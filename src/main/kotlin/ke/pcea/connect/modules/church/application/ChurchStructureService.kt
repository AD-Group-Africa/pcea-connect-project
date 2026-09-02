package ke.pcea.connect.modules.church.application
import ke.pcea.connect.modules.church.domain.*
import ke.pcea.connect.modules.church.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ChurchStructureService(
    private val regionRepo: RegionRepository,
    private val presbyteryRepo: PresbyteryRepository,
    private val parishRepo: ParishRepository,
    private val congregationRepo: CongregationRepository,
    private val gaRepo: GeneralAssemblyRepository
) {
    fun getAllRegions() = regionRepo.findAll()
    fun createRegion(region: Region) = regionRepo.save(region)
    fun getRegion(id: String) = regionRepo.findById(id).orElseThrow { BusinessRuleException("Region not found") }

    fun getPresbyteriesByRegion(regionId: String) = presbyteryRepo.findAll().filter { it.region?.id == regionId }
    fun createPresbytery(name: String, regionId: String): Presbytery {
        val region = regionRepo.findById(regionId).orElseThrow { BusinessRuleException("Region not found") }
        return presbyteryRepo.save(Presbytery(name = name, region = region))
    }
    fun getPresbytery(id: String) = presbyteryRepo.findById(id).orElseThrow { BusinessRuleException("Presbytery not found") }

    fun getParishesByPresbytery(presbyteryId: String) = parishRepo.findAll().filter { it.presbytery?.id == presbyteryId }
    fun createParish(name: String, presbyteryId: String): Parish {
        val presbytery = presbyteryRepo.findById(presbyteryId).orElseThrow { BusinessRuleException("Presbytery not found") }
        return parishRepo.save(Parish(name = name, presbytery = presbytery))
    }
    fun getParish(id: String) = parishRepo.findById(id).orElseThrow { BusinessRuleException("Parish not found") }

    fun getCongregationsByParish(parishId: String) = congregationRepo.findAll().filter { it.parish?.id == parishId }
    fun createCongregation(name: String, parishId: String): Congregation {
        val parish = parishRepo.findById(parishId).orElseThrow { BusinessRuleException("Parish not found") }
        return congregationRepo.save(Congregation(name = name, parish = parish))
    }
    fun getCongregation(id: String) = congregationRepo.findById(id).orElseThrow { BusinessRuleException("Congregation not found") }

    fun getGeneralAssembly() = gaRepo.findAll().firstOrNull() ?: gaRepo.save(GeneralAssembly())
}
