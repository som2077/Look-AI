const fs = require('fs');
let file = fs.readFileSync('src/features/scanning/api/save-label.ts', 'utf8');

const validationCheck = `  addAppBreadcrumb('cloth_label', 'Started saving cloth label to database');
  
  if (analysis.is_valid_apparel === false) {
    console.warn("Attempted to save an invalid label. Aborting save.");
    return false;
  }
  
  try {`;
  
file = file.replace(/  addAppBreadcrumb\('cloth_label', 'Started saving cloth label to database'\);\n  try \{/, validationCheck);

fs.writeFileSync('src/features/scanning/api/save-label.ts', file);
console.log('Updated save-label.ts');
