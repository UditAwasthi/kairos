package expo.modules.kairosos

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream

class KairosShareActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleShare(intent)
    finish()
  }

  private fun handleShare(intent: Intent?) {
    if (intent == null) return
    if (intent.action != Intent.ACTION_SEND) {
      Toast.makeText(this, "Kairos could not read that share.", Toast.LENGTH_SHORT).show()
      return
    }

    val store = KairosCaptureStore(applicationContext)
    val title = intent.getStringExtra(Intent.EXTRA_SUBJECT)
    val text = intent.getStringExtra(Intent.EXTRA_TEXT)
    val stream = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
    val mime = intent.type

    val result = if (stream != null) {
      val copied = copyUri(stream, mime)
      if (copied == null) {
        Toast.makeText(this, "Kairos could not read the shared file.", Toast.LENGTH_SHORT).show()
        return
      }
      store.submitFile(copied, mime ?: "application/octet-stream", "SHARE", title)
    } else if (!text.isNullOrBlank()) {
      val url = if (looksLikeUrl(text)) text.trim() else null
      val content = if (url != null) null else text.trim()
      store.submitText(content ?: "", "SHARE", url, title)
    } else {
      Toast.makeText(this, "Nothing to save to Kairos.", Toast.LENGTH_SHORT).show()
      return
    }

    val message = when {
      result.ok -> "Saved to Kairos"
      result.queued -> "Saved. Kairos will sync when you open the app."
      else -> result.error ?: "Kairos could not save that share."
    }
    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
  }

  private fun copyUri(uri: Uri, mime: String?): File? {
    return try {
      val ext = when {
        mime?.contains("pdf") == true -> "pdf"
        mime?.contains("png") == true -> "png"
        mime?.contains("jpeg") == true || mime?.contains("jpg") == true -> "jpg"
        mime?.contains("webp") == true -> "webp"
        else -> "bin"
      }
      val dest = File(cacheDir, "share-${System.currentTimeMillis()}.$ext")
      contentResolver.openInputStream(uri)?.use { input ->
        FileOutputStream(dest).use { output -> input.copyTo(output) }
      } ?: return null
      dest
    } catch (_: Exception) {
      null
    }
  }

  private fun looksLikeUrl(value: String): Boolean {
    val trimmed = value.trim()
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
  }
}
