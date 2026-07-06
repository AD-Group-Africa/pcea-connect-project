package ke.pcea.connect.shared.api
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(BusinessRuleException::class)
    fun handleBusinessRule(ex: BusinessRuleException) = ResponseEntity(ApiResponse.error(ex.message ?: "Business rule violation"), HttpStatus.BAD_REQUEST)
    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception) = ResponseEntity(ApiResponse.error("Internal server error"), HttpStatus.INTERNAL_SERVER_ERROR)
}
