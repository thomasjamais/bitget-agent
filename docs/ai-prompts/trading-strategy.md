# 🎯 Prompt Spécialisé - Trading Strategy

## Système Prompt
```
Tu es un expert en trading algorithmique avec 15 ans d'expérience. 
Tu développes des stratégies de trading pour le bot Bitget existant.
Architecture: TypeScript/Node.js + Next.js dashboard.
Code existant: src/strategy/AggressiveDecisionEngine.ts
Objectif: Améliorer les performances sans casser l'existant.
```

## Contexte Prompt
```
Analyse le fichier {file_path} et propose des améliorations 
spécifiques avec code TypeScript prêt à implémenter.
```

## Template de Requête
```
Développe une stratégie de trading pour le bot Bitget:

Nom: {strategy_name}
Description: {strategy_description}
Symboles: {symbols}
Timeframes: {timeframes}
Direction: {direction}
Risk: {risk_parameters}

Architecture existante:
- AggressiveDecisionEngine: Moteur de décision agressif
- Enhanced AI Engine: IA avec analyse géopolitique
- Portfolio Balancer: Rééquilibrage automatique
- Risk Manager: Gestion des risques

Fournis:
1. Code TypeScript complet de la stratégie
2. Tests unitaires
3. Documentation technique
4. Intégration avec l'architecture existante
5. Métriques de performance attendues
6. Instructions de déploiement
```

## Exemples d'Utilisation

### Scalping 1-minute
```
Développe une stratégie de scalping 1-minute:

Nom: "BTC Scalping 1m"
Description: "Scalping sur Bitcoin avec signaux 1-minute"
Symboles: ["BTCUSDT"]
Timeframes: ["1m"]
Direction: "both"
Risk: { maxRiskPerTrade: 1.0, maxLeverage: 10, stopLoss: 0.5, takeProfit: 1.0 }

Fournis le code complet avec intégration dans AggressiveDecisionEngine.
```

### Momentum Trading
```
Développe une stratégie de momentum:

Nom: "Multi-Asset Momentum"
Description: "Suivi des tendances fortes sur plusieurs actifs"
Symboles: ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
Timeframes: ["5m", "15m", "1h"]
Direction: "both"
Risk: { maxRiskPerTrade: 2.0, maxLeverage: 5, stopLoss: 2.0, takeProfit: 4.0 }

Fournis le code complet avec confirmation multi-timeframe.
```

### Mean Reversion
```
Développe une stratégie de mean reversion:

Nom: "Bollinger Bands Reversion"
Description: "Retour à la moyenne sur Bollinger Bands"
Symboles: ["BTCUSDT", "ETHUSDT"]
Timeframes: ["15m", "1h"]
Direction: "both"
Risk: { maxRiskPerTrade: 1.5, maxLeverage: 3, stopLoss: 1.5, takeProfit: 3.0 }

Fournis le code complet avec indicateurs techniques.
```
