package ke.pcea.connect.modules.identity.api.controller
import ke.pcea.connect.modules.identity.api.dto.*
import ke.pcea.connect.modules.identity.application.AuthService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
@RestController
@RequestMapping("/api/auth")
class AuthController(private val authService: AuthService) {
    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): ResponseEntity<ApiResponse<UserResponse>> {
        val user = authService.register(req.email, req.password, req.fullName, req.phone)
        return ResponseEntity.ok(ApiResponse.success(UserResponse(user.id, user.email, user.fullName, user.phone, user.roles.toList()), "Registration successful"))
    }
    @PostMapping("/login")
    fun login(@RequestBody req: LoginRequest): ResponseEntity<ApiResponse<AuthResponse>> {
        val result = authService.login(req.email, req.password)
        return ResponseEntity.ok(ApiResponse.success(AuthResponse(result.accessToken, result.refreshToken, result.userId, result.fullName)))
    }
    @PostMapping("/refresh")
    fun refresh(@RequestBody req: RefreshTokenRequest): ResponseEntity<ApiResponse<AuthResponse>> {
        val newAccess = authService.refreshAccessToken(req.refreshToken)
        return ResponseEntity.ok(ApiResponse.success(AuthResponse(newAccess, req.refreshToken, "", "")))
    }
}
@RestController
@RequestMapping("/api/auth")
class LogoutController(
    private val refreshTokenRepo: ke.pcea.connect.modules.identity.infrastructure.RefreshTokenRepository
) {
    @PostMapping("/logout")
    fun logout(@RequestHeader("Authorization") bearer: String): ResponseEntity<ApiResponse<String>> {
        val token = bearer.removePrefix("Bearer ")
        refreshTokenRepo.findByToken(token)?.let { refreshTokenRepo.delete(it) }
        return ResponseEntity.ok(ApiResponse.success("Logged out"))
    }
}

