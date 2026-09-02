package ke.pcea.connect.modules.bible.api.controller
import ke.pcea.connect.modules.bible.api.dto.*
import ke.pcea.connect.modules.bible.application.BibleService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
@RequestMapping("/api/bible")
class BibleController(private val service: BibleService) {

    @GetMapping("/books")
    fun getBooks(@RequestParam(required = false) testament: String?) =
        ResponseEntity.ok(ApiResponse.success(service.getBooks(testament).map { BibleBookResponse(it.id, it.name, it.testament) }))

    @GetMapping("/verses/{bookId}/{chapter}")
    fun getVerses(@PathVariable bookId: String, @PathVariable chapter: Int) =
        ResponseEntity.ok(ApiResponse.success(service.getVerses(bookId, chapter).map {
            BibleVerseResponse(it.id, it.bookId, it.chapter, it.verse, it.text, it.translation, it.audioUrl)
        }))

    @GetMapping("/verses/{bookId}/{chapter}/{verse}")
    fun getVerse(@PathVariable bookId: String, @PathVariable chapter: Int, @PathVariable verse: Int) =
        ResponseEntity.ok(ApiResponse.success(service.getVerse(bookId, chapter, verse)?.let {
            BibleVerseResponse(it.id, it.bookId, it.chapter, it.verse, it.text, it.translation, it.audioUrl)
        }))

    @GetMapping("/parallel/{bookId}/{chapter}/{verse}")
    fun getParallelVerses(@PathVariable bookId: String, @PathVariable chapter: Int, @PathVariable verse: Int) =
        ResponseEntity.ok(ApiResponse.success(service.getParallelVerses(bookId, chapter, verse).map {
            BibleVerseResponse(it.id, it.bookId, it.chapter, it.verse, it.text, it.translation, it.audioUrl)
        }))

    @GetMapping("/search")
    fun search(@RequestParam keyword: String, @RequestParam(defaultValue = "KJV") translation: String) =
        ResponseEntity.ok(ApiResponse.success(service.searchVerses(keyword, translation).map {
            BibleVerseResponse(it.id, it.bookId, it.chapter, it.verse, it.text, it.translation, it.audioUrl)
        }))

    @GetMapping("/bookmarks")
    fun getBookmarks(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.getBookmarks(auth.name).map { BibleBookmarkResponse(it.id, it.bookId, it.chapter, it.verse, it.label) }))

    @PostMapping("/bookmarks")
    fun addBookmark(auth: Authentication, @RequestBody req: BibleBookmarkRequest) =
        ResponseEntity.ok(ApiResponse.success(service.addBookmark(auth.name, req.bookId, req.chapter, req.verse, req.label)
            .let { BibleBookmarkResponse(it.id, it.bookId, it.chapter, it.verse, it.label) }))

    @DeleteMapping("/bookmarks")
    fun removeBookmark(auth: Authentication, @RequestParam bookId: String, @RequestParam chapter: Int, @RequestParam verse: Int) =
        ResponseEntity.ok(ApiResponse.success(service.removeBookmark(auth.name, bookId, chapter, verse).let { "Removed" }))

    @GetMapping("/highlights")
    fun getHighlights(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        service.getHighlights(auth.name).map { BibleHighlightResponse(it.id, it.verseId, it.color) }))

    @PostMapping("/highlights")
    fun addHighlight(auth: Authentication, @RequestBody req: BibleHighlightRequest) =
        ResponseEntity.ok(ApiResponse.success(service.addHighlight(auth.name, req.verseId, req.color)
            .let { BibleHighlightResponse(it.id, it.verseId, it.color) }))

    @DeleteMapping("/highlights/{verseId}")
    fun removeHighlight(auth: Authentication, @PathVariable verseId: String) =
        ResponseEntity.ok(ApiResponse.success(service.removeHighlight(auth.name, verseId).let { "Removed" }))

    @GetMapping("/notes/{verseId}")
    fun getNotes(auth: Authentication, @PathVariable verseId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getNotes(auth.name, verseId).map { BibleNoteResponse(it.id, it.verseId, it.content, it.createdAt.toString()) }))

    @PostMapping("/notes")
    fun addNote(auth: Authentication, @RequestBody req: BibleNoteRequest) =
        ResponseEntity.ok(ApiResponse.success(service.addNote(auth.name, req.verseId, req.content)
            .let { BibleNoteResponse(it.id, it.verseId, it.content, it.createdAt.toString()) }))

    @GetMapping("/plans")
    fun getPlans() = ResponseEntity.ok(ApiResponse.success(service.getPlans().map { BiblePlanResponse(it.id, it.name, it.description, it.days) }))
    @GetMapping("/plans/{planId}/days")
    fun getPlanDays(@PathVariable planId: String) = ResponseEntity.ok(ApiResponse.success(service.getPlanDays(planId).map {
        mapOf("day" to it.dayNumber, "bookId" to it.bookId, "startChapter" to it.startChapter, "endChapter" to it.endChapter) }))
    @PostMapping("/plans/{planId}/start")
    fun startPlan(auth: Authentication, @PathVariable planId: String) = ResponseEntity.ok(ApiResponse.success(
        service.startPlan(auth.name, planId).let { BibleProgressResponse(it.planId, it.currentDay, it.completed) }))
    @GetMapping("/plans/{planId}/progress")
    fun getProgress(auth: Authentication, @PathVariable planId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getProgress(auth.name, planId)?.let { BibleProgressResponse(it.planId, it.currentDay, it.completed) }
            ?: BibleProgressResponse(planId, 0, false)))
    @PostMapping("/plans/{planId}/complete-day/{day}")
    fun completeDay(auth: Authentication, @PathVariable planId: String, @PathVariable day: Int) = ResponseEntity.ok(ApiResponse.success(
        service.completeDay(auth.name, planId, day).let { BibleProgressResponse(it.planId, it.currentDay, it.completed) }))

    @GetMapping("/devotional")
    fun getDailyDevotional() = ResponseEntity.ok(ApiResponse.success(
        service.getDailyDevotional().let { BibleDevotionalResponse(it.title, it.verseRef, it.content, it.author, it.date.toString()) }))

    @PostMapping("/reading-streak")
    fun recordReading(auth: Authentication): ResponseEntity<ApiResponse<Map<String, Any>>> {
        service.recordReading(auth.name)
        val streak = service.getCurrentStreak(auth.name)
        return ResponseEntity.ok(ApiResponse.success(mapOf("streak" to streak)))
    }

    @GetMapping("/reading-streak")
    fun getStreak(auth: Authentication): ResponseEntity<ApiResponse<Map<String, Any>>> {
        val streak = service.getCurrentStreak(auth.name)
        return ResponseEntity.ok(ApiResponse.success(mapOf("streak" to streak)))
    }
}
