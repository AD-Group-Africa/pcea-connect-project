package ke.pcea.connect.modules.communication.infrastructure

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

@Service
class AfricasTalkingService(
    @Value("\${africastalking.api-key}") private val apiKey: String,
    @Value("\${africastalking.username}") private val username: String
) {
    private val restTemplate = RestTemplate()

    fun sendSms(phoneNumber: String, message: String): Boolean {
        try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                set("apiKey", apiKey)
            }
            val body = mapOf("username" to username, "to" to phoneNumber, "message" to message)
            restTemplate.postForEntity(
                "https://api.africastalking.com/version1/messaging",
                HttpEntity(body, headers),
                String::class.java
            )
            return true
        } catch (e: Exception) {
            return false
        }
    }

    fun handleUssd(sessionId: String, phoneNumber: String, text: String): String {
        // Simple USSD menu for giving, prayer, announcements
        return when {
            text.isEmpty() -> "CON Welcome to PCEA Connect\n1. Give\n2. Prayer Request\n3. Announcements"
            text == "1" -> "CON Enter amount in KES:"
            text.startsWith("1*") -> "END Thank you! You will receive an M-Pesa prompt."
            text == "2" -> "CON Enter your prayer request:"
            text.startsWith("2*") -> "END Your prayer request has been received."
            text == "3" -> "END Latest: Join us Sunday at 10 AM."
            else -> "END Invalid choice. Goodbye."
        }
    }
}
