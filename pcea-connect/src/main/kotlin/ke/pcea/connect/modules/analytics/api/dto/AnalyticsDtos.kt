package ke.pcea.connect.modules.analytics.api.dto

data class DashboardMetrics(
    val totalMembers: Long,
    val newMembersThisMonth: Long,
    val attendanceRate: Double,
    val totalGiving: java.math.BigDecimal,
    val activeMinistries: Int,
    val upcomingEvents: Int
)

data class TrendData(
    val labels: List<String>,
    val values: List<Double>
)
