package ke.pcea.connect.modules.pastoralcare.application
import ke.pcea.connect.modules.pastoralcare.domain.*
import ke.pcea.connect.modules.pastoralcare.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class PastoralCareService(
    private val prayerRepo: PrayerRequestRepository,
    private val visitRepo: PastoralVisitRepository,
    private val taskRepo: PastoralTaskRepository
) {
    fun submitPrayerRequest(userId: String, request: String, isAnonymous: Boolean): PrayerRequest {
        val pr = PrayerRequest(userId = userId, request = request, isAnonymous = isAnonymous)
        return prayerRepo.save(pr)
    }

    fun getPrayerRequestsForUser(userId: String) = prayerRepo.findByUserId(userId)
    fun getAllPrayerRequests() = prayerRepo.findAll()
    fun updatePrayerStatus(requestId: String, status: PrayerStatus, prayedBy: String): PrayerRequest {
        val pr = prayerRepo.findById(requestId).orElseThrow { BusinessRuleException("Prayer request not found") }
        pr.status = status
        pr.prayedBy = prayedBy
        return prayerRepo.save(pr)
    }

    fun scheduleVisit(userId: String, type: VisitType, visitorId: String, scheduledAt: LocalDateTime, notes: String): PastoralVisit {
        val visit = PastoralVisit(userId = userId, type = type, visitorId = visitorId, scheduledAt = scheduledAt, notes = notes)
        return visitRepo.save(visit)
    }

    fun completeVisit(visitId: String, notes: String, followUpNeeded: Boolean): PastoralVisit {
        val visit = visitRepo.findById(visitId).orElseThrow { BusinessRuleException("Visit not found") }
        visit.completedAt = LocalDateTime.now()
        visit.notes = notes
        visit.followUpNeeded = followUpNeeded
        return visitRepo.save(visit)
    }

    fun getVisitsForUser(userId: String) = visitRepo.findByUserId(userId)

    fun createTask(title: String, description: String, assignedTo: String, priority: TaskPriority, dueDate: LocalDateTime?): PastoralTask {
        val task = PastoralTask(title = title, description = description, assignedTo = assignedTo, priority = priority, dueDate = dueDate)
        return taskRepo.save(task)
    }

    fun updateTaskStatus(taskId: String, status: TaskStatus): PastoralTask {
        val task = taskRepo.findById(taskId).orElseThrow { BusinessRuleException("Task not found") }
        task.status = status
        if (status == TaskStatus.COMPLETED) task.completedAt = LocalDateTime.now()
        return taskRepo.save(task)
    }

    fun getTasksForUser(userId: String) = taskRepo.findByAssignedTo(userId)
}
