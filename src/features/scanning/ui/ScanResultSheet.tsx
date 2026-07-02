import React from "react"
import { Pressable, Text, View } from "react-native"

interface Chip {
  label: string
  value: string
  color?: string
}

interface Action {
  label: string
  onPress: () => void
  primary?: boolean
  danger?: boolean
  disabled?: boolean
}

interface ScanResultSheetProps {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  chips?: Chip[]
  actions?: Action[]
  children?: React.ReactNode
}

export function ScanResultSheet({
  title,
  subtitle,
  badge,
  badgeColor = "#7C6AFF",
  chips = [],
  actions = [],
  children,
}: ScanResultSheetProps) {
  return (
    <View
      style={{
        backgroundColor: "#161422",
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
      }}
    >
      {badge && (
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: badgeColor + "22",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: badgeColor,
          }}
        >
          <Text
            style={{
              color: badgeColor,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
          >
            {badge}
          </Text>
        </View>
      )}

      <Text
        style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginBottom: 4 }}
      >
        {title}
      </Text>

      {subtitle && (
        <Text style={{ color: "#888", fontSize: 13, marginBottom: 14 }}>
          {subtitle}
        </Text>
      )}

      {chips.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {chips.map((chip, i) => (
            <View
              key={i}
              style={{
                backgroundColor: (chip.color ?? "#7C6AFF") + "22",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: (chip.color ?? "#7C6AFF") + "66",
              }}
            >
              <Text style={{ color: "#AAA", fontSize: 11, fontWeight: "600" }}>
                {chip.label}
              </Text>
              <Text
                style={{
                  color: chip.color ?? "#7C6AFF",
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {chip.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {children}

      {actions.length > 0 && (
        <View style={{ gap: 10, marginTop: 16 }}>
          {actions.map((action, i) => (
            <Pressable
              key={i}
              onPress={action.onPress}
              disabled={action.disabled}
              style={{
                backgroundColor: action.disabled
                  ? "#1A1827"
                  : action.primary
                    ? "#7C6AFF"
                    : action.danger
                      ? "#FF4444"
                      : "#2A2840",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                opacity: action.disabled ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}
