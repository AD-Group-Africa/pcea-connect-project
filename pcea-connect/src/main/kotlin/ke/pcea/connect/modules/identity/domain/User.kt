package ke.pcea.connect.modules.identity.domain
import jakarta.persistence.*
import ke.pcea.connect.modules.church.domain.Congregation

@Entity
@Table(name = "users")
data class User(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    @Column(unique = true) val email: String = "",
    val password: String = "",
    val fullName: String = "",
    val phone: String = "",
    val enabled: Boolean = true,
    @ElementCollection(fetch = FetchType.EAGER) val roles: MutableSet<String> = mutableSetOf(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "congregation_id")
    var congregation: Congregation? = null
)
