package ke.pcea.connect.modules.events.api.dto
import ke.pcea.connect.modules.events.domain.EventType

data class CreateEventRequest(
    val title: String,
    val description: String = "",
    val type: EventType = EventType.OTHER,
    val location: String = "",
    val organizerId: String,
    val startTime: String,          // ISO-8601
    val endTime: String? = null,
    val maxAttendees: Int = 0,
    val requiresRegistration: Boolean = false,
    val qrCheckInEnabled: Boolean = false
)

data class EventResponse(
    val id: String,
    val title: String,
    val description: String,
    val type: String,
    val location: String,
    val startTime: String,
    val endTime: String?,
    val maxAttendees: Int,
    val status: String
)

data class RegistrationResponse(
    val id: String,
    val eventId: String,
    val userId: String,
    val ticketCode: String,
    val status: String,
    val registeredAt: String
)
