package ke.pcea.connect.modules.livestream.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class StreamPlatform { YOUTUBE, FACEBOOK, VIMEO, CUSTOM }
enum class StreamStatus { SCHEDULED, LIVE, ENDED }

@Entity @Table(name = "livestreams")
data class Livestream(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val description: String = "",
    val preacher: String = "",
    val scriptureRef: String = "",
    @Enumerated(EnumType.STRING) val platform: StreamPlatform = StreamPlatform.YOUTUBE,
    val embedUrl: String = "",          // the iframe-compatible URL
    val thumbnailUrl: String = "",
    val scheduledAt: LocalDateTime = LocalDateTime.now(),
    var status: StreamStatus = StreamStatus.SCHEDULED,
    var endedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
