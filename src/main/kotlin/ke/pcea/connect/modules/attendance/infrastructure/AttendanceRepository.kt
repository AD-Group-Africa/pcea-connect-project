package ke.pcea.connect.modules.attendance.infrastructure
import ke.pcea.connect.modules.attendance.domain.AttendanceRecord
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface AttendanceRepository : JpaRepository<AttendanceRecord, String> {
    fun findByUserId(userId: String): List<AttendanceRecord>
    fun findByUserIdAndDate(userId: String, date: LocalDate): List<AttendanceRecord>
    fun findByCongregationIdAndDate(congregationId: String, date: LocalDate): List<AttendanceRecord>
    fun countByCongregationIdAndDate(congregationId: String, date: LocalDate): Long

    @Query("select count(a) from AttendanceRecord a where a.date >= :start and a.date <= :end")
    fun countByDateRange(@Param("start") start: LocalDate, @Param("end") end: LocalDate): Long
}
