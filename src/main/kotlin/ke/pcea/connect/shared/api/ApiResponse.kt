package ke.pcea.connect.shared.api
data class ApiResponse<T>(val success: Boolean, val message: String?, val data: T?, val code: String? = null) {
    companion object {
        fun <T> success(data: T? = null, message: String? = null) = ApiResponse(true, message, data)
        fun error(message: String, code: String? = null) = ApiResponse<Nothing>(false, message, null, code)
    }
}
data class ApiError(val code: String, val message: String)
