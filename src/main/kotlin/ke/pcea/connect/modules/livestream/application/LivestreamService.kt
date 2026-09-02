package ke.pcea.connect.modules.livestream.application
import ke.pcea.connect.modules.livestream.domain.*
import ke.pcea.connect.modules.livestream.infrastructure.*
import ke.pcea.connect.modules.media.domain.MediaType
import ke.pcea.connect.modules.media.domain.Sermon
import ke.pcea.connect.modules.media.infrastructure.SermonRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class LivestreamService(
    private val repo: LivestreamRepository,
    private val sermonRepo: SermonRepository
) {
    private val youTube = YouTubeProvider()

    fun schedule(title: String, description: String, preacher: String, scriptureRef: String,
                 platform: StreamPlatform, embedUrl: String, thumbnailUrl: String, scheduledAt: LocalDateTime): Livestream {
        // If the user provides a YouTube watch URL, auto-convert to embed + extract thumbnail
        val finalEmbed = if (platform == StreamPlatform.YOUTUBE && embedUrl.isNotBlank()) youTube.toEmbedUrl(embedUrl) else embedUrl
        val finalThumb = if (thumbnailUrl.isBlank()) {
            val vidId = youTube.extractVideoId(embedUrl)
            if (vidId != null) youTube.thumbnailUrl(vidId) else ""
        } else thumbnailUrl

        val stream = Livestream(title = title, description = description, preacher = preacher,
            scriptureRef = scriptureRef, platform = platform, embedUrl = finalEmbed,
            thumbnailUrl = finalThumb, scheduledAt = scheduledAt)
        return repo.save(stream)
    }

    fun goLive(streamId: String): Livestream {
        val stream = repo.findById(streamId).orElseThrow { BusinessRuleException("Stream not found") }
        stream.status = StreamStatus.LIVE
        return repo.save(stream)
    }

    fun endStream(streamId: String): Livestream {
        val stream = repo.findById(streamId).orElseThrow { BusinessRuleException("Stream not found") }
        stream.status = StreamStatus.ENDED
        stream.endedAt = LocalDateTime.now()
        val saved = repo.save(stream)
        // Auto-create a sermon from the ended stream so it enters the media/sermon archive
        val sermon = Sermon(
            title = stream.title,
            description = stream.description,
            preacher = stream.preacher,
            scriptureRef = stream.scriptureRef,
            type = MediaType.YOUTUBE,
            videoUrl = stream.embedUrl,
            thumbnailUrl = stream.thumbnailUrl,
            publishedAt = stream.endedAt ?: LocalDateTime.now(),
            isLive = false,
            category = "SERMON"
        )
        sermonRepo.save(sermon)
        return saved
    }

    fun getUpcoming() = repo.findByStatus(StreamStatus.SCHEDULED).sortedBy { it.scheduledAt }
    fun getLive() = repo.findByStatus(StreamStatus.LIVE)
    fun getAll() = repo.findByOrderByScheduledAtDesc()
    fun getPast() = repo.findByStatus(StreamStatus.ENDED).sortedByDescending { it.endedAt }
}
