const MACRO_CATEGORIES = [
  { id: "Top", label: "👕 Top" },
  { id: "Bottom", label: "👖 Bottom" },
];

const SUBCATEGORY_MAP = {
  "Top": ["T-Shirt", "Shirt", "Polo Shirt"],
  "Bottom": ["Jeans", "Trousers", "Pants"],
  "Other": ["Other"]
};

let category = "top"; // What if AI returns lowercase?
let newSubCats = SUBCATEGORY_MAP[category] || SUBCATEGORY_MAP["Other"];
console.log("If lowercase:", newSubCats); // ["Other"]

// Fix:
const normalizedCat = Object.keys(SUBCATEGORY_MAP).find(k => k.toLowerCase() === category.toLowerCase()) || "Top";
console.log("If normalized:", SUBCATEGORY_MAP[normalizedCat]); // ["T-Shirt", ...]
