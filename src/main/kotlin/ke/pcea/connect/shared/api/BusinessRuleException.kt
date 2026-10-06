package ke.pcea.connect.shared.api

/**
 * A business-rule violation mapped to HTTP 400 by [ke.pcea.connect.shared.api.GlobalExceptionHandler].
 *
 * The optional [code] carries a stable, machine-readable reason for programmatic
 * clients (the scanner UI distinguishes DUPLICATE_RECORD from TAMPERED_CREDENTIAL
 * instead of a generic failure). Existing string-only call sites keep working
 * with code = null.
 */
class BusinessRuleException(
    val code: String? = null,
    message: String
) : RuntimeException(message) {
    constructor(message: String) : this(code = null, message = message)
}
