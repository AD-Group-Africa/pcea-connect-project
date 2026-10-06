package ke.pcea.connect.modules.communion.infrastructure

import ke.pcea.connect.modules.communion.domain.CommunionEligibility
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface CommunionEligibilityRepository : JpaRepository<CommunionEligibility, String> {
    fun findByUserId(userId: String): Optional<CommunionEligibility>
}
