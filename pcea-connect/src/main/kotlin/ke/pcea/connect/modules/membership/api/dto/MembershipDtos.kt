package ke.pcea.connect.modules.membership.api.dto

data class AssignCongregationRequest(val congregationId: String)

data class MemberProfileRequest(
    val gender: String = "",
    val dateOfBirth: String? = null,
    val maritalStatus: String = "",
    val occupation: String = "",
    val baptismDate: String? = null,
    val membershipDate: String? = null,
    val spiritualGifts: String = "",
    val skills: String = "",
    val bio: String = ""
)

data class MemberResponse(
    val userId: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val congregationName: String?,
    val roles: List<String>
)
