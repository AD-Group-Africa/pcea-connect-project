package ke.pcea.connect.modules.membership.application

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.google.zxing.qrcode.QRCodeWriter
import ke.pcea.connect.modules.communion.application.CommunionErrorCodes
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.awt.image.BufferedImage

/**
 * Server-signed membership credential.
 *
 * The QR payload is `MC1.<memberId>.<issuedAtEpochSec>.<hmac>` where hmac =
 * HMAC-SHA256(secret, "MC1|memberId|issuedAt") in unpadded base64url.
 *
 * The memberId inside is intentionally NOT sensitive on its own: it is only meaningful
 * when presented to OUR verification endpoint, which requires the valid signature. The
 * signature proves the credential was issued by this system (not forged or tampered).
 * No personal data (name, phone, email) is embedded — verification is a server lookup,
 * not a decode.
 *
 * The QR IMAGE is rendered by this backend as a self-contained PNG data URI using
 * ZXing — no third-party QR service is contacted, so member identifiers never leave
 * our infrastructure.
 */
@Service
class MemberCredentialService(
    private val userRepo: UserRepository,
    @Value("\${app.credential-secret:}") private val configuredSecret: String,
    @Value("\${jwt.secret}") private val jwtSecret: String,
    @Value("\${app.credential-max-age-days:1095}") private val maxAgeDays: Long
) {

    private val secret: ByteArray =
        (if (configuredSecret.isNotBlank()) configuredSecret else jwtSecret).toByteArray(StandardCharsets.UTF_8)

    fun issue(memberId: String, issuedAtEpochSec: Long = System.currentTimeMillis() / 1000): String {
        val payload = "MC1|$memberId|$issuedAtEpochSec"
        return "MC1.$memberId.$issuedAtEpochSec.${sign(payload)}"
    }

    /** Returns the member id if the credential is valid and current, else throws. */
    fun verify(credential: String): String {
        val parts = credential.split(".")
        if (parts.size != 4 || parts[0] != "MC1") throw BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Invalid credential format")
        val memberId = parts[1]
        val issuedAt = parts[2].toLongOrNull() ?: throw BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Invalid credential")
        val expected = sign("MC1|$memberId|$issuedAt")
        if (!MessageDigest.isEqual(expected.toByteArray(StandardCharsets.UTF_8), parts[3].toByteArray(StandardCharsets.UTF_8)))
            throw BusinessRuleException(CommunionErrorCodes.TAMPERED_CREDENTIAL, "Credential signature is invalid")
        val ageSec = System.currentTimeMillis() / 1000 - issuedAt
        if (ageSec < 0 || ageSec > maxAgeDays * 86_400) throw BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Credential has expired")
        // The member must still exist and be enabled — a signed credential of a disabled
        // account verifies to nothing.
        val user = userRepo.findById(memberId).orElseThrow { BusinessRuleException(CommunionErrorCodes.INVALID_CREDENTIAL, "Unknown credential") }
        if (!user.enabled) throw BusinessRuleException(CommunionErrorCodes.UNAUTHORIZED, "Credential holder is not active")
        return user.id
    }

    /** Self-contained PNG data URI (ZXing matrix rendered with the JDK, EC level M). */
    fun qrDataUri(credential: String): String {
        val matrix = QRCodeWriter().encode(
            credential, BarcodeFormat.QR_CODE, 240, 240,
            mapOf(EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M, EncodeHintType.MARGIN to 2)
        )
        val img = BufferedImage(matrix.width, matrix.height, BufferedImage.TYPE_INT_RGB)
        for (y in 0 until matrix.height) for (x in 0 until matrix.width) {
            img.setRGB(x, y, if (matrix.get(x, y)) 0xFF101418.toInt() else 0xFFFFFFFF.toInt())
        }
        val png = ByteArrayOutputStream().use { out ->
            javax.imageio.ImageIO.write(img, "png", out)
            out.toByteArray()
        }
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(png)
    }

    private fun sign(payload: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(secret, "HmacSHA256"))
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(mac.doFinal(payload.toByteArray(StandardCharsets.UTF_8)))
    }
}
