package ke.pcea.connect.config
import ke.pcea.connect.shared.security.JwtAuthFilter
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableMethodSecurity
class SecurityConfig(
    private val jwtAuthFilter: JwtAuthFilter,
    @Value("\${mpesa.callback-secret}") private val mpesaCallbackSecret: String
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/auth/**", "/api/locator/**", "/api/health", "/h2-console/**").permitAll()
                // M-Pesa's servers call this webhook with no JWT, so it must stay public — but the
                // secret path segment (validated in MpesaCallbackController) is what stops anyone
                // else from POSTing fake payment confirmations to it.
                it.requestMatchers("/api/giving/mpesa-callback/*").permitAll()
                it.anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)
            .headers { it.frameOptions { fo -> fo.disable() } }
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        // Dev + demo: allow the frontend from any localhost port (the Next dev server
        // picks a free port like 3000/3001/53344). Production overrides this with a
        // locked-down explicit list of allowed origins.
        configuration.allowedOriginPatterns = listOf(
            "http://localhost:*", "http://127.0.0.1:*",
            "http://192.168.1.23:*", "http://192.168.1.22:*"
        )
        configuration.allowedMethods = listOf("*")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    @Bean fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
