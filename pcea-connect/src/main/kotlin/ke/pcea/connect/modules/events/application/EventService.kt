package ke.pcea.connect.modules.events.application
import ke.pcea.connect.modules.events.domain.*
import ke.pcea.connect.modules.events.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class EventService(
    private val eventRepo: EventRepository,
    private val registrationRepo: EventRegistrationRepository
) {
    fun createEvent(title: String, description: String, type: EventType, location: String, organizerId: String,
                    startTime: java.time.LocalDateTime, endTime: java.time.LocalDateTime?, maxAttendees: Int,
                    requiresRegistration: Boolean, qrCheckInEnabled: Boolean): Event {
        val event = Event(title = title, description = description, type = type, location = location,
            organizerId = organizerId, startTime = startTime, endTime = endTime, maxAttendees = maxAttendees,
            requiresRegistration = requiresRegistration, qrCheckInEnabled = qrCheckInEnabled)
        return eventRepo.save(event)
    }

    fun getAllEvents() = eventRepo.findAll()
    fun getPublishedEvents() = eventRepo.findByStatus(EventStatus.PUBLISHED)
    fun getEvent(id: String) = eventRepo.findById(id).orElseThrow { BusinessRuleException("Event not found") }

    fun publishEvent(eventId: String): Event {
        val event = eventRepo.findById(eventId).orElseThrow { BusinessRuleException("Event not found") }
        event.status = EventStatus.PUBLISHED
        return eventRepo.save(event)
    }

    fun registerForEvent(eventId: String, userId: String): EventRegistration {
        val event = eventRepo.findById(eventId).orElseThrow { BusinessRuleException("Event not found") }
        if (event.status != EventStatus.PUBLISHED) throw BusinessRuleException("Event not open for registration")
        if (event.maxAttendees > 0) {
            val currentCount = registrationRepo.findByEventId(eventId).count { it.status == RegistrationStatus.REGISTERED }
            if (currentCount >= event.maxAttendees) throw BusinessRuleException("Event is full")
        }
        val existing = registrationRepo.findByEventIdAndUserId(eventId, userId)
        if (existing != null) throw BusinessRuleException("Already registered")
        val ticketCode = UUID.randomUUID().toString().take(8).uppercase()
        val reg = EventRegistration(event = event, userId = userId, ticketCode = ticketCode)
        return registrationRepo.save(reg)
    }

    fun checkIn(ticketCode: String): EventRegistration {
        val reg = registrationRepo.findAll().find { it.ticketCode == ticketCode }
            ?: throw BusinessRuleException("Invalid ticket code")
        reg.status = RegistrationStatus.ATTENDED
        reg.attendedAt = java.time.LocalDateTime.now()
        return registrationRepo.save(reg)
    }

    fun getRegistrationsForEvent(eventId: String) = registrationRepo.findByEventId(eventId)
    fun getRegistrationsForUser(userId: String) = registrationRepo.findByUserId(userId)
}
