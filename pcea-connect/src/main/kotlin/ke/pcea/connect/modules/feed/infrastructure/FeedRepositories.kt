package ke.pcea.connect.modules.feed.infrastructure
import ke.pcea.connect.modules.feed.domain.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface FeedPostRepository : JpaRepository<FeedPost, String> {
    fun findByCongregationIdOrderByCreatedAtDesc(congregationId: String): List<FeedPost>
    fun findByMinistryIdOrderByCreatedAtDesc(ministryId: String): List<FeedPost>
    fun findAllByOrderByCreatedAtDesc(): List<FeedPost>
}

@Repository interface FeedReactionRepository : JpaRepository<FeedReaction, String> {
    fun findByPostIdAndUserId(postId: String, userId: String): FeedReaction?
    fun countByPostIdAndType(postId: String, type: ReactionType): Long
}

@Repository interface FeedCommentRepository : JpaRepository<FeedComment, String> {
    fun findByPostIdOrderByCreatedAtAsc(postId: String): List<FeedComment>
}
