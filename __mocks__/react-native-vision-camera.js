const Camera = 'Camera';
const useCameraDevice = jest.fn(() => null);
const useCameraPermission = jest.fn(() => ({
  hasPermission: true,
  requestPermission: jest.fn(() => Promise.resolve(true)),
}));

module.exports = {
  Camera,
  useCameraDevice,
  useCameraPermission,
};
