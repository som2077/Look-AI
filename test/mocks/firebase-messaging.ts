// @react-native-firebase/messaging mock.
const messaging = jest.fn(() => ({
  getToken: jest.fn(async () => null),
  onMessage: jest.fn(() => () => {}),
  requestPermission: jest.fn(async () => 1),
  setBackgroundMessageHandler: jest.fn(),
}));

export default messaging;
