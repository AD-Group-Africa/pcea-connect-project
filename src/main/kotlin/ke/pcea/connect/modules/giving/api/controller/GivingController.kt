package ke.pcea.connect.modules.giving.api.controller
import ke.pcea.connect.modules.giving.api.dto.*
import ke.pcea.connect.modules.giving.application.GivingService
import ke.pcea.connect.modules.giving.infrastructure.MpesaDarajaService
import ke.pcea.connect.shared.api.ApiResponse
import ke.pcea.connect.shared.api.BusinessRuleException
import ke.pcea.connect.shared.security.Roles
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/giving")
class GivingController(
    private val service: GivingService,
    private val mpesaService: MpesaDarajaService
) {
    @PostMapping("/contribute")
    fun contribute(auth: Authentication, @RequestBody req: ContributionRequest): ResponseEntity<ApiResponse<ContributionResponse>> {
        // SECURITY: userId is derived from the authenticated principal, NEVER trusted from the
        // request body. A client must not be able to record giving under another member's identity.
        val userId = auth.name
        val c = service.recordContribution(userId, req.type, req.amount, req.method, req.phoneNumber, req.description, req.congregationId)
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
    @PreAuthorize(Roles.FINANCE_SPEL)
    fun confirmPayment(@RequestBody req: PaymentConfirmationRequest): ResponseEntity<ApiResponse<ContributionResponse>> {
        val c = service.confirmPayment(req.contributionId, req.mpesaCode)
        return ResponseEntity.ok(ApiResponse.success(ContributionResponse(c.id, c.userId, c.type.name, c.amount, c.method.name, c.status.name, c.transactionRef, c.createdAt.toString())))
    }

    @GetMapping("/contributions/{userId}")
    fun getUserContributions(auth: Authentication, @PathVariable userId: String): ResponseEntity<ApiResponse<List<ContributionResponse>>> {
        // OBJECT-LEVEL AUTHORIZATION: a member may only view their own giving records.
        // Finance/staff roles may view any member's records for reconciliation.
        if (userId != auth.name && !Roles.isFinance(auth.authorities.map { it.authority.removePrefix("ROLE_") })) {
            throw BusinessRuleException("You are not authorized to view another member's giving records")
        }
        return ResponseEntity.ok(ApiResponse.success(
            service.getUserContributions(userId).map { ContributionResponse(it.id, it.userId, it.type.name, it.amount, it.method.name, it.status.name, it.transactionRef, it.createdAt.toString()) }
        ))
    }

    @GetMapping("/statement/{userId}")
    fun getStatement(auth: Authentication, @PathVariable userId: String, @RequestParam(required = false) year: Int?): ResponseEntity<ApiResponse<StatementResponse>> {
        // OBJECT-LEVEL AUTHORIZATION: giving statements contain sensitive financial data.
        if (userId != auth.name && !Roles.isFinance(auth.authorities.map { it.authority.removePrefix("ROLE_") })) {
            throw BusinessRuleException("You are not authorized to view another member's giving statement")
        }
        return ResponseEntity.ok(ApiResponse.success(
            service.getStatement(userId, year).let { StatementResponse(it.userId, it.statementYear, it.totalAmount, it.titheAmount, it.offeringAmount, it.donationAmount) }
        ))
    }
}
