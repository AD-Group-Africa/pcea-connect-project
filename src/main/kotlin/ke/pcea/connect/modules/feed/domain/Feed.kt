package ke.pcea.connect.modules.feed.domain
import jakarta.persistence.*
import java.time.LocalDateTime

enum class PostType { TEXT, IMAGE, VIDEO, LINK }
enum class ReactionType { LIKE, LOVE, PRAY, AMEN }

@Entity @Table(name = "feed_posts")
data class FeedPost(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val authorId: String = "",
    @Column(length = 2000) val content: String = "",
    val mediaUrl: String = "",
    @Enumerated(EnumType.STRING) val type: PostType = PostType.TEXT,
    val congregationId: String = "",
    val ministryId: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    var likes: Int = 0,
    var loves: Int = 0,
    var prays: Int = 0,
    var amens: Int = 0
)

@Entity @Table(name = "feed_reactions")
data class FeedReaction(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val postId: String = "",
    val userId: String = "",
    @Enumerated(EnumType.STRING) val type: ReactionType = ReactionType.LIKE
)

@Entity @Table(name = "feed_comments")
data class FeedComment(
    @Id @GeneratedValue(strategy = GenerationType.UUID) val id: String = "",
    val postId: String = "",
    val userId: String = "",
    val content: String = "",
    val createdAt: LocalDateTime = LocalDateTime.now()
)
