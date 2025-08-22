# APEX Fantasy Football League - League Hub

Welcome to the official website for the APEX Fantasy Football League! This is a comprehensive league management platform built for our 12-team fantasy football league.

## 🏈 League Overview

- **Teams**: 12 elite fantasy football managers
- **Scoring**: 0.5 PPR (Point Per Reception)
- **Platform**: ESPN Fantasy Football
- **Buy-in**: $125 per team
- **Season**: 2025 Fantasy Football Season

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd apexleague.bet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Alternative: Use the Makefile Commands

We've provided convenient Makefile commands for easy development:

- **`make install`** - Install all project dependencies
- **`make start`** - Start fresh development server with updated dependencies
- **`make stop`** - Stop the development server
- **`make build`** - Build the project for deployment

## 🌐 Deployment

### Quick Deployment

Use the automated deployment script:

```bash
./deploy.sh
```

This script will:
1. Install dependencies
2. Build the project
3. Commit and push the built files
4. Guide you through GitHub Pages setup

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Configure GitHub Pages**
   - Go to your repository Settings > Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/docs" folder
   - Click Save

3. **Deploy updates**
   ```bash
   npm run build
   git add docs/
   git commit -m "Update website"
   git push origin main
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📝 Updating Team Information

### How to Update Team Details

The team information is stored in a configuration file that's easy to edit without coding knowledge.

#### 1. Locate the Teams Configuration File

Open: `src/config/teams.ts`

#### 2. Find the Team You Want to Update

Each team is defined in a section that looks like this:

```typescript
{
  id: "il-duce",
  name: "IL DUCE",
  owner: "David Rasmussen",
  logo: "/tbd.jpg",
  ownerPhoto: "/commish.png",
  description: "The commissioner's squad, always grinding through the seasons.",
  ownerBlurb: "David Rasmussen, our fantasy football commish...",
  draftPosition: 10
}
```

#### 3. Update Team Information

Simply change the text between the quotes (`"..."`) for any field:

- **`name`**: Change the team name
- **`owner`**: Change the owner's name
- **`description`**: Update the team description (keep it concise)
- **`ownerBlurb`**: Update the owner's story (can be longer)
- **`draftPosition`**: Change the draft position number

#### 4. Update Team Photos and Logos

**For Team Logos:**
1. Add your logo image to the `public/` folder
2. Update the `logo` field in the configuration:
   ```typescript
   logo: "/your-team-logo.png"
   ```

**For Owner Photos:**
1. Add the photo to the `public/` folder
2. Update the `ownerPhoto` field:
   ```typescript
   ownerPhoto: "/owner-name-photo.jpg"
   ```

**Current Photo Examples:**
- David (Commissioner): `/commish.png`
- Brennan (Roster Integrity Chair): `/brennan.png`
- Cole (Roster Integrity Analyst): `/cole.png`
- Other owners: Currently use `/placeholder.svg`

#### 5. Save and Test

1. Save the `teams.ts` file
2. Run `make start` to see your changes locally
3. The website will automatically update to show your changes

### Example Updates

#### Changing a Team Name
```typescript
// Before
name: "Old Team Name",

// After
name: "New Team Name",
```

#### Adding a New Owner Photo
```typescript
// Before
ownerPhoto: "/placeholder.svg",

// After
ownerPhoto: "/kevin-photo.jpg",
```

#### Updating Team Description
```typescript
// Before
description: "A powerhouse team with strategic depth.",

// After
description: "A powerhouse team that dominates with explosive plays and strategic depth.",
```

## 🖼️ Image Guidelines

### Team Logos
- **Format**: PNG, JPG, or SVG
- **Size**: Recommended 200x200 pixels or larger
- **Style**: Square or circular logos work best
- **Placement**: Save in `public/` folder

### Owner Photos
- **Format**: JPG or PNG
- **Size**: Recommended 400x400 pixels or larger
- **Style**: Square photos work best (will be displayed as circles)
- **Placement**: Save in `public/` folder

## 📁 File Structure

```
public/
├── commish.png          # David's photo
├── brennan.png          # Brennan's photo
├── cole.png             # Cole's photo
├── tbd.jpg              # Placeholder for team logos
├── team-logos/          # Add team logos here
│   ├── il-duce.png
│   ├── big-mike.png
│   └── ...
└── owner-photos/        # Add more owner photos here
    ├── kevin-photo.jpg
    ├── henry-photo.jpg
    └── ...
```

## 🎯 Key Features

### Home Page
- **Draft Day Information**: Prominently displayed with Google Meet link
- **League Rules**: Complete rule set and regulations
- **Commissioner Section**: Meet David Rasmussen
- **Roster Integrity**: Brennan and Cole's oversight team

### Teams Page
- **Team Profiles**: Individual cards for each team
- **Owner Information**: Photos and personal stories
- **Draft Positions**: Current draft order
- **Team Descriptions**: Custom team narratives

### Keepers Page
- **Keeper Selections**: View and export keeper data
- **Year Toggle**: Switch between 2024 and 2025
- **CSV Export**: Download keeper data for analysis

### History Page
- **Championship History**: Past winners and records
- **Season Standings**: Final standings for each year
- **Collapsible Sections**: Easy navigation through years

## 🔧 Technical Details

### Built With
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library
- **Build Tool**: Vite for fast development
- **Icons**: Lucide React icon library

### Design System
- **Colors**: Black and gold theme (APEX branding)
- **Typography**: Clean, readable fonts
- **Layout**: Responsive design for all devices
- **Components**: Consistent styling across all pages

## 🚨 Troubleshooting

### Common Issues

**Images not showing:**
- Check that image paths start with `/`
- Verify images are in the `public/` folder
- Ensure file extensions match exactly

**Changes not appearing:**
- Save the `teams.ts` file
- Refresh your browser
- Check the browser console for errors

**Build errors:**
- Run `make install` to ensure dependencies are up to date
- Check that all quotes and commas are correct in the config file
- Verify TypeScript syntax is valid

### Getting Help

If you need assistance:
1. Check this README for common solutions
2. Review the `TEAMS_CONFIG_README.md` for detailed team configuration help
3. Contact the league commissioner or technical team

## 📅 Maintenance

### Regular Updates
- **Team Information**: Update as needed throughout the season
- **Draft Positions**: Update after draft order changes
- **Photos**: Add new owner photos as they become available
- **Content**: Keep team descriptions and blurbs current

### Before Each Season
- Update draft positions
- Review and update team descriptions
- Add new owner photos
- Update any rule changes
- Refresh keeper information

---

**APEX Fantasy Football League** - Where strategy meets competition! 🏆

*Last updated: August 2025*
