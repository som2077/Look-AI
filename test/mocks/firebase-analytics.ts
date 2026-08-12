export const analytics = jest.fn(() => ({
  logScreenView: jest.fn(),
  setUserId: jest.fn(),
  logEvent: jest.fn(),
}));

export default analytics;
