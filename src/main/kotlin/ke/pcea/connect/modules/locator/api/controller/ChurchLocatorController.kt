package ke.pcea.connect.modules.locator.api.controller
import ke.pcea.connect.modules.locator.api.dto.*
import ke.pcea.connect.modules.locator.application.ChurchLocatorService
import ke.pcea.connect.modules.locator.domain.ChurchLocation
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/locator")
class ChurchLocatorController(private val service: ChurchLocatorService) {

    @GetMapping
    fun getAll(@RequestParam(required = false) query: String?): ResponseEntity<ApiResponse<List<ChurchLocationResponse>>> {
        val list = if (query != null) service.search(query) else service.getAll()
        return ResponseEntity.ok(ApiResponse.success(list.map { toResponse(it) }))
    }

    /**
     * Public single-church profile. Powers the visitor-facing church page
     * (Journey A: a visitor can understand a congregation without an account).
     */
    @GetMapping("/{id}")
    fun getOne(@PathVariable id: String): ResponseEntity<ApiResponse<ChurchLocationResponse>> {
        val loc = service.getById(id)
        return ResponseEntity.ok(ApiResponse.success(toResponse(loc)))
    }

    /**
     * Adding a location is an administrative action. This endpoint was previously
     * permitAll() (the whole locator request path was public) — anyone could create
     * arbitrary church entries. The public directory only needs read access.
     */
    @PostMapping
    @PreAuthorize(Roles.STAFF_SPEL)
    fun add(@RequestBody req: ChurchLocationRequest): ResponseEntity<ApiResponse<ChurchLocationResponse>> {
        val loc = service.add(ChurchLocation(
            congregationId = req.congregationId, name = req.name, address = req.address,
            latitude = req.latitude, longitude = req.longitude, serviceTimes = req.serviceTimes,
            phone = req.phone, email = req.email, livestreamUrl = req.livestreamUrl, website = req.website))
        return ResponseEntity.ok(ApiResponse.success(toResponse(loc)))
    }

    private fun toResponse(loc: ChurchLocation) = ChurchLocationResponse(
        loc.id, loc.congregationId, loc.name, loc.address, loc.latitude, loc.longitude,
        loc.serviceTimes, loc.phone, loc.email, loc.livestreamUrl, loc.website)
}
