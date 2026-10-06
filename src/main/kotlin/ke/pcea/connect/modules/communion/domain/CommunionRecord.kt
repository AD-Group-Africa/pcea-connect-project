package ke.pcea.connect.modules.communion.domain
import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

enum class CommunionVerificationMethod { NFC, QR, MANUAL, MEMBER_APP }
enum class CommunionRecordStatus { RECORDED, VOIDED }

/**
 * A Holy Communion participation record. Members may read their own record;
 * recording/reading others is pastoral-gated.
 *
 * Extension columns (V057) tie the record to a [CommunionEvent], capture HOW the
 * member was verified (NFC/QR/MANUAL/MEMBER_APP), support soft-void (never hard
 * delete) and client idempotency keys. Legacy rows keep NULL event_id / defaults.
 */
@Entity
@Table(name = "communion_records")
data class CommunionRecord(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val userId: String = "",
    val congregationId: String = "",
    val serviceDate: LocalDate = LocalDate.now(),
    @Column(length = 500) val note: String = "",
    val recordedBy: String = "",
    val recordedAt: LocalDateTime = LocalDateTime.now(),

    // ── V057: Communion Tracker extension ──────────────────────────────────
    /** The communion event this record belongs to (NULL for legacy/manual-only rows). */
    val eventId: String? = null,
    /** How the member was verified: NFC, QR, MANUAL or MEMBER_APP. */
    @Enumerated(EnumType.STRING) @Column(length = 20) val verificationMethod: CommunionVerificationMethod = CommunionVerificationMethod.MANUAL,
    /** RECORDED or VOIDED. Records are never hard-deleted. */
    @Enumerated(EnumType.STRING) @Column(length = 20) var status: CommunionRecordStatus = CommunionRecordStatus.RECORDED,
    /** Who verified the member's identity (the scanning elder/staff). */
    val verifiedBy: String? = null,
    /** When the identity verification happened. */
    val verifiedAt: LocalDateTime? = null,
    /** Free-form scanner/device identifier (e.g. "elder-phone-jkamau"). Never contains PII. */
    @Column(length = 120) val deviceId: String? = null,
    /** Client-supplied idempotency key (unique across all records; NULL = legacy). */
    @Column(length = 100) val idempotencyKey: String? = null,
    /**
     * Unique slot enforcing ONE active (RECORDED) record per member per event:
     * 'E:<eventId>|U:<userId>' while RECORDED, back to the row id once VOIDED
     * (voiding frees the slot). Portable across H2 and PostgreSQL.
     */
    @Column(length = 600) var activeSlot: String? = null,
    /** Soft-void: reason, actor and time. The row remains for the audit trail. */
    @Column(length = 300) var voidReason: String? = null,
    var voidedBy: String? = null,
    var voidedAt: LocalDateTime? = null
)
