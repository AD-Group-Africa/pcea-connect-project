package ke.pcea.connect.modules.events.api.controller
import ke.pcea.connect.modules.events.api.dto.*
import ke.pcea.connect.modules.events.application.EventService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/events")
class EventController(private val service: EventService) {

    /**
     * Creating/publishing events is a staff action. The organizer is ALWAYS the
     * authenticated principal — a client-supplied organizerId would let any member
     * forge events on behalf of others (IDOR).
     */

    @GetMapping
    fun getAll() = ResponseEntity.ok(ApiResponse.success(service.getAllEvents().map {
        EventResponse(it.id, it.title, it.description, it.type.name, it.location,
            it.startTime.toString(), it.endTime?.toString(), it.maxAttendees, it.status.name,
            it.recurrenceType.name, 0)
    }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PostMapping
    fun create(auth: Authentication, @RequestBody req: CreateEventRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createEvent(req.title, req.description, req.type, req.location, auth.name,
            LocalDateTime.parse(req.startTime), req.endTime?.let { LocalDateTime.parse(it) },
            req.maxAttendees, req.requiresRegistration, req.qrCheckInEnabled,
            req.recurrenceType, req.recurrenceEndDate?.let { LocalDateTime.parse(it) })
            .let { EventResponse(it.id, it.title, it.description, it.type.name, it.location,
                it.startTime.toString(), it.endTime?.toString(), it.maxAttendees, it.status.name,
                it.recurrenceType.name, 0) }))

    @PreAuthorize(Roles.STAFF_SPEL)
    @PutMapping("/{eventId}/publish")
    fun publish(@PathVariable eventId: String) = ResponseEntity.ok(ApiResponse.success(
        service.publishEvent(eventId).let { EventResponse(it.id, it.title, it.description, it.type.name,
            it.location, it.startTime.toString(), it.endTime?.toString(), it.maxAttendees, it.status.name,
            it.recurrenceType.name, 0) }))

    @PostMapping("/{eventId}/register")
    fun register(@PathVariable eventId: String, @RequestBody req: RegisterRequest) =
        ResponseEntity.ok(ApiResponse.success(service.registerForEvent(eventId, req.userId)
            .let { RegistrationResponse(it.id, it.event?.id ?: "", it.userId, it.ticketCode, it.status.name, it.registeredAt.toString()) }))

    @PostMapping("/checkin")
    fun checkIn(@RequestParam ticketCode: String) = ResponseEntity.ok(ApiResponse.success(
        service.checkIn(ticketCode).let { RegistrationResponse(it.id, it.event?.id ?: "", it.userId, it.ticketCode, it.status.name, it.registeredAt.toString()) }))

    @GetMapping("/{eventId}/registrations")
    fun getRegistrations(@PathVariable eventId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getRegistrationsForEvent(eventId).map { RegistrationResponse(it.id, it.event?.id ?: "", it.userId, it.ticketCode, it.status.name, it.registeredAt.toString()) }))
}
