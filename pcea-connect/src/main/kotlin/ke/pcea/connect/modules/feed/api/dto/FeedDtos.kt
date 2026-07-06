package ke.pcea.connect.modules.feed.api.dto
import ke.pcea.connect.modules.feed.domain.PostType
import ke.pcea.connect.modules.feed.domain.ReactionType

data class CreatePostRequest(
    val content: String,
    val type: PostType = PostType.TEXT,
    val mediaUrl: String = "",
    val congregationId: String = "",
    val ministryId: String? = null
)

data class PostResponse(
    val id: String,
    val authorName: String,
    val content: String,
    val type: String,
    val mediaUrl: String,
    val createdAt: String,
    val likes: Int,
    val loves: Int,
    val prays: Int,
    val amens: Int,
    val congregationId: String,
    val ministryId: String?
)

data class AddReactionRequest(val type: ReactionType = ReactionType.LIKE)
data class CommentRequest(val content: String)
data class CommentResponse(val id: String, val userId: String, val content: String, val createdAt: String)
