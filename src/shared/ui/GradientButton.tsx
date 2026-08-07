import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const GradientButton = ({
  title,
  onPress,
  style,
}: GradientButtonProps) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1, // infinite
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      {/* Outer wrapper to clip the rotating square */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Rotating Background */}
        <Animated.View style={[styles.rotatingBox, animatedStyle]}>
          <LinearGradient
            colors={["#ff00cc", "#000000", "#ff00cc", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      {/* Inner Solid Box that creates the border effect */}
      <View style={styles.innerBox}>
        <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    minWidth: 140,
    paddingHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#FFFFFF", // fallback
  },
  rotatingBox: {
    position: "absolute",
    // Must be large enough so the corners don't show when it rotates
    width: "300%",
    height: "600%",
    top: "-250%",
    left: "-100%",
  },
  innerBox: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: "#FFFFFF", // The inner background color matching the banner roughly
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
