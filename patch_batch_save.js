const fs = require('fs');
let file = fs.readFileSync('src/app/(root)/add-clothes/batch-scan.tsx', 'utf8');

const oldSave = `          notes: aiData.notes || "",
          colorHex: aiData.colorHex || "#000000",`;

const newSave = `          notes: aiData.notes || "",
          rating: aiData.rating ? parseInt(String(aiData.rating)) : 5,
          colorHex: aiData.colorHex || "#000000",`;

file = file.replace(oldSave, newSave);

const oldProcess = `const result = await analyzeClothingFull(item.originalUri);
        
        // If the AI rejects the image, we still mark success but flag it (or we could mark it failed).
        // Let's mark it success so the user sees the error inline.
        updateItem(item.id, {
          status: "success",
          data: result,
        });`;

const newProcess = `const result = await analyzeClothingFull(item.originalUri);
        
        if (result) {
          // Normalize Category and Subcategory
          const MACRO_CATEGORIES = [
            { id: "Top" }, { id: "Bottom" }, { id: "One-Piece" },
            { id: "Outerwear" }, { id: "Footwear" }, { id: "Accessories" }, { id: "Other" }
          ];
          const normCat = MACRO_CATEGORIES.find(c => c.id.toLowerCase() === (result.category || "").toLowerCase())?.id || "Top";
          result.category = normCat;
          
          const SUBCATEGORY_MAP = {
            "Top": ["T-Shirt", "Shirt", "Polo Shirt", "Blouse", "Tank Top", "Crop Top", "Sweater", "Hoodie", "Sweatshirt", "Cardigan", "Tunic", "Kurta"],
            "Bottom": ["Jeans", "Trousers", "Pants", "Chinos", "Shorts", "Skirt", "Leggings", "Joggers", "Sweatpants", "Cargo Pants"],
            "One-Piece": ["Dress", "Jumpsuit", "Romper", "Playsuit"],
            "Outerwear": ["Jacket", "Blazer", "Coat", "Trench Coat", "Puffer", "Vest", "Overcoat", "Leather Jacket", "Denim Jacket"],
            "Footwear": ["Sneakers", "Running Shoes", "Boots", "Sandals", "Heels", "Flats", "Loafers", "Formal Shoes", "Slippers", "Slides", "Mules"],
            "Accessories": ["Bag", "Backpack", "Belt", "Wallet", "Watch", "Sunglasses", "Hat", "Cap", "Scarf", "Gloves", "Tie", "Jewelry"],
            "Other": ["Other"]
          };
          const allowedSubcats = SUBCATEGORY_MAP[normCat] || SUBCATEGORY_MAP["Other"];
          const normSub = allowedSubcats.find(s => s.toLowerCase() === (result.subCategory || "").toLowerCase()) || allowedSubcats[0];
          result.subCategory = normSub;
          
          const OCCASIONS_LIST = ["Everyday", "Casual", "Work / Office", "Business", "Formal", "Semi-Formal", "Party", "Wedding", "Festive / Celebration", "Traditional / Cultural", "Date / Romantic", "Dinner", "Evening", "Night Out", "Travel", "Vacation / Resort", "Beach", "Outdoor", "Sports / Active", "Gym / Workout", "Lounge / Home", "School / University", "Interview", "Ceremony", "Religious / Spiritual", "Funeral / Memorial"];
          if (result.occasion && result.occasion.length > 0) {
            result.occasion = result.occasion.map(o => OCCASIONS_LIST.find(ol => ol.toLowerCase() === o.toLowerCase()) || o).filter(Boolean);
          }
          
          const PRESET_SEASONS = ["All Season", "Summer", "Winter", "Monsoon", "Spring", "Autumn"];
          if (result.season && result.season.length > 0) {
            result.season = result.season.map(s => PRESET_SEASONS.find(ps => ps.toLowerCase() === s.toLowerCase()) || s).filter(Boolean);
          }
        }
        
        updateItem(item.id, {
          status: "success",
          data: result,
        });`;

file = file.replace(oldProcess, newProcess);

fs.writeFileSync('src/app/(root)/add-clothes/batch-scan.tsx', file);
console.log('Patched batch-scan.tsx save and normalization logic');
