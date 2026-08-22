const fs = require('fs');

const files = [
  'src/app/(root)/(ai-features)/look-ai.tsx',
  'src/app/(root)/create-outfit.tsx',
  'src/app/(root)/onboarding/full-length-pics.tsx',
  'src/app/(root)/onboarding/gender.tsx',
  'src/app/(root)/onboarding/setup-account.tsx',
  'src/app/(root)/onboarding/style-preference.tsx',
  'src/app/(root)/onboarding/trust.tsx',
  'src/app/(root)/post/[id].tsx',
  'src/app/(root)/user/[id].tsx',
  'src/features/onboarding/ui/onboarding/BackButton.tsx',
  'src/features/onboarding/ui/onboarding/BodyTypeCard.tsx',
  'src/features/onboarding/ui/onboarding/OnboardingHeader.tsx',
  'src/features/social/ui/TrendFeed.tsx'
];

const iconMap = {
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
  'ChevronRight': 'IconChevronRight',
  'ChevronLeft': 'IconChevronLeft',
  'Footprints': 'IconFootprints',
  'Coffee': 'IconCoffee',
  'Briefcase': 'IconBriefcase',
  'Gem': 'IconDiamond',
  'Camera': 'IconCamera',
  'Feather': 'IconFeather',
  'Cloud': 'IconCloud',
  'Activity': 'IconActivity',
  'Shirt': 'IconShirt',
  'Scissors': 'IconScissors',
  'Moon': 'IconMoon',
  'GlassWater': 'IconGlass',
  'Sun': 'IconSun',
  'Cpu': 'IconCpu',
  'Tent': 'IconTent',
  'Umbrella': 'IconUmbrella',
  'Search': 'IconSearch',
  'Sparkles': 'IconSparkles',
  'Droplets': 'IconDroplets',
  'Watch': 'IconWatch',
  'Wind': 'IconWind',
  'Heart': 'IconHeart',
  'MessageCircle': 'IconMessageCircle',
  'Share2': 'IconShare',
  'MoreHorizontal': 'IconDots',
  'Pin': 'IconPin',
  'Download': 'IconDownload',
  'Grid': 'IconLayoutGrid',
  'ArrowUpRight': 'IconArrowUpRight',
  'ArrowDownRight': 'IconArrowDownRight',
  'ArrowUpLeft': 'IconArrowUpLeft',
  'ArrowDownLeft': 'IconArrowDownLeft',
  'Link2': 'IconLink',
  'Maximize': 'IconMaximize',
  'Snowflake': 'IconSnowflake',
  'Disc': 'IconDisc',
  'BookOpen': 'IconBook',
  'Flame': 'IconFlame',
  'Glasses': 'IconEyeglass',
  'Minus': 'IconMinus'
};

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace lucide imports
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"];?/g;
  content = content.replace(importRegex, (match, p1) => {
    const icons = p1.split(',').map(s => s.trim()).filter(Boolean);
    const newIcons = icons.map(i => iconMap[i] || 'Icon' + i);
    return `import { ${newIcons.join(', ')} } from "@tabler/icons-react-native";`;
  });

  // Replace JSX tags
  for (const [lucide, tabler] of Object.entries(iconMap)) {
    // <IconName
    content = content.replace(new RegExp(`<${lucide}(\\s|>)`, 'g'), `<${tabler}$1`);
    // </IconName>
    content = content.replace(new RegExp(`</${lucide}>`, 'g'), `</${tabler}>`);
    // {IconName}
    content = content.replace(new RegExp(`(?<=[\\s{\\[(,:])${lucide}(?=[\\s}\\]),:])`, 'g'), tabler);
  }

  // Replace @expo/vector-icons
  content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]@expo\/vector-icons['"];?/g, 'import { IconStar } from "@tabler/icons-react-native";');
  content = content.replace(/<FontAwesome5([^>]*)>/g, '<IconStar$1>');
  content = content.replace(/<\/FontAwesome5>/g, '</IconStar>');
  content = content.replace(/<Ionicons([^>]*)>/g, '<IconStar$1>');
  content = content.replace(/<\/Ionicons>/g, '</IconStar>');
  
  // Clean up FontAwesome5 name prop by removing it since IconStar doesn't accept `name`
  content = content.replace(/<IconStar([^>]*)name=\{([^}]+)\}([^>]*)>/g, '<IconStar$1$3>');

  fs.writeFileSync(file, content, 'utf8');
}
