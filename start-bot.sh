#!/bin/bash

# 🚀 BITGET TRADING BOT - SCRIPT DE DÉMARRAGE UNIQUE
# Architecture TypeScript scalable et production-ready

echo "🚀 Bitget Trading Bot - Démarrage"
echo "================================="

# Vérifier les credentials
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant !"
    echo "Créez un fichier .env avec vos credentials Bitget :"
    echo "BITGET_API_KEY=votre_cle"
    echo "BITGET_API_SECRET=votre_secret"
    echo "BITGET_API_PASSPHRASE=votre_passphrase"
    echo "BITGET_ENVIRONMENT=production"
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

# Nettoyer les processus existants
echo "🔧 Nettoyage des processus existants..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "Port 8080 libre"

# Compiler le bot TypeScript
echo "🔨 Compilation du bot TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur de compilation !"
    exit 1
fi

# Démarrer le bot
echo "🚀 Démarrage du bot..."
echo "📊 Dashboard: http://localhost:4000"
echo "🔗 API: http://localhost:8080/api/bot/status"
echo ""

CONFIG_PATH="./config/production-bot.yaml" npm run start:simple
