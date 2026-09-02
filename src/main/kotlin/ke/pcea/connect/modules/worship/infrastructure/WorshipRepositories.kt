package ke.pcea.connect.modules.worship.infrastructure
import ke.pcea.connect.modules.worship.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository interface ChurchServiceRepository : JpaRepository<ChurchService, String> {
    fun findByServiceDate(serviceDate: LocalDate): List<ChurchService>
    fun findByCongregationIdAndServiceDate(congregationId: String, serviceDate: LocalDate): List<ChurchService>
    fun findByCongregationIdOrderByServiceDateDescServiceTimeDesc(congregationId: String): List<ChurchService>
    fun findTop1ByCongregationIdAndServiceDateGreaterThanEqualOrderByServiceDateAscServiceTimeAsc(congregationId: String, date: LocalDate): ChurchService?
    fun findByCongregationIdAndServiceDateBetweenOrderByServiceDateAscServiceTimeAsc(congregationId: String, start: LocalDate, end: LocalDate): List<ChurchService>
    fun findAllByOrderByServiceDateDesc(): List<ChurchService>
}

@Repository interface BulletinRepository : JpaRepository<Bulletin, String> {
    fun findByCongregationIdOrderByServiceDateDesc(congregationId: String): List<Bulletin>
    fun findTop1ByCongregationIdAndServiceDateOrderByServiceDateDesc(congregationId: String, serviceDate: LocalDate): Bulletin?
    fun findAllByOrderByServiceDateDesc(): List<Bulletin>
}