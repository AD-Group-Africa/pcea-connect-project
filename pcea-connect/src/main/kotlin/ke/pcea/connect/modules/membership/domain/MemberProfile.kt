package ke.pcea.connect.modules.membership.domain
import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "member_profiles")
data class MemberProfile(
    @Id val userId: String = "",
    @OneToOne(fetch = FetchType.LAZY) @MapsId @JoinColumn(name = "user_id")
    val user: ke.pcea.connect.modules.identity.domain.User? = null,

    var gender: String = "",
    var dateOfBirth: LocalDate? = null,
    var maritalStatus: String = "",
    var occupation: String = "",
    var baptismDate: LocalDate? = null,
    var confirmationDate: LocalDate? = null,
    var marriageDate: LocalDate? = null,
    var membershipDate: LocalDate? = null,
    var spiritualGifts: String = "",
    var skills: String = "",
    var bio: String = "",

    // Family
    var spouseName: String = "",
    var fatherName: String = "",
    var motherName: String = "",
    var emergencyContact: String = "",
    var emergencyPhone: String = "",

    // Address
    var address: String = "",
    var city: String = "",
    var postalCode: String = "",
    var country: String = "Kenya",

    // Status
    var active: Boolean = true,
    var memberStatus: String = "ACTIVE" // ACTIVE, INACTIVE, TRANSFERRED, DECEASED
)
