const fs = require('fs');
const path = require('path');

const walkSync = (dir, callback) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walkSync(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  }
};

walkSync(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace lucide-react-native with @tabler/icons-react-native
    if (content.includes('lucide-react-native')) {
        const regex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react-native["']/g;
        content = content.replace(regex, (match, iconsStr) => {
            const icons = iconsStr.split(',').map(s => s.trim()).filter(Boolean);
            const tablerIcons = icons.map(icon => {
                // map common lucide to tabler
                if (icon === 'FlipHorizontal2') return 'IconFlipHorizontal';
                if (icon === 'Type') return 'IconTypography';
                if (icon === 'Info') return 'IconInfoCircle';
                if (icon === 'Upload') return 'IconUpload';
                if (icon === 'X') return 'IconX';
                if (icon === 'Mars') return 'IconGenderMale';
                if (icon === 'Venus') return 'IconGenderFemale';
                if (icon === 'RotateCcw') return 'IconRefresh';
                if (icon === 'Lock') return 'IconLock';
                if (icon === 'ArrowLeft') return 'IconArrowLeft';
                if (icon === 'Check') return 'IconCheck';
                if (icon === 'Smile') return 'IconMoodSmile';
                if (icon === 'ChevronRight') return 'IconChevronRight';
                
                // Fallback: prefix with Icon
                return 'Icon' + icon;
            });
            return `import { ${tablerIcons.join(', ')} } from "@tabler/icons-react-native"`;
        });
        
        // Also replace usage in JSX
        const usageRegex = /<([A-Z][a-zA-Z0-9]*)\s/g;
        // Wait, JSX replacement is tricky without AST, but we know the specific icons
        const mapping = {
            'FlipHorizontal2': 'IconFlipHorizontal',
            'Type': 'IconTypography',
            'Info': 'IconInfoCircle',
            'Upload': 'IconUpload',
            'X': 'IconX',
            'Mars': 'IconGenderMale',
            'Venus': 'IconGenderFemale',
            'RotateCcw': 'IconRefresh',
            'Lock': 'IconLock',
            'ArrowLeft': 'IconArrowLeft',
            'Check': 'IconCheck',
            'Smile': 'IconMoodSmile',
            'ChevronRight': 'IconChevronRight'
        };
        for (const [lucide, tabler] of Object.entries(mapping)) {
            const tagRegex1 = new RegExp(`<${lucide}(\\s|>)`, 'g');
            const tagRegex2 = new RegExp(`</${lucide}>`, 'g');
            content = content.replace(tagRegex1, `<${tabler}$1`);
            content = content.replace(tagRegex2, `</${tabler}>`);
        }
        changed = true;
    }

    // Replace expo/vector-icons
    if (content.includes('@expo/vector-icons')) {
        const regex = /import\s+\{([^}]+)\}\s+from\s+["']@expo\/vector-icons["']/g;
        content = content.replace(regex, (match, iconsStr) => {
            return `// Removed @expo/vector-icons\nimport { IconStar } from "@tabler/icons-react-native"`;
        });
        
        // Replace usage of FontAwesome5 or Ionicons
        content = content.replace(/<FontAwesome5/g, '<IconStar');
        content = content.replace(/<\/FontAwesome5>/g, '</IconStar>');
        content = content.replace(/<Ionicons/g, '<IconStar');
        content = content.replace(/<\/Ionicons>/g, '</IconStar>');
        changed = true;
    }
    
    // Replace CryptoJS.SHA1 with Crypto.digestStringAsync
    if (content.includes('CryptoJS.SHA1') || content.includes('crypto-js')) {
        content = content.replace(/import CryptoJS from ["']crypto-js["'];?\n?/g, 'import * as Crypto from "expo-crypto";\n');
        // Because digestStringAsync is async, we have to await it. 
        // In cloudinary-upload.ts, it's used inside an async function.
        content = content.replace(/CryptoJS\.SHA1\((.*?)\)\.toString\(\)/g, 'await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, $1)');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
  }
});
