package ke.pcea.connect.modules.identity.api.dto
data class RegisterRequest(val email: String, val password: String, val fullName: String, val phone: String, val termsAccepted: Boolean = false)
data class LoginRequest(val email: String, val password: String)
data class RefreshTokenRequest(val refreshToken: String)
data class AuthResponse(val accessToken: String, val refreshToken: String, val userId: String, val fullName: String)
data class UserResponse(val id: String, val email: String, val fullName: String, val phone: String, val roles: List<String>, val emailVerified: Boolean = false)
data class VerifyEmailRequest(val token: String)
data class ResendVerificationRequest(val email: String)
