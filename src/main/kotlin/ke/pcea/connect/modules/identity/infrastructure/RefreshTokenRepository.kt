package ke.pcea.connect.modules.identity.infrastructure
import ke.pcea.connect.modules.identity.domain.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
interface RefreshTokenRepository : JpaRepository<RefreshToken, String> {
    fun findByToken(token: String): RefreshToken?
    fun deleteByUserId(userId: String)
}
