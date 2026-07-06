package ke.pcea.connect.modules.feed.application
import ke.pcea.connect.modules.feed.domain.*
import ke.pcea.connect.modules.feed.infrastructure.*
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.BusinessRuleException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class FeedService(
    private val postRepo: FeedPostRepository,
    private val reactionRepo: FeedReactionRepository,
    private val commentRepo: FeedCommentRepository,
    private val userRepo: UserRepository
) {
    fun createPost(authorId: String, content: String, type: PostType, mediaUrl: String, congregationId: String, ministryId: String?): FeedPost {
        val post = FeedPost(authorId = authorId, content = content, type = type,
            mediaUrl = mediaUrl, congregationId = congregationId, ministryId = ministryId)
        return postRepo.save(post)
    }

    fun getPosts(congregationId: String?, ministryId: String?): List<FeedPost> {
        return when {
            ministryId != null -> postRepo.findByMinistryIdOrderByCreatedAtDesc(ministryId)
            congregationId != null -> postRepo.findByCongregationIdOrderByCreatedAtDesc(congregationId)
            else -> postRepo.findAllByOrderByCreatedAtDesc()
        }
    }

    fun addReaction(postId: String, userId: String, type: ReactionType): FeedPost {
        val post = postRepo.findById(postId).orElseThrow { BusinessRuleException("Post not found") }
        val existing = reactionRepo.findByPostIdAndUserId(postId, userId)
        if (existing != null) throw BusinessRuleException("Already reacted")
        reactionRepo.save(FeedReaction(postId = postId, userId = userId, type = type))
        // update counts
        when (type) {
            ReactionType.LIKE -> post.likes = reactionRepo.countByPostIdAndType(postId, ReactionType.LIKE).toInt()
            ReactionType.LOVE -> post.loves = reactionRepo.countByPostIdAndType(postId, ReactionType.LOVE).toInt()
            ReactionType.PRAY -> post.prays = reactionRepo.countByPostIdAndType(postId, ReactionType.PRAY).toInt()
            ReactionType.AMEN -> post.amens = reactionRepo.countByPostIdAndType(postId, ReactionType.AMEN).toInt()
        }
        return postRepo.save(post)
    }

    fun addComment(postId: String, userId: String, content: String): FeedComment {
        val comment = FeedComment(postId = postId, userId = userId, content = content)
        return commentRepo.save(comment)
    }

    fun getComments(postId: String) = commentRepo.findByPostIdOrderByCreatedAtAsc(postId)
}
