package ke.pcea.connect.modules.congregation.application
import ke.pcea.connect.modules.congregation.domain.*
import ke.pcea.connect.modules.congregation.infrastructure.*
import ke.pcea.connect.modules.attendance.infrastructure.AttendanceRepository
import ke.pcea.connect.modules.church.infrastructure.CongregationRepository
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class CongregationOpsService(
    private val smallGroupRepo: SmallGroupRepository,
    private val committeeRepo: CommitteeRepository,
    private val visitorRepo: VisitorRepository,
    private val congregationRepo: CongregationRepository,
    private val userRepo: UserRepository,
    private val attendanceRepo: AttendanceRepository
) {
    // Small Groups
    fun createSmallGroup(name: String, description: String, congregationId: String, leaderId: String,
                         meetingDay: String, meetingTime: String, location: String): SmallGroup {
        return smallGroupRepo.save(SmallGroup(name = name, description = description, congregationId = congregationId,
            leaderId = leaderId, meetingDay = meetingDay, meetingTime = meetingTime, location = location))
    }
    fun getSmallGroups(congregationId: String) = smallGroupRepo.findByCongregationId(congregationId)

    // Committees
    fun createCommittee(name: String, description: String, congregationId: String, chairpersonId: String,
                        meetingFrequency: String): Committee {
        return committeeRepo.save(Committee(name = name, description = description, congregationId = congregationId,
            chairpersonId = chairpersonId, meetingFrequency = meetingFrequency))
    }
    fun getCommittees(congregationId: String) = committeeRepo.findByCongregationId(congregationId)

    // Visitors
    fun registerVisitor(fullName: String, phone: String, email: String, purpose: String, congregationId: String): Visitor {
        return visitorRepo.save(Visitor(fullName = fullName, phone = phone, email = email, purpose = purpose, congregationId = congregationId))
    }
    fun getVisitors(congregationId: String) = visitorRepo.findByCongregationId(congregationId)
    fun markVisitorFollowedUp(visitorId: String): Visitor {
        val visitor = visitorRepo.findById(visitorId).orElseThrow { BusinessRuleException("Visitor not found") }
        visitor.followedUp = true
        return visitorRepo.save(visitor)
    }

    // Admin Dashboard Summary
    fun getAdminDashboard(congregationId: String): Map<String, Any> {
        val totalMembers = userRepo.countByCongregationId(congregationId)
        val groupsCount = smallGroupRepo.findByCongregationId(congregationId).size
        val committeesCount = committeeRepo.findByCongregationId(congregationId).size
        val visitorsThisMonth = visitorRepo.findByCongregationId(congregationId)
            .count { it.visitDate.month == LocalDateTime.now().month }
        val attendanceToday = attendanceRepo.countByCongregationIdAndDate(congregationId, java.time.LocalDate.now())
        return mapOf(
            "totalMembers" to totalMembers,
            "smallGroups" to groupsCount,
            "committees" to committeesCount,
            "visitorsThisMonth" to visitorsThisMonth,
            "attendanceToday" to attendanceToday
        )
    }
}
