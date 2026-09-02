package ke.pcea.connect.modules.ministries.api.controller
import ke.pcea.connect.modules.ministries.application.MinistryFeedService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/ministries/{ministryId}/feed")
class MinistryFeedController(private val feedService: MinistryFeedService) {

    @GetMapping
    fun getFeed(@PathVariable ministryId: String) = ResponseEntity.ok(ApiResponse.success(
        feedService.getFeed(ministryId).map {
            mapOf("id" to it.id, "type" to it.type, "title" to it.title,
                  "description" to it.description, "timestamp" to it.timestamp.toString(),
                  "imageUrl" to (it.imageUrl ?: ""))
        }
    ))
}
