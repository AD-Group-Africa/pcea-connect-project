package ke.pcea.connect.modules.catechism.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Catechism foundation — a reusable learning structure built on the shared Ministry
 * framework (a Catechism course belongs to a congregation). The hierarchy is:
 *
 *   COURSE → MODULE → LESSON → ENROLLMENT → PROGRESS → ASSESSMENT
 *
 * Confirmation criteria and theological progression rules are deliberately NOT
 * hard-coded — the workflow is configurable through the [status] and [sequenceOrder]
 * fields. This is a foundation, not a full LMS.
 */
@Entity
@Table(name = "catechism_courses")
data class CatechismCourse(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",                       // e.g. "Confirmation Class"
    val description: String = "",
    val congregationId: String = "",
    val active: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "catechism_modules")
data class CatechismModule(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",
    val description: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id") val course: CatechismCourse? = null,
    val sequenceOrder: Int = 0,                 // configurable ordering
    val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "catechism_lessons")
data class CatechismLesson(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val content: String = "",
    val bibleReference: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id") val module: CatechismModule? = null,
    val sequenceOrder: Int = 0,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

/**
 * A learner (user) enrolled in a catechism course. Enrollment is the gateway to
 * progress and assessment — only enrolled learners (or their teacher) see their
 * own progress. Object-level authorization enforced in the service layer.
 */
@Entity
@Table(name = "catechism_enrollments")
data class CatechismEnrollment(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id") val course: CatechismCourse? = null,
    val enrolledAt: LocalDateTime = LocalDateTime.now(),
    val status: String = "IN_PROGRESS"          // IN_PROGRESS, COMPLETED, WITHDRAWN
)

/**
 * Per-lesson progress for an enrollment. A learner sees only their own progress.
 */
@Entity
@Table(name = "catechism_progress")
data class CatechismProgress(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id") val enrollment: CatechismEnrollment? = null,
    val lessonId: String = "",
    val status: String = "NOT_STARTED",         // NOT_STARTED, IN_PROGRESS, COMPLETED
    val completedAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * Assessment result for a lesson — records a score. Only the learner and authorized
 * teachers see assessment results.
 */
@Entity
@Table(name = "catechism_assessments")
data class CatechismAssessment(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id") val enrollment: CatechismEnrollment? = null,
    val lessonId: String = "",
    val score: Int = 0,
    val maxScore: Int = 100,
    val passed: Boolean = false,
    val assessedAt: LocalDateTime = LocalDateTime.now()
)
