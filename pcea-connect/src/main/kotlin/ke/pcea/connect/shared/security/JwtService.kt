package ke.pcea.connect.shared.security
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.*
import javax.crypto.SecretKey
@Service
class JwtService(
    @Value("\${jwt.secret}") secret: String,
    @Value("\${jwt.expiration-ms}") private val expirationMs: Long,
    @Value("\${jwt.refresh-expiration-ms}") private val refreshExpirationMs: Long
) {
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray())
    fun generateToken(userId: String, roles: List<String> = emptyList()): String {
        val now = Date()
        return Jwts.builder().subject(userId).claim("roles", roles)
            .issuedAt(now).expiration(Date(now.time + expirationMs))
            .signWith(signingKey).compact()
    }
    fun generateRefreshToken(userId: String): String {
        val now = Date()
        return Jwts.builder().subject(userId).issuedAt(now)
            .expiration(Date(now.time + refreshExpirationMs)).signWith(signingKey).compact()
    }
    fun validateToken(token: String): Boolean {
        return try { Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token); true } catch (e: Exception) { false }
    }
    fun getUserIdFromToken(token: String): String {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).payload.subject
    }

    @Suppress("UNCHECKED_CAST")
    fun getRolesFromToken(token: String): List<String> {
        val claims = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).payload
        return (claims["roles"] as? List<*>)?.mapNotNull { it as? String } ?: emptyList()
    }
}
