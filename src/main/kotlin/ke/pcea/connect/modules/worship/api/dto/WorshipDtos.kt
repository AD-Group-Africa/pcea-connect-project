package ke.pcea.connect.modules.worship.api.dto

data class CreateServiceRequest(
    val title: String,
    val serviceDate: String,          // ISO local date yyyy-MM-dd
    val serviceTime: String,          // ISO local time HH:mm
    val congregationId: String = "",
    val serviceType: String = "SUNDAY_WORSHIP",
    val preacherName: String = "",
    val preacherUserId: String = "",
    val sermonId: String = "",
    val theme: String = "",
    val scriptureRef: String = "",
    val worshipTeam: String = "",
    val orderOfService: String = "",
    val livestreamId: String = "",
    val announcements: String = ""
)
data class UpdateServiceRequest(
    val title: String? = null,
    val serviceDate: String? = null,
    val serviceTime: String? = null,
    val serviceType: String? = null,
    val preacherName: String? = null,
    val preacherUserId: String? = null,
    val sermonId: String? = null,
    val theme: String? = null,
    val scriptureRef: String? = null,
    val worshipTeam: String? = null,
    val orderOfService: String? = null,
    val livestreamId: String? = null,
    val announcements: String? = null
)
data class ServiceResponse(
    val id: String,
    val title: String,
    val serviceDate: String,
    val serviceTime: String,
    val congregationId: String,
    val serviceType: String,
    val preacherName: String,
    val preacherUserId: String,
    val sermonId: String,
    val theme: String,
    val scriptureRef: String,
    val worshipTeam: String,
    val orderOfService: String,
    val livestreamId: String,
    val announcements: String,
    val bulletinId: String
)
data class CreateBulletinRequest(
    val title: String = "",
    val congregationId: String = "",
    val churchServiceId: String = "",
    val serviceDate: String,
    val welcomeMessage: String = "",
    val orderOfService: String = "",
    val scriptureRef: String = "",
    val preacher: String = "",
    val sermonTheme: String = "",
    val announcements: String = "",
    val weeklyCalendar: String = "",
    val ministryNotices: String = "",
    val givingInformation: String = "",
    val livestreamUrl: String = "",
    val specialEvents: String = ""
)
data class UpdateBulletinRequest(
    val title: String? = null,
    val welcomeMessage: String? = null,
    val orderOfService: String? = null,
    val scriptureRef: String? = null,
    val preacher: String? = null,
    val sermonTheme: String? = null,
    val announcements: String? = null,
    val weeklyCalendar: String? = null,
    val ministryNotices: String? = null,
    val givingInformation: String? = null,
    val livestreamUrl: String? = null,
    val specialEvents: String? = null
)
data class BulletinResponse(
    val id: String,
    val title: String,
    val congregationId: String,
    val churchServiceId: String,
    val serviceDate: String,
    val welcomeMessage: String,
    val orderOfService: String,
    val scriptureRef: String,
    val preacher: String,
    val sermonTheme: String,
    val announcements: String,
    val weeklyCalendar: String,
    val ministryNotices: String,
    val givingInformation: String,
    val livestreamUrl: String,
    val specialEvents: String,
    val status: String,
    val publishedAt: String?
)