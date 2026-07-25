package ke.pcea.connect.modules.analytics.api.controller
import ke.pcea.connect.modules.analytics.api.dto.*
import ke.pcea.connect.modules.analytics.application.AnalyticsService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
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

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/national")
    fun nationalMetrics() = ResponseEntity.ok(ApiResponse.success(service.getNationalMetrics()))

    @GetMapping("/drill-down/{level}/{id}")
    fun drillDown(@PathVariable level: String, @PathVariable id: String): ResponseEntity<ApiResponse<DrillDownMetrics>> {
        return ResponseEntity.ok(ApiResponse.success(service.getDrillDown(level, id)))
    }

    @GetMapping("/trends/{congregationId}")
    fun trends(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(service.getTrends(congregationId)))

    @GetMapping("/export/csv")
    fun exportCsv(): ResponseEntity<String> {
        val csv = StringBuilder()
        csv.appendLine("Month,Members,Attendance,Giving")
        val trends = service.getTrends("")
        trends[0].data.forEachIndexed { i, _ ->
            csv.appendLine("${trends[2].data[i].label},${trends[2].data[i].value},${trends[1].data[i].value},${trends[0].data[i].value}")
        }
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=analytics.csv")
            .contentType(MediaType.TEXT_PLAIN)
            .body(csv.toString())
    }
}
