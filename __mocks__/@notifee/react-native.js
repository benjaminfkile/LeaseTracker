const AndroidImportance = { DEFAULT: 3, HIGH: 4, LOW: 2, MIN: 1, NONE: 0 };
const EventType = { DELIVERED: 3, PRESS: 1, ACTION_PRESS: 2, DISMISSED: 0 };

const notifee = {
  createChannel: jest.fn(() => Promise.resolve()),
  displayNotification: jest.fn(() => Promise.resolve()),
  cancelNotification: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
  getNotificationSettings: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
  onForegroundEvent: jest.fn(() => () => {}),
  onBackgroundEvent: jest.fn(),
  getBadgeCount: jest.fn(() => Promise.resolve(0)),
  setBadgeCount: jest.fn(() => Promise.resolve()),
};

module.exports = notifee;
module.exports.default = notifee;
module.exports.AndroidImportance = AndroidImportance;
module.exports.EventType = EventType;
