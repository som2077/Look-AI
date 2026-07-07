const fs = require("fs");
const path = require("path");

const basePath = "C:\\Users\\skynet\\Desktop\\look-ai\\app\\(root)\\add-clothes";

const files = [
  {
    name: "scan-result.tsx",
    type: "FullClothingAnalysis",
    fn: "analyzeClothingFull",
    param: "photoUri"
  },
  {
    name: "barcode-result.tsx",
    type: "BarcodeAnalysis",
    fn: "analyzeBarcodeImage",
    param: "photoUri" // barcode result might also use barcodeValue, but analyzeBarcodeImage takes photoUri
  },
  {
    name: "label-result.tsx",
    type: "LabelAnalysis",
    fn: "analyzeClothLabel",
    param: "photoUri"
  },
  {
    name: "fitcheck-result.tsx",
    type: "FitCheckAnalysis",
    fn: "analyzeFitCheck",
    param: "photoUri"
  }
];

files.forEach(({ name, type, fn }) => {
  const filePath = path.join(basePath, name);
  let content = fs.readFileSync(filePath, "utf8");
  
  // 1. Import the AI function
  if (!content.includes(fn)) {
    content = content.replace(`import { ${type} } from "@/lib/gemini-scan"`, `import { ${type}, ${fn} } from "@/lib/gemini-scan"`);
  }

  // 2. State replacement
  const resultDeclRegex = new RegExp(`const result: ${type} = \\(\\(\\) => \\{[\\s\\S]*?\\}\\)\\(\\)\\s*`, "g");
  
  const newState = `
  const [loading, setLoading] = useState(!params.resultJson)
  const [result, setResult] = useState<${type}>(() => {
    try {
      if (!params.resultJson) return DEFAULT_RESULT
      return JSON.parse(params.resultJson) as ${type}
    } catch {
      return DEFAULT_RESULT
    }
  })

  useEffect(() => {
    if (!params.resultJson && params.photoUri) {
      ${fn}(params.photoUri).then((data) => {
        setResult(data)
        setLoading(false)
        
        // Add to history after getting result
        addScan({
          type: "${name === 'scan-result.tsx' ? 'cloth' : name.replace('-result.tsx', '')}",
          thumbnail: params.photoUri ?? "",
          date: new Date().toISOString(),
          result: data as unknown as Record<string, unknown>,
          isFavorite: false,
        })
      })
    } else if (params.resultJson) {
      // Add to history immediately if already have result
      addScan({
        type: "${name === 'scan-result.tsx' ? 'cloth' : name.replace('-result.tsx', '')}",
        thumbnail: params.photoUri ?? "",
        date: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>,
        isFavorite: false,
      })
    }
  }, [])
`;

  content = content.replace(resultDeclRegex, newState);

  // 3. Remove original useEffect for historyAdded
  const useEffectRegex = /useEffect\(\(\) => \{\s*if \(historyAdded\.current\) return[\s\S]*?\}, \[\]\)\s*/;
  content = content.replace(useEffectRegex, "");

  // 4. Add Loading UI
  const returnRegex = /return \(\s*<View style=\{\{ flex: 1, backgroundColor: "#0F0E15" \}\}>\s*<StatusBar style="light" \/>/;
  
  const loadingUI = `
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E15", alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#7C6AFF" />
        <Text style={{ color: "#AAA", marginTop: 16, fontSize: 16, fontWeight: "600" }}>AI is analyzing...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E15" }}>
      <StatusBar style="light" />`;

  content = content.replace(returnRegex, loadingUI);
  
  // ensure ActivityIndicator is imported
  if (!content.includes("ActivityIndicator")) {
    content = content.replace("Image,", "ActivityIndicator,\n  Image,");
  }

  fs.writeFileSync(filePath, content, "utf8");
});

console.log("Done");
