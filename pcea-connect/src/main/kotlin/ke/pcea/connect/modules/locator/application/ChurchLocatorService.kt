package ke.pcea.connect.modules.locator.application
import ke.pcea.connect.modules.locator.domain.*
import ke.pcea.connect.modules.locator.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ChurchLocatorService(private val repo: ChurchLocationRepository) {
    fun getAll() = repo.findAll()
    fun search(query: String) = repo.findByNameContainingIgnoreCase(query)
    fun getById(id: String) = repo.findById(id).orElseThrow { BusinessRuleException("Not found") }

    @Transactional
    fun add(location: ChurchLocation) = repo.save(location)
}
