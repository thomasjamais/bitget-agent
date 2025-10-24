#!/bin/bash

# 🌐 DASHBOARD STARTUP SCRIPT
echo "🌐 Démarrage du Dashboard Bitget Trading Bot"
echo "============================================="

# Vérifier si le bot est en cours d'exécution
if ! curl -s http://localhost:8080/api/bot/status > /dev/null; then
    echo "❌ Le bot n'est pas en cours d'exécution !"
    echo "Démarrez d'abord le bot avec: ./start-bot.sh"
    exit 1
fi

# Vérifier si le dossier web existe
if [ ! -d "web" ]; then
    echo "❌ Dossier web manquant !"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "web/node_modules" ]; then
    echo "📦 Installation des dépendances du dashboard..."
    cd web && npm install && cd ..
fi

# Démarrer le dashboard
echo "🚀 Démarrage du dashboard..."
echo "📊 Dashboard: http://localhost:4000"
echo "🔗 Bot API: http://localhost:8080/api/bot/status"
echo ""

cd web && npm run dev
