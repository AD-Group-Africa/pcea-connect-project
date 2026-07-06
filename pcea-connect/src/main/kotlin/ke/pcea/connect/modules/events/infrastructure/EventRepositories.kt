package ke.pcea.connect.modules.events.infrastructure
import ke.pcea.connect.modules.events.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EventRepository : JpaRepository<Event, String> {
    fun findByStatus(status: EventStatus): List<Event>
    fun findByOrganizerId(organizerId: String): List<Event>
    fun countByStatus(status: EventStatus): Long
}

@Repository
interface EventRegistrationRepository : JpaRepository<EventRegistration, String> {
    fun findByEventId(eventId: String): List<EventRegistration>
    fun findByUserId(userId: String): List<EventRegistration>
    fun findByEventIdAndUserId(eventId: String, userId: String): EventRegistration?
}
