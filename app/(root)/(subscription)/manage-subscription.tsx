import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Crown,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react-native";
import { useBillingStatus } from "@/billing/hooks";
import { useBillingStore } from "@/billing/store";
import { FREE_FEATURES } from "@/billing/constants";

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: "Active", color: "#22C55E", bg: "bg-[#22C55E]/15" },
  grace_period: {
    label: "Grace Period",
    color: "#F59E0B",
    bg: "bg-[#F59E0B]/15",
  },
  pending: { label: "Pending", color: "#A78BFA", bg: "bg-[#A78BFA]/15" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "bg-[#EF4444]/15" },
  expired: { label: "Expired", color: "#6B7280", bg: "bg-[#6B7280]/15" },
  on_hold: { label: "On Hold", color: "#F59E0B", bg: "bg-[#F59E0B]/15" },
  paused: { label: "Paused", color: "#6B7280", bg: "bg-[#6B7280]/15" },
  inactive: { label: "Inactive", color: "#6B7280", bg: "bg-[#6B7280]/15" },
  free: { label: "Free", color: "#8B8A9B", bg: "bg-[#8B8A9B]/15" },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const billing = useBillingStatus();
  const { isRestoring, restorePurchases, refreshEntitlement } =
    useBillingStore();

  const userId = user?.id ?? "";

  const statusCfg =
    STATUS_CONFIG[billing.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.free;

  const handleRestore = useCallback(async () => {
    if (!userId) return;
    const token = await getToken();
    if (!token) return;
    await restorePurchases(userId, token);
  }, [userId, getToken, restorePurchases]);

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    const token = await getToken();
    if (!token) return;
    await refreshEntitlement(userId, token);
  }, [userId, getToken, refreshEntitlement]);

  const handleManageOnPlay = useCallback(() => {
    Linking.openURL(
      "https://play.google.com/store/account/subscriptions",
    ).catch(() => {});
  }, []);

  const handleUpgrade = useCallback(() => {
    router.push("/(root)/subscription" as never);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-[#0F0C1A]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text className="text-white text-2xl font-bold mb-1">
          Manage Subscription
        </Text>
        <Text className="text-[#8B8A9B] text-sm mb-6">
          View and manage your current plan
        </Text>

        {/* ── Grace period banner ── */}
        {billing.showGraceBanner && (
          <View className="flex-row items-start bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl px-4 py-3 mb-5 gap-3">
            <AlertTriangle size={18} color="#F59E0B" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-[#F59E0B] text-sm font-semibold">
                Payment issue – grace period active
              </Text>
              <Text className="text-[#F59E0B]/80 text-xs mt-0.5">
                Update your payment method on Google Play to keep your
                subscription.
                {billing.daysUntilGraceEnd !== null &&
                  billing.daysUntilGraceEnd > 0 &&
                  ` ${billing.daysUntilGraceEnd} day${billing.daysUntilGraceEnd === 1 ? "" : "s"} remaining.`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Expiry warning banner ── */}
        {billing.showExpiryWarning && (
          <View className="flex-row items-start bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-4 py-3 mb-5 gap-3">
            <Clock size={18} color="#EF4444" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-[#EF4444] text-sm font-semibold">
                Subscription expiring soon
              </Text>
              <Text className="text-[#EF4444]/80 text-xs mt-0.5">
                Your plan expires in {billing.daysUntilExpiry} day
                {billing.daysUntilExpiry === 1 ? "" : "s"} and will not renew
                automatically.
              </Text>
            </View>
          </View>
        )}

        {/* ── Current plan card ── */}
        <View className="bg-[#1D1A27] rounded-2xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Crown size={20} color="#A78BFA" />
              <Text className="text-white text-lg font-bold">
                {billing.planName}
              </Text>
            </View>
            {/* Status pill */}
            <View className={`px-3 py-1 rounded-full ${statusCfg.bg}`}>
              <Text
                className="text-xs font-semibold"
                style={{ color: statusCfg.color }}
              >
                {statusCfg.label}
              </Text>
            </View>
          </View>

          {/* Details rows */}
          <View className="gap-2">
            {billing.isActive && billing.daysUntilExpiry !== null && (
              <DetailRow
                icon={<CheckCircle2 size={15} color="#22C55E" />}
                label={
                  billing.isAutoRenewing
                    ? `Renews in ${billing.daysUntilExpiry} day${billing.daysUntilExpiry === 1 ? "" : "s"}`
                    : `Expires in ${billing.daysUntilExpiry} day${billing.daysUntilExpiry === 1 ? "" : "s"}`
                }
              />
            )}
            {billing.isCancelled && (
              <DetailRow
                icon={<XCircle size={15} color="#EF4444" />}
                label="Subscription cancelled – access until expiry"
              />
            )}
            {billing.isExpired && (
              <DetailRow
                icon={<XCircle size={15} color="#6B7280" />}
                label="Subscription has expired"
              />
            )}
            {billing.isPending && (
              <DetailRow
                icon={<Clock size={15} color="#A78BFA" />}
                label="Purchase pending – payment processing"
              />
            )}
            {billing.tier === "free" && (
              <DetailRow
                icon={<ShieldCheck size={15} color="#8B8A9B" />}
                label="Using free plan features"
              />
            )}
          </View>
        </View>

        {/* ── Free plan feature list (when not premium) ── */}
        {!billing.isActive && !billing.isGracePeriod && (
          <View className="bg-[#1D1A27] rounded-2xl p-5 mb-5">
            <Text className="text-[#8B8A9B] text-xs font-semibold uppercase tracking-widest mb-3">
              Free Plan Includes
            </Text>
            {FREE_FEATURES.map((f) => (
              <View key={f} className="flex-row items-center gap-2 mb-2">
                <CheckCircle2 size={14} color="#8B8A9B" />
                <Text className="text-[#8B8A9B] text-sm">{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Actions ── */}
        <View className="gap-3">
          {/* Upgrade / change plan */}
          <ActionButton
            label={
              billing.isActive || billing.isGracePeriod
                ? "Change Plan"
                : "Upgrade to Premium"
            }
            icon={<Crown size={18} color="#A78BFA" />}
            onPress={handleUpgrade}
            variant="primary"
          />

          {/* Manage on Google Play */}
          {(billing.isActive ||
            billing.isGracePeriod ||
            billing.isCancelled) && (
            <ActionButton
              label="Manage on Google Play"
              sublabel="Cancel, update payment, or pause"
              icon={<ExternalLink size={18} color="#8B8A9B" />}
              onPress={handleManageOnPlay}
              variant="secondary"
            />
          )}

          {/* Refresh status */}
          <ActionButton
            label="Refresh Status"
            sublabel="Sync latest subscription status"
            icon={<RefreshCw size={18} color="#8B8A9B" />}
            onPress={handleRefresh}
            variant="secondary"
          />

          {/* Restore purchases */}
          <ActionButton
            label="Restore Purchases"
            sublabel="Re-link a subscription from another device"
            icon={
              isRestoring ? (
                <ActivityIndicator size="small" color="#8B8A9B" />
              ) : (
                <RefreshCw size={18} color="#8B8A9B" />
              )
            }
            onPress={handleRestore}
            variant="secondary"
            disabled={isRestoring}
          />
        </View>

        {/* ── Legal footer ── */}
        <Text className="text-[#4B4A5B] text-xs text-center mt-8 leading-5">
          Subscriptions are billed through Google Play and can be managed in
          your Google Play account settings. By subscribing you agree to our
          Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DetailRow = React.memo(function DetailRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="text-[#8B8A9B] text-sm flex-1">{label}</Text>
    </View>
  );
});

const ActionButton = React.memo(function ActionButton({
  label,
  sublabel,
  icon,
  onPress,
  variant,
  disabled = false,
}: {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant: "primary" | "secondary";
  disabled?: boolean;
}) {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      className={`flex-row items-center px-4 py-4 rounded-xl ${
        isPrimary ? "bg-[#A78BFA]" : "bg-[#1D1A27]"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <View className="mr-3">{icon}</View>
      <View className="flex-1">
        <Text
          className={`font-semibold text-sm ${
            isPrimary ? "text-white" : "text-[#C4C0D4]"
          }`}
        >
          {label}
        </Text>
        {sublabel && (
          <Text className="text-[#8B8A9B] text-xs mt-0.5">{sublabel}</Text>
        )}
      </View>
      {!isPrimary && <ChevronRight size={16} color="#4B4A5B" />}
    </TouchableOpacity>
  );
});
