package ke.pcea.connect.modules.identity.infrastructure
import ke.pcea.connect.modules.identity.domain.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*
interface UserRepository : JpaRepository<User, String> {
    fun findByEmail(email: String): Optional<User>
    fun countByCongregationId(congregationId: String): Long
}
