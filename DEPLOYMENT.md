# GitHub Pages Deployment Guide

This guide explains how to deploy the APEX Fantasy Football League website to GitHub Pages using the `/docs` folder approach.

## 🚀 Deployment Steps

### 1. Build the Project

First, build the project to generate the static files:

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build
```

This will create a `docs/` folder containing all the static files needed for the website.

### 2. Configure GitHub Pages

1. **Go to your GitHub repository**
2. **Click on "Settings"** tab
3. **Scroll down to "Pages"** section
4. **Under "Source"**, select **"Deploy from a branch"**
5. **Choose "main"** branch
6. **Select "/docs"** folder
7. **Click "Save"**

### 3. Commit and Push

```bash
# Add the docs folder to git
git add docs/

# Commit the changes
git commit -m "Build for GitHub Pages deployment"

# Push to main branch
git push origin main
```

### 4. Wait for Deployment

- GitHub will automatically deploy your site
- You'll see a green checkmark when deployment is complete
- Your site will be available at: `https://[username].github.io/[repository-name]`

## 🔧 Configuration Details

### Vite Configuration
The project is configured to:
- **Build to `/docs`** folder (specified in `vite.config.ts`)
- **Use relative paths** (`base: './'`) for proper GitHub Pages routing
- **Clean output** (`emptyOutDir: true`) on each build

### Build Output
The `docs/` folder will contain:
- `index.html` - Main entry point
- `assets/` - JavaScript, CSS, and other assets
- All static files needed for the website

## 📝 Updating the Website

### For Content Changes
1. **Edit the configuration files**:
   - `src/config/teams.ts` - Update team information
   - `src/config/proposals.ts` - Update proposals
2. **Test locally**: `npm run dev`
3. **Build and deploy**:
   ```bash
   npm run build
   git add docs/
   git commit -m "Update website content"
   git push origin main
   ```

### For Code Changes
1. **Make your changes** to the source code
2. **Test locally**: `npm run dev`
3. **Build and deploy**:
   ```bash
   npm run build
   git add docs/
   git commit -m "Update website code"
   git push origin main
   ```

## 🚨 Important Notes

### Base Path
- The website uses relative paths (`base: './'`)
- This ensures it works correctly in the `/docs` subfolder
- All internal links and assets will work properly

### Build Process
- **Always run `npm run build`** before deploying
- The `docs/` folder is **automatically generated** - don't edit it manually
- **Don't commit** the `docs/` folder to your repository (add it to `.gitignore` if you prefer)

### File Structure
```
your-repo/
├── src/                    # Source code
├── docs/                   # Built files (auto-generated)
├── public/                 # Static assets
├── vite.config.ts          # Build configuration
└── package.json            # Dependencies
```

## 🔍 Troubleshooting

### Common Issues

**Site not loading:**
- Check that GitHub Pages is enabled for the `/docs` folder
- Verify the build completed successfully
- Check the GitHub Actions tab for deployment status

**Assets not loading:**
- Ensure `base: './'` is set in `vite.config.ts`
- Verify all files are in the `docs/` folder
- Check browser console for 404 errors

**Routing issues:**
- GitHub Pages doesn't support client-side routing by default
- The current setup uses hash routing (`#home`, `#teams`, etc.) which works fine

### Getting Help

If you encounter issues:
1. Check the GitHub Pages documentation
2. Verify your repository settings
3. Check the build output in the `docs/` folder
4. Review the browser console for errors

## 🎯 Benefits of This Setup

- **Simple deployment** - Just push to main branch
- **Automatic builds** - GitHub handles the deployment
- **Easy updates** - Build locally and push
- **Professional hosting** - Free hosting with custom domain support
- **Version control** - All changes are tracked in git

---

**Your APEX Fantasy Football League website will be live and accessible to all league members once deployed!** 🏈
