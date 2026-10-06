package ke.pcea.connect.shared.api
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import ke.pcea.connect.shared.security.TenantViolationException
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
        // code carries the stable machine-readable reason (spec STEP 12); null stays null
        // for legacy string-only violations so existing clients see no shape change.
        ResponseEntity(ApiResponse.error(ex.message ?: "Business rule violation", ex.code), HttpStatus.BAD_REQUEST)

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException) =
        ResponseEntity(ApiResponse.error("Access denied"), HttpStatus.FORBIDDEN)

    /** Cross-congregation access attempt — same safe 403, details only in the log. */
    @ExceptionHandler(TenantViolationException::class)
    fun handleTenantViolation(ex: TenantViolationException) =
        ResponseEntity(ApiResponse.error("Access denied"), HttpStatus.FORBIDDEN)

    @ExceptionHandler(org.springframework.security.core.AuthenticationException::class)
    fun handleAuth(ex: org.springframework.security.core.AuthenticationException) =
        ResponseEntity(ApiResponse.error("Unauthorized"), HttpStatus.UNAUTHORIZED)

    /** Malformed/unreadable request body — a client error, not a server fault. */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException::class)
    fun handleUnreadableBody(ex: org.springframework.http.converter.HttpMessageNotReadableException) =
        ResponseEntity(ApiResponse.error("Malformed request body"), HttpStatus.BAD_REQUEST)

    /** Bean-validation failures (@Valid) — 400 with no internal details. */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException::class)
    fun handleValidation(ex: org.springframework.web.bind.MethodArgumentNotValidException) =
        ResponseEntity(ApiResponse.error("Invalid request"), HttpStatus.BAD_REQUEST)

    /** Unknown routes/static resources — 404, not a logged server error. */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException::class)
    fun handleNoResource(ex: org.springframework.web.servlet.resource.NoResourceFoundException) =
        ResponseEntity(ApiResponse.error("Not found"), HttpStatus.NOT_FOUND)

    /** Wrong HTTP verb on an existing route. */
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException::class)
    fun handleMethodNotSupported(ex: org.springframework.web.HttpRequestMethodNotSupportedException) =
        ResponseEntity(ApiResponse.error("Method not allowed"), HttpStatus.METHOD_NOT_ALLOWED)

    /** Missing required @RequestHeader (e.g. Authorization on /logout) — client error. */
    @ExceptionHandler(org.springframework.web.bind.MissingRequestHeaderException::class)
    fun handleMissingHeader(ex: org.springframework.web.bind.MissingRequestHeaderException) =
        ResponseEntity(ApiResponse.error("Missing required header"), HttpStatus.BAD_REQUEST)

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception): ResponseEntity<ApiResponse<Nothing>> {
        log.error("Unhandled exception", ex)
        return ResponseEntity(ApiResponse.error("Internal server error"), HttpStatus.INTERNAL_SERVER_ERROR)
    }
}