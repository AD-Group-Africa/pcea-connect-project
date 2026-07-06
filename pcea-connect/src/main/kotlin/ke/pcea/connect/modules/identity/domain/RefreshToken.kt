package ke.pcea.connect.modules.identity.domain
import jakarta.persistence.*
import java.time.Instant
@Entity
@Table(name = "refresh_tokens")
data class RefreshToken(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val token: String = "",
    val userId: String = "",
    val expiryDate: Instant = Instant.now()
)
