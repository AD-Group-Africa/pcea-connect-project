package ke.pcea.connect.modules.ministries.domain
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * Ministry-scoped announcement — allows each ministry to communicate with its members
 * without polluting the main congregation feed. Uses the shared Ministry framework;
 * no separate PCMF/YPCMF/Guild tables needed.
 */
@Entity
@Table(name = "ministry_announcements")
data class MinistryAnnouncement(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ministry_id") val ministry: Ministry? = null,
    val title: String = "",
    val content: String = "",
    val authorId: String = "",
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val pinned: Boolean = false
)
