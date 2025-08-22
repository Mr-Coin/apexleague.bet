.PHONY: install start stop

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
