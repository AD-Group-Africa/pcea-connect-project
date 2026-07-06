package ke.pcea.connect.modules.identity.application
import ke.pcea.connect.modules.identity.domain.RefreshToken
import ke.pcea.connect.modules.identity.domain.User
import ke.pcea.connect.modules.identity.infrastructure.RefreshTokenRepository
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.Instant
@Service
class AuthService(
    private val userRepo: UserRepository,
    private val refreshTokenRepo: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val tokenService: TokenService
) {
    fun register(email: String, password: String, fullName: String, phone: String): User {
        if (userRepo.findByEmail(email).isPresent) throw BusinessRuleException("Email already registered")
        val user = User(email = email, password = passwordEncoder.encode(password), fullName = fullName, phone = phone, roles = mutableSetOf("USER"))
        return userRepo.save(user)
    }
    fun login(email: String, password: String): LoginResult {
        val user = userRepo.findByEmail(email).orElseThrow { BusinessRuleException("Invalid credentials") }
        if (!passwordEncoder.matches(password, user.password)) throw BusinessRuleException("Invalid credentials")
        val roles = user.roles.toList()
        val accessToken = tokenService.createAccessToken(user.id, roles)
        val refreshTokenStr = tokenService.createRefreshToken(user.id)
        refreshTokenRepo.deleteByUserId(user.id)
        val refreshToken = RefreshToken(token = refreshTokenStr, userId = user.id, expiryDate = Instant.now().plusSeconds(604800))
        refreshTokenRepo.save(refreshToken)
        return LoginResult(accessToken, refreshTokenStr, user.id, user.fullName)
    }
    fun refreshAccessToken(refreshToken: String): String {
        val stored = refreshTokenRepo.findByToken(refreshToken) ?: throw BusinessRuleException("Invalid refresh token")
        if (stored.expiryDate.isBefore(Instant.now())) throw BusinessRuleException("Refresh token expired")
        val user = userRepo.findById(stored.userId).orElseThrow { BusinessRuleException("User not found") }
        return tokenService.createAccessToken(user.id, user.roles.toList())
    }
}
data class LoginResult(val accessToken: String, val refreshToken: String, val userId: String, val fullName: String)
