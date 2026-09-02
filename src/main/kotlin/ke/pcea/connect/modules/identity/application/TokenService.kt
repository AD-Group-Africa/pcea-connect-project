package ke.pcea.connect.modules.identity.application
import ke.pcea.connect.shared.security.JwtService
import org.springframework.stereotype.Service
@Service
class TokenService(private val jwtService: JwtService) {
    fun createAccessToken(userId: String, roles: List<String>) = jwtService.generateToken(userId, roles)
    fun createRefreshToken(userId: String) = jwtService.generateRefreshToken(userId)
    fun validateToken(token: String) = jwtService.validateToken(token)
    fun getUserId(token: String) = jwtService.getUserIdFromToken(token)
}
