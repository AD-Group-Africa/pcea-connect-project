package ke.pcea.connect.modules.volunteer.infrastructure
import ke.pcea.connect.modules.volunteer.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface VolunteerTeamRepository : JpaRepository<VolunteerTeam, String> {
    fun findByCongregationId(congregationId: String): List<VolunteerTeam>
}
@Repository interface VolunteerScheduleRepository : JpaRepository<VolunteerSchedule, String> {
    fun findByTeamId(teamId: String): List<VolunteerSchedule>
}
@Repository interface VolunteerSignupRepository : JpaRepository<VolunteerSignup, String> {
    fun findByScheduleId(scheduleId: String): List<VolunteerSignup>
    fun findByUserId(userId: String): List<VolunteerSignup>
}
@Repository interface VolunteerServiceHoursRepository : JpaRepository<VolunteerServiceHours, String> {
    fun findByUserId(userId: String): List<VolunteerServiceHours>
}
