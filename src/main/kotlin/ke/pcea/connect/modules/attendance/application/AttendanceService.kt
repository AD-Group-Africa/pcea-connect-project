package ke.pcea.connect.modules.attendance.application
import ke.pcea.connect.modules.attendance.domain.*
import ke.pcea.connect.modules.attendance.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
@Transactional
class AttendanceService(private val repo: AttendanceRepository) {

    fun markAttendance(userId: String, type: AttendanceType, referenceId: String, congregationId: String, date: LocalDate?): AttendanceRecord {
        val d = date ?: LocalDate.now()
        // Check if already recorded for that user+date+type
        val existing = repo.findByUserIdAndDate(userId, d).find { it.type == type && it.referenceId == referenceId }
        if (existing != null) throw BusinessRuleException("Attendance already recorded for this session")
        val record = AttendanceRecord(userId = userId, type = type, referenceId = referenceId, date = d,
            checkInTime = LocalDateTime.now(), congregationId = congregationId)
        return repo.save(record)
    }

    fun checkIn(recordId: String): AttendanceRecord {
        val record = repo.findById(recordId).orElseThrow { BusinessRuleException("Record not found") }
        record.checkInTime = LocalDateTime.now()
        record.status = "PRESENT"
        return repo.save(record)
    }

    fun checkout(recordId: String): AttendanceRecord {
        val record = repo.findById(recordId).orElseThrow { BusinessRuleException("Record not found") }
        record.checkOutTime = LocalDateTime.now()
        return repo.save(record)
    }

    fun getAttendanceByUser(userId: String) = repo.findByUserId(userId)
    fun getAttendanceByCongregation(congregationId: String, date: LocalDate?) =
        repo.findByCongregationIdAndDate(congregationId, date ?: LocalDate.now())

    // Offline sync: accept a batch of records (placeholder for mobile sync)
    fun syncOfflineRecords(records: List<AttendanceRecord>): List<AttendanceRecord> {
        return records.map { repo.save(it) }
    }
}
