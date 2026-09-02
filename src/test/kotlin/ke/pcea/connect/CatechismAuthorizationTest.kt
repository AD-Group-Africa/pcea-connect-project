package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus

/**
 * Integration tests for Catechism object-level authorization.
 *
 * Verifies:
 *  - learner accesses own enrollment/progress
 *  - learner cannot access another learner's enrollment
 *  - teacher/admin can create content and view all enrollments
 */
class CatechismAuthorizationTest : AbstractIntegrationTest() {

    @Test
    fun `learner accesses own enrollment but denied others`() {
        val admin = admin()
        val learner1 = registerUser()
        val learner2 = registerUser()

        // Admin creates a course
        val course = post("/api/catechism/courses",
            """{"name":"Confirmation Class","description":"Foundation course","congregationId":""}""", admin.token)
        assertOk(course)
        val courseId = course.path("data").path("id").asText()

        // Admin creates a module + lesson
        val module = post("/api/catechism/modules",
            """{"courseId":"$courseId","name":"Module 1","description":"The Church","sequenceOrder":0}""", admin.token)
        val moduleId = module.path("data").path("id").asText()

        val lesson = post("/api/catechism/lessons",
            """{"moduleId":"$moduleId","title":"The Church","content":"What is the Church?","bibleReference":"Matthew 16:18","sequenceOrder":0}""", admin.token)
        val lessonId = lesson.path("data").path("id").asText()

        // Both learners enroll
        val enrollment1 = post("/api/catechism/enroll", """{"courseId":"$courseId"}""", learner1.token)
        assertOk(enrollment1)
        val enrollment1Id = enrollment1.path("data").path("id").asText()

        val enrollment2 = post("/api/catechism/enroll", """{"courseId":"$courseId"}""", learner2.token)
        val enrollment2Id = enrollment2.path("data").path("id").asText()

        // Learner1 can see own enrollments
        val myEnrollments = get("/api/catechism/my-enrollments", learner1.token)
        assertOk(myEnrollments)
        check(myEnrollments.path("data").size() == 1) { "Learner1 should see 1 enrollment" }
        check(myEnrollments.path("data").path(0).path("id").asText() == enrollment1Id)

        // Learner1 can access own progress
        val myProgress = get("/api/catechism/enrollments/$enrollment1Id/progress", learner1.token)
        assertOk(myProgress)

        // Learner1 CANNOT access learner2's progress — 403
        val deniedProgress = getRaw("/api/catechism/enrollments/$enrollment2Id/progress", learner1.token)
        check(deniedProgress.statusCode == HttpStatus.FORBIDDEN) {
            "Learner1 should be denied learner2 progress, got ${deniedProgress.statusCode}"
        }

        // Learner1 can update own progress
        val updateProgress = post("/api/catechism/progress",
            """{"enrollmentId":"$enrollment1Id","lessonId":"$lessonId","status":"IN_PROGRESS"}""", learner1.token)
        assertOk(updateProgress)
        check(updateProgress.path("data").path("status").asText() == "IN_PROGRESS")

        // Learner1 can view own journey
        val journey = get("/api/catechism/enrollments/$enrollment1Id/journey", learner1.token)
        assertOk(journey)
        check(journey.path("data").path("courseName").asText() == "Confirmation Class")
    }

    @Test
    fun `admin can view all enrollments for a course`() {
        val admin = admin()
        val learner = registerUser()

        // Create course + enroll learner
        val course = post("/api/catechism/courses",
            """{"name":"Test Course","description":"test","congregationId":""}""", admin.token)
        val courseId = course.path("data").path("id").asText()

        post("/api/catechism/enroll", """{"courseId":"$courseId"}""", learner.token)

        // Admin can view all enrollments
        val enrollments = get("/api/catechism/courses/$courseId/enrollments", admin.token)
        assertOk(enrollments)
        check(enrollments.path("data").size() == 1) { "Admin should see 1 enrollment" }
    }

    @Test
    fun `member cannot create catechism courses`() {
        admin()  // Claim SUPER_ADMIN first
        val member = registerUser()

        val create = postRaw("/api/catechism/courses",
            """{"name":"Unauthorized","description":"test","congregationId":""}""", member.token)
        check(create.statusCode == HttpStatus.FORBIDDEN) {
            "Member should be denied course creation, got ${create.statusCode}"
        }
    }
}
