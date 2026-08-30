/**
 * ChainOfThought — collapsible step list. Each step shows a status
 * icon (complete/active/pending), a label, and an optional
 * description. Used to show the AI's reasoning trace as discrete
 * steps (e.g. "Searched wardrobe", "Filtered by occasion").
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconLoader,
  IconCircle,
} from "@tabler/icons-react-native";
import { colors, font, FONT_FAMILY, radii, space } from "./theme";
import { Collapsible } from "./Collapsible";
import type { ChainOfThoughtStepStatus } from "./types";

export interface ChainOfThoughtStep {
  label: string;
  description?: string;
  status?: ChainOfThoughtStepStatus;
}

export interface ChainOfThoughtProps {
  title?: string;
  steps: ChainOfThoughtStep[];
  defaultOpen?: boolean;
}

export function ChainOfThought({
  title = "Chain of Thought",
  steps,
  defaultOpen = false,
}: ChainOfThoughtProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (!steps || steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.status === "complete").length;
  const label = `${title} · ${completedCount}/${steps.length}`;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
        accessibilityRole="button"
      >
        {open ? (
          <IconChevronDown size={14} color={colors.textMuted} />
        ) : (
          <IconChevronRight size={14} color={colors.textMuted} />
        )}
        <Text style={[styles.label, { fontFamily: FONT_FAMILY["600"] }]}>
          {label}
        </Text>
      </Pressable>
      <Collapsible open={open}>
        <View style={styles.body}>
          {steps.map((step, i) => (
            <ChainOfThoughtStep
              key={`${step.label}-${i}`}
              {...step}
              isLast={i === steps.length - 1}
            />
          ))}
        </View>
      </Collapsible>
    </View>
  );
}

export interface ChainOfThoughtStepProps extends ChainOfThoughtStep {
  isLast?: boolean;
}

export function ChainOfThoughtStep({
  label,
  description,
  status = "complete",
  isLast = false,
}: ChainOfThoughtStepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.iconCol}>
        <StepStatusIcon status={status} />
        {!isLast ? <View style={styles.connector} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: space.sm }}>
        <Text
          style={[
            styles.stepLabel,
            {
              fontFamily: FONT_FAMILY["500"],
              color:
                status === "pending" ? colors.textSubtle : colors.text,
            },
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={styles.stepDesc}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

function StepStatusIcon({ status }: { status: ChainOfThoughtStepStatus }) {
  if (status === "complete") {
    return (
      <View style={[styles.statusIcon, styles.statusComplete]}>
        <IconCheck size={10} color={colors.success} strokeWidth={3} />
      </View>
    );
  }
  if (status === "active") {
    return (
      <View style={[styles.statusIcon, styles.statusActive]}>
        <IconLoader size={10} color={colors.text} />
      </View>
    );
  }
  return (
    <View style={[styles.statusIcon, styles.statusPending]}>
      <IconCircle size={10} color={colors.textSubtle} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: space.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  label: {
    fontSize: font.small,
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  body: {
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: space.sm,
  },
  iconCol: {
    alignItems: "center",
    paddingTop: 2,
  },
  statusIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusComplete: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  statusPending: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
  },
  connector: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 2,
    marginBottom: -2,
  },
  stepLabel: {
    fontSize: font.small + 1,
  },
  stepDesc: {
    fontSize: font.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
