#!/usr/bin/env node

/**
 * AI Development Helper - Outil d'assistance au développement avec IA
 * Optimise l'interaction développeur-IA pour le bot Bitget
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIDevelopmentHelper {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPath = path.join(this.projectRoot, "docs/ai-config.json");
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
    return this.createDefaultConfig();
  }

  createDefaultConfig() {
    const defaultConfig = {
      ai: {
        provider: "openai",
        model: "gpt-4",
        temperature: 0.1,
        maxTokens: 4000,
      },
      project: {
        name: "Bitget Trading Bot",
        architecture: "TypeScript/Node.js + Next.js",
        mainFiles: [
          "src/index.ts",
          "src/ai/EnhancedAIEngine.ts",
          "src/strategy/AggressiveDecisionEngine.ts",
          "src/portfolio/PortfolioBalancer.ts",
          "web/src/app/",
        ],
      },
      prompts: {
        systemPrompt:
          "Tu es un expert en développement de bots de trading avec 15 ans d'expérience. Tu travailles sur le bot Bitget avec IA avancée, trading agressif et portfolio balancing automatique.",
        contextPrompt:
          "Architecture: TypeScript/Node.js + Next.js dashboard. Code existant optimisé pour trading haute fréquence avec IA géopolitique.",
      },
    };

    // Créer le fichier de configuration
    const configDir = path.join(this.projectRoot, "docs");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  /**
   * Génère un prompt optimisé pour l'analyse de code
   */
  generateCodeAnalysisPrompt(filePath) {
    const code = this.readFile(filePath);
    const context = this.getFileContext(filePath);

    return `
${this.config.prompts.systemPrompt}

${this.config.prompts.contextPrompt}

Analyse ce fichier: ${filePath}

Contexte du fichier:
${context}

Code:
\`\`\`typescript
${code}
\`\`\`

Fournis une analyse complète:
1. Structure actuelle et architecture
2. Points d'amélioration identifiés
3. Optimisations de performance possibles
4. Code TypeScript optimisé prêt à implémenter
5. Tests unitaires suggérés
6. Documentation à ajouter
7. Impact sur les autres composants

Format de réponse:
- Analyse: [analyse détaillée]
- Améliorations: [liste des améliorations]
- Code optimisé: [code TypeScript complet]
- Tests: [tests unitaires]
- Documentation: [documentation à ajouter]
- Impact: [impact sur l'architecture]
`;
  }

  /**
   * Génère un prompt pour le développement de fonctionnalités
   */
  generateFeatureDevelopmentPrompt(
    featureName,
    description,
    filesToModify = []
  ) {
    const context = this.getProjectContext();

    return `
${this.config.prompts.systemPrompt}

${this.config.prompts.contextPrompt}

Développe cette fonctionnalité: ${featureName}

Description: ${description}

Fichiers à modifier: ${filesToModify.join(", ")}

Contexte du projet:
${context}

Fournis:
1. Code TypeScript complet prêt à implémenter
2. Tests unitaires complets
3. Documentation technique
4. Instructions de déploiement
5. Impact sur l'architecture existante
6. Métriques de performance attendues

Format de réponse:
- Code: [code TypeScript complet]
- Tests: [tests unitaires]
- Documentation: [documentation technique]
- Déploiement: [instructions de déploiement]
- Impact: [impact sur l'architecture]
- Métriques: [métriques de performance]
`;
  }

  /**
   * Génère un prompt pour l'optimisation de performance
   */
  generatePerformanceOptimizationPrompt(
    componentName,
    currentMetrics,
    targetMetrics
  ) {
    const componentCode = this.getComponentCode(componentName);

    return `
${this.config.prompts.systemPrompt}

${this.config.prompts.contextPrompt}

Optimise ce composant: ${componentName}

Métriques actuelles: ${JSON.stringify(currentMetrics, null, 2)}
Objectifs: ${JSON.stringify(targetMetrics, null, 2)}

Code actuel:
\`\`\`typescript
${componentCode}
\`\`\`

Fournis:
1. Analyse des goulots d'étranglement
2. Solutions d'optimisation
3. Code optimisé
4. Métriques de validation
5. Tests de performance
6. Monitoring suggéré

Format de réponse:
- Analyse: [analyse des goulots d'étranglement]
- Solutions: [solutions d'optimisation]
- Code optimisé: [code optimisé]
- Métriques: [métriques de validation]
- Tests: [tests de performance]
- Monitoring: [monitoring suggéré]
`;
  }

  /**
   * Génère un prompt pour le debug et résolution de problèmes
   */
  generateDebugPrompt(problemDescription, errorLogs, expectedBehavior) {
    const relevantFiles = this.getRelevantFiles(problemDescription);
    const context = this.getProjectContext();

    return `
${this.config.prompts.systemPrompt}

${this.config.prompts.contextPrompt}

Problème: ${problemDescription}

Logs d'erreur:
\`\`\`
${errorLogs}
\`\`\`

Comportement attendu: ${expectedBehavior}

Fichiers concernés: ${relevantFiles.join(", ")}

Contexte du projet:
${context}

Fournis:
1. Analyse de la cause racine
2. Solution complète
3. Code corrigé
4. Tests de validation
5. Prévention de récurrence
6. Monitoring suggéré

Format de réponse:
- Cause: [analyse de la cause racine]
- Solution: [solution complète]
- Code: [code corrigé]
- Tests: [tests de validation]
- Prévention: [prévention de récurrence]
- Monitoring: [monitoring suggéré]
`;
  }

  /**
   * Génère un prompt pour la génération de tests
   */
  generateTestPrompt(filePath, testType = "unit") {
    const code = this.readFile(filePath);
    const context = this.getFileContext(filePath);

    return `
${this.config.prompts.systemPrompt}

${this.config.prompts.contextPrompt}

Génère des tests ${testType} pour: ${filePath}

Contexte:
${context}

Code:
\`\`\`typescript
${code}
\`\`\`

Fournis:
1. Tests unitaires complets
2. Tests d'intégration
3. Tests de performance
4. Mocks et stubs
5. Configuration de test
6. Couverture de test

Format de réponse:
- Tests unitaires: [tests unitaires]
- Tests intégration: [tests d'intégration]
- Tests performance: [tests de performance]
- Mocks: [mocks et stubs]
- Configuration: [configuration de test]
- Couverture: [couverture de test]
`;
  }

  /**
   * Génère un prompt pour la documentation
   */
  generateDocumentationPrompt(filePath, docType = "technical") {
    const code = this.readFile(filePath);
    const context = this.getFileContext(filePath);

    return `
${this.config.prompts.systemPrompt}

${this.config.prompts.contextPrompt}

Génère de la documentation ${docType} pour: ${filePath}

Contexte:
${context}

Code:
\`\`\`typescript
${code}
\`\`\`

Fournis:
1. Documentation technique complète
2. Exemples d'utilisation
3. API documentation
4. Guide de développement
5. Troubleshooting
6. Best practices

Format de réponse:
- Documentation: [documentation technique]
- Exemples: [exemples d'utilisation]
- API: [API documentation]
- Guide: [guide de développement]
- Troubleshooting: [troubleshooting]
- Best practices: [best practices]
`;
  }

  // Méthodes utilitaires
  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.projectRoot, filePath), "utf8");
    } catch (error) {
      return `Erreur lors de la lecture du fichier: ${error.message}`;
    }
  }

  getFileContext(filePath) {
    const context = {
      type: this.getFileType(filePath),
      purpose: this.getFilePurpose(filePath),
      dependencies: this.getFileDependencies(filePath),
      relatedFiles: this.getRelatedFiles(filePath),
    };

    return JSON.stringify(context, null, 2);
  }

  getProjectContext() {
    return {
      architecture: this.config.project.architecture,
      mainFiles: this.config.project.mainFiles,
      recentChanges: this.getRecentChanges(),
      currentIssues: this.getCurrentIssues(),
      nextSteps: this.getNextSteps(),
    };
  }

  getFileType(filePath) {
    if (filePath.includes("/ai/")) return "AI Engine";
    if (filePath.includes("/strategy/")) return "Trading Strategy";
    if (filePath.includes("/portfolio/")) return "Portfolio Management";
    if (filePath.includes("/risk/")) return "Risk Management";
    if (filePath.includes("/trading/")) return "Trading Execution";
    if (filePath.includes("/web/")) return "Dashboard Component";
    return "General Component";
  }

  getFilePurpose(filePath) {
    const purposes = {
      "src/index.ts": "Main bot entry point",
      "src/ai/EnhancedAIEngine.ts": "AI engine with geopolitical analysis",
      "src/strategy/AggressiveDecisionEngine.ts":
        "Aggressive trading decision engine",
      "src/portfolio/PortfolioBalancer.ts": "Automatic portfolio rebalancing",
      "src/risk/riskManager.ts": "Risk management and position sizing",
      "src/trading/executor.ts": "Trade execution and order management",
    };

    return purposes[filePath] || "Component functionality";
  }

  getFileDependencies(filePath) {
    // Analyse des imports pour déterminer les dépendances
    const code = this.readFile(filePath);
    const imports = code.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    return imports.map((imp) => imp.match(/['"]([^'"]+)['"]/)[1]);
  }

  getRelatedFiles(filePath) {
    // Détermine les fichiers liés basés sur la structure du projet
    const related = [];
    if (filePath.includes("/ai/")) {
      related.push("src/strategy/AggressiveDecisionEngine.ts");
      related.push("src/intelligence/NewsIntelligenceEngine.ts");
    }
    if (filePath.includes("/strategy/")) {
      related.push("src/ai/EnhancedAIEngine.ts");
      related.push("src/risk/riskManager.ts");
    }
    return related;
  }

  getRecentChanges() {
    try {
      const gitLog = execSync("git log --oneline -10", { encoding: "utf8" });
      return gitLog.split("\n").filter((line) => line.trim());
    } catch (error) {
      return ["Impossible de récupérer les changements récents"];
    }
  }

  getCurrentIssues() {
    // Analyse des TODOs et FIXMEs dans le code
    const issues = [];
    const files = this.getAllSourceFiles();

    files.forEach((file) => {
      const content = this.readFile(file);
      const todos = content.match(/TODO|FIXME|BUG/g) || [];
      if (todos.length > 0) {
        issues.push(`${file}: ${todos.length} issues`);
      }
    });

    return issues;
  }

  getNextSteps() {
    return [
      "Optimiser l'Enhanced AI Engine",
      "Améliorer le risk management",
      "Développer de nouvelles stratégies",
      "Optimiser le dashboard",
      "Ajouter des tests unitaires",
    ];
  }

  getAllSourceFiles() {
    const sourceFiles = [];
    const srcDir = path.join(this.projectRoot, "src");
    const webDir = path.join(this.projectRoot, "web/src");

    [srcDir, webDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir, sourceFiles);
      }
    });

    return sourceFiles;
  }

  scanDirectory(dir, files) {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, files);
      } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
        files.push(fullPath.replace(this.projectRoot + "/", ""));
      }
    });
  }

  getComponentCode(componentName) {
    const componentMap = {
      EnhancedAIEngine: "src/ai/EnhancedAIEngine.ts",
      AggressiveDecisionEngine: "src/strategy/AggressiveDecisionEngine.ts",
      PortfolioBalancer: "src/portfolio/PortfolioBalancer.ts",
      RiskManager: "src/risk/riskManager.ts",
    };

    const filePath = componentMap[componentName];
    if (filePath) {
      return this.readFile(filePath);
    }

    return "Composant non trouvé";
  }

  getRelevantFiles(problemDescription) {
    // Analyse la description du problème pour identifier les fichiers concernés
    const relevantFiles = [];

    if (
      problemDescription.toLowerCase().includes("ai") ||
      problemDescription.toLowerCase().includes("intelligence")
    ) {
      relevantFiles.push("src/ai/EnhancedAIEngine.ts");
    }
    if (
      problemDescription.toLowerCase().includes("trading") ||
      problemDescription.toLowerCase().includes("strategy")
    ) {
      relevantFiles.push("src/strategy/AggressiveDecisionEngine.ts");
    }
    if (
      problemDescription.toLowerCase().includes("portfolio") ||
      problemDescription.toLowerCase().includes("balance")
    ) {
      relevantFiles.push("src/portfolio/PortfolioBalancer.ts");
    }
    if (
      problemDescription.toLowerCase().includes("risk") ||
      problemDescription.toLowerCase().includes("safety")
    ) {
      relevantFiles.push("src/risk/riskManager.ts");
    }

    return relevantFiles.length > 0 ? relevantFiles : ["src/index.ts"];
  }
}

