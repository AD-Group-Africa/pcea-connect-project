package ke.pcea.connect.modules.membership.api.dto

data class MemberProfileRequest(
    val gender: String = "",
    val dateOfBirth: String? = null,
    val maritalStatus: String = "",
    val occupation: String = "",
    val baptismDate: String? = null,
    val confirmationDate: String? = null,
    val marriageDate: String? = null,
    val membershipDate: String? = null,
    val spiritualGifts: String = "",
    val skills: String = "",
    val bio: String = "",
    val spouseName: String = "",
    val fatherName: String = "",
    val motherName: String = "",
    val emergencyContact: String = "",
    val emergencyPhone: String = "",
    val address: String = "",
    val city: String = "",
    val postalCode: String = "",
    val country: String = "Kenya",
    val active: Boolean = true,
    val memberStatus: String = "ACTIVE"
)

data class MemberSearchRequest(val query: String)
data class MemberProfileResponse(
    val userId: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val gender: String,
    val occupation: String,
    val memberStatus: String,
    val congregationName: String?
)
