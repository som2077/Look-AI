import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { RotateCw, ShieldCheck, Settings2 } from "lucide-react-native";
import { PlanList } from "@/components/payment/PlanList";
import {
  useBillingStore,
  selectIsPremium,
  selectPlanName,
} from "@/billing/store";
import { SUBSCRIPTION_PLANS } from "@/billing/constants";
import type { SubscriptionPlan } from "@/billing/types";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const {
    entitlement,
    isLoading,
    isPurchasing,
    isRestoring,
    error,
    billingReady,
    initBilling,
    purchasePlan,
    restorePurchases,
    clearError,
  } = useBillingStore();

  const userId = user?.id ?? "";

  useEffect(() => {
    if (!userId) return;
    (async () => {
      await initBilling(userId, () => getToken());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (error) {
      Alert.alert("Billing Error", error, [
        { text: "OK", onPress: clearError },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const isPremium = selectIsPremium(entitlement);
  const planName = selectPlanName(entitlement);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!userId) return;
    const token = await getToken();
    if (!token) return;
    await purchasePlan(plan.id, userId, token);
  };

  const handleRestore = async () => {
    if (!userId) return;
    const token = await getToken();
    if (!token) return;
    await restorePurchases(userId, token);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F0C1A]">
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-white text-2xl font-bold">
            Choose Your Plan
          </Text>
          <Text className="text-[#8B8A9B] text-sm mt-1">
            {isPremium
              ? `Your plan: ${planName}`
              : "Upgrade to unlock all premium features"}
          </Text>
        </View>

        {/* Premium badge – taps through to manage screen */}
        {isPremium && (
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/manage-subscription" as never)
            }
            activeOpacity={0.75}
            className="flex-row items-center bg-[#A78BFA]/15 px-4 py-3 rounded-xl mb-5"
          >
            <ShieldCheck size={18} color="#A78BFA" />
            <Text className="text-[#A78BFA] text-sm font-semibold ml-2 flex-1">
              {planName} – Active
            </Text>
            <Settings2 size={15} color="#A78BFA" />
          </TouchableOpacity>
        )}

        {/* Loading state while billing initialises */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#A78BFA" size="large" />
            <Text className="text-[#8B8A9B] text-sm mt-4">Loading plans…</Text>
          </View>
        ) : (
          <PlanList
            plans={SUBSCRIPTION_PLANS}
            activePlanId={isPremium ? (entitlement?.planId ?? null) : null}
            isPurchasing={isPurchasing || !billingReady}
            onSelectPlan={handleSelectPlan}
            billingCycle={billingCycle}
            onCycleChange={setBillingCycle}
          />
        )}

        {/* Restore purchases */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring || isLoading}
          className="flex-row items-center justify-center py-3 mt-2"
        >
          {isRestoring ? (
            <ActivityIndicator color="#8B8A9B" size="small" />
          ) : (
            <>
              <RotateCw size={14} color="#8B8A9B" />
              <Text className="text-[#8B8A9B] text-sm ml-2">
                Restore Purchases
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
