const Purchases = {
  setLogLevel: jest.fn(),
  configure: jest.fn(),
  getOfferings: jest.fn(async () => ({ current: null })),
  getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
  logIn: jest.fn(async () => ({ customerInfo: null, created: false })),
  logOut: jest.fn(async () => ({ customerInfo: null })),
};

(Purchases as any).LOG_LEVEL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

export default Purchases;
