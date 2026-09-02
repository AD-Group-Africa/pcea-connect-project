package ke.pcea.connect.modules.events.api.dto
import ke.pcea.connect.modules.events.domain.EventType
import ke.pcea.connect.modules.events.domain.RecurrenceType

data class CreateEventRequest(
    val title: String, val description: String = "", val type: EventType = EventType.OTHER,
    val location: String = "", val organizerId: String, val startTime: String,
    val endTime: String? = null, val maxAttendees: Int = 0,
    val requiresRegistration: Boolean = false, val qrCheckInEnabled: Boolean = false,
    val recurrenceType: RecurrenceType = RecurrenceType.NONE, val recurrenceEndDate: String? = null
)

data class EventResponse(
    val id: String, val title: String, val description: String, val type: String,
    val location: String, val startTime: String, val endTime: String?, val maxAttendees: Int,
    val status: String, val recurrenceType: String, val registeredCount: Int = 0
)

data class RegisterRequest(val userId: String)
data class RegistrationResponse(val id: String, val eventId: String, val userId: String,
                                 val ticketCode: String, val status: String, val registeredAt: String)
