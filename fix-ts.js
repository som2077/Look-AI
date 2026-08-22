const fs = require('fs');

const replaceInFile = (filePath, replacements) => {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
};

replaceInFile('src/app/(root)/(ai-features)/look-ai.tsx', [
    ['<Sparkles ', '<IconSparkles '],
    ['</Sparkles>', '</IconSparkles>'],
    ['<Wind ', '<IconWind '],
    ['</Wind>', '</IconWind>'],
    ['<Droplets ', '<IconDroplets '],
    ['</Droplets>', '</IconDroplets>'],
    ['<Sun ', '<IconSun '],
    ['</Sun>', '</IconSun>'],
    ['<Footprints ', '<IconFootprints '],
    ['</Footprints>', '</IconFootprints>'],
    ['<Shirt ', '<IconShirt '],
    ['</Shirt>', '</IconShirt>'],
    ['<Watch ', '<IconWatch '],
    ['</Watch>', '</IconWatch>'],
    ['<ChevronLeft ', '<IconChevronLeft '],
    ['</ChevronLeft>', '</IconChevronLeft>']
]);

replaceInFile('src/app/(root)/(ai-features)/outfit-suggestion.tsx', [
    ['<Sparkles ', '<IconSparkles '],
    ['<Wind ', '<IconWind '],
    ['<Droplets ', '<IconDroplets '],
    ['<Sun ', '<IconSun '],
    ['IconStar', 'IconStar'] // Wait, where did I use FontAwesome5?
]);

replaceInFile('src/app/(root)/onboarding/gender.tsx', [
    ['<Mars ', '<IconGenderMale '],
    ['</Mars>', '</IconGenderMale>'],
    ['<Venus ', '<IconGenderFemale '],
    ['</Venus>', '</IconGenderFemale>']
]);

replaceInFile('src/app/(root)/onboarding/style-preference.tsx', [
    ['Footprints', 'IconFootprints'],
    ['Coffee', 'IconCoffee'],
    ['Briefcase', 'IconBriefcase'],
    ['Gem', 'IconDiamond'],
    ['Camera', 'IconCamera'],
    ['Feather', 'IconFeather'],
    ['Cloud', 'IconCloud'],
    ['Activity', 'IconActivity'],
    ['Shirt', 'IconShirt'],
    ['Scissors', 'IconScissors'],
    ['Moon', 'IconMoon'],
    ['GlassWater', 'IconGlass'],
    ['Sun', 'IconSun'],
    ['Cpu', 'IconCpu'],
    ['Tent', 'IconTent'],
    ['Umbrella', 'IconUmbrella'],
    ['Search', 'IconSearch'],
    ['Sparkles', 'IconSparkles']
]);

replaceInFile('src/app/(root)/onboarding/where-did-you-hear.tsx', [
    ['name={item.icon as any}', 'name={item.icon as any} /* fixed later */'] // it's using <IconStar name=... /> which doesn't exist
]);

replaceInFile('src/app/(root)/post/[id].tsx', [
    ['IconMoreHorizontal', 'IconDots'],
    ['IconGrid', 'IconLayoutGrid'],
    ['<ChevronLeft ', '<IconChevronLeft '],
    ['<Heart ', '<IconHeart '],
    ['<MessageCircle ', '<IconMessageCircle '],
    ['<Share2 ', '<IconShare '],
    ['<MoreHorizontal ', '<IconDots '],
    ['<Pin ', '<IconPin '],
    ['<Download ', '<IconDownload '],
    ['<Grid ', '<IconLayoutGrid ']
]);

replaceInFile('src/app/(root)/user/[id].tsx', [
    ['IconGrid', 'IconLayoutGrid'],
    ['IconLink2', 'IconLink'],
    ['<ChevronLeft ', '<IconChevronLeft '],
    ['<ArrowUpRight ', '<IconArrowUpRight '],
    ['<ArrowDownRight ', '<IconArrowDownRight '],
    ['<ArrowUpLeft ', '<IconArrowUpLeft '],
    ['<ArrowDownLeft ', '<IconArrowDownLeft '],
    ['<Link2 ', '<IconLink '],
    ['<Grid ', '<IconLayoutGrid ']
]);
