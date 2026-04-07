#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataBridge, NSObject)

RCT_EXTERN_METHOD(
  updateWidgetData:(NSInteger)milesRemaining
  daysRemaining:(NSInteger)daysRemaining
  paceStatus:(NSString *)paceStatus
  vehicleLabel:(NSString *)vehicleLabel
)

@end
