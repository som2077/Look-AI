import React, { useCallback, useMemo } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { PlanCard } from "./PlanCard";
import type { SubscriptionPlan, SubscriptionPlanId } from "@/billing/types";

type BillingCycle = "monthly" | "yearly";

interface PlanListProps {
  plans: SubscriptionPlan[];
  activePlanId: SubscriptionPlanId | null;
  isPurchasing: boolean;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  billingCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
}

export const PlanList = React.memo(function PlanList({
  plans,
  activePlanId,
  isPurchasing,
  onSelectPlan,
  billingCycle,
  onCycleChange,
}: PlanListProps) {
  const filtered = useMemo(
    () => plans.filter((p) => p.billingCycle === billingCycle),
    [plans, billingCycle],
  );

  const onMonthly = useCallback(
    () => onCycleChange("monthly"),
    [onCycleChange],
  );
  const onYearly = useCallback(() => onCycleChange("yearly"), [onCycleChange]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pb-10"
    >
      {/* Billing cycle toggle */}
      <View className="flex-row bg-[#1D1A27] rounded-xl p-1 mb-6">
        <TouchableOpacity
          onPress={onMonthly}
          className={`flex-1 py-2 rounded-lg items-center ${
            billingCycle === "monthly" ? "bg-[#A78BFA]" : ""
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              billingCycle === "monthly" ? "text-white" : "text-[#8B8A9B]"
            }`}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onYearly}
          className={`flex-1 py-2 rounded-lg items-center ${
            billingCycle === "yearly" ? "bg-[#A78BFA]" : ""
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              billingCycle === "yearly" ? "text-white" : "text-[#8B8A9B]"
            }`}
          >
            Yearly
          </Text>
          {billingCycle !== "yearly" && (
            <Text className="text-[#22C55E] text-[10px] font-semibold mt-0.5">
              Save 30%
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Google Play badge */}
      <View className="flex-row items-center justify-center mb-6 gap-x-2">
        <View className="bg-[#1D1A27] px-3 py-1.5 rounded-full">
          <Text className="text-[#8B8A9B] text-xs">
            Payments secured by{" "}
            <Text className="text-white font-semibold">Google Play</Text>
          </Text>
        </View>
      </View>

      {filtered.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrentPlan={activePlanId === plan.id}
          isLoading={isPurchasing}
          onSelect={onSelectPlan}
        />
      ))}

      <Text className="text-[#4B4A5C] text-xs text-center mt-4 px-4">
        Subscriptions automatically renew unless cancelled at least 24 hours
        before the end of the current period. Manage or cancel via Google Play
        Store → Subscriptions.
      </Text>
    </ScrollView>
  );
});
