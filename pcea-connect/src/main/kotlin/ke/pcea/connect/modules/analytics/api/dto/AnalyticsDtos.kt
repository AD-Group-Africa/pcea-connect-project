package ke.pcea.connect.modules.analytics.api.dto

data class DashboardMetrics(
    val totalMembers: Long, val newMembersThisMonth: Long, val attendanceRate: Double,
    val totalGiving: java.math.BigDecimal, val activeMinistries: Int, val upcomingEvents: Int
)

data class TrendPoint(val label: String, val value: Double)
data class TrendData(val title: String, val data: List<TrendPoint>)

data class DrillDownMetrics(
    val level: String,         // "congregation", "parish", "presbytery", "region", "national"
    val id: String,            // entity ID
    val name: String,          // entity name
    val metrics: DashboardMetrics,
    val trends: List<TrendData>
)
