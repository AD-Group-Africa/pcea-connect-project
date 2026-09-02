package ke.pcea.connect.modules.church.domain
import jakarta.persistence.*
@Entity
@Table(name = "regions")
data class Region(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @Column(unique = true) val name: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val active: Boolean = true
)
