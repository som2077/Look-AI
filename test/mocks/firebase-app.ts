// @react-native-firebase/app mock — avoids "Native module RNFBAppModule not found".
const app = {
  apps: [],
  initializeApp: jest.fn(),
};

export default app;
export const firebase = { app: jest.fn(() => app) };
