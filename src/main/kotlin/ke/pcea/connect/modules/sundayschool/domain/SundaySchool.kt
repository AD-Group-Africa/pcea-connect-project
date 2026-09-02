package ke.pcea.connect.modules.sundayschool.domain

import jakarta.persistence.*
import ke.pcea.connect.modules.ministries.domain.Ministry
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Sunday School domain — a genuinely different user journey (child / parent / teacher)
 * built on the shared Ministry framework. A SundaySchoolClass belongs to a Ministry of
 * type CHURCH_SCHOOL so it reuses the same membership, events and announcement machinery
 * without duplicating identities.
 */
@Entity
@Table(name = "sunday_school_classes")
data class SundaySchoolClass(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "",                          // e.g. "Class 4"
    val ageGroup: String = "",                      // e.g. "Ages 9-11"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ministry_id") val ministry: Ministry? = null,
    val congregationId: String = "",
    val active: Boolean = true,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

/**
 * Teacher → class assignment. A teacher only sees the classes they are assigned to
 * unless they hold a congregation-wide authorized role. This is the backbone of
 * Sunday School object-level authorization.
 */
@Entity
@Table(name = "sunday_school_teacher_assignments")
data class TeacherAssignment(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id") val sundaySchoolClass: SundaySchoolClass? = null,
    val teacherUserId: String = "",
    val role: String = "TEACHER",   // TEACHER or ASSISTANT
    val assignedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * A child enrolled in Sunday School. Children are NOT stored as users — they have no
 * login credentials. Their profile is deliberately minimal and is only visible to
 * their linked parents/guardians and assigned teachers.
 */
@Entity
@Table(name = "sunday_school_children")
data class ChildEnrollment(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val childName: String = "",
    val dateOfBirth: LocalDate? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id") val sundaySchoolClass: SundaySchoolClass? = null,
    val congregationId: String = "",
    val enrolledAt: LocalDateTime = LocalDateTime.now(),
    val active: Boolean = true
)

/**
 * Links a child to a parent/guardian user account. A parent can only see children
 * linked to their userId — enforced server-side, never just in the frontend.
 */
@Entity
@Table(name = "sunday_school_parent_links")
data class ParentGuardianLink(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_id") val child: ChildEnrollment? = null,
    val parentUserId: String = "",
    val relationship: String = "PARENT",   // PARENT, GUARDIAN
    val linkedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * A lesson taught in a Sunday School class. Teachers create and deliver lessons;
 * parents and children can view lessons for their own class only.
 */
@Entity
@Table(name = "sunday_school_lessons")
data class SundaySchoolLesson(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val title: String = "",
    val bibleReference: String = "",        // e.g. "1 Samuel 17"
    val description: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id") val sundaySchoolClass: SundaySchoolClass? = null,
    val lessonDate: LocalDate = LocalDate.now(),
    val createdAt: LocalDateTime = LocalDateTime.now()
)

/**
 * Sunday School attendance — scoped to a class and a child. Only assigned teachers
 * and authorized admins can record or view attendance for a class.
 */
@Entity
@Table(name = "sunday_school_attendance")
data class SundaySchoolAttendance(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_id") val child: ChildEnrollment? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id") val lesson: SundaySchoolLesson? = null,
    val attendanceDate: LocalDate = LocalDate.now(),
    val present: Boolean = true,
    val note: String = "",
    val recordedByUserId: String = "",
    val recordedAt: LocalDateTime = LocalDateTime.now()
)

/**
 * Teacher notes / progress observations on a child — scoped. Only the child's
 * assigned teacher and linked parent can see these notes.
 */
@Entity
@Table(name = "sunday_school_progress")
data class SundaySchoolProgress(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_id") val child: ChildEnrollment? = null,
    val lessonId: String? = null,
    val status: String = "ON_TRACK",   // ON_TRACK, NEEDS_HELP, EXCELLENT
    val note: String = "",
    val recordedByUserId: String = "",
    val recordedAt: LocalDateTime = LocalDateTime.now()
)
