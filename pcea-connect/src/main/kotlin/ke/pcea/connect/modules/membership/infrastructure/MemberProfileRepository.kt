package ke.pcea.connect.modules.membership.infrastructure
import ke.pcea.connect.modules.membership.domain.MemberProfile
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface MemberProfileRepository : JpaRepository<MemberProfile, String> {
    @Query("SELECT m FROM MemberProfile m WHERE " +
           "LOWER(m.user.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.user.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.occupation) LIKE LOWER(CONCAT('%', :query, '%'))")
    fun search(query: String): List<MemberProfile>

    fun findByMemberStatus(status: String): List<MemberProfile>
}
