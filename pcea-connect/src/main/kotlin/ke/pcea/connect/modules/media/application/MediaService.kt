package ke.pcea.connect.modules.media.application
import ke.pcea.connect.modules.media.domain.*
import ke.pcea.connect.modules.media.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class MediaService(
    private val sermonRepo: SermonRepository,
    private val playlistRepo: MediaPlaylistRepository,
    private val itemRepo: MediaPlaylistItemRepository
) {
    fun getAll() = sermonRepo.findByOrderByPublishedAtDesc()
    fun getByCategory(category: String) = sermonRepo.findByCategoryOrderByPublishedAtDesc(category)
    fun getLive() = sermonRepo.findByIsLiveTrue()
    fun getSermon(id: String) = sermonRepo.findById(id).orElseThrow { BusinessRuleException("Not found") }

    @Transactional
    fun createSermon(title: String, description: String, preacher: String, scriptureRef: String,
                     type: MediaType, videoUrl: String, audioUrl: String, thumbnailUrl: String,
                     category: String): Sermon {
        val sermon = Sermon(title = title, description = description, preacher = preacher,
            scriptureRef = scriptureRef, type = type, videoUrl = videoUrl, audioUrl = audioUrl,
            thumbnailUrl = thumbnailUrl, category = category)
        return sermonRepo.save(sermon)
    }

    // Playlists
    fun getPlaylists(userId: String) = playlistRepo.findByCreatedBy(userId)
    @Transactional fun createPlaylist(name: String, description: String, userId: String) =
        playlistRepo.save(MediaPlaylist(name = name, description = description, createdBy = userId))

    fun getPlaylistItems(playlistId: String) = itemRepo.findByPlaylistIdOrderByPosition(playlistId)
        .mapNotNull { item -> sermonRepo.findById(item.sermonId).orElse(null) }

    @Transactional fun addToPlaylist(playlistId: String, sermonId: String) {
        val maxPos = itemRepo.findByPlaylistIdOrderByPosition(playlistId).maxOfOrNull { it.position } ?: 0
        itemRepo.save(MediaPlaylistItem(playlistId = playlistId, sermonId = sermonId, position = maxPos + 1))
    }
}
