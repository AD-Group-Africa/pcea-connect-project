package ke.pcea.connect.modules.analytics.application
import ke.pcea.connect.modules.attendance.infrastructure.AttendanceRepository
import ke.pcea.connect.modules.church.infrastructure.*
import ke.pcea.connect.modules.events.infrastructure.EventRepository
import ke.pcea.connect.modules.events.domain.EventStatus
import ke.pcea.connect.modules.giving.infrastructure.ContributionRepository
import ke.pcea.connect.modules.giving.domain.PaymentStatus
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.ministries.infrastructure.MinistryRepository
import ke.pcea.connect.modules.analytics.api.dto.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class AnalyticsService(
    private val userRepo: UserRepository,
    private val attendanceRepo: AttendanceRepository,
    private val contributionRepo: ContributionRepository,
    private val ministryRepo: MinistryRepository,
    private val eventRepo: EventRepository,
    private val congregationRepo: CongregationRepository,
    private val parishRepo: ParishRepository,
    private val presbyteryRepo: PresbyteryRepository,
    private val regionRepo: RegionRepository
) {
    fun getCongregationMetrics(congregationId: String): DashboardMetrics {
        val totalMembers = userRepo.countByCongregationId(congregationId)
        val newThisMonth = totalMembers
        val today = LocalDate.now()
        val attendanceToday = attendanceRepo.countByCongregationIdAndDate(congregationId, today).toDouble()
        val attendanceRate = if (totalMembers > 0) attendanceToday / totalMembers else 0.0
        val sum = contributionRepo.sumAmountByCongregationIdAndStatus(congregationId, PaymentStatus.COMPLETED)
        val totalGiving = sum ?: java.math.BigDecimal.ZERO
        val activeMinistries = ministryRepo.countByCongregationId(congregationId).toInt()
        val upcomingEvents = eventRepo.countByStatus(EventStatus.PUBLISHED).toInt()
        return DashboardMetrics(totalMembers, newThisMonth, attendanceRate, totalGiving, activeMinistries, upcomingEvents)
    }

    fun getParishMetrics(parishId: String): DashboardMetrics {
        val congregations = congregationRepo.findByParishId(parishId)
        return aggregate(congregations.map { getCongregationMetrics(it.id) })
    }

    fun getPresbyteryMetrics(presbyteryId: String): DashboardMetrics {
        val parishes = parishRepo.findByPresbyteryId(presbyteryId)
        return aggregate(parishes.map { getParishMetrics(it.id) })
    }

    fun getRegionMetrics(regionId: String): DashboardMetrics {
        val presbyteries = presbyteryRepo.findByRegionId(regionId)
        return aggregate(presbyteries.map { getPresbyteryMetrics(it.id) })
    }

    fun getNationalMetrics(): DashboardMetrics {
        val regions = regionRepo.findAll()
        return aggregate(regions.map { getRegionMetrics(it.id) })
    }

    private fun aggregate(metrics: List<DashboardMetrics>): DashboardMetrics {
        if (metrics.isEmpty()) return DashboardMetrics(0, 0, 0.0, java.math.BigDecimal.ZERO, 0, 0)
        var totalMembers = 0L; var newThisMonth = 0L; var totalGiving = java.math.BigDecimal.ZERO
        var ministriesCount = 0; var eventsCount = 0; var attendanceRateSum = 0.0
        metrics.forEach {
            totalMembers += it.totalMembers
            newThisMonth += it.newMembersThisMonth
            totalGiving = totalGiving.add(it.totalGiving)
            ministriesCount += it.activeMinistries
            eventsCount += it.upcomingEvents
            attendanceRateSum += it.attendanceRate
        }
        val avgAttendance = attendanceRateSum / metrics.size
        return DashboardMetrics(totalMembers, newThisMonth, avgAttendance, totalGiving, ministriesCount, eventsCount)
    }
}
