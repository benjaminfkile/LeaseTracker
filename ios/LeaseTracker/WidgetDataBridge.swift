import Foundation
import WidgetKit

/// Native module that writes lease summary data to the shared App Group UserDefaults
/// so the WidgetKit extension can read it without any network call.
@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {

  private let appGroupID = "group.org.reactjs.native.example.LeaseTracker"

  @objc
  func updateWidgetData(
    _ milesRemaining: NSInteger,
    daysRemaining: NSInteger,
    paceStatus: String,
    vehicleLabel: String
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
    defaults.set(milesRemaining, forKey: "widget_miles_remaining")
    defaults.set(daysRemaining,  forKey: "widget_days_remaining")
    defaults.set(paceStatus,     forKey: "widget_pace_status")
    defaults.set(vehicleLabel,   forKey: "widget_vehicle_label")
    defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: "widget_updated_at")
    defaults.synchronize()

    WidgetCenter.shared.reloadAllTimelines()
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
