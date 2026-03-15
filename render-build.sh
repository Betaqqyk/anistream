#!/usr/bin/env bash
# Render Build Script
# ==================
# Runs during each deploy on Render

set -e

echo "📦 Installing dependencies..."
npm install

echo "🌱 Seeding database..."
npm run seed

echo "✅ Build complete!"
