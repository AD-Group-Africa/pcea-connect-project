package ke.pcea.connect.modules.media.api.controller
import ke.pcea.connect.modules.media.api.dto.*
import ke.pcea.connect.modules.media.application.MediaService
import ke.pcea.connect.shared.api.ApiResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/media")
class MediaController(private val mediaService: MediaService) {

    @GetMapping("/sermons")
    fun getAll(@RequestParam(required = false) category: String?) = ResponseEntity.ok(ApiResponse.success(
        (if (category != null) mediaService.getByCategory(category) else mediaService.getAll()).map {
            SermonResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.type.name, it.videoUrl, it.audioUrl, it.thumbnailUrl, it.category,
                it.publishedAt.toString(), it.isLive, it.views)
        }))

    @GetMapping("/sermons/live")
    fun getLive() = ResponseEntity.ok(ApiResponse.success(
        mediaService.getLive().map {
            SermonResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.type.name, it.videoUrl, it.audioUrl, it.thumbnailUrl, it.category,
                it.publishedAt.toString(), it.isLive, it.views)
        }))

    @PostMapping("/sermons")
    fun create(@RequestBody req: CreateSermonRequest) = ResponseEntity.ok(ApiResponse.success(
        mediaService.createSermon(req.title, req.description, req.preacher, req.scriptureRef,
            req.type, req.videoUrl, req.audioUrl, req.thumbnailUrl, req.category)
            .let { SermonResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.type.name, it.videoUrl, it.audioUrl, it.thumbnailUrl, it.category,
                it.publishedAt.toString(), it.isLive, it.views) }))

    // Playlists
    @GetMapping("/playlists")
    fun getPlaylists(auth: Authentication) = ResponseEntity.ok(ApiResponse.success(
        mediaService.getPlaylists(auth.name).map {
            PlaylistResponse(it.id, it.name, it.description)
        }))

    @PostMapping("/playlists")
    fun createPlaylist(auth: Authentication, @RequestBody req: CreatePlaylistRequest) =
        ResponseEntity.ok(ApiResponse.success(
            mediaService.createPlaylist(req.name, req.description, auth.name)
                .let { PlaylistResponse(it.id, it.name, it.description) }))

    @GetMapping("/playlists/{playlistId}/items")
    fun getPlaylistItems(@PathVariable playlistId: String) = ResponseEntity.ok(ApiResponse.success(
        mediaService.getPlaylistItems(playlistId).map {
            SermonResponse(it.id, it.title, it.description, it.preacher, it.scriptureRef,
                it.type.name, it.videoUrl, it.audioUrl, it.thumbnailUrl, it.category,
                it.publishedAt.toString(), it.isLive, it.views)
        }))

    @PostMapping("/playlists/{playlistId}/items")
    fun addToPlaylist(@PathVariable playlistId: String, @RequestBody req: AddToPlaylistRequest) =
        ResponseEntity.ok(ApiResponse.success(mediaService.addToPlaylist(playlistId, req.sermonId).let { "Added" }))
}
