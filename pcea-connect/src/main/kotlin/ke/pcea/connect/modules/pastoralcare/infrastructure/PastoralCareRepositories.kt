package ke.pcea.connect.modules.pastoralcare.infrastructure
import ke.pcea.connect.modules.pastoralcare.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface PrayerRequestRepository : JpaRepository<PrayerRequest, String> {
    fun findByUserId(userId: String): List<PrayerRequest>
    fun findByStatus(status: PrayerStatus): List<PrayerRequest>
}

@Repository interface PastoralVisitRepository : JpaRepository<PastoralVisit, String> {
    fun findByUserId(userId: String): List<PastoralVisit>
    fun findByVisitorId(visitorId: String): List<PastoralVisit>
}

@Repository interface PastoralTaskRepository : JpaRepository<PastoralTask, String> {
    fun findByAssignedTo(assignedTo: String): List<PastoralTask>
    fun findByStatus(status: TaskStatus): List<PastoralTask>
}
