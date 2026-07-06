package ke.pcea.connect.modules.church.domain
import jakarta.persistence.*
@Entity
@Table(name = "presbyteries")
data class Presbytery(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @Column(unique = true) val name: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "region_id") val region: Region? = null,
    val active: Boolean = true
)
