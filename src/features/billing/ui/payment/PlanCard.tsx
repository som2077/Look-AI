import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Check, Star, Zap } from "lucide-react-native";
import type { SubscriptionPlan } from "@/features/billing/model/types";

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
          ? "border-[#1D1A27] bg-[#ffffff] shadow-sm"
          : "border-[#EBECEF] bg-[#FBFBFC]"
      }`}
    >
      {isPopular ? (
        <View className="flex-row items-center mb-3">
          <Star size={14} color="#1D1A27" fill="#1D1A27" />
          <Text className="text-[#1D1A27] text-xs font-semibold ml-1">
            Most Popular
          </Text>
        </View>
      ) : null}

      {plan.savingsPercent ? (
        <View className="flex-row items-center mb-3">
          <Star size={14} color="#1D9E75" fill="#1D9E75" />
          <Text className="text-[#1D9E75] text-xs font-semibold ml-1">
            Save {plan.savingsPercent}%
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-[#1D1A27] text-xl font-bold">{plan.name}</Text>
        {isCurrentPlan ? (
          <View className="bg-[#1D9E75]/15 px-2 py-1 rounded-full">
            <Text className="text-[#1D9E75] text-xs font-semibold">Active</Text>
          </View>
        ) : null}
      </View>

      <Text className="text-[#8E8D98] text-sm mb-4">{plan.description}</Text>

      <View className="mb-1">
        <Text className="text-[#1D1A27] text-2xl font-bold">
          {plan.priceDisplay}
        </Text>
        {plan.yearlyMonthlyEquivalent ? (
          <Text className="text-[#8E8D98] text-xs mt-0.5">
            ~ {plan.yearlyMonthlyEquivalent} billed yearly
          </Text>
        ) : null}
      </View>

      <View className="my-5 gap-y-2">
        {plan.features.map((feature) => (
          <View key={feature} className="flex-row items-start">
            <Check size={15} color="#1D1A27" className="mt-0.5" />
            <Text className="text-[#4C4B5E] text-sm ml-2 flex-1">
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
            ? "bg-[#F0F0F5]"
            : isPopular
              ? "bg-[#1D1A27]"
              : "bg-[#FBFBFC] border border-[#1D1A27]"
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="#1D1A27" size="small" />
        ) : (
          <Text
            className={`text-sm font-semibold ${
              isCurrentPlan
                ? "text-[#8E8D98]"
                : isPopular
                  ? "text-[#ffffff]"
                  : "text-[#1D1A27]"
            }`}
          >
            {isCurrentPlan ? "Current Plan" : `Get ${plan.name}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});
