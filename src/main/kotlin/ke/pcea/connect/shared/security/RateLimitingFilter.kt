package ke.pcea.connect.shared.security
import jakarta.servlet.*
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.time.Instant

/**
 * Per-IP sliding-window rate limiting for abuse-sensitive endpoints.
 *
 * Two buckets:
 *  - auth (login/register): 10/min — stop credential stuffing.
 *  - credential verification (Church ID verify, communion verify): 120/min — a real
 *    communion service must scan quickly, but enumeration/brute-force still gets
 *    throttled. HMAC verification is constant-time, so this is defense-in-depth.
 *
 * Disabled entirely in the test profile (security.rate-limit.enabled=false).
 */
@Component
class RateLimitingFilter(
    @Value("\${security.rate-limit.enabled:true}") private val enabled: Boolean,
    @Value("\${security.rate-limit.verify-per-minute:120}") private val verifyPerMinute: Int
) : Filter {
    private val authCounts = ConcurrentHashMap<String, MutableList<Instant>>()
    private val verifyCounts = ConcurrentHashMap<String, MutableList<Instant>>()

    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        val httpRequest = request as HttpServletRequest
        val httpResponse = response as HttpServletResponse
        val path = httpRequest.requestURI

        if (!enabled) {
            chain.doFilter(request, response)
            return
        }

        val clientIp = httpRequest.remoteAddr
        val now = Instant.now()
        val window = now.minusSeconds(60)

        // Credential verification endpoints (Church ID / communion scanner).
        if (path == "/api/membership-card/verify" ||
            (path.startsWith("/api/communion/events/") && path.endsWith("/verify"))
        ) {
            val timestamps = verifyCounts.getOrPut(clientIp) { mutableListOf() }
            timestamps.removeIf { it.isBefore(window) }
            if (timestamps.size >= verifyPerMinute) {
                httpResponse.status = 429
                httpResponse.writer.write("Too many verification requests. Please try again later.")
                return
            }
            timestamps.add(now)
        }
        // Authentication endpoints.
        else if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            val timestamps = authCounts.getOrPut(clientIp) { mutableListOf() }
            timestamps.removeIf { it.isBefore(window) }
            if (timestamps.size >= 10) {
                httpResponse.status = 429
                httpResponse.writer.write("Too many requests. Please try again later.")
                return
            }
            timestamps.add(now)
        }
        chain.doFilter(request, response)
    }
}
