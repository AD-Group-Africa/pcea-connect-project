package ke.pcea.connect.modules.volunteer.application
import ke.pcea.connect.modules.volunteer.domain.*
import ke.pcea.connect.modules.volunteer.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class VolunteerService(
    private val teamRepo: VolunteerTeamRepository,
    private val scheduleRepo: VolunteerScheduleRepository,
    private val signupRepo: VolunteerSignupRepository,
    private val hoursRepo: VolunteerServiceHoursRepository
) {
    fun createTeam(name: String, description: String, congregationId: String): VolunteerTeam =
        teamRepo.save(VolunteerTeam(name = name, description = description, congregationId = congregationId))
    fun getTeams(congregationId: String): List<VolunteerTeam> = teamRepo.findByCongregationId(congregationId)

    fun createSchedule(teamId: String, eventName: String, scheduledAt: java.time.LocalDateTime, durationMinutes: Int): VolunteerSchedule =
        scheduleRepo.save(VolunteerSchedule(teamId = teamId, eventName = eventName, scheduledAt = scheduledAt, durationMinutes = durationMinutes))
    fun getSchedules(teamId: String): List<VolunteerSchedule> = scheduleRepo.findByTeamId(teamId)

    fun signUp(scheduleId: String, userId: String, role: String): VolunteerSignup {
        val existing = signupRepo.findByScheduleId(scheduleId).find { it.userId == userId }
        if (existing != null) throw BusinessRuleException("Already signed up")
        return signupRepo.save(VolunteerSignup(scheduleId = scheduleId, userId = userId, role = role))
    }
    fun getSignups(scheduleId: String): List<VolunteerSignup> = signupRepo.findByScheduleId(scheduleId)

    fun markAttended(signupId: String): VolunteerSignup {
        val signup = signupRepo.findById(signupId).orElseThrow { BusinessRuleException("Not found") }
        signup.attended = true
        return signupRepo.save(signup)
    }
    fun recordHours(userId: String, teamId: String, hours: Double): VolunteerServiceHours =
        hoursRepo.save(VolunteerServiceHours(userId = userId, teamId = teamId, hours = hours))
    fun getHours(userId: String): List<VolunteerServiceHours> = hoursRepo.findByUserId(userId)
}
