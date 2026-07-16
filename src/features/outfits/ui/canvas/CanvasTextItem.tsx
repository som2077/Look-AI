import { IconArrowsDiagonal, IconTrash } from "@tabler/icons-react-native";
import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { CanvasItemData } from "./types";

export function CanvasTextItem({
  item,
  isActive,
  isPreview,
  onFocus,
  onDelete,
  onTextChange,
}: {
  item: CanvasItemData;
  isActive: boolean;
  isPreview: boolean;
  onFocus: (id: string) => void;
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const BOUND_X = 150;
  const BOUND_Y = 250;

  const panResponderItem = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
        onFocus(item.id);
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentX = (pan.x as any)._offset + gestureState.dx;
        const currentY = (pan.y as any)._offset + gestureState.dy;

        const boundedX = Math.max(-BOUND_X, Math.min(currentX, BOUND_X));
        const boundedY = Math.max(-BOUND_Y, Math.min(currentY, BOUND_Y));

        pan.setValue({
          x: boundedX - (pan.x as any)._offset,
          y: boundedY - (pan.y as any)._offset,
        });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  const panResponderResize = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scaleAnim.extractOffset();
        rotateAnim.extractOffset();
      },
      onPanResponderMove: (evt, gestureState) => {
        const initialX = 50;
        const initialY = 20;

        const currentX = initialX + gestureState.dx;
        const currentY = initialY + gestureState.dy;

        const initialDist = Math.sqrt(
          initialX * initialX + initialY * initialY,
        );
        const currentDist = Math.sqrt(
          currentX * currentX + currentY * currentY,
        );
        const scaleFactor = currentDist / initialDist;

        const baseScale = (scaleAnim as any)._offset || 1;
        const targetScale = baseScale * scaleFactor;
        const clampedScale = Math.max(0.3, Math.min(targetScale, 5));

        scaleAnim.setValue(clampedScale - baseScale);

        const initialAngle = Math.atan2(initialY, initialX);
        const currentAngle = Math.atan2(currentY, currentX);
        const angleDiff = (currentAngle - initialAngle) * (180 / Math.PI);
        rotateAnim.setValue(angleDiff);
      },
      onPanResponderRelease: () => {
        scaleAnim.flattenOffset();
        rotateAnim.flattenOffset();
      },
    }),
  ).current;

  const interpolatedRotate = rotateAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.canvasTextWrapper,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
            { rotate: interpolatedRotate },
          ],
          zIndex: item.zIndex,
        },
      ]}
    >
      <View {...panResponderItem.panHandlers} style={{ position: "relative" }}>
        <TextInput
          value={item.text}
          onChangeText={(val) => onTextChange(item.id, val)}
          pointerEvents="auto"
          onFocus={() => {
            onFocus(item.id);
          }}
          multiline
          placeholder={isActive ? "Type..." : ""}
          placeholderTextColor="#999"
          style={{
            fontSize: 24,
            color: item.color,
            fontWeight: item.fontWeight,
            textAlign: item.align,
            padding: 8,
            minWidth: 40,
            transform: [{ scaleX: item.flipValue }],
          }}
          underlineColorAndroid="transparent"
        />
        {isActive && (
          <>
            <View style={styles.boundingBox} pointerEvents="none" />
            <Pressable
              style={[
                styles.controlBadge,
                { top: -14, right: -14, zIndex: 10 },
              ]}
              onPress={() => onDelete(item.id)}
            >
              <IconTrash size={14} color="#EF4444" />
            </Pressable>
            <View
              {...panResponderResize.panHandlers}
              style={[
                styles.controlBadge,
                {
                  bottom: -14,
                  right: -14,
                  zIndex: 10,
                  backgroundColor: "#3B82F6",
                },
              ]}
            >
              <IconArrowsDiagonal size={14} color="#FFFFFF" />
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvasTextWrapper: {
    position: "absolute",
    left: "50%",
    top: "50%",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -20,
    marginTop: -20,
  },
  boundingBox: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 8,
  },
  controlBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
