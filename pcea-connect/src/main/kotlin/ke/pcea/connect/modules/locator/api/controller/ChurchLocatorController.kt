package ke.pcea.connect.modules.locator.api.controller
import ke.pcea.connect.modules.locator.api.dto.*
import ke.pcea.connect.modules.locator.application.ChurchLocatorService
import ke.pcea.connect.modules.locator.domain.ChurchLocation
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/locator")
class ChurchLocatorController(private val service: ChurchLocatorService) {

    @GetMapping
    fun getAll(@RequestParam(required = false) query: String?): ResponseEntity<ApiResponse<List<ChurchLocationResponse>>> {
        val list = if (query != null) service.search(query) else service.getAll()
        return ResponseEntity.ok(ApiResponse.success(list.map {
            ChurchLocationResponse(it.id, it.congregationId, it.name, it.address,
                it.latitude, it.longitude, it.serviceTimes, it.phone, it.email,
                it.livestreamUrl, it.website)
        }))
    }

    @PostMapping
    fun add(@RequestBody req: ChurchLocationRequest): ResponseEntity<ApiResponse<ChurchLocationResponse>> {
        val loc = service.add(ChurchLocation(
            congregationId = req.congregationId, name = req.name, address = req.address,
            latitude = req.latitude, longitude = req.longitude, serviceTimes = req.serviceTimes,
            phone = req.phone, email = req.email, livestreamUrl = req.livestreamUrl, website = req.website))
        return ResponseEntity.ok(ApiResponse.success(
            ChurchLocationResponse(loc.id, loc.congregationId, loc.name, loc.address,
                loc.latitude, loc.longitude, loc.serviceTimes, loc.phone, loc.email,
                loc.livestreamUrl, loc.website)))
    }
}
