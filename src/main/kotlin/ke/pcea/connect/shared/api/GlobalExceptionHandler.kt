package ke.pcea.connect.shared.api
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

/**
 * Central error mapping: users receive safe messages; developers receive the underlying
 * cause in the application log (never in the HTTP response, so no internals leak).
 */
@RestControllerAdvice
class GlobalExceptionHandler {
    private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(BusinessRuleException::class)
    fun handleBusinessRule(ex: BusinessRuleException) =
        ResponseEntity(ApiResponse.error(ex.message ?: "Business rule violation"), HttpStatus.BAD_REQUEST)

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException) =
        ResponseEntity(ApiResponse.error("Access denied"), HttpStatus.FORBIDDEN)

    @ExceptionHandler(org.springframework.security.core.AuthenticationException::class)
    fun handleAuth(ex: org.springframework.security.core.AuthenticationException) =
        ResponseEntity(ApiResponse.error("Unauthorized"), HttpStatus.UNAUTHORIZED)

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception): ResponseEntity<ApiResponse<Nothing>> {
        log.error("Unhandled exception", ex)
        return ResponseEntity(ApiResponse.error("Internal server error"), HttpStatus.INTERNAL_SERVER_ERROR)
    }
}