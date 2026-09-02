package ke.pcea.connect.modules.identity.domain

import jakarta.persistence.*
import java.time.Instant

/**
 * Single-use, time-limited email verification token. The token value is a securely
 * random UUID. Tokens expire after 24 hours and are invalidated on use.
 */
@Entity
@Table(name = "email_verification_tokens")
data class EmailVerificationToken(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val token: String = "",
    val expiryDate: Instant = Instant.now().plusSeconds(86400),
    var used: Boolean = false
)
