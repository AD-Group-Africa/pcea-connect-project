package ke.pcea.connect.shell

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * PCEA Connect Android demo shell.
 *
 * A deliberately small, secure WebView wrapper around the existing PCEA Connect
 * web application. The web app is the product; this shell adds:
 *  - Android back-button navigation inside the web app
 *  - allow-listed navigation (only the demo host renders in-app; everything
 *    else — YouTube livestreams, mailto:, tel: — opens in the browser/app)
 *  - a branded splash and a friendly offline/retry state
 *  - file-chooser support so web forms (uploads) still work
 *
 * The demo URL is injected at build time from gradle.properties (demoUrl).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var errorView: LinearLayout
    private lateinit var root: FrameLayout
    private var homeHost: String = ""
    private var startUrl: String = ""
    // Set when the main frame fails to load, cleared on the next page start.
    // onPageFinished fires AFTER onReceivedError for failed loads, so we must not
    // hide the error screen unconditionally there (it would flash and vanish).
    private var mainFrameFailed = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val b64 = getString(R.string.demo_url_b64)
        startUrl = String(Base64.decode(b64, Base64.DEFAULT), Charsets.UTF_8)
        homeHost = Uri.parse(startUrl).host ?: ""

        root = FrameLayout(this)
        webView = WebView(this)
        errorView = buildErrorView()

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true          // localStorage => session persistence
        webView.settings.databaseEnabled = true
        webView.settings.loadWithOverviewMode = true
        webView.settings.useWideViewPort = true
        webView.settings.mediaPlaybackRequiresUserGesture = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = true
        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false)

        webView.webViewClient = ShellWebViewClient()
        webView.webChromeClient = ShellChromeClient()
        webView.setBackgroundColor(0xFF0A1128.toInt())

        root.addView(webView, FrameLayout.LayoutParams(-1, -1))
        root.addView(errorView, FrameLayout.LayoutParams(-1, -1))
        errorView.visibility = View.GONE
        setContentView(root)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(startUrl)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    private fun showError() {
        errorView.visibility = View.VISIBLE
        webView.visibility = View.INVISIBLE
    }

    private fun retry() {
        errorView.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.loadUrl(startUrl)
    }

    private fun buildErrorView(): LinearLayout {
        val pad = (24 * resources.displayMetrics.density).toInt()
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(0xFF0A1128.toInt())
            setPadding(pad, pad, pad, pad)
        }
        val title = TextView(this).apply {
            text = "Cannot reach PCEA Connect"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 18f
            gravity = android.view.Gravity.CENTER
        }
        val body = TextView(this).apply {
            text = "Check your internet connection and try again."
            setTextColor(0xFF94A3B8.toInt())
            textSize = 14f
            gravity = android.view.Gravity.CENTER
            setPadding(0, (12 * resources.displayMetrics.density).toInt(), 0, 0)
        }
        val button = Button(this).apply {
            text = "Retry"
            setOnClickListener { retry() }
        }
        box.addView(title)
        box.addView(body)
        box.addView(button)
        return box
    }

    /**
     * Navigation allow-list: the demo host renders in-app. External http(s)
     * hosts (e.g. the church's YouTube channel), mailto:, tel:, intent:// and
     * Play Store links are handed to the OS so the right app handles them.
     */
    private inner class ShellWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            val scheme = url.scheme ?: return true

            if (scheme == "http" || scheme == "https") {
                val host = url.host ?: return true
                if (host == homeHost) return false        // in-app
                return openExternally(url)                // different site → browser
            }
            return openExternally(url)                    // mailto:, tel:, intent:, market: …
        }

        private fun openExternally(url: Uri): Boolean {
            return try {
                startActivity(Intent(Intent.ACTION_VIEW, url))
                true
            } catch (e: ActivityNotFoundException) {
                true // nothing can handle it; stay in-app rather than crash
            }
        }

        override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
            mainFrameFailed = false
            errorView.visibility = View.GONE
            webView.visibility = View.VISIBLE
        }

        override fun onPageFinished(view: WebView, url: String) {
            if (!mainFrameFailed) errorView.visibility = View.GONE
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (request.isForMainFrame) {
                mainFrameFailed = true
                showError()
            }
        }

        override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse) {
            if (request.isForMainFrame && errorResponse.statusCode >= 500) {
                mainFrameFailed = true
                showError()
            }
        }
    }

    /** File-chooser support so <input type="file"> in the web app works. */
    private inner class ShellChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            view: WebView,
            callback: ValueCallback<Array<Uri>>,
            params: FileChooserParams
        ): Boolean {
            return try {
                fileChooserCallback = callback
                startActivityForResult(params.createIntent(), FILE_CHOOSER_CODE)
                true
            } catch (e: ActivityNotFoundException) {
                fileChooserCallback = null
                false
            }
        }
    }

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_CODE) {
            fileChooserCallback?.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            )
            fileChooserCallback = null
        } else {
            @Suppress("DEPRECATION")
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    companion object {
        private const val FILE_CHOOSER_CODE = 4101
    }
}
