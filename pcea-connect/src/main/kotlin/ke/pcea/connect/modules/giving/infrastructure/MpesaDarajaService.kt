package ke.pcea.connect.modules.giving.infrastructure

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.util.Base64
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class MpesaDarajaService(
    @Value("\${mpesa.consumer-key}") private val consumerKey: String,
    @Value("\${mpesa.consumer-secret}") private val consumerSecret: String,
    @Value("\${mpesa.passkey}") private val passkey: String,
    @Value("\${mpesa.shortcode}") private val shortcode: String,
    @Value("\${mpesa.callback-url}") private val callbackUrl: String
) {
    private val restTemplate = RestTemplate()

    data class StkResponse(val CheckoutRequestID: String?, val ResponseCode: String?, val ResponseDescription: String?)

    fun getAccessToken(): String {
        val credentials = "$consumerKey:$consumerSecret"
        val encoded = Base64.getEncoder().encodeToString(credentials.toByteArray())
        val headers = HttpHeaders().apply { set("Authorization", "Basic $encoded") }
        val response = restTemplate.exchange(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            HttpMethod.GET,
            HttpEntity<String>(headers),
            Map::class.java
        )
        val body = response.body as? Map<*, *>
        return (body?.get("access_token") as? String) ?: ""
    }

    fun stkPush(phoneNumber: String, amount: java.math.BigDecimal, accountRef: String, description: String): StkResponse {
        val token = getAccessToken()
        val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
        val password = Base64.getEncoder().encodeToString("$shortcode$passkey$timestamp".toByteArray())

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(token)
        }

        val payload = mapOf<String, Any>(
            "BusinessShortCode" to shortcode,
            "Password" to password,
            "Timestamp" to timestamp,
            "TransactionType" to "CustomerPayBillOnline",
            "Amount" to amount.toPlainString(),
            "PartyA" to phoneNumber.replace("+", "").replace(" ", ""),
            "PartyB" to shortcode,
            "PhoneNumber" to phoneNumber.replace("+", "").replace(" ", ""),
            "CallBackURL" to callbackUrl,
            "AccountReference" to accountRef,
            "TransactionDesc" to description
        )

        val response = restTemplate.postForEntity(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            HttpEntity(payload, headers),
            Map::class.java
        )

        val body = response.body as? Map<*, *>
        return StkResponse(
            CheckoutRequestID = body?.get("CheckoutRequestID") as? String,
            ResponseCode = body?.get("ResponseCode") as? String,
            ResponseDescription = body?.get("ResponseDescription") as? String
        )
    }
}
