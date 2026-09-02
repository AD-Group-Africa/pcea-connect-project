package ke.pcea.connect.modules.catechism.application

import ke.pcea.connect.modules.catechism.domain.*
import ke.pcea.connect.modules.catechism.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Catechism service — enforces object-level authorization.
 *
 * A learner sees only their own enrollment, progress and assessment results.
 * A CATECHISM_TEACHER sees learners enrolled in courses they can access (via
 * congregation-wide roles). The workflow is configurable — no hard-coded
 * confirmation criteria or theological progression rules.
 */
@Service
@Transactional
class CatechismService(
    private val courseRepo: CatechismCourseRepository,
    private val moduleRepo: CatechismModuleRepository,
    private val lessonRepo: CatechismLessonRepository,
    private val enrollmentRepo: CatechismEnrollmentRepository,
    private val progressRepo: CatechismProgressRepository,
    private val assessmentRepo: CatechismAssessmentRepository
) {
    // ── Authorization helpers ──────────────────────────────────────────

    private fun requireOwnEnrollment(userId: String, enrollmentId: String): CatechismEnrollment {
        val enrollment = enrollmentRepo.findById(enrollmentId)
            .orElseThrow { BusinessRuleException("Enrollment not found") }
        if (enrollment.userId != userId) {
            throw AccessDeniedException("Not authorized to view this enrollment")
        }
        return enrollment
    }

    private fun isTeacherOrAdmin(roles: Set<String>): Boolean =
        roles.any { it in setOf("SUPER_ADMIN", "ADMIN", "ELDER", "PASTOR", "CATECHISM_TEACHER") }

    // ── Courses ────────────────────────────────────────────────────────

    fun getActiveCourses(): List<CatechismCourse> = courseRepo.findByActiveTrue()

    fun getCoursesForCongregation(congregationId: String): List<CatechismCourse> =
        courseRepo.findByCongregationId(congregationId)

    fun createCourse(userId: String, roles: Set<String>, name: String, description: String, congregationId: String): CatechismCourse {
        if (!isTeacherOrAdmin(roles)) throw AccessDeniedException("Only teachers/admins can create courses")
        return courseRepo.save(CatechismCourse(name = name, description = description, congregationId = congregationId))
    }

    // ── Modules ────────────────────────────────────────────────────────

    fun getModules(courseId: String): List<CatechismModule> = moduleRepo.findByCourseId(courseId)

    fun createModule(userId: String, roles: Set<String>, courseId: String, name: String, description: String, sequenceOrder: Int): CatechismModule {
        if (!isTeacherOrAdmin(roles)) throw AccessDeniedException("Only teachers/admins can create modules")
        val course = courseRepo.findById(courseId).orElseThrow { BusinessRuleException("Course not found") }
        return moduleRepo.save(CatechismModule(name = name, description = description, course = course, sequenceOrder = sequenceOrder))
    }

    // ── Lessons ───────────────────────────────────────────────────────

    fun getLessons(moduleId: String): List<CatechismLesson> = lessonRepo.findByModuleId(moduleId)

    fun createLesson(userId: String, roles: Set<String>, moduleId: String, title: String,
                     content: String, bibleReference: String, sequenceOrder: Int): CatechismLesson {
        if (!isTeacherOrAdmin(roles)) throw AccessDeniedException("Only teachers/admins can create lessons")
        val module = moduleRepo.findById(moduleId).orElseThrow { BusinessRuleException("Module not found") }
        return lessonRepo.save(CatechismLesson(title = title, content = content, bibleReference = bibleReference,
            module = module, sequenceOrder = sequenceOrder))
    }

    // ── Enrollment ─────────────────────────────────────────────────────

    fun getMyEnrollments(userId: String): List<CatechismEnrollment> = enrollmentRepo.findByUserId(userId)

    fun getEnrollmentsForCourse(userId: String, roles: Set<String>, courseId: String): List<CatechismEnrollment> {
        if (!isTeacherOrAdmin(roles)) throw AccessDeniedException("Only teachers/admins can view all enrollments")
        return enrollmentRepo.findByCourseId(courseId)
    }

    fun enroll(userId: String, courseId: String): CatechismEnrollment {
        val existing = enrollmentRepo.findByUserIdAndCourseId(userId, courseId)
        if (existing != null) throw BusinessRuleException("Already enrolled")
        val course = courseRepo.findById(courseId).orElseThrow { BusinessRuleException("Course not found") }
        return enrollmentRepo.save(CatechismEnrollment(userId = userId, course = course))
    }

    // ── Progress ──────────────────────────────────────────────────────

    fun getMyProgress(userId: String, enrollmentId: String): List<CatechismProgress> {
        requireOwnEnrollment(userId, enrollmentId)
        return progressRepo.findByEnrollmentId(enrollmentId)
    }

    fun updateProgress(userId: String, roles: Set<String>, enrollmentId: String, lessonId: String, status: String): CatechismProgress {
        // Learners can update their own progress; teachers can update any
        val enrollment = enrollmentRepo.findById(enrollmentId)
            .orElseThrow { BusinessRuleException("Enrollment not found") }
        if (enrollment.userId != userId && !isTeacherOrAdmin(roles)) {
            throw AccessDeniedException("Not authorized to update this progress")
        }
        val existing = progressRepo.findByEnrollmentIdAndLessonId(enrollmentId, lessonId)
        val record = existing ?: CatechismProgress(enrollment = enrollment, lessonId = lessonId)
        val updated = record.copy(status = status,
            completedAt = if (status == "COMPLETED") LocalDateTime.now() else record.completedAt,
            updatedAt = LocalDateTime.now())
        return progressRepo.save(updated)
    }

    // ── Assessment ─────────────────────────────────────────────────────

    fun getMyAssessments(userId: String, enrollmentId: String): List<CatechismAssessment> {
        requireOwnEnrollment(userId, enrollmentId)
        return assessmentRepo.findByEnrollmentId(enrollmentId)
    }

    fun recordAssessment(userId: String, roles: Set<String>, enrollmentId: String, lessonId: String,
                         score: Int, maxScore: Int, passed: Boolean): CatechismAssessment {
        if (!isTeacherOrAdmin(roles)) throw AccessDeniedException("Only teachers/admins can record assessments")
        val enrollment = enrollmentRepo.findById(enrollmentId)
            .orElseThrow { BusinessRuleException("Enrollment not found") }
        return assessmentRepo.save(CatechismAssessment(enrollment = enrollment, lessonId = lessonId,
            score = score, maxScore = maxScore, passed = passed))
    }

    // ── Dashboard ──────────────────────────────────────────────────────

    fun getMyJourney(userId: String, enrollmentId: String): CatechismJourney {
        val enrollment = requireOwnEnrollment(userId, enrollmentId)
        val progress = progressRepo.findByEnrollmentId(enrollmentId)
        val courseId = enrollment.course?.id ?: throw BusinessRuleException("Course not found")
        val modules = moduleRepo.findByCourseId(courseId)
        val totalLessons = modules.sumOf { m -> lessonRepo.findByModuleId(m.id).size }
        val completedLessons = progress.count { it.status == "COMPLETED" }
        val percentage = if (totalLessons > 0) (completedLessons * 100) / totalLessons else 0
        return CatechismJourney(
            enrollmentId = enrollmentId,
            courseId = courseId,
            courseName = enrollment.course?.name ?: "",
            totalLessons = totalLessons,
            completedLessons = completedLessons,
            percentage = percentage,
            enrollmentStatus = enrollment.status
        )
    }
}

data class CatechismJourney(
    val enrollmentId: String,
    val courseId: String,
    val courseName: String,
    val totalLessons: Int,
    val completedLessons: Int,
    val percentage: Int,
    val enrollmentStatus: String
)
