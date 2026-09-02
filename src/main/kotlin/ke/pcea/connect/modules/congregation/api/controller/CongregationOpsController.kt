package ke.pcea.connect.modules.congregation.api.controller
import ke.pcea.connect.modules.congregation.api.dto.*
import ke.pcea.connect.modules.congregation.application.CongregationOpsService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/congregation-ops")
class CongregationOpsController(private val service: CongregationOpsService) {

    @PostMapping("/small-groups")
    fun createSmallGroup(@RequestBody req: SmallGroupRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createSmallGroup(req.name, req.description, req.congregationId, req.leaderId, req.meetingDay, req.meetingTime, req.location)))

    @GetMapping("/small-groups/{congregationId}")
    fun getSmallGroups(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getSmallGroups(congregationId)))

    @PostMapping("/committees")
    fun createCommittee(@RequestBody req: CommitteeRequest) = ResponseEntity.ok(ApiResponse.success(
        service.createCommittee(req.name, req.description, req.congregationId, req.chairpersonId, req.meetingFrequency)))

    @GetMapping("/committees/{congregationId}")
    fun getCommittees(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getCommittees(congregationId)))

    @PostMapping("/visitors")
    fun registerVisitor(@RequestBody req: VisitorRequest) = ResponseEntity.ok(ApiResponse.success(
        service.registerVisitor(req.fullName, req.phone, req.email, req.purpose, req.congregationId)))

    @GetMapping("/visitors/{congregationId}")
    fun getVisitors(@PathVariable congregationId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getVisitors(congregationId)))

    @PutMapping("/visitors/{visitorId}/follow-up")
    fun markVisitorFollowedUp(@PathVariable visitorId: String) = ResponseEntity.ok(ApiResponse.success(
        service.markVisitorFollowedUp(visitorId)))

    @GetMapping("/admin-dashboard/{congregationId}")
    fun getAdminDashboard(@PathVariable congregationId: String): ResponseEntity<ApiResponse<Map<String, Any>>> {
        val dashboard = service.getAdminDashboard(congregationId)
        return ResponseEntity.ok(ApiResponse.success(dashboard))
    }
}
