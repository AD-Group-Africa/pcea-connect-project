package ke.pcea.connect.modules.ministries.application
import ke.pcea.connect.modules.ministries.domain.*
import ke.pcea.connect.modules.ministries.infrastructure.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

data class MinistryFeedItem(
    val id: String,
    val type: String,
    val title: String,
    val description: String,
    val timestamp: LocalDateTime,
    val imageUrl: String? = null
)

@Service
@Transactional(readOnly = true)
class MinistryFeedService(
    private val eventRepo: MinistryEventRepository,
    private val projectRepo: MinistryProjectRepository,
    private val galleryRepo: MinistryGalleryRepository
) {
    fun getFeed(ministryId: String): List<MinistryFeedItem> {
        val items = mutableListOf<MinistryFeedItem>()
        eventRepo.findByMinistryId(ministryId).mapTo(items) { e ->
            MinistryFeedItem(e.id, "event", e.title, e.description ?: "", e.startTime)
        }
        projectRepo.findByMinistryId(ministryId).mapTo(items) { p ->
            MinistryFeedItem(p.id, "project", p.name, p.description ?: "", p.startDate)
        }
        galleryRepo.findByMinistryId(ministryId).mapTo(items) { g ->
            MinistryFeedItem(g.id, "gallery", g.caption, "", g.uploadedAt, g.imageUrl)
        }
        return items.sortedByDescending { it.timestamp }
    }
}
