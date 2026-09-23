package expo.modules.kairosos

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class KairosOsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val store by lazy { KairosCaptureStore(context) }

  override fun definition() = ModuleDefinition {
    Name("KairosOs")

    AsyncFunction("setAuthToken") { token: String? ->
      store.authToken = token
    }

    AsyncFunction("setApiBaseUrl") { url: String ->
      store.apiBaseUrl = url
    }

    AsyncFunction("getPendingCapture") {
      store.getPending()?.toMap()
    }

    AsyncFunction("clearPendingCapture") {
      store.clearPending()
    }

    AsyncFunction("refreshWidget") { insight: String? ->
      if (!insight.isNullOrBlank()) {
        store.insightText = insight
      }
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, KairosWidgetProvider::class.java))
      KairosWidgetProvider.updateAll(context, manager, ids, store.insightText)
    }
  }
}

private fun JSONObject.toMap(): Map<String, Any?> {
  val out = mutableMapOf<String, Any?>()
  keys().forEach { key ->
    out[key] = opt(key)
  }
  return out
}
