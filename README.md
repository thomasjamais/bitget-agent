# 🚀 Bitget Trading Bot - Architecture TypeScript

## 📋 **STATUT ACTUEL**

✅ **Bot fonctionnel** avec architecture TypeScript scalable  
✅ **Dashboard** opérationnel avec données réelles  
✅ **API REST** et WebSocket pour monitoring  
✅ **Configuration** optimisée pour production  

## 🚀 **DÉMARRAGE RAPIDE**

### 1. Configuration
```bash
# Copier le template de configuration
cp env.example .env

# Éditer .env avec vos credentials Bitget
nano .env

# Copier le template de configuration pour le dashboard
cp web/.env.example web/.env
```

### 2. Installation
```bash
npm install
```

### 3. Démarrage du Bot
```bash
./start-bot.sh
```

### 4. Démarrage du Dashboard (dans un autre terminal)
```bash
./start-dashboard.sh
```

## 📊 **INTERFACES DISPONIBLES**

- **Dashboard** : http://localhost:4000
- **API Status** : http://localhost:8080/api/bot/status
- **WebSocket** : ws://localhost:8080/ws

## 🏗️ **ARCHITECTURE TYPESCRIPT**

### Structure du projet
```
src/
├── ai/                    # Moteurs d'IA et confirmation
├── api/                   # Serveur WebSocket et API REST
├── config/                # Gestionnaire de configuration
├── exchanges/             # Intégration Bitget API
├── portfolio/             # Gestion de portefeuille
├── signals/               # Génération de signaux
├── trading/               # Exécution des trades
├── types/                 # Types TypeScript
└── simple-bot.ts         # Bot principal
```

### Fonctionnalités principales
- **TypeScript** : Type safety et scalabilité
- **AI Engine** : Confirmation IA avec 40% de poids décisionnel
- **Portfolio Management** : Équilibrage automatique
- **Risk Management** : Gestion des risques intégrée
- **Real-time Data** : Données de marché en temps réel

## 📈 **STRATÉGIES DE TRADING**

### 1. High-Frequency Scalping
- **Timeframe** : 1m, 3m
- **Leverage** : 25x
- **Risk** : 0.3% par trade
- **Target** : 0.6% profit

### 2. Mean Reversion avec IA
- **Timeframe** : 5m, 15m
- **Leverage** : 10x
- **Risk** : 0.5% par trade
- **Target** : 1.5% profit

### 3. Trend Following
- **Timeframe** : 15m, 30m
- **Leverage** : 5x
- **Risk** : 0.8% par trade
- **Target** : 3.0% profit

## 🎯 **OBJECTIFS DE PROFIT**

- **Quotidien** : 5%
- **Hebdomadaire** : 25%
- **Mensuel** : 100%

## 🔧 **CONFIGURATION**

Le fichier `config/production-bot.yaml` contient :
- Stratégies de trading optimisées
- Gestion des risques
- Configuration du portefeuille
- Paramètres IA

## 📊 **MONITORING**

### Dashboard
- Vue d'ensemble du portefeuille
- Métriques de trading
- Données de marché
- Historique des trades

### API Endpoints
- `GET /api/bot/status` : Statut du bot
- `WebSocket /ws` : Données temps réel

## 🚀 **ROADMAP DE DÉVELOPPEMENT**

### Phase 1 : Optimisation (Actuelle)
- ✅ Architecture TypeScript
- ✅ Dashboard fonctionnel
- ✅ API REST et WebSocket
- ✅ Configuration production

### Phase 2 : Amélioration IA
- [ ] Intégration modèles ONNX/TensorFlow
- [ ] Machine Learning avancé
- [ ] Prédictions de marché
- [ ] Optimisation automatique

### Phase 3 : Scalabilité
- [ ] Multi-exchange support
- [ ] Clustering de bots
- [ ] Monitoring avancé
- [ ] Alertes intelligentes

### Phase 4 : Production Avancée
- [ ] Déploiement cloud
- [ ] Monitoring 24/7
- [ ] Backup automatique
- [ ] Scaling horizontal

## 🛠️ **COMMANDES UTILES**

```bash
# Démarrer le bot (TERMINAL 1)
./start-bot.sh

# Démarrer le dashboard (TERMINAL 2)
./start-dashboard.sh

# Arrêter le bot
pkill -f "node.*simple-bot"

# Tester l'API
curl http://localhost:8080/api/bot/status

# Vérifier que le bot fonctionne
ps aux | grep "node.*simple-bot"

# Compiler le bot
npm run build

# Mode développement (bot + dashboard)
npm run dev:full
```

## 🔧 **RÉSOLUTION DE PROBLÈMES**

### CORS Dashboard
- ✅ **CORS configuré** pour http://localhost:4000
- ✅ **API fonctionnelle** sur http://localhost:8080
- ✅ **WebSocket** sur ws://localhost:8080/ws

### Bot complet restauré
- ✅ **Toutes les fonctionnalités** de l'ancienne version
- ✅ **AI Engine** avec confirmation
- ✅ **Portfolio Management** complet
- ✅ **Risk Management** intégré
- ✅ **Trading Strategies** optimisées
- ✅ **Trade Execution Fix** - Gestion automatique des erreurs de position unilatérale

### Correction des erreurs de trading
- ✅ **Erreur 40774 résolue** - "The order type for unilateral position must also be the unilateral position type"
- ✅ **Retry automatique** avec API de position unilatérale
- ✅ **Gestion d'erreurs** améliorée pour Bitget API

## ⚠️ **IMPORTANT**

- **Testez d'abord** avec `BITGET_ENVIRONMENT=testnet`
- **Surveillez** vos trades régulièrement
- **Ne risquez jamais** plus que vous ne pouvez perdre
- **Sauvegardez** votre configuration

## 📞 **SUPPORT**

Pour toute question ou problème :
1. Vérifiez les logs dans `logs/`
2. Testez l'API : `curl http://localhost:8080/api/bot/status`
3. Vérifiez la configuration dans `.env`

---

**🎯 Objectif : Bot de trading automatisé et profitable avec architecture TypeScript scalable**
