package ke.pcea.connect.modules.bible.infrastructure
import ke.pcea.connect.modules.bible.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository interface BibleBookRepository : JpaRepository<BibleBook, String> {
    fun findByTestament(testament: String): List<BibleBook>
}

@Repository interface BibleVerseRepository : JpaRepository<BibleVerse, String> {
    fun findByBookIdAndChapter(bookId: String, chapter: Int): List<BibleVerse>
    fun findByBookIdAndChapterAndVerse(bookId: String, chapter: Int, verse: Int): List<BibleVerse>
    fun findByTranslation(translation: String): List<BibleVerse>
}

@Repository interface BibleBookmarkRepository : JpaRepository<BibleBookmark, String> {
    fun findByUserId(userId: String): List<BibleBookmark>
    fun deleteByUserIdAndBookIdAndChapterAndVerse(userId: String, bookId: String, chapter: Int, verse: Int)
}

@Repository interface BibleHighlightRepository : JpaRepository<BibleHighlight, String> {
    fun findByUserId(userId: String): List<BibleHighlight>
    fun deleteByUserIdAndVerseId(userId: String, verseId: String)
}

@Repository interface BibleNoteRepository : JpaRepository<BibleNote, String> {
    fun findByUserIdAndVerseId(userId: String, verseId: String): List<BibleNote>
}

@Repository interface BibleReadingPlanRepository : JpaRepository<BibleReadingPlan, String> {}
@Repository interface BibleReadingPlanDayRepository : JpaRepository<BibleReadingPlanDay, String> {
    fun findByPlanIdOrderByDayNumber(planId: String): List<BibleReadingPlanDay>
}
@Repository interface BibleUserReadingProgressRepository : JpaRepository<BibleUserReadingProgress, String> {
    fun findByUserIdAndPlanId(userId: String, planId: String): BibleUserReadingProgress?
}
@Repository interface BibleDevotionalRepository : JpaRepository<BibleDevotional, String> {
    fun findByDate(date: LocalDate): BibleDevotional?
}

@Repository interface BibleReadingStreakRepository : JpaRepository<BibleReadingStreak, String> {
    fun countByUserIdAndDateAfter(userId: String, date: LocalDate): Long
    fun findByUserIdAndDate(userId: String, date: LocalDate): BibleReadingStreak?
}
