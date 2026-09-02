package ke.pcea.connect.modules.events.application
import ke.pcea.connect.modules.events.domain.*
import ke.pcea.connect.modules.events.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
@Transactional
class EventService(
    private val eventRepo: EventRepository,
    private val regRepo: EventRegistrationRepository
) {
    fun createEvent(title: String, description: String, type: EventType, location: String, organizerId: String,
                    startTime: LocalDateTime, endTime: LocalDateTime?, maxAttendees: Int,
                    requiresRegistration: Boolean, qrCheckInEnabled: Boolean,
                    recurrenceType: RecurrenceType, recurrenceEndDate: LocalDateTime?): Event {
        val event = Event(title = title, description = description, type = type, location = location,
            organizerId = organizerId, startTime = startTime, endTime = endTime, maxAttendees = maxAttendees,
            requiresRegistration = requiresRegistration, qrCheckInEnabled = qrCheckInEnabled,
            recurrenceType = recurrenceType, recurrenceEndDate = recurrenceEndDate)
        return eventRepo.save(event)
    }

    fun getAllEvents(): List<Event> = eventRepo.findAllByOrderByStartTimeAsc()
    fun getPublishedEvents(): List<Event> = eventRepo.findByStatus(EventStatus.PUBLISHED)
    fun getEvent(id: String): Event = eventRepo.findById(id).orElseThrow { BusinessRuleException("Event not found") }

    fun publishEvent(eventId: String): Event {
        val event = getEvent(eventId)
        event.status = EventStatus.PUBLISHED
        return eventRepo.save(event)
    }

    fun registerForEvent(eventId: String, userId: String): EventRegistration {
        val event = getEvent(eventId)
        if (event.status != EventStatus.PUBLISHED) throw BusinessRuleException("Event not open for registration")
        if (event.maxAttendees > 0) {
            val currentCount = regRepo.countByEventIdAndStatus(eventId, RegistrationStatus.REGISTERED)
            if (currentCount >= event.maxAttendees) throw BusinessRuleException("Event is full")
        }
        val existing = regRepo.findByEventIdAndUserId(eventId, userId)
        if (existing != null) throw BusinessRuleException("Already registered")
        val ticketCode = UUID.randomUUID().toString().take(8).uppercase()
        return regRepo.save(EventRegistration(event = event, userId = userId, ticketCode = ticketCode))
    }

    fun checkIn(ticketCode: String): EventRegistration {
        val reg = regRepo.findAll().find { it.ticketCode == ticketCode }
            ?: throw BusinessRuleException("Invalid ticket code")
        reg.status = RegistrationStatus.ATTENDED
        reg.attendedAt = LocalDateTime.now()
        return regRepo.save(reg)
    }

    fun getRegistrationsForEvent(eventId: String) = regRepo.findByEventId(eventId)
}
