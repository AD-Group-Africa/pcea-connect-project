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
import java.time.format.DateTimeFormatter

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
        val today = LocalDate.now()
        val attendanceToday = attendanceRepo.countByCongregationIdAndDate(congregationId, today).toDouble()
        val attendanceRate = if (totalMembers > 0) attendanceToday / totalMembers else 0.0
        val sum = contributionRepo.sumAmountByCongregationIdAndStatus(congregationId, PaymentStatus.COMPLETED)
        val totalGiving = sum ?: java.math.BigDecimal.ZERO
        val activeMinistries = ministryRepo.countByCongregationId(congregationId).toInt()
        val upcomingEvents = eventRepo.countByStatus(EventStatus.PUBLISHED).toInt()
        return DashboardMetrics(totalMembers, totalMembers, attendanceRate, totalGiving, activeMinistries, upcomingEvents)
    }

    fun getTrends(congregationId: String): List<TrendData> {
        // Simulated monthly trends for the last 6 months
        val months = (5 downTo 0).map {
            LocalDate.now().minusMonths(it.toLong()).format(DateTimeFormatter.ofPattern("MMM yyyy"))
        }
        val givingTrend = TrendData("Giving (KES)", months.map { TrendPoint(it, (5000 + Math.random() * 10000).toLong().coerceIn(0, Long.MAX_VALUE).toDouble().toDouble()) })
        val attendanceTrend = TrendData("Attendance", months.map { TrendPoint(it, (50 + Math.random() * 50).toLong().coerceIn(0, Long.MAX_VALUE).toDouble().toDouble()) })
        val memberTrend = TrendData("Members", months.map { TrendPoint(it, (100 + Math.random() * 20).toLong().coerceIn(0, Long.MAX_VALUE).toDouble().toDouble()) })
        return listOf(givingTrend, attendanceTrend, memberTrend)
    }

    fun getDrillDown(level: String, id: String): DrillDownMetrics {
        val (name, metrics) = when (level) {
            "congregation" -> {
                val c = congregationRepo.findById(id).orElse(null)
                (c?.name ?: "Unknown") to getCongregationMetrics(id)
            }
            "parish" -> {
                val p = parishRepo.findById(id).orElse(null)
                (p?.name ?: "Unknown") to getParishMetrics(id)
            }
            "presbytery" -> {
                val p = presbyteryRepo.findById(id).orElse(null)
                (p?.name ?: "Unknown") to getPresbyteryMetrics(id)
            }
            "region" -> {
                val r = regionRepo.findById(id).orElse(null)
                (r?.name ?: "Unknown") to getRegionMetrics(id)
            }
            else -> ("National") to getNationalMetrics()
        }
        return DrillDownMetrics(level, id, name, metrics, getTrends(id))
    }

    // Aggregation helpers (same as before)
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
        var totalMembers = 0L; var totalGiving = java.math.BigDecimal.ZERO
        var ministries = 0; var events = 0; var attendanceSum = 0.0
        metrics.forEach {
            totalMembers += it.totalMembers
            totalGiving = totalGiving.add(it.totalGiving)
            ministries += it.activeMinistries
            events += it.upcomingEvents
            attendanceSum += it.attendanceRate
        }
        return DashboardMetrics(totalMembers, totalMembers, attendanceSum / metrics.size, totalGiving, ministries, events)
    }
}
