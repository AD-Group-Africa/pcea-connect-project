package ke.pcea.connect.modules.media.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class MediaType { YOUTUBE, FACEBOOK, VIDEO_FILE, AUDIO_FILE }

@Entity @Table(name = "sermons")
data class Sermon(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val description: String = "",
    val preacher: String = "",
    val scriptureRef: String = "",
    @Enumerated(EnumType.STRING) val type: MediaType = MediaType.YOUTUBE,
    val videoUrl: String = "",
    val audioUrl: String = "",        // NEW: audio-only URL for streaming/downloads
    val thumbnailUrl: String = "",
    val publishedAt: LocalDateTime = LocalDateTime.now(),
    var isLive: Boolean = false,
    val views: Long = 0,
    val duration: String = "",
    val category: String = "SERMON"   // SERMON, PODCAST, WORSHIP, TESTIMONY
)

@Entity @Table(name = "media_playlists")
data class MediaPlaylist(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val description: String = "",
    val createdBy: String = "",       // user ID
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity @Table(name = "media_playlist_items")
data class MediaPlaylistItem(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val playlistId: String = "",
    val sermonId: String = "",
    val position: Int = 0
)
