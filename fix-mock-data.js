const fs = require('fs');

let aiScanContent = fs.readFileSync('src/features/scanning/api/ai-scan.ts', 'utf8');

const replacement = `const fallbackData: FitCheckAnalysis = {
    fitScore: 85,
    ratingTitle: "Fallback Result",
    ratingSubtitle: "Unable to analyze completely.",
    silhouette: {
      bodyShape: "Balanced",
      waistBalance: "Standard Balance",
      topRatio: 50,
      bottomRatio: 50,
      explanation: "Fallback proportions.",
    },
    fitPrecision: {
      shoulderFit: { status: "Perfect", text: "N/A" },
      sleeveLength: { status: "Perfect", text: "N/A" },
      trouserBreak: { status: "Perfect", text: "N/A" },
    },
    colorTheory: {
      hexColors: ["#1D1A27", "#F9FAFB"],
      harmony: "Neutral",
      contrastExplanation: "Fallback contrast.",
    },
    styleCategory: {
      archetype: "Casual",
      trendScore: 50,
    },
    actionableFixes: [],
    outfitPieces: {
      top: null,
      bottom: null,
      footwear: null,
      accessories: null,
    },
  };

  const text = await callOpenAIVision(imageUri, FITCHECK_PROMPT, "fitcheck", 400);
  return parseJson<FitCheckAnalysis>(text, fallbackData);`;

aiScanContent = aiScanContent.replace(/const text = await callOpenAIVision\(imageUri, FITCHECK_PROMPT, "fitcheck", 400\);\s*return parseJson<FitCheckAnalysis>\(text, mockData\);/, replacement);

fs.writeFileSync('src/features/scanning/api/ai-scan.ts', aiScanContent, 'utf8');
