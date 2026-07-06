package ke.pcea.connect.modules.analytics.api.controller
import ke.pcea.connect.modules.analytics.application.AnalyticsService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/analytics")
class AnalyticsController(private val service: AnalyticsService) {

    @GetMapping("/congregation/{congregationId}")
    fun congregationMetrics(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(service.getCongregationMetrics(congregationId)))

    @GetMapping("/parish/{parishId}")
    fun parishMetrics(@PathVariable parishId: String) = ResponseEntity.ok(ApiResponse.success(service.getParishMetrics(parishId)))

    @GetMapping("/presbytery/{presbyteryId}")
    fun presbyteryMetrics(@PathVariable presbyteryId: String) = ResponseEntity.ok(ApiResponse.success(service.getPresbyteryMetrics(presbyteryId)))

    @GetMapping("/region/{regionId}")
    fun regionMetrics(@PathVariable regionId: String) = ResponseEntity.ok(ApiResponse.success(service.getRegionMetrics(regionId)))

    @GetMapping("/national")
    fun nationalMetrics() = ResponseEntity.ok(ApiResponse.success(service.getNationalMetrics()))
}
