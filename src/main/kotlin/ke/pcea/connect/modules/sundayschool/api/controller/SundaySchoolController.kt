package ke.pcea.connect.modules.sundayschool.api.controller

import ke.pcea.connect.modules.sundayschool.api.dto.*
import ke.pcea.connect.modules.sundayschool.application.SundaySchoolService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

/**
 * Sunday School REST API — child/parent/teacher journey.
 *
 * Every endpoint derives the requesting user from the JWT principal (auth.name = userId)
 * and the service layer enforces object-level authorization. No child data is exposed
 * without a verified parent link or teacher assignment.
 */
@RestController
@RequestMapping("/api/sunday-school")
class SundaySchoolController(private val service: SundaySchoolService) {

    // ── Classes ────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','PASTOR','SUNDAY_SCHOOL_TEACHER')")
    @GetMapping("/classes")
    fun getMyClasses(auth: Authentication): ResponseEntity<ApiResponse<List<SundaySchoolClassResponse>>> {
        val userId = auth.name
        val classes = if (auth.authorities.any { it.authority in setOf("ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_ELDER", "ROLE_PASTOR") }) {
            // Admins see all classes they have access to via teacher assignments OR congregation
            service.getClassesForTeacher(userId)
        } else {
            service.getClassesForTeacher(userId)
        }
        return ResponseEntity.ok(ApiResponse.success(classes.map { it.toResponse() }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER')")
    @PostMapping("/classes")
    fun createClass(auth: Authentication, @RequestBody req: CreateClassRequest): ResponseEntity<ApiResponse<SundaySchoolClassResponse>> {
        val ssClass = service.createClass(auth.name, req.name, req.ageGroup, req.congregationId, req.ministryId)
        return ResponseEntity.ok(ApiResponse.success(ssClass.toResponse()))
    }

    // ── Teacher assignments ────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER')")
    @PostMapping("/classes/{classId}/teachers")
    fun assignTeacher(auth: Authentication, @PathVariable classId: String, @RequestBody req: AssignTeacherRequest): ResponseEntity<ApiResponse<Map<String, String>>> {
        service.assignTeacher(auth.name, classId, req.teacherUserId, req.role)
        return ResponseEntity.ok(ApiResponse.success(mapOf("status" to "assigned")))
    }

    // ── Children (teacher view) ───────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @GetMapping("/classes/{classId}/children")
    fun getChildrenForClass(auth: Authentication, @PathVariable classId: String): ResponseEntity<ApiResponse<List<ChildResponse>>> {
        val children = service.getChildrenForClass(auth.name, classId)
        return ResponseEntity.ok(ApiResponse.success(children.map { it.toResponse() }))
    }

    // ── Children (parent view) ────────────────────────────────────────

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/my-children")
    fun getMyChildren(auth: Authentication): ResponseEntity<ApiResponse<List<ChildResponse>>> {
        val children = service.getChildrenForParent(auth.name)
        return ResponseEntity.ok(ApiResponse.success(children.map { it.toResponse() }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @PostMapping("/children")
    fun enrollChild(auth: Authentication, @RequestBody req: EnrollChildRequest): ResponseEntity<ApiResponse<ChildResponse>> {
        val dob = req.dateOfBirth?.let { LocalDate.parse(it) }
        val child = service.enrollChild(auth.name, req.childName, req.classId, dob, req.congregationId)
        return ResponseEntity.ok(ApiResponse.success(child.toResponse()))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER')")
    @PostMapping("/parent-links")
    fun linkParent(auth: Authentication, @RequestBody req: LinkParentRequest): ResponseEntity<ApiResponse<Map<String, String>>> {
        service.linkParent(auth.name, req.childId, req.parentUserId, req.relationship)
        return ResponseEntity.ok(ApiResponse.success(mapOf("status" to "linked")))
    }

    // ── Lessons ───────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @GetMapping("/classes/{classId}/lessons")
    fun getLessonsForClass(auth: Authentication, @PathVariable classId: String): ResponseEntity<ApiResponse<List<LessonResponse>>> {
        val lessons = service.getLessonsForClass(auth.name, classId)
        return ResponseEntity.ok(ApiResponse.success(lessons.map { it.toResponse() }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @PostMapping("/lessons")
    fun createLesson(auth: Authentication, @RequestBody req: CreateLessonRequest): ResponseEntity<ApiResponse<LessonResponse>> {
        val lesson = service.createLesson(auth.name, req.classId, req.title, req.bibleReference,
            req.description, LocalDate.parse(req.lessonDate))
        return ResponseEntity.ok(ApiResponse.success(lesson.toResponse()))
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/children/{childId}/lessons")
    fun getLessonsForChild(auth: Authentication, @PathVariable childId: String): ResponseEntity<ApiResponse<List<LessonResponse>>> {
        val lessons = service.getLessonsForParent(auth.name, childId)
        return ResponseEntity.ok(ApiResponse.success(lessons.map { it.toResponse() }))
    }

    // ── Attendance ─────────────────────────────────────────────────────

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/children/{childId}/attendance")
    fun getAttendanceForChild(auth: Authentication, @PathVariable childId: String): ResponseEntity<ApiResponse<List<AttendanceResponse>>> {
        val records = service.getAttendanceForChild(auth.name, childId)
        return ResponseEntity.ok(ApiResponse.success(records.map { it.toResponse() }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @PostMapping("/attendance")
    fun recordAttendance(auth: Authentication, @RequestBody req: RecordAttendanceRequest): ResponseEntity<ApiResponse<AttendanceResponse>> {
        val record = service.recordAttendance(auth.name, req.childId, req.lessonId, req.present, req.note)
        return ResponseEntity.ok(ApiResponse.success(record.toResponse()))
    }

    // ── Progress ───────────────────────────────────────────────────────

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/children/{childId}/progress")
    fun getProgressForChild(auth: Authentication, @PathVariable childId: String): ResponseEntity<ApiResponse<List<ProgressResponse>>> {
        val records = service.getProgressForChild(auth.name, childId)
        return ResponseEntity.ok(ApiResponse.success(records.map { it.toResponse() }))
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @PostMapping("/progress")
    fun recordProgress(auth: Authentication, @RequestBody req: RecordProgressRequest): ResponseEntity<ApiResponse<ProgressResponse>> {
        val record = service.recordProgress(auth.name, req.childId, req.lessonId, req.status, req.note)
        return ResponseEntity.ok(ApiResponse.success(record.toResponse()))
    }

    // ── Dashboard stats ────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','ELDER','SUNDAY_SCHOOL_TEACHER')")
    @GetMapping("/classes/{classId}/stats")
    fun getClassStats(auth: Authentication, @PathVariable classId: String): ResponseEntity<ApiResponse<ClassStatsResponse>> {
        val stats = service.getClassStats(auth.name, classId)
        return ResponseEntity.ok(ApiResponse.success(ClassStatsResponse(
            stats.classId, stats.learnerCount, stats.presentToday,
            stats.todaysLessonTitle, stats.todaysLessonReference
        )))
    }

    // ── Mapping helpers ─────────────────────────────────────────────────

    private fun ke.pcea.connect.modules.sundayschool.domain.SundaySchoolClass.toResponse() =
        SundaySchoolClassResponse(id, name, ageGroup, ministry?.id ?: "", congregationId, active)

    private fun ke.pcea.connect.modules.sundayschool.domain.ChildEnrollment.toResponse() =
        ChildResponse(id, childName, dateOfBirth?.toString(), sundaySchoolClass?.id ?: "", sundaySchoolClass?.name ?: "")

    private fun ke.pcea.connect.modules.sundayschool.domain.SundaySchoolLesson.toResponse() =
        LessonResponse(id, title, bibleReference, description, sundaySchoolClass?.id ?: "", lessonDate.toString())

    private fun ke.pcea.connect.modules.sundayschool.domain.SundaySchoolAttendance.toResponse() =
        AttendanceResponse(id, child?.id ?: "", lesson?.id, attendanceDate.toString(), present, note)

    private fun ke.pcea.connect.modules.sundayschool.domain.SundaySchoolProgress.toResponse() =
        ProgressResponse(id, child?.id ?: "", lessonId, status, note)
}
