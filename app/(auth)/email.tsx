import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const getStartedLogo = require("@/assets/images/getStartedLogo.png");

type EmailFlow = "sign-in" | "sign-up";

const RESEND_COOLDOWN_SECONDS = 30;
const VERIFICATION_CODE_LENGTH = 6;

const formatMissingField = (field: string) =>
  field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getMissingFields = (resource: unknown) => {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "missingFields" in resource &&
    Array.isArray(resource.missingFields)
  ) {
    return resource.missingFields.filter(
      (field): field is string => typeof field === "string",
    );
  }

  return [];
};

const getProfileFromEmail = (emailAddress: string) => {
  const [localPart] = emailAddress.trim().split("@");
  const nameParts = localPart
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "Account";
  const username = localPart.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);

  return { firstName, lastName, username };
};

const getSupportedProfileUpdate = (
  missingFields: string[],
  emailAddress: string,
) => {
  const profile = getProfileFromEmail(emailAddress);
  const update: Record<string, string> = {};

  if (missingFields.includes("first_name")) {
    update.firstName = profile.firstName;
  }

  if (missingFields.includes("last_name")) {
    update.lastName = profile.lastName;
  }

  if (missingFields.includes("username")) {
    update.username = profile.username;
  }

  return update;
};

const getMissingRequirementsMessage = (missingFields: string[]) => {
  if (missingFields.length === 0) {
    return "Email verified, but this Clerk app requires another sign-up field.";
  }

  if (missingFields.includes("password")) {
    return "Passwordless email sign-up is not enabled in Clerk.";
  }

  return `Missing required field: ${missingFields
    .map(formatMissingField)
    .join(", ")}`;
};

const getIncompleteVerificationMessage = (
  flow: EmailFlow,
  status: string | null | undefined,
) => {
  if (flow === "sign-in") {
    switch (status) {
      case "needs_second_factor":
        return "This account requires a second verification step.";
      case "needs_new_password":
        return "This account requires a new password before sign-in can finish.";
      case "needs_first_factor":
        return "Code was accepted, but Clerk still needs a first sign-in factor.";
      case "needs_identifier":
        return "Please enter your email again and request a new code.";
      case "complete":
        return "Sign-in completed, but Clerk did not return a session.";
      default:
        return "Verification could not be completed.";
    }
  }

  switch (status) {
    case "abandoned":
      return "This sign-up attempt expired. Please request a new code.";
    case "complete":
      return "Email verified, but Clerk did not return a session.";
    default:
      return "Verification could not be completed.";
  }
};

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors) &&
    error.errors[0]?.message
  ) {
    return error.errors[0].message;
  }

  return "Something went wrong. Please try again.";
};

const getVerificationErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors)
  ) {
    const clerkError = error.errors[0];
    const code = clerkError?.code;
    const message = clerkError?.message;

    if (
      typeof code === "string" &&
      (code.includes("verification") || code.includes("code"))
    ) {
      return "Code expired or invalid.";
    }

    if (
      typeof message === "string" &&
      (message.toLowerCase().includes("code") ||
        message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("invalid"))
    ) {
      return "Code expired or invalid.";
    }
  }

  return getErrorMessage(error);
};

const isUnknownEmailError = (error: unknown) => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("errors" in error) ||
    !Array.isArray(error.errors)
  ) {
    return false;
  }

  const code = error.errors[0]?.code;

  return (
    typeof code === "string" &&
    (code.includes("identifier_not_found") ||
      code.includes("form_identifier_not_found"))
  );
};

