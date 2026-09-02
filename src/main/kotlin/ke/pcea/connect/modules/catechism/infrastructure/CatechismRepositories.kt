package ke.pcea.connect.modules.catechism.infrastructure

import ke.pcea.connect.modules.catechism.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface CatechismCourseRepository : JpaRepository<CatechismCourse, String> {
    fun findByCongregationId(congregationId: String): List<CatechismCourse>
    fun findByActiveTrue(): List<CatechismCourse>
}

@Repository interface CatechismModuleRepository : JpaRepository<CatechismModule, String> {
    fun findByCourseId(courseId: String): List<CatechismModule>
}

@Repository interface CatechismLessonRepository : JpaRepository<CatechismLesson, String> {
    fun findByModuleId(moduleId: String): List<CatechismLesson>
}

@Repository interface CatechismEnrollmentRepository : JpaRepository<CatechismEnrollment, String> {
    fun findByUserId(userId: String): List<CatechismEnrollment>
    fun findByUserIdAndCourseId(userId: String, courseId: String): CatechismEnrollment?
    fun findByCourseId(courseId: String): List<CatechismEnrollment>
}

@Repository interface CatechismProgressRepository : JpaRepository<CatechismProgress, String> {
    fun findByEnrollmentId(enrollmentId: String): List<CatechismProgress>
    fun findByEnrollmentIdAndLessonId(enrollmentId: String, lessonId: String): CatechismProgress?
}

@Repository interface CatechismAssessmentRepository : JpaRepository<CatechismAssessment, String> {
    fun findByEnrollmentId(enrollmentId: String): List<CatechismAssessment>
}
