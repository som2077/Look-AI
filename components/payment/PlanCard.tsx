import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Check, Star, Zap } from "lucide-react-native";
import type { SubscriptionPlan } from "@/billing/types";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

export const PlanCard = React.memo(function PlanCard({
  plan,
  isCurrentPlan,
  isLoading,
  onSelect,
}: PlanCardProps) {
  const isPopular = !!plan.isPopular;
  const handleSelect = useCallback(() => onSelect(plan), [onSelect, plan]);

  return (
    <View
      className={`rounded-2xl p-5 mb-4 border ${
        isPopular
          ? "border-[#A78BFA] bg-[#1D1A27]"
          : "border-[#2E2A3B] bg-[#161322]"
      }`}
    >
      {isPopular && (
        <View className="flex-row items-center mb-3">
          <Star size={14} color="#A78BFA" fill="#A78BFA" />
          <Text className="text-[#A78BFA] text-xs font-semibold ml-1">
            Most Popular
          </Text>
        </View>
      )}

      {plan.savingsPercent && (
        <View className="flex-row items-center mb-3">
          <Zap size={14} color="#22C55E" fill="#22C55E" />
          <Text className="text-[#22C55E] text-xs font-semibold ml-1">
            Save {plan.savingsPercent}%
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white text-xl font-bold">{plan.name}</Text>
        {isCurrentPlan && (
          <View className="bg-[#22C55E]/20 px-2 py-1 rounded-full">
            <Text className="text-[#22C55E] text-xs font-semibold">Active</Text>
          </View>
        )}
      </View>

      <Text className="text-[#8B8A9B] text-sm mb-4">{plan.description}</Text>

      <View className="mb-1">
        <Text className="text-white text-2xl font-bold">
          {plan.priceDisplay}
        </Text>
        {plan.yearlyMonthlyEquivalent && (
          <Text className="text-[#8B8A9B] text-xs mt-0.5">
            ≈ {plan.yearlyMonthlyEquivalent} billed yearly
          </Text>
        )}
      </View>

      <View className="my-5 gap-y-2">
        {plan.features.map((feature) => (
          <View key={feature} className="flex-row items-start">
            <Check size={15} color="#A78BFA" className="mt-0.5" />
            <Text className="text-[#C4C0D4] text-sm ml-2 flex-1">
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleSelect}
        disabled={isCurrentPlan || isLoading}
        className={`py-3.5 rounded-xl items-center justify-center ${
          isCurrentPlan
            ? "bg-[#2E2A3B]"
            : isPopular
              ? "bg-[#A78BFA]"
              : "bg-[#2E2A3B] border border-[#A78BFA]"
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text
            className={`text-sm font-semibold ${
              isCurrentPlan
                ? "text-[#8B8A9B]"
                : isPopular
                  ? "text-white"
                  : "text-[#A78BFA]"
            }`}
          >
            {isCurrentPlan ? "Current Plan" : `Get ${plan.name}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});
