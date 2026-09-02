package ke.pcea.connect.modules.livestream.infrastructure
import ke.pcea.connect.modules.livestream.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface LivestreamRepository : JpaRepository<Livestream, String> {
    fun findByStatus(status: StreamStatus): List<Livestream>
    fun findByOrderByScheduledAtDesc(): List<Livestream>
}
