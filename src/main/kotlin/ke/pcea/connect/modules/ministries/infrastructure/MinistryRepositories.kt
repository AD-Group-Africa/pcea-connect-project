package ke.pcea.connect.modules.ministries.infrastructure
import ke.pcea.connect.modules.ministries.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface MinistryRepository : JpaRepository<Ministry, String> {
    fun findByCongregationId(congregationId: String): List<Ministry>
    fun countByCongregationId(congregationId: String): Long
}

@Repository interface MinistryMemberRepository : JpaRepository<MinistryMember, String> {
    fun findByMinistryId(ministryId: String): List<MinistryMember>
    fun findByUserId(userId: String): List<MinistryMember>
    fun findByMinistryIdAndUserId(ministryId: String, userId: String): MinistryMember?
}

@Repository interface MinistryEventRepository : JpaRepository<MinistryEvent, String> {
    fun findByMinistryId(ministryId: String): List<MinistryEvent>
}

@Repository interface MinistryProjectRepository : JpaRepository<MinistryProject, String> {
    fun findByMinistryId(ministryId: String): List<MinistryProject>
}

@Repository interface MinistryGalleryRepository : JpaRepository<MinistryGallery, String> {
    fun findByMinistryId(ministryId: String): List<MinistryGallery>
}

@Repository interface MinistryAnnouncementRepository : JpaRepository<MinistryAnnouncement, String> {
    fun findByMinistryIdOrderByCreatedAtDesc(ministryId: String): List<MinistryAnnouncement>
}
