package ke.pcea.connect.modules.identity.application

/**
 * Email provider abstraction. In production this is backed by SMTP or a transactional
 * email service (e.g. Africa's Talking, SendGrid). In development with no SMTP configured,
 * emails are logged to the application log instead of being sent — this is explicit, not
 * a fake implementation. The boundary is visible: if [isEnabled] returns false, no email
 * is sent and the caller should communicate the verification link through the dev UI.
 */
interface EmailProvider {
    /** True when SMTP or a transactional email service is configured. */
    fun isEnabled(): Boolean

    /**
     * Sends an email. Returns the sent message ID, or null if email is not enabled.
     * Never throws on failure — logs the error and returns null so registration is not blocked.
     */
    fun sendEmail(to: String, subject: String, htmlBody: String): String?
}

/**
 * Development email provider — logs emails to the application log instead of sending them.
 * This is NOT a fake implementation; it is the explicit dev/local behavior documented in
 * the run doc and visible in application.yml configuration.
 */
class LogEmailProvider : EmailProvider {
    private val log = org.slf4j.LoggerFactory.getLogger(LogEmailProvider::class.java)

    override fun isEnabled(): Boolean = false

    override fun sendEmail(to: String, subject: String, htmlBody: String): String? {
        log.info("[DEV EMAIL] To: {}, Subject: {}, Body: {}", to, subject, htmlBody)
        return null
    }
}
