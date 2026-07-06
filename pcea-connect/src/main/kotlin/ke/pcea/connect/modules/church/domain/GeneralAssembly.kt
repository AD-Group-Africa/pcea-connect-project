package ke.pcea.connect.modules.church.domain
import jakarta.persistence.*
@Entity
@Table(name = "general_assembly")
data class GeneralAssembly(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val name: String = "PCEA General Assembly",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    val active: Boolean = true
)
