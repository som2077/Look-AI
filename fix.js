const fs = require('fs');
let file = fs.readFileSync('src/app/(root)/cloth-details/[id].tsx', 'utf8');
file = file.replace(
  'const [category,\n      subCategory, setCategory] = useState<string>(initialCategory);\n  const [subCategory, setSubCategory] = useState<string>(userItem?.subCategory ?? mockItem?.subCategory ?? "");',
  'const [category, setCategory] = useState<string>(initialCategory);\n  const [subCategory, setSubCategory] = useState<string>(userItem?.subCategory ?? "");'
);
fs.writeFileSync('src/app/(root)/cloth-details/[id].tsx', file);
