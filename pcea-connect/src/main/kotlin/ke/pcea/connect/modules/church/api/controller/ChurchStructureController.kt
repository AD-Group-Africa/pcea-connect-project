package ke.pcea.connect.modules.church.api.controller
import ke.pcea.connect.modules.church.application.ChurchStructureService
import ke.pcea.connect.modules.church.domain.*
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class CreateRegionRequest(val name: String, val address: String = "", val phone: String = "", val email: String = "")
data class CreatePresbyteryRequest(val name: String, val regionId: String)
data class CreateParishRequest(val name: String, val presbyteryId: String)
data class CreateCongregationRequest(val name: String, val parishId: String)

@RestController
@RequestMapping("/api/church")
class ChurchStructureController(private val service: ChurchStructureService) {

    @GetMapping("/regions")
    fun getRegions() = ResponseEntity.ok(ApiResponse.success(service.getAllRegions()))

    @PostMapping("/regions")
    fun createRegion(@RequestBody req: CreateRegionRequest) =
        ResponseEntity.ok(ApiResponse.success(service.createRegion(Region(name = req.name, address = req.address, phone = req.phone, email = req.email))))

    @GetMapping("/presbyteries")
    fun getPresbyteries(@RequestParam regionId: String) = ResponseEntity.ok(ApiResponse.success(service.getPresbyteriesByRegion(regionId)))

    @PostMapping("/presbyteries")
    fun createPresbytery(@RequestBody req: CreatePresbyteryRequest) =
        ResponseEntity.ok(ApiResponse.success(service.createPresbytery(req.name, req.regionId)))

    @GetMapping("/parishes")
    fun getParishes(@RequestParam presbyteryId: String) = ResponseEntity.ok(ApiResponse.success(service.getParishesByPresbytery(presbyteryId)))

    @PostMapping("/parishes")
    fun createParish(@RequestBody req: CreateParishRequest) =
        ResponseEntity.ok(ApiResponse.success(service.createParish(req.name, req.presbyteryId)))

    @GetMapping("/congregations")
    fun getCongregations(@RequestParam parishId: String) = ResponseEntity.ok(ApiResponse.success(service.getCongregationsByParish(parishId)))

    @PostMapping("/congregations")
    fun createCongregation(@RequestBody req: CreateCongregationRequest) =
        ResponseEntity.ok(ApiResponse.success(service.createCongregation(req.name, req.parishId)))

    @GetMapping("/general-assembly")
    fun getGeneralAssembly() = ResponseEntity.ok(ApiResponse.success(service.getGeneralAssembly()))
}
