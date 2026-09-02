package ke.pcea.connect.modules.communication.api.controller
import ke.pcea.connect.modules.communication.infrastructure.AfricasTalkingService
import ke.pcea.connect.modules.communication.infrastructure.WhatsAppService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/communication")
class MessagingController(
    private val atService: AfricasTalkingService,
    private val waService: WhatsAppService
) {
    data class SmsRequest(val phone: String, val message: String)
    data class WhatsAppRequest(val phone: String, val message: String)

    @PostMapping("/sms")
    fun sendSms(@RequestBody req: SmsRequest): ResponseEntity<ApiResponse<Any>> {
        val success = atService.sendSms(req.phone, req.message)
        return if (success) ResponseEntity.ok(ApiResponse.success("SMS sent"))
        else ResponseEntity.status(500).body(ApiResponse.error("SMS failed") as ApiResponse<Any>)
    }

    @PostMapping("/whatsapp")
    fun sendWhatsApp(@RequestBody req: WhatsAppRequest): ResponseEntity<ApiResponse<Any>> {
        val success = waService.sendWhatsApp(req.phone, req.message)
        return if (success) ResponseEntity.ok(ApiResponse.success("WhatsApp sent"))
        else ResponseEntity.status(500).body(ApiResponse.error("WhatsApp failed") as ApiResponse<Any>)
    }

    @PostMapping("/ussd")
    fun handleUssd(@RequestParam sessionId: String, @RequestParam phoneNumber: String, @RequestParam text: String): String {
        return atService.handleUssd(sessionId, phoneNumber, text)
    }
}
