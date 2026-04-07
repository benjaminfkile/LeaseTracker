import WidgetKit
import SwiftUI

// MARK: - Shared constants

private let appGroupID = "group.org.reactjs.native.example.LeaseTracker"

// MARK: - Widget data model

struct WidgetData {
    let milesRemaining: Int
    let daysRemaining: Int
    let paceStatus: String  // "on-track" | "slightly-over" | "over-pace"
    let vehicleLabel: String

    static var placeholder: WidgetData {
        WidgetData(
            milesRemaining: 8_000,
            daysRemaining: 180,
            paceStatus: "on-track",
            vehicleLabel: "My Vehicle"
        )
    }

    static func load() -> WidgetData {
        let defaults = UserDefaults(suiteName: appGroupID)
        return WidgetData(
            milesRemaining: defaults?.integer(forKey: "widget_miles_remaining") ?? 0,
            daysRemaining: defaults?.integer(forKey: "widget_days_remaining") ?? 0,
            paceStatus: defaults?.string(forKey: "widget_pace_status") ?? "on-track",
            vehicleLabel: defaults?.string(forKey: "widget_vehicle_label") ?? "My Lease"
        )
    }
}

// MARK: - Timeline entry

struct LeaseEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Timeline provider

struct LeaseProvider: TimelineProvider {
    func placeholder(in context: Context) -> LeaseEntry {
        LeaseEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (LeaseEntry) -> Void) {
        completion(LeaseEntry(date: Date(), data: context.isPreview ? .placeholder : .load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LeaseEntry>) -> Void) {
        let entry = LeaseEntry(date: Date(), data: .load())
        // Refresh every 30 minutes
        let refresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

// MARK: - Pace status helpers

private func paceColor(for status: String) -> Color {
    switch status {
    case "over-pace":     return Color(red: 0.90, green: 0.24, blue: 0.24)
    case "slightly-over": return Color(red: 0.95, green: 0.60, blue: 0.07)
    default:              return Color(red: 0.20, green: 0.72, blue: 0.41)
    }
}

private func paceLabel(for status: String) -> String {
    switch status {
    case "over-pace":     return "Over Pace"
    case "slightly-over": return "Slightly Over"
    default:              return "On Track"
    }
}

// MARK: - Small widget view (pace status badge only)

struct SmallWidgetView: View {
    let entry: LeaseEntry

    var body: some View {
        let color = paceColor(for: entry.data.paceStatus)
        ZStack {
            color.opacity(0.10)
            VStack(spacing: 6) {
                Circle()
                    .fill(color)
                    .frame(width: 12, height: 12)
                Text(paceLabel(for: entry.data.paceStatus))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(color)
                    .multilineTextAlignment(.center)
                Text(entry.data.vehicleLabel)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            .padding()
        }
    }
}

// MARK: - Medium widget view (status + miles remaining + days to end)

struct MediumWidgetView: View {
    let entry: LeaseEntry

    var body: some View {
        let data = entry.data
        let color = paceColor(for: data.paceStatus)

        HStack(spacing: 0) {
            // Left column: pace status + vehicle label
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Circle()
                        .fill(color)
                        .frame(width: 10, height: 10)
                    Text(paceLabel(for: data.paceStatus))
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(color)
                }
                Spacer()
                Text(data.vehicleLabel)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            .padding()
            .frame(maxHeight: .infinity, alignment: .leading)

            Divider()
                .padding(.vertical, 12)

            // Right column: miles remaining + days left
            VStack(spacing: 14) {
                VStack(spacing: 2) {
                    Text("\(data.milesRemaining.formatted())")
                        .font(.system(size: 22, weight: .bold))
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text("mi remaining")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                VStack(spacing: 2) {
                    Text("\(data.daysRemaining)")
                        .font(.system(size: 22, weight: .bold))
                    Text("days to end")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
        }
    }
}

// MARK: - Entry view dispatcher

struct LeaseTrackerWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: LeaseEntry

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                SmallWidgetView(entry: entry)
            case .systemMedium:
                MediumWidgetView(entry: entry)
            default:
                SmallWidgetView(entry: entry)
            }
        }
        .applyWidgetBackground()
    }
}

// MARK: - iOS 17 container background compatibility

private extension View {
    @ViewBuilder
    func applyWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(.background, for: .widget)
        } else {
            self
        }
    }
}

// MARK: - Widget declaration

struct LeaseTrackerWidget: Widget {
    let kind: String = "LeaseTrackerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LeaseProvider()) { entry in
            LeaseTrackerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Lease Tracker")
        .description("Monitor your lease mileage at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Widget bundle

@main
struct LeaseTrackerWidgetBundle: WidgetBundle {
    var body: some Widget {
        LeaseTrackerWidget()
    }
}
