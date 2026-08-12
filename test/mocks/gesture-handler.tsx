import React from "react";

export const GestureHandlerRootView = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const gestureHandlerRootHOC = (Component: React.ComponentType) => Component;

export const PanGestureHandler = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const Swipeable = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const GestureDetector = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const Gesture = {
  Pan: () => ({
    onUpdate: jest.fn(),
    onEnd: jest.fn(),
    runOnJS: true,
  }),
};

export const State = {};
