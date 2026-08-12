// Load .env into process.env so modules that validate EXPO_PUBLIC_* vars work in jest.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
