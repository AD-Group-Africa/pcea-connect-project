package ke.pcea.connect.modules.ministries.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class MinistryType { PCMF, YPCMF, WOMANS_GUILD, YOUTH_FELLOWSHIP, CHURCH_SCHOOL, BOYS_BRIGADE, GIRLS_BRIGADE, CHOIR, MISSION_EVANGELISM, DEVELOPMENT_COMMITTEE, OTHER }
enum class MinistryRole { MEMBER, LEADER, COORDINATOR, ADMIN }

@Entity
@Table(name = "ministries")
data class Ministry(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    @Enumerated(EnumType.STRING) val type: MinistryType = MinistryType.OTHER,
    val description: String = "",
    val congregationId: String = "",   // scoped to a congregation
    val active: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "ministry_members")
data class MinistryMember(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ministry_id") val ministry: Ministry? = null,
    val userId: String = "",
    @Enumerated(EnumType.STRING) val role: MinistryRole = MinistryRole.MEMBER,
    val joinedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "ministry_events")
data class MinistryEvent(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val description: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ministry_id") val ministry: Ministry? = null,
    val startTime: LocalDateTime = LocalDateTime.now(),
    val endTime: LocalDateTime? = null,
    val location: String = ""
)

@Entity
@Table(name = "ministry_projects")
data class MinistryProject(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val description: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ministry_id") val ministry: Ministry? = null,
    val startDate: LocalDateTime = LocalDateTime.now(),
    val endDate: LocalDateTime? = null,
    var status: String = "PLANNING"   // var to allow updates
)
@Entity @Table(name = "ministry_galleries")
data class MinistryGallery(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val ministryId: String = "",
    val imageUrl: String = "",
    val caption: String = "",
    val uploadedAt: LocalDateTime = LocalDateTime.now()
)
