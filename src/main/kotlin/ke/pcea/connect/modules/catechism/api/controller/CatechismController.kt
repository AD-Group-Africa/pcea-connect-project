package ke.pcea.connect.modules.catechism.api.controller

import ke.pcea.connect.modules.catechism.api.dto.*
import ke.pcea.connect.modules.catechism.application.CatechismService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

/**
 * Catechism REST API — course → module → lesson → enrollment → progress → assessment.
 *
 * Learners see only their own enrollment, progress and assessment results.
 * Teachers/admins can create content and view all enrollments for a course.
 */
@RestController
@RequestMapping("/api/catechism")
class CatechismController(private val service: CatechismService) {

    // ── Courses ────────────────────────────────────────────────────────

    @GetMapping("/courses")
    fun getActiveCourses(): ResponseEntity<ApiResponse<List<CourseResponse>>> {
        val courses = service.getActiveCourses()
        return ResponseEntity.ok(ApiResponse.success(courses.map {
            CourseResponse(it.id, it.name, it.description, it.congregationId, it.active)
        }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','PASTOR','CATECHISM_TEACHER')")
    @PostMapping("/courses")
    fun createCourse(auth: Authentication, @RequestBody req: CreateCourseRequest): ResponseEntity<ApiResponse<CourseResponse>> {
        val course = service.createCourse(auth.name, auth.authorities.map { it.authority.removePrefix("ROLE_") }.toSet(),
            req.name, req.description, req.congregationId)
        return ResponseEntity.ok(ApiResponse.success(CourseResponse(course.id, course.name, course.description, course.congregationId, course.active)))
    }

    // ── Modules ────────────────────────────────────────────────────────

    @GetMapping("/courses/{courseId}/modules")
    fun getModules(@PathVariable courseId: String): ResponseEntity<ApiResponse<List<ModuleResponse>>> {
        val modules = service.getModules(courseId)
        return ResponseEntity.ok(ApiResponse.success(modules.map {
            ModuleResponse(it.id, it.name, it.description, it.course?.id ?: "", it.sequenceOrder)
        }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','PASTOR','CATECHISM_TEACHER')")
    @PostMapping("/modules")
    fun createModule(auth: Authentication, @RequestBody req: CreateModuleRequest): ResponseEntity<ApiResponse<ModuleResponse>> {
        val module = service.createModule(auth.name, auth.authorities.map { it.authority.removePrefix("ROLE_") }.toSet(),
            req.courseId, req.name, req.description, req.sequenceOrder)
        return ResponseEntity.ok(ApiResponse.success(ModuleResponse(module.id, module.name, module.description,
            module.course?.id ?: "", module.sequenceOrder)))
    }

    // ── Lessons ───────────────────────────────────────────────────────

    @GetMapping("/modules/{moduleId}/lessons")
    fun getLessons(@PathVariable moduleId: String): ResponseEntity<ApiResponse<List<LessonResponse>>> {
        val lessons = service.getLessons(moduleId)
        return ResponseEntity.ok(ApiResponse.success(lessons.map {
            LessonResponse(it.id, it.title, it.content, it.bibleReference, it.module?.id ?: "", it.sequenceOrder)
        }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','PASTOR','CATECHISM_TEACHER')")
    @PostMapping("/lessons")
    fun createLesson(auth: Authentication, @RequestBody req: CreateLessonRequest): ResponseEntity<ApiResponse<LessonResponse>> {
        val lesson = service.createLesson(auth.name, auth.authorities.map { it.authority.removePrefix("ROLE_") }.toSet(),
            req.moduleId, req.title, req.content, req.bibleReference, req.sequenceOrder)
        return ResponseEntity.ok(ApiResponse.success(LessonResponse(lesson.id, lesson.title, lesson.content,
            lesson.bibleReference, lesson.module?.id ?: "", lesson.sequenceOrder)))
    }

    // ── Enrollment ─────────────────────────────────────────────────────

    @GetMapping("/my-enrollments")
    fun getMyEnrollments(auth: Authentication): ResponseEntity<ApiResponse<List<EnrollmentResponse>>> {
        val enrollments = service.getMyEnrollments(auth.name)
        return ResponseEntity.ok(ApiResponse.success(enrollments.map {
            EnrollmentResponse(it.id, it.userId, it.course?.id ?: "", it.course?.name ?: "", it.status)
        }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','PASTOR','CATECHISM_TEACHER')")
    @GetMapping("/courses/{courseId}/enrollments")
    fun getEnrollmentsForCourse(auth: Authentication, @PathVariable courseId: String): ResponseEntity<ApiResponse<List<EnrollmentResponse>>> {
        val enrollments = service.getEnrollmentsForCourse(auth.name,
            auth.authorities.map { it.authority.removePrefix("ROLE_" ) }.toSet(), courseId)
        return ResponseEntity.ok(ApiResponse.success(enrollments.map {
            EnrollmentResponse(it.id, it.userId, it.course?.id ?: "", it.course?.name ?: "", it.status)
        }))
    }

    @PostMapping("/enroll")
    fun enroll(auth: Authentication, @RequestBody req: EnrollRequest): ResponseEntity<ApiResponse<EnrollmentResponse>> {
        val enrollment = service.enroll(auth.name, req.courseId)
        return ResponseEntity.ok(ApiResponse.success(EnrollmentResponse(enrollment.id, enrollment.userId,
            enrollment.course?.id ?: "", enrollment.course?.name ?: "", enrollment.status)))
    }

    // ── Progress ──────────────────────────────────────────────────────

    @GetMapping("/enrollments/{enrollmentId}/progress")
    fun getMyProgress(auth: Authentication, @PathVariable enrollmentId: String): ResponseEntity<ApiResponse<List<ProgressResponse>>> {
        val progress = service.getMyProgress(auth.name, enrollmentId)
        return ResponseEntity.ok(ApiResponse.success(progress.map {
            ProgressResponse(it.id, it.enrollment?.id ?: "", it.lessonId, it.status, it.completedAt?.toString())
        }))
    }

    @PostMapping("/progress")
    fun updateProgress(auth: Authentication, @RequestBody req: UpdateProgressRequest): ResponseEntity<ApiResponse<ProgressResponse>> {
        val progress = service.updateProgress(auth.name,
            auth.authorities.map { it.authority.removePrefix("ROLE_") }.toSet(),
            req.enrollmentId, req.lessonId, req.status)
        return ResponseEntity.ok(ApiResponse.success(ProgressResponse(progress.id,
            progress.enrollment?.id ?: "", progress.lessonId, progress.status, progress.completedAt?.toString())))
    }

    // ── Assessment ─────────────────────────────────────────────────────

    @GetMapping("/enrollments/{enrollmentId}/assessments")
    fun getMyAssessments(auth: Authentication, @PathVariable enrollmentId: String): ResponseEntity<ApiResponse<List<AssessmentResponse>>> {
        val assessments = service.getMyAssessments(auth.name, enrollmentId)
        return ResponseEntity.ok(ApiResponse.success(assessments.map {
            AssessmentResponse(it.id, it.enrollment?.id ?: "", it.lessonId, it.score, it.maxScore, it.passed)
        }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','PASTOR','CATECHISM_TEACHER')")
    @PostMapping("/assessments")
    fun recordAssessment(auth: Authentication, @RequestBody req: RecordAssessmentRequest): ResponseEntity<ApiResponse<AssessmentResponse>> {
        val assessment = service.recordAssessment(auth.name,
            auth.authorities.map { it.authority.removePrefix("ROLE_") }.toSet(),
            req.enrollmentId, req.lessonId, req.score, req.maxScore, req.passed)
        return ResponseEntity.ok(ApiResponse.success(AssessmentResponse(assessment.id,
            assessment.enrollment?.id ?: "", assessment.lessonId, assessment.score, assessment.maxScore, assessment.passed)))
    }

    // ── Dashboard ──────────────────────────────────────────────────────

    @GetMapping("/enrollments/{enrollmentId}/journey")
    fun getMyJourney(auth: Authentication, @PathVariable enrollmentId: String): ResponseEntity<ApiResponse<JourneyResponse>> {
        val journey = service.getMyJourney(auth.name, enrollmentId)
        return ResponseEntity.ok(ApiResponse.success(JourneyResponse(journey.enrollmentId, journey.courseId,
            journey.courseName, journey.totalLessons, journey.completedLessons, journey.percentage, journey.enrollmentStatus)))
    }
}
