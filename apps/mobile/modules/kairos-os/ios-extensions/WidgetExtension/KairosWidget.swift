import SwiftUI
import WidgetKit

struct KairosEntry: TimelineEntry {
  let date: Date
  let insight: String
}

struct KairosProvider: TimelineProvider {
  func placeholder(in context: Context) -> KairosEntry {
    KairosEntry(date: Date(), insight: "Capture something and Kairos will find patterns.")
  }

  func getSnapshot(in context: Context, completion: @escaping (KairosEntry) -> Void) {
    completion(current())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<KairosEntry>) -> Void) {
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
    completion(Timeline(entries: [current()], policy: .after(next)))
  }

  private func current() -> KairosEntry {
    let defaults = UserDefaults(suiteName: "group.com.kairos.mobile")
    let insight = defaults?.string(forKey: "insightText")
      ?? "Capture something and Kairos will find patterns."
    return KairosEntry(date: Date(), insight: insight)
  }
}

struct KairosWidgetView: View {
  var entry: KairosEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("KAIROS")
        .font(.caption2)
        .foregroundStyle(.secondary)
      Text("Today's insight")
        .font(.caption)
      Text(entry.insight)
        .font(.subheadline)
        .lineLimit(3)
      HStack {
        Link("+ Capture", destination: URL(string: "kairos://capture?source=WIDGET")!)
        Spacer()
        Link("Ask Kairos", destination: URL(string: "kairos://ask")!)
      }
      .font(.caption.weight(.semibold))
    }
    .widgetURL(URL(string: "kairos://insight"))
  }
}

@main
struct KairosWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "KairosWidget", provider: KairosProvider()) { entry in
      KairosWidgetView(entry: entry)
    }
    .configurationDisplayName("Kairos")
    .description("Capture, ask, and see today’s insight.")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}
