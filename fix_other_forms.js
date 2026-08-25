const fs = require('fs');
['src/app/(root)/cloth-details/[id].tsx', 'src/app/(root)/add-clothes/form.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\(SUBCATEGORY_MAP\[category\] \|\| SUBCATEGORY_MAP\["Other"\]\)/g, 
    '(SUBCATEGORY_MAP[CATEGORIES.find(c => c.id.toLowerCase() === category.toLowerCase())?.id || "Other"] || SUBCATEGORY_MAP["Other"])');
  fs.writeFileSync(file, content);
});
console.log('Fixed other forms');
