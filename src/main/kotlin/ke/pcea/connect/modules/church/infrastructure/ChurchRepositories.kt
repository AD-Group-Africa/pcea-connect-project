package ke.pcea.connect.modules.church.infrastructure
import ke.pcea.connect.modules.church.domain.*
import org.springframework.data.jpa.repository.JpaRepository

interface CongregationRepository : JpaRepository<Congregation, String> {
    fun findByParishId(parishId: String): List<Congregation>
}
interface ParishRepository : JpaRepository<Parish, String> {
    fun findByPresbyteryId(presbyteryId: String): List<Parish>
}
interface PresbyteryRepository : JpaRepository<Presbytery, String> {
    fun findByRegionId(regionId: String): List<Presbytery>
}
interface RegionRepository : JpaRepository<Region, String>
interface GeneralAssemblyRepository : JpaRepository<GeneralAssembly, String>
