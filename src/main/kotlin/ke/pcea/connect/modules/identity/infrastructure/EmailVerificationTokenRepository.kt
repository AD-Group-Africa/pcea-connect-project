package ke.pcea.connect.modules.identity.infrastructure

import ke.pcea.connect.modules.identity.domain.EmailVerificationToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EmailVerificationTokenRepository : JpaRepository<EmailVerificationToken, String> {
    fun findByToken(token: String): EmailVerificationToken?
}
