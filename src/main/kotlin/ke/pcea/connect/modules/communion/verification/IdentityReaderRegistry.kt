package ke.pcea.connect.modules.communion.verification

import ke.pcea.connect.modules.communion.domain.CommunionVerificationMethod
import ke.pcea.connect.modules.membership.application.MemberCredentialService
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Component

/**
 * Identity-reader abstraction: the Communion domain receives a resolved member id
 * regardless of HOW the identity credential was acquired (QR scan today, NFC tap or
 * member-app presentment later). Communion code never depends on a specific reader
 * technology.
 *
 * Readers are added by type; an unsupported method is a 400, not a silent fallback.
 *
 * NFC STATUS (documented, deliberately NOT faked): no NFC reader hardware exists in
 * this deployment, so there is no NfcIdentityReader. When NFC hardware is available,
 * implement [IdentityReader] for NFC — e.g. read the credential from an NFC Data
 * Exchange Format tag holding the same signed MC1 credential, or perform the
 * challenge/response on the secure element — and register it here. The domain, API
 * and audit pipeline need NO changes. NFC status remains YELLOW until validated
 * against real hardware.
 */
interface IdentityReader {
    /** Which presentation method this reader handles. */
    fun method(): CommunionVerificationMethod

    /**
     * Resolves a raw acquired credential to the member id it proves.
     * Must throw [BusinessRuleException] on any invalid/tampered/expired credential.
     */
    fun resolve(rawCredential: String): String
}

/** QR reader: delegates to the existing signed-credential service (unchanged). */
@Component
class QrIdentityReader(private val credentials: MemberCredentialService) : IdentityReader {
    override fun method() = CommunionVerificationMethod.QR
    override fun resolve(rawCredential: String): String = credentials.verify(rawCredential)
}

/**
 * Member-app presentment: the member shows the same signed credential from their own
 * device (the Church ID screen). It is the SAME credential and the SAME verification —
 * only the acquisition channel differs from an elder scanning the printed/shown QR.
 */
@Component
class MemberAppIdentityReader(private val credentials: MemberCredentialService) : IdentityReader {
    override fun method() = CommunionVerificationMethod.MEMBER_APP
    override fun resolve(rawCredential: String): String = credentials.verify(rawCredential)
}

/** NFC: NOT implemented — no hardware. Requests with method=NFC fail explicitly. */
@Component
class IdentityReaderRegistry(readers: List<IdentityReader>) {
    private val byMethod: Map<CommunionVerificationMethod, IdentityReader> =
        readers.associateBy { it.method() }

    fun resolve(method: CommunionVerificationMethod, rawCredential: String): String {
        val reader = byMethod[method]
            ?: throw BusinessRuleException("Identity method $method is not available on this device (NFC hardware not configured)")
        return reader.resolve(rawCredential)
    }
}
