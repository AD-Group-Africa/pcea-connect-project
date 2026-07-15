package ke.pcea.connect.shared.security
import jakarta.servlet.*
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.time.Instant

@Component
class RateLimitingFilter : Filter {
    private val requestCounts = ConcurrentHashMap<String, MutableList<Instant>>()

    override fun doFilter(request: ServletRequest, response: ServletResponse, chain: FilterChain) {
        val httpRequest = request as HttpServletRequest
        val httpResponse = response as HttpServletResponse
        val path = httpRequest.requestURI

        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            val clientIp = httpRequest.remoteAddr
            val now = Instant.now()
            val window = now.minusSeconds(60)
            val timestamps = requestCounts.getOrPut(clientIp) { mutableListOf() }
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
