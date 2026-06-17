import React, { Component, ReactNode, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { create } from "zustand";
import {
  IconWifiOff,
  IconServer,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react-native";

// ─── Zustand Error Store ──────────────────────────────────────────────────────

interface ErrorState {
  isOffline: boolean;
  isServerError: boolean;
  hasCrash: boolean;
  crashMessage: string;
  setOffline: (offline: boolean) => void;
  setServerError: (serverError: boolean) => void;
  setCrash: (crash: boolean, message?: string) => void;
  resetAll: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  isOffline: false,
  isServerError: false,
  hasCrash: false,
  crashMessage: "",
  setOffline: (offline) => set({ isOffline: offline }),
  setServerError: (serverError) => set({ isServerError: serverError }),
  setCrash: (crash, message = "") => set({ hasCrash: crash, crashMessage: message }),
  resetAll: () => set({ isOffline: false, isServerError: false, hasCrash: false, crashMessage: "" }),
}));

// ─── ErrorStateView Overlays ───────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function ErrorStateView({ onRetry }: { onRetry: () => Promise<void> }) {
  const { isOffline, isServerError, resetAll } = useErrorStore();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.warn("Retry failed", err);
    } finally {
      setRetrying(false);
    }
  }, [onRetry, retrying]);

  if (!isOffline && !isServerError) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F8F7FC",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        paddingHorizontal: 24,
      }}
    >
      <StatusBar style="dark" />
      
      <View
        style={{
          width: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "#E2E2EA",
          padding: 24,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        {/* Rounded Icon Box */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isOffline ? "#EAE8FF" : "#FFF0F0",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {isOffline ? (
            <IconWifiOff size={28} color="#4C36F5" />
          ) : (
            <IconServer size={28} color="#EF4444" />
          )}
        </View>

        {/* Text descriptions */}
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27", textAlign: "center" }}>
          {isOffline ? "Connection Lost" : "Service Unavailable"}
        </Text>
        
        <Text
          style={{
            fontSize: 12,
            color: "#5A5A6A",
            textAlign: "center",
            marginTop: 8,
            lineHeight: 18,
            fontWeight: "500",
            paddingHorizontal: 12,
            marginBottom: 24,
          }}
        >
          {isOffline
            ? "It looks like you're offline. Please check your internet connection and try again."
            : "Our servers are currently experiencing issues or undergoing maintenance. We will be back online shortly."}
        </Text>

        {/* Action Button */}
        <Pressable
          onPress={handleRetry}
          disabled={retrying}
          style={({ pressed }) => ({
            width: "100%",
            height: 48,
            borderRadius: 14,
            backgroundColor: "#4C36F5",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: pressed || retrying ? 0.9 : 1,
          })}
        >
          {retrying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconRefresh size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                {isOffline ? "Retry Connection" : "Check Server Status"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── React Error Boundary ─────────────────────────────────────────────────────

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  public state: BoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught runtime layout error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#F8F7FC",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <StatusBar style="dark" />
          
          <View
            style={{
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: 28,
              borderWidth: 1,
              borderColor: "#E2E2EA",
              padding: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            {/* Warning icon badge */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#FEF6EC",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <IconAlertTriangle size={28} color="#B25E02" />
            </View>

            {/* Error header details */}
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1D1A27", textAlign: "center" }}>
              App Error Occurred
            </Text>
            
            <Text style={{ fontSize: 12, color: "#5A5A6A", textAlign: "center", marginTop: 8, fontWeight: "500" }}>
              A runtime layout error was intercepted in the styling engine.
            </Text>

            {/* Error Message Trace Box */}
            <View
              style={{
                width: "100%",
                backgroundColor: "#F1F1F5",
                borderRadius: 14,
                padding: 12,
                marginTop: 16,
                marginBottom: 24,
                maxHeight: 140,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={true}>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#EF4444",
                    lineHeight: 14,
                  }}
                >
                  {this.state.errorMessage || "Unknown rendering breakdown"}
                </Text>
              </ScrollView>
            </View>

            {/* Reset / Reload Button */}
            <Pressable
              onPress={this.handleReset}
              style={({ pressed }) => ({
                width: "100%",
                height: 48,
                borderRadius: 14,
                backgroundColor: "#4C36F5",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                Restart App View
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
