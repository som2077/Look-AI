/* eslint-disable */
import { ExpoRoot } from "expo-router";
import { getMockContext } from "expo-router/build/testing-library/mock-config";
import React from "react";
import { act, create } from "react-test-renderer";

// Reproduce the "Couldn't find a navigation context" layout error.
// The AppErrorBoundary swallows the error into its error UI and logs it via
// console.error("Uncaught runtime layout error:", ...) — so we intercept that
// log to surface which component actually threw.
describe("router render", () => {
  it("renders the real route tree without navigation-context errors", () => {
    jest.useFakeTimers();
    process.env.EXPO_ROUTER_IMPORT_MODE = "sync";
    // RootLayout's connectivity check fires a HEAD fetch on mount; a never-
    // resolving fetch keeps it from ever setting offline/serverError state
    // (which would trip the act() warning and pollute the assertion output).
    global.fetch = jest.fn(() => new Promise(() => {})) as any;

    const errors: any[] = [];
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (String(args[0]).includes("Uncaught runtime layout error")) {
        errors.push(args);
      }
      originalError(...args);
    };

    try {
      const mockContext = getMockContext("./src/app");
      let renderer: any;
      act(() => {
        renderer = create(<ExpoRoot context={mockContext} location="/" />);
      });
      act(() => {
        jest.runAllTimers();
      });
      // Force any pending effects/errors to flush.
      act(() => {});
      act(() => {
        renderer?.unmount();
      });
    } catch (e: any) {
      errors.push(["THROWN", e.message, e.stack]);
    } finally {
      console.error = originalError;
    }

    if (errors.length > 0) {
      throw new Error(
        errors
          .map((e) =>
            e
              .map((x: any) =>
                typeof x === "string"
                  ? x
                  : x?.message ?? x?.toString?.() ?? String(x),
              )
              .join("\n"),
          )
          .join("\n\n================\n\n"),
      );
    }
  });
});
