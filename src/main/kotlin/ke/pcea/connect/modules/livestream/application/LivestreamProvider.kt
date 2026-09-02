package ke.pcea.connect.modules.livestream.application

/**
 * Provider-agnostic abstraction for livestream/video platforms.
 *
 * SECURITY/INTEGRITY: This abstraction does NOT fabricate live-status data.
 * If no YouTube API credentials are configured, live-status is determined by
 * the persisted StreamStatus in the database (set by authorized staff via goLive/endStream),
 * NOT by querying YouTube's API. The provider only handles URL parsing/embed generation.
 *
 * When YouTube API credentials ARE configured (future), implementations can poll
 * the YouTube Data API for real live-status and auto-transition streams.
 */
interface LivestreamProvider {
    /** The platform this provider handles. */
    fun platform(): String

    /**
     * Extracts a canonical video ID from a watch/share URL.
     * Returns null if the URL is not recognized.
     */
    fun extractVideoId(url: String): String?

    /**
     * Builds an iframe-embeddable URL from a video ID or watch URL.
     * Returns the original URL if it cannot be parsed.
     */
    fun toEmbedUrl(urlOrId: String): String

    /**
     * Builds a thumbnail URL from a video ID.
     * YouTube thumbnails follow a predictable pattern: https://img.youtube.com/vi/{id}/hqdefault.jpg
     */
    fun thumbnailUrl(videoId: String): String

    /**
     * Builds a watchable URL from a video ID.
     */
    fun watchUrl(videoId: String): String
}

/**
 * YouTube implementation — handles URL parsing and embed generation.
 *
 * INTEGRITY: Does NOT call the YouTube Data API. Live-status is NOT fabricated.
 * The LivestreamService determines live-status from the persisted StreamStatus enum,
 * which is set by authorized staff through the goLive/endStream endpoints.
 *
 * Future enhancement: when YouTube API credentials are configured, this can poll
 * the Data API for real broadcast status and auto-transition streams.
 */
class YouTubeProvider : LivestreamProvider {
    override fun platform() = "YOUTUBE"

    private val patterns = listOf(
        Regex("""(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/live/)([A-Za-z0-9_-]{11})"""),
        Regex("""^([A-Za-z0-9_-]{11})$""")
    )

    override fun extractVideoId(url: String): String? {
        for (p in patterns) {
            val m = p.find(url)
            if (m != null) return m.groupValues[1]
        }
        return null
    }

    override fun toEmbedUrl(urlOrId: String): String {
        val id = extractVideoId(urlOrId) ?: return urlOrId
        return "https://www.youtube.com/embed/$id"
    }

    override fun thumbnailUrl(videoId: String): String =
        "https://img.youtube.com/vi/$videoId/hqdefault.jpg"

    override fun watchUrl(videoId: String): String =
        "https://www.youtube.com/watch?v=$videoId"
}
