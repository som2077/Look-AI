import React from "react";

const isSignedIn = process.env.TEST_SIGNED_IN === "true";

export const ClerkProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn,
    userId: isSignedIn ? "test-user" : null,
    getToken: jest.fn(async () => "test-token"),
    signOut: jest.fn(),
  };
}

export function useUser() {
  return {
    user: isSignedIn
      ? { id: "test-user", imageUrl: "", nickname: "Tester", fullName: "Tester" }
      : null,
  };
}

export function useSSO() {
  return { startSSOFlow: jest.fn() };
}

export const tokenCache = {
  getToken: jest.fn(),
  saveToken: jest.fn(),
};
