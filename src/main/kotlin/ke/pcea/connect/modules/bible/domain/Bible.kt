package ke.pcea.connect.modules.bible.domain
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity @Table(name = "bible_books")
data class BibleBook(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val testament: String = "",
    val orderIndex: Int = 0
)

@Entity @Table(name = "bible_verses")
data class BibleVerse(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val bookId: String = "",
    val chapter: Int = 0,
    val verse: Int = 0,
    @Column(length = 1000) val text: String = "",
    val translation: String = "KJV",
    val audioUrl: String = ""          // NEW: audio Bible URL
)

@Entity @Table(name = "bible_bookmarks")
data class BibleBookmark(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val bookId: String = "",
    val chapter: Int = 0,
    val verse: Int = 0,
    val label: String = ""
)

@Entity @Table(name = "bible_highlights")
data class BibleHighlight(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val verseId: String = "",
    val color: String = "#FFEB3B"
)

@Entity @Table(name = "bible_notes")
data class BibleNote(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val verseId: String = "",
    val content: String = "",
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity @Table(name = "bible_reading_plans")
data class BibleReadingPlan(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val description: String = "",
    val days: Int = 0
)

@Entity @Table(name = "bible_reading_plan_days")
data class BibleReadingPlanDay(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val planId: String = "",
    val dayNumber: Int = 0,
    val bookId: String = "",
    val startChapter: Int = 0,
    val endChapter: Int = 0
)

@Entity @Table(name = "bible_user_reading_progress")
data class BibleUserReadingProgress(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val planId: String = "",
    var currentDay: Int = 1,
    var completed: Boolean = false
)

@Entity @Table(name = "bible_devotionals")
data class BibleDevotional(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val verseRef: String = "",
    val content: String = "",
    val author: String = "",
    val date: LocalDate = LocalDate.now()
)

@Entity @Table(name = "bible_reading_streaks")
data class BibleReadingStreak(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val date: LocalDate = LocalDate.now()
)
