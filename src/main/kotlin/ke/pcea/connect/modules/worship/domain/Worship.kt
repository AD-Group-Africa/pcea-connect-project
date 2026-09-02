package ke.pcea.connect.modules.worship.domain
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

enum class ServiceType { SUNDAY_WORSHIP, MORNING_PRAYER, EVENING_PRAYER, MIDWEEK_SERVICE, SPECIAL_SERVICE, YOUTH_SERVICE, OTHER }
enum class BulletinStatus { DRAFT, PUBLISHED }

@Entity @Table(name = "church_services")
data class ChurchService(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    var title: String = "",
    var serviceDate: LocalDate = LocalDate.now(),
    var serviceTime: LocalTime = LocalTime.of(10, 0),
    val congregationId: String = "",      // scoped to a congregation
    @Enumerated(EnumType.STRING) var serviceType: ServiceType = ServiceType.SUNDAY_WORSHIP,
    var preacherName: String = "",
    var preacherUserId: String = "",
    var sermonId: String = "",
    var theme: String = "",
    var scriptureRef: String = "",
    var worshipTeam: String = "",
    @Column(length = 4000) var orderOfService: String = "",
    var livestreamId: String = "",        // FK into livestreams (YouTube)
    @Column(length = 4000) var announcements: String = "",
    var bulletinId: String = "",
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var updatedAt: LocalDateTime? = null
)

@Entity @Table(name = "bulletins")
data class Bulletin(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    var title: String = "",
    val congregationId: String = "",
    val churchServiceId: String = "",
    val serviceDate: LocalDate = LocalDate.now(),
    var welcomeMessage: String = "",
    @Column(length = 4000) var orderOfService: String = "",
    var scriptureRef: String = "",
    var preacher: String = "",
    // preacher full name snapshot at publish time
    var sermonTheme: String = "",
    @Column(length = 4000) var announcements: String = "",
    @Column(length = 4000) var weeklyCalendar: String = "",
    @Column(length = 4000) var ministryNotices: String = "",
    @Column(length = 2000) var givingInformation: String = "",
    var livestreamUrl: String = "",
    @Column(length = 4000) var specialEvents: String = "",
    @Enumerated(EnumType.STRING) var status: BulletinStatus = BulletinStatus.DRAFT,
    var publishedAt: LocalDateTime? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var updatedAt: LocalDateTime? = null
)