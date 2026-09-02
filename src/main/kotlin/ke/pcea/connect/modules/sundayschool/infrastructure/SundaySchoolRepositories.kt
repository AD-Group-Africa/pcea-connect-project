package ke.pcea.connect.modules.sundayschool.infrastructure

import ke.pcea.connect.modules.sundayschool.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface SundaySchoolClassRepository : JpaRepository<SundaySchoolClass, String> {
    fun findByCongregationId(congregationId: String): List<SundaySchoolClass>
}

@Repository interface TeacherAssignmentRepository : JpaRepository<TeacherAssignment, String> {
    fun findByTeacherUserId(teacherUserId: String): List<TeacherAssignment>
    fun findBySundaySchoolClassId(classId: String): List<TeacherAssignment>
    fun findBySundaySchoolClassIdAndTeacherUserId(classId: String, teacherUserId: String): TeacherAssignment?
}

@Repository interface ChildEnrollmentRepository : JpaRepository<ChildEnrollment, String> {
    fun findBySundaySchoolClassId(classId: String): List<ChildEnrollment>
}

@Repository interface ParentGuardianLinkRepository : JpaRepository<ParentGuardianLink, String> {
    fun findByParentUserId(parentUserId: String): List<ParentGuardianLink>
    fun findByChildId(childId: String): List<ParentGuardianLink>
    fun findByChildIdAndParentUserId(childId: String, parentUserId: String): ParentGuardianLink?
}

@Repository interface SundaySchoolLessonRepository : JpaRepository<SundaySchoolLesson, String> {
    fun findBySundaySchoolClassId(classId: String): List<SundaySchoolLesson>
    fun findBySundaySchoolClassIdAndLessonDate(classId: String, lessonDate: java.time.LocalDate): List<SundaySchoolLesson>
}

@Repository interface SundaySchoolAttendanceRepository : JpaRepository<SundaySchoolAttendance, String> {
    fun findByChildId(childId: String): List<SundaySchoolAttendance>
    fun findByLessonId(lessonId: String): List<SundaySchoolAttendance>
    fun findByChildIdAndLessonId(childId: String, lessonId: String): SundaySchoolAttendance?
}

@Repository interface SundaySchoolProgressRepository : JpaRepository<SundaySchoolProgress, String> {
    fun findByChildId(childId: String): List<SundaySchoolProgress>
    fun findByLessonId(lessonId: String): List<SundaySchoolProgress>
}
