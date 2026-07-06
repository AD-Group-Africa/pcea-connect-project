package ke.pcea.connect.modules.livestream.api.dto
import ke.pcea.connect.modules.livestream.domain.StreamPlatform
import java.time.LocalDateTime

data class ScheduleRequest(
    val title: String,
    val description: String = "",
    val preacher: String = "",
    val scriptureRef: String = "",
    val platform: StreamPlatform = StreamPlatform.YOUTUBE,
    val embedUrl: String = "",
    val thumbnailUrl: String = "",
    val scheduledAt: String
)
data class LivestreamResponse(
    val id: String, val title: String, val description: String,
    val preacher: String, val scriptureRef: String, val platform: String,
    val embedUrl: String, val thumbnailUrl: String, val scheduledAt: String,
    val status: String, val endedAt: String?
)
