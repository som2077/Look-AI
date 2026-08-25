const fs = require('fs');

// Patch cloth-details/[id].tsx
let details = fs.readFileSync('src/app/(root)/cloth-details/[id].tsx', 'utf8');

// 1. Add subCategory state
details = details.replace(
  'const [category, setCategory] = useState<string>(initialCategory);',
  'const [category, setCategory] = useState<string>(initialCategory);\n  const [subCategory, setSubCategory] = useState<string>(userItem?.subCategory ?? mockItem?.subCategory ?? "");'
);

// 2. Add subCategory to activeSheet
details = details.replace(
  '| "category"',
  '| "category"\n    | "subCategory"'
);

// 3. Add SubCategory row in form UI (right after Category)
details = details.replace(
  '{/* Color */}',
  `{/* SubCategory */}
            <Pressable
              onPress={() => openSheet("subCategory")}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, color: "#000000", fontWeight: "500" }}>Sub-Category</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 15, color: subCategory ? "#00000090" : "#D1D5DB", fontWeight: "500" }}>{subCategory || "Select"}</Text>
                <IconChevronDown size={18} color="#D1D5DB" />
              </View>
            </Pressable>
            {/* Color */}`
);

// 4. Update the save action to include subCategory
details = details.replace(
  'category,',
  'category,\n      subCategory,'
);

// 5. Replace CATEGORIES with MACRO_CATEGORIES and SUBCATEGORY_MAP
const cats = `const CATEGORIES = [
  { id: "Top", label: "Top" },
  { id: "Bottom", label: "Bottom" },
  { id: "One-Piece", label: "One-Piece" },
  { id: "Outerwear", label: "Outerwear" },
  { id: "Footwear", label: "Footwear" },
  { id: "Accessories", label: "Accessories" },
  { id: "Other", label: "Other" },
];

const SUBCATEGORY_MAP: Record<string, string[]> = {
  "Top": ["T-Shirt", "Shirt", "Polo Shirt", "Blouse", "Tank Top", "Crop Top", "Sweater", "Hoodie", "Sweatshirt", "Cardigan", "Tunic", "Kurta"],
  "Bottom": ["Jeans", "Trousers", "Pants", "Chinos", "Shorts", "Skirt", "Leggings", "Joggers", "Sweatpants", "Cargo Pants"],
  "One-Piece": ["Dress", "Jumpsuit", "Romper", "Playsuit"],
  "Outerwear": ["Jacket", "Blazer", "Coat", "Trench Coat", "Puffer", "Vest", "Overcoat", "Leather Jacket", "Denim Jacket"],
  "Footwear": ["Sneakers", "Running Shoes", "Boots", "Sandals", "Heels", "Flats", "Loafers", "Formal Shoes", "Slippers", "Slides", "Mules"],
  "Accessories": ["Bag", "Backpack", "Belt", "Wallet", "Watch", "Sunglasses", "Hat", "Cap", "Scarf", "Gloves", "Tie", "Jewelry"],
  "Other": ["Other"]
};
`;
details = details.replace(/const CATEGORIES: \{ id: CategoryId; label: string \}.*?\];/s, cats);

// 6. Fix Bottom Sheet for SubCategory
const subCatSheet = `
                      {activeSheet === "subCategory" &&
                        (SUBCATEGORY_MAP[category] || SUBCATEGORY_MAP["Other"]).map((subCat) => (
                          <Pressable
                            key={subCat}
                            onPress={() => {
                              setSubCategory(subCat);
                              closeSheet();
                            }}
                            style={{
                              flexDirection: "row", alignItems: "center", justifyContent: "center",
                              paddingVertical: 14, borderRadius: 16, marginBottom: 8,
                              backgroundColor: subCategory === subCat ? "#1D1A27" : "#fff",
                              borderWidth: 1, borderColor: subCategory === subCat ? "#1D1A27" : "#E5E7EB",
                            }}
                          >
                            <Text style={{ color: subCategory === subCat ? "#fff" : "#6B7280", fontSize: 14, fontWeight: "500" }}>
                              {subCat}
                            </Text>
                          </Pressable>
                        ))}
                      {activeSheet === "season"`;
details = details.replace('{activeSheet === "season"', subCatSheet);

// 7. Fix category display in Category button
details = details.replace(
  '{category === "top"\n                    ? "Tops > Shirt"\n                    : (CATEGORIES.find((c) => c.id === category)?.label ??\n                      category)}',
  '{CATEGORIES.find((c) => c.id === category)?.label ?? category}'
);

fs.writeFileSync('src/app/(root)/cloth-details/[id].tsx', details);
console.log('Patched cloth-details/[id].tsx');
