package ke.pcea.connect.modules.membership.domain
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "member_profiles")
data class MemberProfile(
    @Id
    val userId: String = "",  // same as User.id

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    val user: ke.pcea.connect.modules.identity.domain.User? = null,

    var gender: String = "",
    var dateOfBirth: LocalDate? = null,
    var maritalStatus: String = "",
    var occupation: String = "",
    var baptismDate: LocalDate? = null,
    var membershipDate: LocalDate? = null,
    var spiritualGifts: String = "",
    var skills: String = "",
    var bio: String = ""
)
