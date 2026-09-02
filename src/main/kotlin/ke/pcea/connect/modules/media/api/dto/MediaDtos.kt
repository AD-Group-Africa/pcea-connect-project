package ke.pcea.connect.modules.media.api.dto
import ke.pcea.connect.modules.media.domain.MediaType

data class CreateSermonRequest(
    val title: String, val description: String = "", val preacher: String = "",
    val scriptureRef: String = "", val type: MediaType = MediaType.YOUTUBE,
    val videoUrl: String = "", val audioUrl: String = "",
    val thumbnailUrl: String = "", val category: String = "SERMON"
)
data class SermonResponse(
    val id: String, val title: String, val description: String, val preacher: String,
    val scriptureRef: String, val type: String, val videoUrl: String,
    val audioUrl: String, val thumbnailUrl: String, val category: String,
    val publishedAt: String, val isLive: Boolean, val views: Long
)
data class CreatePlaylistRequest(val name: String, val description: String = "")
data class AddToPlaylistRequest(val sermonId: String)
data class PlaylistResponse(val id: String, val name: String, val description: String)
