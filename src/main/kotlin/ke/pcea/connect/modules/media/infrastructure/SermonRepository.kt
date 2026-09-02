package ke.pcea.connect.modules.media.infrastructure
import ke.pcea.connect.modules.media.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface SermonRepository : JpaRepository<Sermon, String> {
    fun findByCategoryOrderByPublishedAtDesc(category: String): List<Sermon>
    fun findByOrderByPublishedAtDesc(): List<Sermon>
    fun findByIsLiveTrue(): List<Sermon>
}

@Repository interface MediaPlaylistRepository : JpaRepository<MediaPlaylist, String> {
    fun findByCreatedBy(createdBy: String): List<MediaPlaylist>
}

@Repository interface MediaPlaylistItemRepository : JpaRepository<MediaPlaylistItem, String> {
    fun findByPlaylistIdOrderByPosition(playlistId: String): List<MediaPlaylistItem>
}
