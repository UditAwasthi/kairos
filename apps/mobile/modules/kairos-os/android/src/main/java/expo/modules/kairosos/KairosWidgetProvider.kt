package expo.modules.kairosos

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

class KairosWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val insight = KairosCaptureStore(context).insightText
    updateAll(context, appWidgetManager, appWidgetIds, insight)
  }

  companion object {
    fun updateAll(
      context: Context,
      manager: AppWidgetManager,
      ids: IntArray,
      insight: String,
    ) {
      for (id in ids) {
        val views = RemoteViews(context.packageName, R.layout.kairos_widget)
        views.setTextViewText(R.id.kairos_widget_insight, insight)
        views.setOnClickPendingIntent(
          R.id.kairos_widget_capture,
          deepLink(context, 11, "kairos://capture?source=WIDGET"),
        )
        views.setOnClickPendingIntent(
          R.id.kairos_widget_ask,
          deepLink(context, 12, "kairos://ask"),
        )
        views.setOnClickPendingIntent(
          R.id.kairos_widget_root,
          deepLink(context, 10, "kairos://insight"),
        )
        manager.updateAppWidget(id, views)
      }
    }

    private fun deepLink(context: Context, requestCode: Int, uri: String): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      return PendingIntent.getActivity(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }
}