// Interface CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const helper = new AIDevelopmentHelper();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "analyze":
      if (args[0]) {
        console.log(helper.generateCodeAnalysisPrompt(args[0]));
      } else {
        console.log("Usage: node ai-development-helper.js analyze <file-path>");
      }
      break;

    case "feature":
      if (args[0] && args[1]) {
        console.log(
          helper.generateFeatureDevelopmentPrompt(
            args[0],
            args[1],
            args.slice(2)
          )
        );
      } else {
        console.log(
          "Usage: node ai-development-helper.js feature <name> <description> [files...]"
        );
      }
      break;

    case "optimize":
      if (args[0]) {
        const currentMetrics = {
          latency: "100ms",
          throughput: "1000/min",
          memory: "50MB",
        };
        const targetMetrics = {
          latency: "50ms",
          throughput: "2000/min",
          memory: "30MB",
        };
        console.log(
          helper.generatePerformanceOptimizationPrompt(
            args[0],
            currentMetrics,
            targetMetrics
          )
        );
      } else {
        console.log(
          "Usage: node ai-development-helper.js optimize <component-name>"
        );
      }
      break;

    case "debug":
      if (args[0] && args[1]) {
        console.log(
          helper.generateDebugPrompt(
            args[0],
            args[1],
            args[2] || "Expected behavior not specified"
          )
        );
      } else {
        console.log(
          "Usage: node ai-development-helper.js debug <problem> <error-logs> [expected-behavior]"
        );
      }
      break;

    case "test":
      if (args[0]) {
        console.log(helper.generateTestPrompt(args[0], args[1] || "unit"));
      } else {
        console.log(
          "Usage: node ai-development-helper.js test <file-path> [test-type]"
        );
      }
      break;

    case "docs":
      if (args[0]) {
        console.log(
          helper.generateDocumentationPrompt(args[0], args[1] || "technical")
        );
      } else {
        console.log(
          "Usage: node ai-development-helper.js docs <file-path> [doc-type]"
        );
      }
      break;

    default:
      console.log(`
AI Development Helper - Outil d'assistance au développement avec IA

Usage:
  node ai-development-helper.js analyze <file-path>           # Analyse de code
  node ai-development-helper.js feature <name> <description>  # Développement de fonctionnalité
  node ai-development-helper.js optimize <component>          # Optimisation de performance
  node ai-development-helper.js debug <problem> <logs>        # Debug et résolution
  node ai-development-helper.js test <file-path>              # Génération de tests
  node ai-development-helper.js docs <file-path>              # Génération de documentation

Exemples:
  node ai-development-helper.js analyze src/ai/EnhancedAIEngine.ts
  node ai-development-helper.js feature "Multi-timeframe analysis" "Add multi-timeframe signal confirmation"
  node ai-development-helper.js optimize EnhancedAIEngine
  node ai-development-helper.js debug "WebSocket connection drops" "Connection timeout error"
  node ai-development-helper.js test src/strategy/AggressiveDecisionEngine.ts
  node ai-development-helper.js docs src/portfolio/PortfolioBalancer.ts
      `);
  }
}

export default AIDevelopmentHelper;
