package ke.pcea.connect.modules.locator.api.dto

data class ChurchLocationRequest(
    val congregationId: String = "",
    val name: String,
    val address: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val serviceTimes: String = "",
    val phone: String = "",
    val email: String = "",
    val livestreamUrl: String = "",
    val website: String = ""
)

data class ChurchLocationResponse(
    val id: String, val congregationId: String, val name: String,
    val address: String, val latitude: Double, val longitude: Double,
    val serviceTimes: String, val phone: String, val email: String,
    val livestreamUrl: String, val website: String
)
