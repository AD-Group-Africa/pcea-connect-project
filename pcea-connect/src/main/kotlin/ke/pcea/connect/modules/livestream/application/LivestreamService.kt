package ke.pcea.connect.modules.livestream.application
import ke.pcea.connect.modules.livestream.domain.*
import ke.pcea.connect.modules.livestream.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class LivestreamService(private val repo: LivestreamRepository) {
    fun schedule(title: String, description: String, preacher: String, scriptureRef: String,
                 platform: StreamPlatform, embedUrl: String, thumbnailUrl: String, scheduledAt: LocalDateTime): Livestream {
        val stream = Livestream(title = title, description = description, preacher = preacher,
            scriptureRef = scriptureRef, platform = platform, embedUrl = embedUrl,
            thumbnailUrl = thumbnailUrl, scheduledAt = scheduledAt)
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
        return repo.save(stream)
    }

    fun getUpcoming() = repo.findByStatus(StreamStatus.SCHEDULED).sortedBy { it.scheduledAt }
    fun getLive() = repo.findByStatus(StreamStatus.LIVE)
    fun getAll() = repo.findByOrderByScheduledAtDesc()
    fun getPast() = repo.findByStatus(StreamStatus.ENDED).sortedByDescending { it.endedAt }
}
