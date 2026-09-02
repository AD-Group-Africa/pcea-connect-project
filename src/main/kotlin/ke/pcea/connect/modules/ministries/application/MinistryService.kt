package ke.pcea.connect.modules.ministries.application
import ke.pcea.connect.modules.ministries.domain.*
import ke.pcea.connect.modules.ministries.infrastructure.*
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class MinistryService(
    private val ministryRepo: MinistryRepository,
    private val memberRepo: MinistryMemberRepository,
    private val eventRepo: MinistryEventRepository,
    private val projectRepo: MinistryProjectRepository,
    private val announcementRepo: MinistryAnnouncementRepository
) {
    fun createMinistry(name: String, type: MinistryType, description: String, congregationId: String): Ministry {
        val ministry = Ministry(name = name, type = type, description = description, congregationId = congregationId)
        return ministryRepo.save(ministry)
    }

    fun getAllMinistries() = ministryRepo.findAll()
    fun getMinistriesByCongregation(congregationId: String) = ministryRepo.findByCongregationId(congregationId)

    /** Returns all ministries a user is a member of — enables the "My Ministries" dashboard. */
    fun getMyMinistries(userId: String): List<Ministry> {
        val memberships = memberRepo.findByUserId(userId)
        return memberships.mapNotNull { it.ministry }
    }

    /** Returns ministries the user is NOT a member of — powers the "Explore Ministries" section. */
    fun getExploreMinistries(userId: String): List<Ministry> {
        val myMinistryIds = memberRepo.findByUserId(userId).mapNotNull { it.ministry?.id }.toSet()
        return ministryRepo.findAll().filter { it.id !in myMinistryIds && it.active }
    }

    fun addMember(ministryId: String, userId: String, role: MinistryRole): MinistryMember {
        val ministry = ministryRepo.findById(ministryId).orElseThrow { BusinessRuleException("Ministry not found") }
        val existing = memberRepo.findByMinistryIdAndUserId(ministryId, userId)
        if (existing != null) throw BusinessRuleException("User already a member")
        val member = MinistryMember(ministry = ministry, userId = userId, role = role)
        return memberRepo.save(member)
    }

    fun getMembers(ministryId: String) = memberRepo.findByMinistryId(ministryId)

    fun createEvent(ministryId: String, title: String, description: String, startTime: java.time.LocalDateTime,
                    endTime: java.time.LocalDateTime?, location: String): MinistryEvent {
        val ministry = ministryRepo.findById(ministryId).orElseThrow { BusinessRuleException("Ministry not found") }
        val event = MinistryEvent(title = title, description = description, ministry = ministry,
            startTime = startTime, endTime = endTime, location = location)
        return eventRepo.save(event)
    }

    fun getEvents(ministryId: String) = eventRepo.findByMinistryId(ministryId)

    fun createProject(ministryId: String, name: String, description: String, startDate: java.time.LocalDateTime,
                      endDate: java.time.LocalDateTime?): MinistryProject {
        val ministry = ministryRepo.findById(ministryId).orElseThrow { BusinessRuleException("Ministry not found") }
        val project = MinistryProject(name = name, description = description, ministry = ministry,
            startDate = startDate, endDate = endDate)
        return projectRepo.save(project)
    }

    fun getProjects(ministryId: String) = projectRepo.findByMinistryId(ministryId)

    fun createAnnouncement(ministryId: String, title: String, content: String, authorId: String): MinistryAnnouncement {
        val ministry = ministryRepo.findById(ministryId).orElseThrow { BusinessRuleException("Ministry not found") }
        return announcementRepo.save(MinistryAnnouncement(ministry = ministry, title = title, content = content, authorId = authorId))
    }

    fun getAnnouncements(ministryId: String) = announcementRepo.findByMinistryIdOrderByCreatedAtDesc(ministryId)
}
