package ke.pcea.connect.modules.giving.api.controller
import ke.pcea.connect.modules.giving.api.dto.*
import ke.pcea.connect.modules.giving.application.GivingService
import ke.pcea.connect.modules.giving.infrastructure.MpesaDarajaService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/giving")
class GivingController(
    private val service: GivingService,
    private val mpesaService: MpesaDarajaService
) {
    @PostMapping("/contribute")
    fun contribute(@RequestBody req: ContributionRequest): ResponseEntity<ApiResponse<ContributionResponse>> {
        val c = service.recordContribution(req.userId, req.type, req.amount, req.method, req.phoneNumber, req.description, req.congregationId)
        if (req.method.name == "MPESA" && req.phoneNumber.isNotBlank()) {
            try {
                val stkResponse = mpesaService.stkPush(req.phoneNumber, req.amount, c.id, req.description)
                if (stkResponse.CheckoutRequestID != null) {
                    c.transactionRef = stkResponse.CheckoutRequestID
                    service.updateContribution(c)
                }
            } catch (e: Exception) { /* STK push failed – contribution still saved as PENDING */ }
        }
        return ResponseEntity.ok(ApiResponse.success(ContributionResponse(c.id, c.userId, c.type.name, c.amount, c.method.name, c.status.name, c.transactionRef, c.createdAt.toString())))
    }

    @PostMapping("/confirm-payment")
    fun confirmPayment(@RequestBody req: PaymentConfirmationRequest): ResponseEntity<ApiResponse<ContributionResponse>> {
        val c = service.confirmPayment(req.contributionId, req.mpesaCode)
        return ResponseEntity.ok(ApiResponse.success(ContributionResponse(c.id, c.userId, c.type.name, c.amount, c.method.name, c.status.name, c.transactionRef, c.createdAt.toString())))
    }

    @GetMapping("/contributions/{userId}")
    fun getUserContributions(@PathVariable userId: String) = ResponseEntity.ok(ApiResponse.success(
        service.getUserContributions(userId).map { ContributionResponse(it.id, it.userId, it.type.name, it.amount, it.method.name, it.status.name, it.transactionRef, it.createdAt.toString()) }
    ))

    @GetMapping("/statement/{userId}")
    fun getStatement(@PathVariable userId: String, @RequestParam(required = false) year: Int?) = ResponseEntity.ok(ApiResponse.success(
        service.getStatement(userId, year).let { StatementResponse(it.userId, it.statementYear, it.totalAmount, it.titheAmount, it.offeringAmount, it.donationAmount) }
    ))
}
