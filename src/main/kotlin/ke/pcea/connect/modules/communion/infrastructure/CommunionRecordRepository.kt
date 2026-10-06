package ke.pcea.connect.modules.communion.infrastructure

import ke.pcea.connect.modules.communion.domain.CommunionRecord
import ke.pcea.connect.modules.communion.domain.CommunionRecordStatus
import ke.pcea.connect.modules.communion.domain.CommunionVerificationMethod
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface CommunionRecordRepository : JpaRepository<CommunionRecord, String> {
    fun findByUserIdOrderByServiceDateDesc(userId: String): List<CommunionRecord>
    fun findByCongregationIdOrderByServiceDateDesc(congregationId: String): List<CommunionRecord>
    fun findByUserIdAndCongregationIdOrderByServiceDateDesc(userId: String, congregationId: String): List<CommunionRecord>

    // ── V057: Communion Tracker ────────────────────────────────────────────
    fun findByEventIdOrderByRecordedAtAsc(eventId: String): List<CommunionRecord>
    fun findByEventIdOrderByRecordedAtDesc(eventId: String): List<CommunionRecord>
    fun findByEventIdAndStatus(eventId: String, status: CommunionRecordStatus): List<CommunionRecord>
    fun findByIdempotencyKey(idempotencyKey: String): CommunionRecord?
    fun findByEventIdAndUserIdAndStatus(eventId: String, userId: String, status: CommunionRecordStatus): CommunionRecord?
    fun countByEventId(eventId: String): Long
    fun countByEventIdAndStatus(eventId: String, status: CommunionRecordStatus): Long
    fun countByEventIdAndVerificationMethod(eventId: String, method: CommunionVerificationMethod): Long
}
