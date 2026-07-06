package ke.pcea.connect.modules.membership.infrastructure
import ke.pcea.connect.modules.membership.domain.MemberProfile
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MemberProfileRepository : JpaRepository<MemberProfile, String>
