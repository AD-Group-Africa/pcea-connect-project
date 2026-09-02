package ke.pcea.connect.modules.communication.infrastructure

import com.twilio.Twilio
import com.twilio.rest.api.v2010.account.Message
import com.twilio.type.PhoneNumber
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class WhatsAppService(
    @Value("\${twilio.account-sid}") private val accountSid: String,
    @Value("\${twilio.auth-token}") private val authToken: String,
    @Value("\${twilio.whatsapp-number}") private val fromNumber: String
) {
    fun sendWhatsApp(toPhone: String, message: String): Boolean {
        return try {
            Twilio.init(accountSid, authToken)
            Message.creator(
                PhoneNumber("whatsapp:$toPhone"),
                PhoneNumber(fromNumber),
                message
            ).create()
            true
        } catch (e: Exception) {
            false
        }
    }
}
