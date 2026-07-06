package ke.pcea.connect.modules.church.domain
import jakarta.persistence.*
@Entity
@Table(name = "congregations")
data class Congregation(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @Column(unique = true) val name: String = "",
    val address: String = "",
    val phone: String = "",
    val email: String = "",
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "parish_id") val parish: Parish? = null,
    val active: Boolean = true
)
