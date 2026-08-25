const fs = require('fs');
let file = fs.readFileSync('src/app/(root)/add-clothes/form.tsx', 'utf8');
file = file.replace(
  'const [category,\n      subCategory, setCategory] = useState<string>(params.category ?? "top");',
  'const [category, setCategory] = useState<string>(params.category ?? "top");\n  const [subCategory, setSubCategory] = useState<string>("");'
);
fs.writeFileSync('src/app/(root)/add-clothes/form.tsx', file);
