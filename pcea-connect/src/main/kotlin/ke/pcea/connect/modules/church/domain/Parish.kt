package ke.pcea.connect.modules.church.domain
import jakarta.persistence.*
@Entity
@Table(name = "parishes")
data class Parish(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @Column(unique = true) val name: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "presbytery_id") val presbytery: Presbytery? = null,
    val active: Boolean = true
)
