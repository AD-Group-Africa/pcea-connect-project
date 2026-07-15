package ke.pcea.connect.modules.congregation.infrastructure
import ke.pcea.connect.modules.congregation.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface SmallGroupRepository : JpaRepository<SmallGroup, String> {
    fun findByCongregationId(congregationId: String): List<SmallGroup>
}

@Repository interface CommitteeRepository : JpaRepository<Committee, String> {
    fun findByCongregationId(congregationId: String): List<Committee>
}

@Repository interface VisitorRepository : JpaRepository<Visitor, String> {
    fun findByCongregationId(congregationId: String): List<Visitor>
}
