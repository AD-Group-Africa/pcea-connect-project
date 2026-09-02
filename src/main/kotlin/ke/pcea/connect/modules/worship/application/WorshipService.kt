package ke.pcea.connect.modules.worship.application
import ke.pcea.connect.modules.worship.domain.*
import ke.pcea.connect.modules.worship.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Service
@Transactional
class WorshipService(
    private val serviceRepo: ChurchServiceRepository,
    private val bulletinRepo: BulletinRepository
) {
    // ---------- Services ----------

    fun createService(
        title: String, serviceDate: LocalDate, serviceTime: LocalTime, congregationId: String,
        serviceType: ServiceType, preacherName: String, preacherUserId: String, sermonId: String,
        theme: String, scriptureRef: String, worshipTeam: String, orderOfService: String,
        livestreamId: String, announcements: String
    ): ChurchService {
        val service = ChurchService(
            title = title.ifBlank { "$serviceType ${serviceDate} ${serviceTime}" },
            serviceDate = serviceDate, serviceTime = serviceTime, congregationId = congregationId,
            serviceType = serviceType, preacherName = preacherName, preacherUserId = preacherUserId,
            sermonId = sermonId, theme = theme, scriptureRef = scriptureRef, worshipTeam = worshipTeam,
            orderOfService = orderOfService, livestreamId = livestreamId, announcements = announcements
        )
        return serviceRepo.save(service)
    }

    fun updateService(id: String, patch: Map<String, Any?>): ChurchService {
        val s = serviceRepo.findById(id).orElseThrow { BusinessRuleException("Service not found") }
        (patch["title"] as? String)?.let { s.title = it }
        (patch["serviceDate"] as? LocalDate)?.let { s.serviceDate = it }
        (patch["serviceTime"] as? LocalTime)?.let { s.serviceTime = it }
        (patch["serviceType"] as? ServiceType)?.let { s.serviceType = it }
        (patch["preacherName"] as? String)?.let { s.preacherName = it }
        (patch["preacherUserId"] as? String)?.let { s.preacherUserId = it }
        (patch["sermonId"] as? String)?.let { s.sermonId = it }
        (patch["theme"] as? String)?.let { s.theme = it }
        (patch["scriptureRef"] as? String)?.let { s.scriptureRef = it }
        (patch["worshipTeam"] as? String)?.let { s.worshipTeam = it }
        (patch["orderOfService"] as? String)?.let { s.orderOfService = it }
        (patch["livestreamId"] as? String)?.let { s.livestreamId = it }
        (patch["announcements"] as? String)?.let { s.announcements = it }
        s.updatedAt = LocalDateTime.now()
        return serviceRepo.save(s)
    }

    fun getService(id: String) = serviceRepo.findById(id).orElseThrow { BusinessRuleException("Service not found") }

    fun getUpcoming(congregationId: String?, limit: Int = 10): List<ChurchService> {
        val today = LocalDate.now()
        val list = if (congregationId.isNullOrBlank())
            serviceRepo.findAllByOrderByServiceDateDesc().filter { !it.serviceDate.isBefore(today) }
        else
            serviceRepo.findTop1ByCongregationIdAndServiceDateGreaterThanEqualOrderByServiceDateAscServiceTimeAsc(congregationId, today)?.let { listOf(it) } ?: emptyList()
        return list.take(limit)
    }

    fun getWeek(congregationId: String?): List<ChurchService> {
        val today = LocalDate.now()
        val start = today.minusDays(1)
        val end = today.plusDays(6)
        return if (congregationId.isNullOrBlank())
            serviceRepo.findAllByOrderByServiceDateDesc().filter { !it.serviceDate.isBefore(start) && !it.serviceDate.isAfter(end) }
                .sortedBy { it.serviceDate }
        else
            serviceRepo.findByCongregationIdAndServiceDateBetweenOrderByServiceDateAscServiceTimeAsc(congregationId, start, end)
    }

    fun getHistory(congregationId: String?, limit: Int = 20): List<ChurchService> {
        val today = LocalDate.now()
        val list = if (congregationId.isNullOrBlank()) serviceRepo.findAllByOrderByServiceDateDesc()
        else serviceRepo.findByCongregationIdOrderByServiceDateDescServiceTimeDesc(congregationId)
        return list.filter { it.serviceDate.isBefore(today) }.take(limit)
    }

    fun deleteService(id: String) {
        serviceRepo.deleteById(id)
    }

    // ---------- Bulletins ----------

    fun createBulletin(
        title: String, congregationId: String, churchServiceId: String, serviceDate: LocalDate,
        welcomeMessage: String, orderOfService: String, scriptureRef: String, preacher: String,
        sermonTheme: String, announcements: String, weeklyCalendar: String, ministryNotices: String,
        givingInformation: String, livestreamUrl: String, specialEvents: String
    ): Bulletin {
        val b = Bulletin(
            title = title.ifBlank { "Weekly Bulletin — $serviceDate" },
            congregationId = congregationId, churchServiceId = churchServiceId, serviceDate = serviceDate,
            welcomeMessage = welcomeMessage, orderOfService = orderOfService, scriptureRef = scriptureRef,
            preacher = preacher, sermonTheme = sermonTheme, announcements = announcements,
            weeklyCalendar = weeklyCalendar, ministryNotices = ministryNotices,
            givingInformation = givingInformation, livestreamUrl = livestreamUrl, specialEvents = specialEvents
        )
        return bulletinRepo.save(b)
    }

    fun updateBulletin(id: String, patch: Map<String, Any?>): Bulletin {
        val b = bulletinRepo.findById(id).orElseThrow { BusinessRuleException("Bulletin not found") }
        (patch["title"] as? String)?.let { b.title = it }
        (patch["welcomeMessage"] as? String)?.let { b.welcomeMessage = it }
        (patch["orderOfService"] as? String)?.let { b.orderOfService = it }
        (patch["scriptureRef"] as? String)?.let { b.scriptureRef = it }
        (patch["preacher"] as? String)?.let { b.preacher = it }
        (patch["sermonTheme"] as? String)?.let { b.sermonTheme = it }
        (patch["announcements"] as? String)?.let { b.announcements = it }
        (patch["weeklyCalendar"] as? String)?.let { b.weeklyCalendar = it }
        (patch["ministryNotices"] as? String)?.let { b.ministryNotices = it }
        (patch["givingInformation"] as? String)?.let { b.givingInformation = it }
        (patch["livestreamUrl"] as? String)?.let { b.livestreamUrl = it }
        (patch["specialEvents"] as? String)?.let { b.specialEvents = it }
        b.updatedAt = LocalDateTime.now()
        return bulletinRepo.save(b)
    }

    fun publishBulletin(id: String): Bulletin {
        val b = bulletinRepo.findById(id).orElseThrow { BusinessRuleException("Bulletin not found") }
        b.status = BulletinStatus.PUBLISHED
        b.publishedAt = LocalDateTime.now()
        return bulletinRepo.save(b)
    }

    fun getBulletin(id: String) = bulletinRepo.findById(id).orElseThrow { BusinessRuleException("Bulletin not found") }

    fun getBulletins(congregationId: String?): List<Bulletin> =
        if (congregationId.isNullOrBlank()) bulletinRepo.findAllByOrderByServiceDateDesc()
        else bulletinRepo.findByCongregationIdOrderByServiceDateDesc(congregationId)

    fun getLatestBulletin(congregationId: String?): Bulletin? {
        if (congregationId.isNullOrBlank()) return bulletinRepo.findAllByOrderByServiceDateDesc().firstOrNull()
        return bulletinRepo.findByCongregationIdOrderByServiceDateDesc(congregationId).firstOrNull()
    }

    fun deleteBulletin(id: String) {
        bulletinRepo.deleteById(id)
    }
}