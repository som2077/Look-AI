export type CanvasItemType = "image" | "text";

export type CanvasItemData = {
  id: string;
  type: CanvasItemType;

  // Image props
  image?: string;

  // Text props
  text?: string;
  color?: string;
  fontWeight?: "400" | "700";
  align?: "left" | "center" | "right";

  // Shared props
  flipValue: number;
  zIndex: number;
};
