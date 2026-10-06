package ke.pcea.connect.modules.communion.infrastructure

import ke.pcea.connect.modules.communion.domain.CommunionEvent
import ke.pcea.connect.modules.communion.domain.CommunionEventStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface CommunionEventRepository : JpaRepository<CommunionEvent, String> {
    fun findByCongregationIdOrderByServiceDateDesc(congregationId: String): List<CommunionEvent>
    fun findByCongregationIdAndStatus(congregationId: String, status: CommunionEventStatus): List<CommunionEvent>
    fun findByCongregationIdAndServiceDateAndStatusIn(
        congregationId: String,
        serviceDate: LocalDate,
        statuses: Collection<CommunionEventStatus>
    ): List<CommunionEvent>
}
