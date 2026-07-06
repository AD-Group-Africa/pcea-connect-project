package ke.pcea.connect.modules.search.api.controller
import ke.pcea.connect.modules.bible.infrastructure.BibleVerseRepository
import ke.pcea.connect.modules.church.infrastructure.CongregationRepository
import ke.pcea.connect.modules.events.infrastructure.EventRepository
import ke.pcea.connect.modules.feed.infrastructure.FeedPostRepository
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.media.infrastructure.SermonRepository
import ke.pcea.connect.modules.ministries.infrastructure.MinistryRepository
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/search")
class SearchController(
    private val userRepo: UserRepository,
    private val congregationRepo: CongregationRepository,
    private val sermonRepo: SermonRepository,
    private val eventRepo: EventRepository,
    private val ministryRepo: MinistryRepository,
    private val postRepo: FeedPostRepository,
    private val bibleVerseRepo: BibleVerseRepository
) {
    @GetMapping
    fun search(@RequestParam q: String): ResponseEntity<ApiResponse<Map<String, List<Any>>>> {
        val query = q.trim().lowercase()
        val results = mapOf(
            "members" to userRepo.findAll().filter { it.fullName.lowercase().contains(query) || it.email.lowercase().contains(query) }.take(5),
            "congregations" to congregationRepo.findAll().filter { it.name.lowercase().contains(query) || it.address.lowercase().contains(query) }.take(5),
            "sermons" to sermonRepo.findAll().filter { it.title.lowercase().contains(query) || it.preacher.lowercase().contains(query) }.take(5),
            "events" to eventRepo.findAll().filter { it.title.lowercase().contains(query) || it.location.lowercase().contains(query) }.take(5),
            "ministries" to ministryRepo.findAll().filter { it.name.lowercase().contains(query) }.take(5),
            "posts" to postRepo.findAll().filter { it.content.lowercase().contains(query) }.take(5),
            "bible_verses" to bibleVerseRepo.findAll().filter { it.text.lowercase().contains(query) }.take(5)
        )
        return ResponseEntity.ok(ApiResponse.success(results))
    }
}
