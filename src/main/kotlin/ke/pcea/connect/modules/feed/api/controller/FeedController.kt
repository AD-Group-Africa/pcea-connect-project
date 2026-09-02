package ke.pcea.connect.modules.feed.api.controller
import ke.pcea.connect.modules.feed.api.dto.*
import ke.pcea.connect.modules.feed.application.FeedService
import ke.pcea.connect.modules.identity.infrastructure.UserRepository
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/feed")
class FeedController(
    private val feedService: FeedService,
    private val userRepo: UserRepository
) {
    @GetMapping
    fun getFeed(
        @RequestParam(required = false) congregationId: String?,
        @RequestParam(required = false) ministryId: String?
    ) = ResponseEntity.ok(ApiResponse.success(
        feedService.getPosts(congregationId, ministryId).map { post ->
            val author = userRepo.findById(post.authorId).orElse(null)
            PostResponse(post.id, author?.fullName ?: "Unknown", post.content,
                post.type.name, post.mediaUrl, post.createdAt.toString(),
                post.likes, post.loves, post.prays, post.amens,
                post.congregationId, post.ministryId)
        }
    ))

    @PostMapping
    fun createPost(auth: Authentication, @RequestBody req: CreatePostRequest) =
        ResponseEntity.ok(ApiResponse.success(
            feedService.createPost(auth.name, req.content, req.type, req.mediaUrl, req.congregationId, req.ministryId)
                .let { post -> PostResponse(post.id, auth.name, post.content, post.type.name, post.mediaUrl,
                    post.createdAt.toString(), 0, 0, 0, 0, post.congregationId, post.ministryId) }
        ))

    @PostMapping("/{postId}/react")
    fun addReaction(auth: Authentication, @PathVariable postId: String, @RequestBody req: AddReactionRequest) =
        ResponseEntity.ok(ApiResponse.success(
            feedService.addReaction(postId, auth.name, req.type).let { post ->
                PostResponse(post.id, auth.name, post.content, post.type.name, post.mediaUrl,
                    post.createdAt.toString(), post.likes, post.loves, post.prays, post.amens,
                    post.congregationId, post.ministryId)
            }
        ))

    @PostMapping("/{postId}/comment")
    fun addComment(auth: Authentication, @PathVariable postId: String, @RequestBody req: CommentRequest) =
        ResponseEntity.ok(ApiResponse.success(
            feedService.addComment(postId, auth.name, req.content).let {
                CommentResponse(it.id, it.userId, it.content, it.createdAt.toString())
            }
        ))

    @GetMapping("/{postId}/comments")
    fun getComments(@PathVariable postId: String) = ResponseEntity.ok(ApiResponse.success(
        feedService.getComments(postId).map {
            CommentResponse(it.id, it.userId, it.content, it.createdAt.toString())
        }
    ))
}
