package ke.pcea.connect.modules.catechism.api.dto

data class CreateCourseRequest(val name: String, val description: String = "", val congregationId: String = "")
data class CreateModuleRequest(val courseId: String, val name: String, val description: String = "", val sequenceOrder: Int = 0)
data class CreateLessonRequest(val moduleId: String, val title: String, val content: String = "", val bibleReference: String = "", val sequenceOrder: Int = 0)
data class EnrollRequest(val courseId: String)
data class UpdateProgressRequest(val enrollmentId: String, val lessonId: String, val status: String)
data class RecordAssessmentRequest(val enrollmentId: String, val lessonId: String, val score: Int, val maxScore: Int = 100, val passed: Boolean)

data class CourseResponse(val id: String, val name: String, val description: String, val congregationId: String, val active: Boolean)
data class ModuleResponse(val id: String, val name: String, val description: String, val courseId: String, val sequenceOrder: Int)
data class LessonResponse(val id: String, val title: String, val content: String, val bibleReference: String, val moduleId: String, val sequenceOrder: Int)
data class EnrollmentResponse(val id: String, val userId: String, val courseId: String, val courseName: String, val status: String)
data class ProgressResponse(val id: String, val enrollmentId: String, val lessonId: String, val status: String, val completedAt: String?)
data class AssessmentResponse(val id: String, val enrollmentId: String, val lessonId: String, val score: Int, val maxScore: Int, val passed: Boolean)
data class JourneyResponse(val enrollmentId: String, val courseId: String, val courseName: String, val totalLessons: Int, val completedLessons: Int, val percentage: Int, val enrollmentStatus: String)
