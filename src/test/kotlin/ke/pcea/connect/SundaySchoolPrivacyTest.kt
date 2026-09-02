package ke.pcea.connect

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import java.time.LocalDate

/**
 * Integration tests for Sunday School object-level authorization.
 *
 * Verifies the non-negotiable child privacy rules:
 *  - parent accesses linked child
 *  - parent denied unrelated child
 *  - teacher accesses assigned class
 *  - teacher denied unrelated class
 *  - member cannot access protected child records
 */
class SundaySchoolPrivacyTest : AbstractIntegrationTest() {

    private val today = LocalDate.now().toString()

    @Test
    fun `parent accesses linked child but denied unrelated child`() {
        val admin = admin()

        // Create a Sunday School class
        val ssClass = post("/api/sunday-school/classes",
            """{"name":"Class 4","ageGroup":"Ages 9-11","congregationId":"","ministryId":""}""", admin.token)
        assertOk(ssClass)
        val classId = ssClass.path("data").path("id").asText()

        // Enroll two children
        val child1 = post("/api/sunday-school/children",
            """{"childName":"Brian","classId":"$classId","congregationId":""}""", admin.token)
        assertOk(child1)
        val child1Id = child1.path("data").path("id").asText()

        val child2 = post("/api/sunday-school/children",
            """{"childName":"Grace","classId":"$classId","congregationId":""}""", admin.token)
        val child2Id = child2.path("data").path("id").asText()

        // Create two parent users
        val parent1 = registerUser()
        val parent2 = registerUser()

        // Link parent1 to child1, parent2 to child2
        post("/api/sunday-school/parent-links",
            """{"childId":"$child1Id","parentUserId":"${parent1.id}","relationship":"PARENT"}""", admin.token)
        post("/api/sunday-school/parent-links",
            """{"childId":"$child2Id","parentUserId":"${parent2.id}","relationship":"PARENT"}""", admin.token)

        // parent1 sees child1
        val myChildren1 = get("/api/sunday-school/my-children", parent1.token)
        assertOk(myChildren1)
        check(myChildren1.path("data").size() == 1) { "Parent1 should see 1 child" }
        check(myChildren1.path("data").path(0).path("id").asText() == child1Id)

        // parent1 can access child1's lessons (empty but should not 403)
        val lessons1 = get("/api/sunday-school/children/$child1Id/lessons", parent1.token)
        assertOk(lessons1)

        // parent1 CANNOT access child2's lessons (unrelated child) — 403
        val lessons2 = getRaw("/api/sunday-school/children/$child2Id/lessons", parent1.token)
        check(lessons2.statusCode == HttpStatus.FORBIDDEN) {
            "Parent1 should be denied access to child2, got ${lessons2.statusCode}"
        }

        // parent1 CANNOT access child2's attendance — 403
        val attendance2 = getRaw("/api/sunday-school/children/$child2Id/attendance", parent1.token)
        check(attendance2.statusCode == HttpStatus.FORBIDDEN) {
            "Parent1 should be denied child2 attendance, got ${attendance2.statusCode}"
        }

        // parent1 CANNOT access child2's progress — 403
        val progress2 = getRaw("/api/sunday-school/children/$child2Id/progress", parent1.token)
        check(progress2.statusCode == HttpStatus.FORBIDDEN) {
            "Parent1 should be denied child2 progress, got ${progress2.statusCode}"
        }
    }

    @Test
    fun `teacher accesses assigned class but denied unrelated class`() {
        val admin = admin()

        // Create two classes
        val classA = post("/api/sunday-school/classes",
            """{"name":"Class A","ageGroup":"Ages 6-8","congregationId":"","ministryId":""}""", admin.token)
        val classB = post("/api/sunday-school/classes",
            """{"name":"Class B","ageGroup":"Ages 9-11","congregationId":"","ministryId":""}""", admin.token)
        val classAId = classA.path("data").path("id").asText()
        val classBId = classB.path("data").path("id").asText()

        // Create a teacher user and assign to class A only
        val teacher = registerUser()
        // Grant SUNDAY_SCHOOL_TEACHER role
        post("/api/admin/users/${teacher.id}/roles", """{"role":"SUNDAY_SCHOOL_TEACHER"}""", admin.token)
        // Re-login to get fresh token with the new role
        val teacherToken = login(teacher.email, teacher.password)

        post("/api/sunday-school/classes/$classAId/teachers",
            """{"teacherUserId":"${teacher.id}","role":"TEACHER"}""", admin.token)

        // Teacher can access class A children
        val childrenA = get("/api/sunday-school/classes/$classAId/children", teacherToken)
        assertOk(childrenA)

        // Teacher CANNOT access class B children — 403
        val childrenB = getRaw("/api/sunday-school/classes/$classBId/children", teacherToken)
        check(childrenB.statusCode == HttpStatus.FORBIDDEN) {
            "Teacher should be denied class B, got ${childrenB.statusCode}"
        }

        // Teacher CANNOT access class B lessons — 403
        val lessonsB = getRaw("/api/sunday-school/classes/$classBId/lessons", teacherToken)
        check(lessonsB.statusCode == HttpStatus.FORBIDDEN) {
            "Teacher should be denied class B lessons, got ${lessonsB.statusCode}"
        }

        // Teacher CANNOT access class B stats — 403
        val statsB = getRaw("/api/sunday-school/classes/$classBId/stats", teacherToken)
        check(statsB.statusCode == HttpStatus.FORBIDDEN) {
            "Teacher should be denied class B stats, got ${statsB.statusCode}"
        }
    }

    @Test
    fun `member cannot access protected child records`() {
        val admin = admin()
        val member = registerUser()  // plain MEMBER, no teacher/admin role

        // Create a class and enroll a child
        val ssClass = post("/api/sunday-school/classes",
            """{"name":"Private Class","ageGroup":"Ages 6-8","congregationId":"","ministryId":""}""", admin.token)
        val classId = ssClass.path("data").path("id").asText()

        val child = post("/api/sunday-school/children",
            """{"childName":"Test Child","classId":"$classId","congregationId":""}""", admin.token)
        val childId = child.path("data").path("id").asText()

        // Member cannot list class children — 403 (no SUNDAY_SCHOOL_TEACHER role)
        val childrenResp = getRaw("/api/sunday-school/classes/$classId/children", member.token)
        check(childrenResp.statusCode == HttpStatus.FORBIDDEN) {
            "Member should be denied class children, got ${childrenResp.statusCode}"
        }

        // Member cannot view child lessons — 403 (not linked parent)
        val lessonsResp = getRaw("/api/sunday-school/children/$childId/lessons", member.token)
        check(lessonsResp.statusCode == HttpStatus.FORBIDDEN) {
            "Member should be denied child lessons, got ${lessonsResp.statusCode}"
        }

        // Member cannot view child attendance — 403
        val attendanceResp = getRaw("/api/sunday-school/children/$childId/attendance", member.token)
        check(attendanceResp.statusCode == HttpStatus.FORBIDDEN) {
            "Member should be denied child attendance, got ${attendanceResp.statusCode}"
        }

        // Member cannot view child progress — 403
        val progressResp = getRaw("/api/sunday-school/children/$childId/progress", member.token)
        check(progressResp.statusCode == HttpStatus.FORBIDDEN) {
            "Member should be denied child progress, got ${progressResp.statusCode}"
        }
    }
}
