package ke.pcea.connect.modules.locator.infrastructure
import ke.pcea.connect.modules.locator.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface ChurchLocationRepository : JpaRepository<ChurchLocation, String> {
    fun findByNameContainingIgnoreCase(name: String): List<ChurchLocation>
}
