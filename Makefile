.PHONY: install start stop build deploy

# Default target
all: install

# Install all project dependencies
install:
	@echo "Installing project dependencies..."
	npm install
	@echo "Dependencies installed successfully!"

# Start the website locally with a fresh version
start:
	@echo "Starting fresh development server..."
	@echo "Stopping any running instances..."
	@-pkill -f "vite" || true
	@echo "Installing dependencies..."
	@make install
	@echo "Starting development server..."
	npm run dev

# Stop the currently running website instance
stop:
	@echo "Stopping development server..."
	@-pkill -f "vite" || true
	@echo "Development server stopped!"

# Build the project for deployment
build:
	@echo "Building project for deployment..."
	npm run build
	@echo "Build complete! Check the docs/ folder for deployment files."

# Deploy to GitHub Pages (build + commit + push)
deploy:
	@echo "🚀 Deploying to GitHub Pages..."
	@echo "📦 Installing dependencies..."
	@npm install
	@echo "🔨 Building project..."
	@npm run build
	@echo "📝 Checking git status..."
	@if git status --porcelain | grep -q "docs/"; then \
		echo "💾 Committing changes..."; \
		git add docs/; \
		git commit -m "Build for GitHub Pages deployment - $(shell date)"; \
		echo "🚀 Pushing to main branch..."; \
		git push origin main; \
		echo "✅ Deployment complete!"; \
		echo "🌐 Your site will be available at: https://[username].github.io/[repository-name]"; \
		echo "⏱️  It may take a few minutes for changes to appear."; \
	else \
		echo "📝 No changes in docs/ folder to commit."; \
		echo "💡 Run 'make build' first if you want to rebuild."; \
	fi
