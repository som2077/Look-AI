export type MockCategoryId =
  | "top"
  | "bottoms"
  | "footwear"
  | "outerwear"
  | "dress"
  | "ethnic"
  | "accessory";

export interface MockClothingItem {
  id: string;
  name: string;
  category: MockCategoryId;
  color: string;
  bgColor: string;
  occasion: string;
  wears: number;
  isNew: boolean;
}

const BASE_MOCK_ITEMS: MockClothingItem[] = [
  {
    id: "1",
    name: "White Shirt",
    category: "top",
    color: "White",
    bgColor: "#F8F7FC",
    occasion: "Casual",
    wears: 8,
    isNew: false,
  },
  {
    id: "2",
    name: "Black Jeans",
    category: "bottoms",
    color: "Black",
    bgColor: "#F8F7FC",
    occasion: "Casual",
    wears: 5,
    isNew: false,
  },
  {
    id: "3",
    name: "Blue Kurta",
    category: "top",
    color: "Blue",
    bgColor: "#F8F7FC",
    occasion: "Casual",
    wears: 0,
    isNew: true,
  },
  {
    id: "4",
    name: "Sneakers",
    category: "footwear",
    color: "White",
    bgColor: "#F8F7FC",
    occasion: "Casual",
    wears: 12,
    isNew: false,
  },
  {
    id: "5",
    name: "Grey Blazer",
    category: "outerwear",
    color: "Grey",
    bgColor: "#F8F7FC",
    occasion: "Formal",
    wears: 0,
    isNew: true,
  },
  {
    id: "6",
    name: "Beige Chinos",
    category: "bottoms",
    color: "Beige",
    bgColor: "#F8F7FC",
    occasion: "Casual",
    wears: 0,
    isNew: true,
  },
];

const generateMockItems = (): MockClothingItem[] => {
  const items = [...BASE_MOCK_ITEMS];
  const categories: MockCategoryId[] = [
    "top",
    "bottoms",
    "footwear",
    "outerwear",
    "dress",
    "ethnic",
    "accessory",
  ];
  const names = [
    "Red T-Shirt",
    "Chino Pants",
    "Brown Boots",
    "Black Leather Jacket",
    "Summer Dress",
    "Sherwani",
    "Sunglasses",
    "Wool Scarf",
    "Silk Tie",
    "Running Shoes",
    "Jeans Jacket",
    "Cargo Shorts",
    "Hoodie",
    "Sweater",
  ];
  for (let i = 7; i <= 48; i++) {
    const category = categories[i % categories.length];
    const wears = i % 4 === 0 ? 0 : Math.floor((i * 3) % 15) + 1;
    items.push({
      id: String(i),
      name: `${names[i % names.length]} #${i}`,
      category,
      color: "Various",
      bgColor: "#F8F7FC",
      occasion: i % 2 === 0 ? "Casual" : "Formal",
      wears,
      isNew: wears === 0 && i % 3 === 0,
    });
  }
  return items;
};

export const MOCK_WARDROBE_ITEMS = generateMockItems();

const MOCK_BY_ID = new Map(
  MOCK_WARDROBE_ITEMS.map((item) => [item.id, item]),
);

export function getMockWardrobeItemById(
  id: string | undefined,
): MockClothingItem | undefined {
  if (!id) return undefined;
  return MOCK_BY_ID.get(id);
}
