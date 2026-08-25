const fs = require('fs');
let file = fs.readFileSync('src/app/(root)/add-clothes/scan-result.tsx', 'utf8');

const applyFn = `const applyAiDataToState = (data: FullClothingAnalysis) => {
    setResult(data);
    const resolvedName =
      data.name ||
      \`\${data.color || data.primaryColor || ""} \${data.subCategory || data.category || "Item"}\`.trim();
    setName(resolvedName || "Wardrobe Item");
    
    // Normalize Category
    const normCat = MACRO_CATEGORIES.find(c => c.id.toLowerCase() === (data.category || "").toLowerCase())?.id || "Top";
    setCategory(normCat);
    
    // Normalize Subcategory
    const allowedSubcats = SUBCATEGORY_MAP[normCat] || SUBCATEGORY_MAP["Other"];
    const normSub = allowedSubcats.find(s => s.toLowerCase() === (data.subCategory || "").toLowerCase()) || allowedSubcats[0];
    setSubCategory(normSub);
    
    setColor(data.color || data.primaryColor || "Unknown");
    setColorHex(data.colorHex || "#1E3A8A");
    
    if (data.occasion && data.occasion.length > 0) {
      // Normalize occasions to match OCCASIONS_LIST
      const normOccasions = data.occasion.map(o => OCCASIONS_LIST.find(ol => ol.toLowerCase() === o.toLowerCase()) || o).filter(Boolean);
      setSelectedOccasions(normOccasions);
    }
    if (data.season && data.season.length > 0) {
      // Normalize seasons to match PRESET_SEASONS
      const normSeasons = data.season.map(s => PRESET_SEASONS.find(ps => ps.toLowerCase() === s.toLowerCase()) || s).filter(Boolean);
      setSelectedSeasons(normSeasons);
    }
    setBrand(data.brand && data.brand !== "Unknown" ? data.brand : "");
    setCareInstructions(data.careInstructions || "");
    setNotes(data.notes || "");
  };`;

file = file.replace(/const applyAiDataToState = \(data: FullClothingAnalysis\) => \{[\s\S]*?setNotes\(data\.notes \|\| ""\);\n  \};/, applyFn);

// Also fix the UI rendering for SUBCATEGORY_MAP
file = file.replace(/\(SUBCATEGORY_MAP\[category\] \|\| SUBCATEGORY_MAP\["Other"\]\)/g, 
  '(SUBCATEGORY_MAP[MACRO_CATEGORIES.find(c => c.id.toLowerCase() === category.toLowerCase())?.id || "Other"] || SUBCATEGORY_MAP["Other"])');

fs.writeFileSync('src/app/(root)/add-clothes/scan-result.tsx', file);
