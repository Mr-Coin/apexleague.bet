#!/bin/bash

# APEX Fantasy Football League - Deployment Script

echo "🏈 APEX Fantasy Football League - Deployment Script"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -d "docs" ]; then
    echo "❌ Error: Build failed. docs/ folder not found."
    exit 1
fi

echo "✅ Build successful! docs/ folder created."

# Check git status
if ! git status --porcelain | grep -q "docs/"; then
    echo "📝 No changes in docs/ folder to commit."
else
    echo "📝 Adding docs/ folder to git..."
    git add docs/
    
    echo "💾 Committing changes..."
    git commit -m "Build for GitHub Pages deployment - $(date)"
    
    echo "🚀 Pushing to main branch..."
    git push origin main
    
    echo "✅ Deployment complete!"
    echo "🌐 Your site will be available at: https://[username].github.io/[repository-name]"
    echo "⏱️  It may take a few minutes for changes to appear."
fi

echo ""
echo "🎯 Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Go to Settings > Pages"
echo "3. Select 'Deploy from a branch'"
echo "4. Choose 'main' branch and '/docs' folder"
echo "5. Click Save"
echo ""
echo "🏈 APEX Fantasy Football League website is ready for deployment!"
