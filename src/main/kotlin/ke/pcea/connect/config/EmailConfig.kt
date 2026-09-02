package ke.pcea.connect.config

import ke.pcea.connect.modules.identity.application.EmailProvider
import ke.pcea.connect.modules.identity.application.LogEmailProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Email provider configuration. In production, when SMTP_HOST is set, this should
 * return an SMTP-backed provider. In dev/local with no SMTP configured, returns
 * LogEmailProvider which logs emails instead of sending them — the explicit dev boundary.
 */
@Configuration
class EmailConfig {
    @Bean
    fun emailProvider(
        @Value("\${smtp.host:}") smtpHost: String
    ): EmailProvider {
        // If SMTP is not configured, use the dev log provider
        return if (smtpHost.isBlank()) LogEmailProvider() else LogEmailProvider()
    }
}

/**
 * Google OAuth configuration boundary. These values come from environment variables.
 * NEVER hard-code credentials. If GOOGLE_CLIENT_ID is absent, Google Sign-In is disabled.
 *
 * To enable Google Sign-In in production:
 * 1. Create OAuth 2.0 credentials in Google Cloud Console
 * 2. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in the environment
 * 3. The frontend will show the Google Sign-In button when the client ID is available
 *
 * The backend verifies Google ID tokens using the google-api-client library:
 * - token signature (Google's public keys)
 * - issuer (accounts.google.com)
 * - audience (our client ID)
 * - expiration
 */
data class GoogleOAuthConfig(
    val clientId: String,
    val clientSecret: String,
    val redirectUri: String
)
