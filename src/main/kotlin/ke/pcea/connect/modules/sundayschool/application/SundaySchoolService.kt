package ke.pcea.connect.modules.sundayschool.application

import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.modules.sundayschool.domain.*
import ke.pcea.connect.modules.sundayschool.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Sunday School service — enforces object-level authorization on EVERY method.
 *
 * Privacy rules (non-negotiable, server-side):
 *  - Parent sees only children linked to their userId
 *  - Teacher sees only classes they are assigned to
 *  - Ministry leaders do NOT automatically see all child data
 *  - Attendance, progress and notes are scoped to the child's class / parent link
 *  - No child financial data
 *  - No public contact details
 */
@Service
@Transactional
class SundaySchoolService(
    private val classRepo: SundaySchoolClassRepository,
    private val teacherRepo: TeacherAssignmentRepository,
    private val childRepo: ChildEnrollmentRepository,
    private val parentLinkRepo: ParentGuardianLinkRepository,
    private val lessonRepo: SundaySchoolLessonRepository,
    private val attendanceRepo: SundaySchoolAttendanceRepository,
    private val progressRepo: SundaySchoolProgressRepository,
    private val userRepo: UserRepository
) {
    // ── Authorization helpers ──────────────────────────────────────────

    private fun userRoles(userId: String): Set<String> =
        userRepo.findById(userId).orElseThrow { BusinessRuleException("User not found") }.roles

    private fun isCongregationAdmin(userId: String): Boolean {
        val roles = userRoles(userId)
        return roles.any { it in setOf("SUPER_ADMIN", "ADMIN", "ELDER", "PASTOR", "MINISTER") }
    }

    private fun isTeacherOfClass(userId: String, classId: String): Boolean =
        teacherRepo.findBySundaySchoolClassIdAndTeacherUserId(classId, userId) != null

    private fun isParentOfChild(userId: String, childId: String): Boolean =
        parentLinkRepo.findByChildIdAndParentUserId(childId, userId) != null

    private fun requireTeacherOrAdmin(userId: String, classId: String) {
        if (!isCongregationAdmin(userId) && !isTeacherOfClass(userId, classId)) {
            throw AccessDeniedException("Not authorized for this class")
        }
    }

    private fun requireParentOrAdmin(userId: String, childId: String) {
        if (!isCongregationAdmin(userId) && !isParentOfChild(userId, childId)) {
            throw AccessDeniedException("Not authorized to view this child")
        }
    }

    // ── Classes ────────────────────────────────────────────────────────

    fun getClassesForCongregation(userId: String, congregationId: String): List<SundaySchoolClass> {
        require(isCongregationAdmin(userId) || hasAnyTeacherAssignment(userId, congregationId)) {
            throw AccessDeniedException("Not authorized to list classes")
        }
        return classRepo.findByCongregationId(congregationId)
    }

    private fun hasAnyTeacherAssignment(userId: String, congregationId: String): Boolean =
        teacherRepo.findByTeacherUserId(userId).any { it.sundaySchoolClass?.congregationId == congregationId }

    fun getClassesForTeacher(userId: String): List<SundaySchoolClass> {
        val assignments = teacherRepo.findByTeacherUserId(userId)
        return assignments.mapNotNull { it.sundaySchoolClass }
    }

    fun createClass(userId: String, name: String, ageGroup: String, congregationId: String, ministryId: String): SundaySchoolClass {
        if (!isCongregationAdmin(userId)) throw AccessDeniedException("Only admins can create classes")
        val ssClass = SundaySchoolClass(name = name, ageGroup = ageGroup, congregationId = congregationId)
        return classRepo.save(ssClass)
    }

    fun assignTeacher(userId: String, classId: String, teacherUserId: String, role: String): TeacherAssignment {
        if (!isCongregationAdmin(userId)) throw AccessDeniedException("Only admins can assign teachers")
        val ssClass = classRepo.findById(classId).orElseThrow { BusinessRuleException("Class not found") }
        return teacherRepo.save(TeacherAssignment(sundaySchoolClass = ssClass, teacherUserId = teacherUserId, role = role))
    }

    // ── Children ───────────────────────────────────────────────────────

    fun getChildrenForClass(userId: String, classId: String): List<ChildEnrollment> {
        requireTeacherOrAdmin(userId, classId)
        return childRepo.findBySundaySchoolClassId(classId)
    }

    fun getChildrenForParent(userId: String): List<ChildEnrollment> {
        val links = parentLinkRepo.findByParentUserId(userId)
        return links.mapNotNull { it.child }
    }

    fun enrollChild(userId: String, childName: String, classId: String, dateOfBirth: LocalDate?, congregationId: String): ChildEnrollment {
        requireTeacherOrAdmin(userId, classId)
        val ssClass = classRepo.findById(classId).orElseThrow { BusinessRuleException("Class not found") }
        return childRepo.save(ChildEnrollment(childName = childName, dateOfBirth = dateOfBirth,
            sundaySchoolClass = ssClass, congregationId = congregationId))
    }

    fun linkParent(userId: String, childId: String, parentUserId: String, relationship: String): ParentGuardianLink {
        if (!isCongregationAdmin(userId)) throw AccessDeniedException("Only admins can link parents")
        val child = childRepo.findById(childId).orElseThrow { BusinessRuleException("Child not found") }
        return parentLinkRepo.save(ParentGuardianLink(child = child, parentUserId = parentUserId, relationship = relationship))
    }

    // ── Lessons ───────────────────────────────────────────────────────

    fun getLessonsForClass(userId: String, classId: String): List<SundaySchoolLesson> {
        requireTeacherOrAdmin(userId, classId)
        return lessonRepo.findBySundaySchoolClassId(classId)
    }

    fun getLessonsForParent(userId: String, childId: String): List<SundaySchoolLesson> {
        requireParentOrAdmin(userId, childId)
        val child = childRepo.findById(childId).orElseThrow { BusinessRuleException("Child not found") }
        val classId = child.sundaySchoolClass?.id ?: return emptyList()
        return lessonRepo.findBySundaySchoolClassId(classId)
    }

    fun createLesson(userId: String, classId: String, title: String, bibleReference: String,
                     description: String, lessonDate: LocalDate): SundaySchoolLesson {
        requireTeacherOrAdmin(userId, classId)
        val ssClass = classRepo.findById(classId).orElseThrow { BusinessRuleException("Class not found") }
        return lessonRepo.save(SundaySchoolLesson(title = title, bibleReference = bibleReference,
            description = description, sundaySchoolClass = ssClass, lessonDate = lessonDate))
    }

    fun getTodaysLesson(userId: String, classId: String): SundaySchoolLesson? {
        requireTeacherOrAdmin(userId, classId)
        return lessonRepo.findBySundaySchoolClassIdAndLessonDate(classId, LocalDate.now()).firstOrNull()
    }

    // ── Attendance ────────────────────────────────────────────────────

    fun getAttendanceForChild(userId: String, childId: String): List<SundaySchoolAttendance> {
        requireParentOrAdmin(userId, childId)
        return attendanceRepo.findByChildId(childId)
    }

    fun getAttendanceForLesson(userId: String, lessonId: String): List<SundaySchoolAttendance> {
        val lesson = lessonRepo.findById(lessonId).orElseThrow { BusinessRuleException("Lesson not found") }
        val classId = lesson.sundaySchoolClass?.id ?: throw BusinessRuleException("Lesson has no class")
        requireTeacherOrAdmin(userId, classId)
        return attendanceRepo.findByLessonId(lessonId)
    }

    fun recordAttendance(userId: String, childId: String, lessonId: String, present: Boolean, note: String): SundaySchoolAttendance {
        val lesson = lessonRepo.findById(lessonId).orElseThrow { BusinessRuleException("Lesson not found") }
        val classId = lesson.sundaySchoolClass?.id ?: throw BusinessRuleException("Lesson has no class")
        requireTeacherOrAdmin(userId, classId)
        val child = childRepo.findById(childId).orElseThrow { BusinessRuleException("Child not found") }
        val existing = attendanceRepo.findByChildIdAndLessonId(childId, lessonId)
        val record = existing ?: SundaySchoolAttendance(child = child, lesson = lesson)
        val updated = record.copy(present = present, note = note, recordedByUserId = userId, recordedAt = LocalDateTime.now())
        return attendanceRepo.save(updated)
    }

    // ── Progress ──────────────────────────────────────────────────────

    fun getProgressForChild(userId: String, childId: String): List<SundaySchoolProgress> {
        requireParentOrAdmin(userId, childId)
        return progressRepo.findByChildId(childId)
    }

    fun recordProgress(userId: String, childId: String, lessonId: String?, status: String, note: String): SundaySchoolProgress {
        val child = childRepo.findById(childId).orElseThrow { BusinessRuleException("Child not found") }
        val classId = child.sundaySchoolClass?.id ?: throw BusinessRuleException("Child has no class")
        requireTeacherOrAdmin(userId, classId)
        return progressRepo.save(SundaySchoolProgress(child = child, lessonId = lessonId, status = status,
            note = note, recordedByUserId = userId))
    }

    // ── Dashboard stats ───────────────────────────────────────────────

    fun getClassStats(userId: String, classId: String): ClassStats {
        requireTeacherOrAdmin(userId, classId)
        val children = childRepo.findBySundaySchoolClassId(classId)
        val today = LocalDate.now()
        val todaysLesson = lessonRepo.findBySundaySchoolClassIdAndLessonDate(classId, today).firstOrNull()
        val presentCount = todaysLesson?.let { lesson ->
            attendanceRepo.findByLessonId(lesson.id).count { it.present }
        } ?: 0
        return ClassStats(
            classId = classId,
            learnerCount = children.size,
            presentToday = presentCount,
            todaysLessonTitle = todaysLesson?.title,
            todaysLessonReference = todaysLesson?.bibleReference
        )
    }
}

data class ClassStats(
    val classId: String,
    val learnerCount: Int,
    val presentToday: Int,
    val todaysLessonTitle: String?,
    val todaysLessonReference: String?
)
