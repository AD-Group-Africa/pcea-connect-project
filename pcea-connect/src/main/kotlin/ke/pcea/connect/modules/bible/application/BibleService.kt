package ke.pcea.connect.modules.bible.application
import ke.pcea.connect.modules.bible.domain.*
import ke.pcea.connect.modules.bible.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional
class BibleService(
    private val bookRepo: BibleBookRepository,
    private val verseRepo: BibleVerseRepository,
    private val bookmarkRepo: BibleBookmarkRepository,
    private val highlightRepo: BibleHighlightRepository,
    private val noteRepo: BibleNoteRepository,
    private val planRepo: BibleReadingPlanRepository,
    private val planDayRepo: BibleReadingPlanDayRepository,
    private val progressRepo: BibleUserReadingProgressRepository,
    private val devotionalRepo: BibleDevotionalRepository,
    private val streakRepo: BibleReadingStreakRepository
) {
    fun getBooks(testament: String?) = testament?.let { bookRepo.findByTestament(it) } ?: bookRepo.findAll()

    // Bulletproof: if translation is null or blank, return all verses for that chapter
    fun getVerses(bookId: String, chapter: Int, translation: String? = null): List<BibleVerse> {
        val all = verseRepo.findByBookIdAndChapter(bookId, chapter)
        return if (translation.isNullOrBlank()) all else all.filter { it.translation == translation }
    }

    fun getParallelVerses(bookId: String, chapter: Int, verse: Int): List<BibleVerse> =
        verseRepo.findByBookIdAndChapterAndVerse(bookId, chapter, verse)

    fun getVerse(bookId: String, chapter: Int, verse: Int, translation: String? = null): BibleVerse? {
        val verses = verseRepo.findByBookIdAndChapterAndVerse(bookId, chapter, verse)
        return if (translation != null) verses.find { it.translation == translation } else verses.firstOrNull()
    }

    fun searchVerses(keyword: String, translation: String = "KJV") =
        verseRepo.findByTranslation(translation).filter { it.text.contains(keyword, ignoreCase = true) }

    fun addBookmark(userId: String, bookId: String, chapter: Int, verse: Int, label: String) =
        bookmarkRepo.save(BibleBookmark(userId = userId, bookId = bookId, chapter = chapter, verse = verse, label = label))
    fun removeBookmark(userId: String, bookId: String, chapter: Int, verse: Int) =
        bookmarkRepo.deleteByUserIdAndBookIdAndChapterAndVerse(userId, bookId, chapter, verse)
    fun getBookmarks(userId: String) = bookmarkRepo.findByUserId(userId)

    fun addHighlight(userId: String, verseId: String, color: String) =
        highlightRepo.save(BibleHighlight(userId = userId, verseId = verseId, color = color))
    fun removeHighlight(userId: String, verseId: String) =
        highlightRepo.deleteByUserIdAndVerseId(userId, verseId)
    fun getHighlights(userId: String) = highlightRepo.findByUserId(userId)

    fun addNote(userId: String, verseId: String, content: String) =
        noteRepo.save(BibleNote(userId = userId, verseId = verseId, content = content))
    fun getNotes(userId: String, verseId: String) = noteRepo.findByUserIdAndVerseId(userId, verseId)

    fun getPlans() = planRepo.findAll()
    fun getPlanDays(planId: String) = planDayRepo.findByPlanIdOrderByDayNumber(planId)
    fun startPlan(userId: String, planId: String): BibleUserReadingProgress {
        val existing = progressRepo.findByUserIdAndPlanId(userId, planId)
        if (existing != null) return existing
        return progressRepo.save(BibleUserReadingProgress(userId = userId, planId = planId))
    }
    fun getProgress(userId: String, planId: String) = progressRepo.findByUserIdAndPlanId(userId, planId)
    fun completeDay(userId: String, planId: String, day: Int): BibleUserReadingProgress {
        val progress = progressRepo.findByUserIdAndPlanId(userId, planId)
            ?: throw BusinessRuleException("Plan not started")
        progress.currentDay = day
        return progressRepo.save(progress)
    }

    fun getDailyDevotional(date: LocalDate = LocalDate.now()) =
        devotionalRepo.findByDate(date) ?: throw BusinessRuleException("No devotional for today")

    fun recordReading(userId: String) {
        val today = LocalDate.now()
        if (streakRepo.findByUserIdAndDate(userId, today) == null) {
            streakRepo.save(BibleReadingStreak(userId = userId, date = today))
        }
    }

    fun getCurrentStreak(userId: String): Long {
        val today = LocalDate.now()
        var date = today
        var count = 0L
        while (streakRepo.findByUserIdAndDate(userId, date) != null) {
            count++
            date = date.minusDays(1)
        }
        return count
    }
}
