package ke.pcea.connect.modules.ministries.api.dto
import ke.pcea.connect.modules.ministries.domain.MinistryRole
import ke.pcea.connect.modules.ministries.domain.MinistryType

data class CreateMinistryRequest(
    val name: String,
    val type: MinistryType = MinistryType.OTHER,
    val description: String = "",
    val congregationId: String = ""
)

data class AddMemberRequest(
    val userId: String,
    val role: MinistryRole = MinistryRole.MEMBER
)

data class CreateEventRequest(
    val title: String,
    val description: String = "",
    val startTime: String,
    val endTime: String? = null,
    val location: String = ""
)

data class CreateProjectRequest(
    val name: String,
    val description: String = "",
    val startDate: String,
    val endDate: String? = null
)

data class MinistryResponse(
    val id: String,
    val name: String,
    val type: String,
    val description: String,
    val congregationId: String
)

data class MinistryMemberResponse(
    val id: String,
    val userId: String,
    val role: String,
    val joinedAt: String
)

data class MinistryEventResponse(
    val id: String,
    val title: String,
    val description: String,
    val startTime: String,
    val endTime: String?,
    val location: String
)

data class MinistryProjectResponse(
    val id: String,
    val name: String,
    val description: String,
    val startDate: String,
    val endDate: String?,
    val status: String
)
