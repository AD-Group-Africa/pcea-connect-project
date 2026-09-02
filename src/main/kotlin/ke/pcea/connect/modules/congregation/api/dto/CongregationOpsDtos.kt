package ke.pcea.connect.modules.congregation.api.dto

data class SmallGroupRequest(val name: String, val description: String = "", val congregationId: String = "",
                             val leaderId: String = "", val meetingDay: String = "", val meetingTime: String = "",
                             val location: String = "")
data class CommitteeRequest(val name: String, val description: String = "", val congregationId: String = "",
                            val chairpersonId: String = "", val meetingFrequency: String = "")
data class VisitorRequest(val fullName: String, val phone: String = "", val email: String = "",
                          val purpose: String = "", val congregationId: String = "")
data class AdminDashboardResponse(
    val totalMembers: Long, val smallGroups: Int, val committees: Int,
    val visitorsThisMonth: Int, val attendanceToday: Long
)