export default function EmailAuthScreen() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [flow, setFlow] = useState<EmailFlow | null>(null);
  const [emailAddressId, setEmailAddressId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [error, setError] = useState("");
  const verifiedCode = useRef("");

  const isLoaded = isSignInLoaded && isSignUpLoaded;
  const hasSentCode = flow !== null;
  const isResendDisabled = resendSeconds > 0 || isSending || isVerifying;

  const activateSession = useCallback(
    async (sessionId: string) => {
      if (!setActive) {
        setError("Unable to activate session. Please try again.");
        return;
      }

      await setActive({ session: sessionId });
      router.replace("/(root)/(tabs)");
    },
    [router, setActive],
  );

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((seconds: number) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const resetCodeInput = () => {
    setCode("");
    verifiedCode.current = "";
  };

  const handleCodeChange = (value: string) => {
    const nextCode = value
      .replace(/\D/g, "")
      .slice(0, VERIFICATION_CODE_LENGTH);

    setCode(nextCode);
  };

  const sendCode = async () => {
    if (!isLoaded || isSending) {
      return;
    }

    setError("");
    resetCodeInput();
    setFlow(null);
    setEmailAddressId("");
    setIsSending(true);
    setResendSeconds(0);

    try {
      const signInAttempt = await signIn.create({
        identifier: email.trim(),
      });
      const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
        (factor: { strategy?: string; emailAddressId?: string }) =>
          factor.strategy === "email_code",
      );

      if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) {
        setError("Email code sign-in is not available for this account.");
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });
      setEmailAddressId(emailCodeFactor.emailAddressId);
      setFlow("sign-in");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (!isUnknownEmailError(err)) {
        setError(getErrorMessage(err));
        return;
      }

      try {
        await signUp.create({
          emailAddress: email.trim(),
        });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setFlow("sign-up");
        setResendSeconds(RESEND_COOLDOWN_SECONDS);
      } catch (signUpError) {
        setError(getErrorMessage(signUpError));
      }
    } finally {
      setIsSending(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || !flow || isResendDisabled) {
      return;
    }

    setError("");
    resetCodeInput();
    setIsSending(true);

    try {
      if (flow === "sign-in") {
        if (!emailAddressId) {
          setError("Unable to resend code. Please try again.");
          return;
        }

        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId,
        });
      } else {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      }

      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const verifyCode = async () => {
      if (
        !isLoaded ||
        !flow ||
        code.trim().length < VERIFICATION_CODE_LENGTH ||
        isVerifying
      ) {
        return;
      }

      const trimmedCode = code.trim();

      if (verifiedCode.current === trimmedCode) {
        return;
      }

      verifiedCode.current = trimmedCode;
      setError("");
      setIsVerifying(true);

      try {
        const result =
          flow === "sign-in"
            ? await signIn.attemptFirstFactor({
                strategy: "email_code",
                code: trimmedCode,
              })
            : await signUp.attemptEmailAddressVerification({
                code: trimmedCode,
              });

        const sessionId =
          result.createdSessionId ||
          (flow === "sign-in"
            ? signIn.createdSessionId
            : signUp.createdSessionId);

        if (sessionId) {
          await activateSession(sessionId);
          return;
        }

        if (flow === "sign-up" && result.status === "missing_requirements") {
          const missingFields = getMissingFields(result);
          const update = getSupportedProfileUpdate(missingFields, email);

          if (Object.keys(update).length > 0) {
            const updatedSignUp = await signUp.update(update);
            const updatedSessionId =
              updatedSignUp.createdSessionId || signUp.createdSessionId;

            if (updatedSessionId) {
              await activateSession(updatedSessionId);
              return;
            }

            if (updatedSignUp.status === "missing_requirements") {
              setError(
                getMissingRequirementsMessage(getMissingFields(updatedSignUp)),
              );
              return;
            }
          }

          setError(getMissingRequirementsMessage(getMissingFields(result)));
          return;
        }

        setError(getIncompleteVerificationMessage(flow, result.status));
      } catch (err) {
        setError(getVerificationErrorMessage(err));
      } finally {
        setIsVerifying(false);
      }
    };

    void verifyCode();
  }, [
    activateSession,
    code,
    email,
    flow,
    isLoaded,
    isVerifying,
    signIn,
    signUp,
  ]);

  return (
    <ScrollView
      className="flex-1 "
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 mt-12">
        {/* Logo */}
        <View className="items-center mt-12">
          <Image
            source={getStartedLogo}
            className="h-24 w-full"
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <Text className="text-center text-4xl font-bold leading-10 text-[#000000] mt-16 mb-16">
          Discover what to wear,{"\n"}instantly and effortlessly.
        </Text>

        {/* Subtext */}
        <Text className="text-center text-xl font-medium text-[#000000] mb-2">
          Enter your email address to get started
        </Text>

        {/* Email Input */}
        <TextInput
          className="w-full rounded-2xl bg-[#F2F4F7] text-center border border-[#D1D5DB] px-5 py-5 text-base text-[#000000]"
          placeholder="name@youremailaddress.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!hasSentCode && !isSending && !isVerifying}
        />

        {/* Continue Button */}
        <TouchableOpacity
          onPress={hasSentCode ? resendCode : sendCode}
          disabled={
            hasSentCode
              ? isResendDisabled
              : !email.trim() || isSending || isVerifying
          }
          className="w-full mt-3 rounded-2xl bg-[#1A1A1A] py-5 items-center"
        >
          {isSending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {hasSentCode
                ? resendSeconds > 0
                  ? `Resend Code (${resendSeconds}s)`
                  : "Resend Code"
                : "Continue"}
            </Text>
          )}
        </TouchableOpacity>

        {hasSentCode ? (
          <View>
            <Text className="text-center text-xl font-medium text-[#000000] mb-2 mt-6">
              Enter verification code we sent to your email...
            </Text>
            <TextInput
              className="w-full rounded-2xl text-center bg-[#F2F4F7] border border-[#D1D5DB] px-5 py-5 text-base text-[#000000]"
              placeholder="Verification code"
              placeholderTextColor="#9CA3AF"
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={VERIFICATION_CODE_LENGTH}
              autoCapitalize="none"
              editable={!isVerifying}
            />
            {isVerifying ? <ActivityIndicator color="#2563EB" /> : null}
          </View>
        ) : null}

        {error ? (
          <Text className="text-red-500 text-center mt-4">{error}</Text>
        ) : null}

        {/* Terms Text */}
        <Text className="mt-5 px-4 text-center text-sm leading-5 text-[#000000]">
          By continuing, you accept our{" "}
          <Text className="font-semibold text-[#000000] underline">
            Terms of Service
          </Text>{" "}
          and acknowledge our{" "}
          <Text className="font-semibold text-[#000000] underline">
            Privacy Policy
          </Text>
          . You can tap them to view details.
        </Text>
      </View>
    </ScrollView>
  );
}
