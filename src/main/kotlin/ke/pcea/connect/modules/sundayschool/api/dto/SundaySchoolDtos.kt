package ke.pcea.connect.modules.sundayschool.api.dto

import java.time.LocalDate
import java.time.LocalDateTime

data class CreateClassRequest(
    val name: String,
    val ageGroup: String = "",
    val congregationId: String,
    val ministryId: String = ""
)

data class AssignTeacherRequest(
    val teacherUserId: String,
    val role: String = "TEACHER"
)

data class EnrollChildRequest(
    val childName: String,
    val classId: String,
    val dateOfBirth: String? = null,
    val congregationId: String = ""
)

data class LinkParentRequest(
    val childId: String,
    val parentUserId: String,
    val relationship: String = "PARENT"
)

data class CreateLessonRequest(
    val title: String,
    val bibleReference: String = "",
    val description: String = "",
    val classId: String,
    val lessonDate: String
)

data class RecordAttendanceRequest(
    val childId: String,
    val lessonId: String,
    val present: Boolean = true,
    val note: String = ""
)

data class RecordProgressRequest(
    val childId: String,
    val lessonId: String? = null,
    val status: String = "ON_TRACK",
    val note: String = ""
)

data class SundaySchoolClassResponse(
    val id: String,
    val name: String,
    val ageGroup: String,
    val ministryId: String,
    val congregationId: String,
    val active: Boolean
)

data class ChildResponse(
    val id: String,
    val childName: String,
    val dateOfBirth: String?,
    val classId: String,
    val className: String
)

data class LessonResponse(
    val id: String,
    val title: String,
    val bibleReference: String,
    val description: String,
    val classId: String,
    val lessonDate: String
)

data class AttendanceResponse(
    val id: String,
    val childId: String,
    val lessonId: String?,
    val attendanceDate: String,
    val present: Boolean,
    val note: String
)

data class ProgressResponse(
    val id: String,
    val childId: String,
    val lessonId: String?,
    val status: String,
    val note: String
)

data class TeacherAssignmentResponse(
    val id: String,
    val classId: String,
    val className: String,
    val teacherUserId: String,
    val role: String
)

data class ClassStatsResponse(
    val classId: String,
    val learnerCount: Int,
    val presentToday: Int,
    val todaysLessonTitle: String?,
    val todaysLessonReference: String?
)
