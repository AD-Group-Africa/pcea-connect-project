package ke.pcea.connect.modules.locator.domain
import jakarta.persistence.*

@Entity @Table(name = "church_locator")
data class ChurchLocation(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val congregationId: String = "",
    val name: String = "",
    val address: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val serviceTimes: String = "",
    val phone: String = "",
    val email: String = "",
    val livestreamUrl: String = "",
    val website: String = ""
)
