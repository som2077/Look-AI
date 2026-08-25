const fs = require('fs');
let file = fs.readFileSync('src/app/(root)/add-clothes/cloth-scan.tsx', 'utf8');

const oldSave = `addItem({
        id: itemId,
        userId: targetUserId,
        customName: formState.notes
          ? \`\${formState.color ? formState.color + " " : ""}\${formState.category || "Item"}\`
          : formState.brand
          ? \`\${formState.brand} \${formState.category || "Item"}\`
          : formState.category || "Item",
        brand: formState.brand,
        category: formState.category || "Top",
        primaryColor: formState.color,
        season: formState.season ? [formState.season] : ["All Season"],
        occasion: formState.occasion ? [formState.occasion] : ["Casual"],
        careInstructions: formState.careInstructions,
        notes: formState.notes,
        imageUrl: analysisResult.bg_removed_url || analysisResult.original_url,
        originalImageUrl: analysisResult.original_url,
        confidence: 0.95,
        source: "camera",
      });`;

const newSave = `addItem({
        id: itemId,
        userId: targetUserId,
        customName: formState.name || (formState.brand
          ? \`\${formState.brand} \${formState.category || "Item"}\`
          : formState.category || "Item"),
        brand: formState.brand,
        category: formState.category || "Top",
        subCategory: formState.subCategory || "Other",
        primaryColor: formState.color,
        season: formState.season ? [formState.season] : ["All Season"],
        occasion: formState.occasion ? (Array.isArray(formState.occasion) ? formState.occasion : [formState.occasion]) : ["Casual"],
        careInstructions: formState.careInstructions,
        notes: formState.notes,
        rating: formState.rating ? parseInt(String(formState.rating)) : 5,
        imageUrl: analysisResult.bg_removed_url || analysisResult.original_url,
        originalImageUrl: analysisResult.original_url,
        confidence: 0.95,
        source: "camera",
      });`;

file = file.replace(oldSave, newSave);

fs.writeFileSync('src/app/(root)/add-clothes/cloth-scan.tsx', file);
console.log('Patched cloth-scan.tsx');
