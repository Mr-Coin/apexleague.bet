# Teams Configuration Guide

This guide explains how to update team information in the APEX Fantasy Football League website without needing to know how to code.

## What You Can Update

Each team has the following configurable fields:

- **Team Name**: The fantasy football team name
- **Owner Name**: The person who owns/manages the team
- **Team Logo**: An image file for the team logo
- **Owner Photo**: A photo of the team owner
- **Team Description**: A brief description of the team's style/approach
- **Owner Blurb**: A longer description about the team owner
- **Draft Position**: The team's draft position for the current year

## How to Update Teams

### 1. Edit the Configuration File

Open the file: `src/config/teams.ts`

### 2. Find the Team You Want to Update

Each team is defined in a section that looks like this:

```typescript
{
  id: "il-duce",
  name: "IL DUCE",
  owner: "David Rasmussen",
  logo: "/team-logos/il-duce.png",
  ownerPhoto: "/commish.png",
  description: "The commissioner's squad, always grinding through the seasons.",
  ownerBlurb: "David Rasmussen, our fantasy football commish...",
  draftPosition: 10
}
```

### 3. Update the Fields

Simply change the text between the quotes (`"..."`) for any field you want to update:

- **name**: Change the team name
- **owner**: Change the owner's name
- **description**: Update the team description
- **ownerBlurb**: Update the owner's story
- **draftPosition**: Change the draft position number

### 4. Update Images

For team logos and owner photos:

1. **Add the image file** to the `public/` folder
2. **Update the path** in the configuration:
   - Team logos: `logo: "/your-team-logo.png"`
   - Owner photos: `ownerPhoto: "/owner-photo.jpg"`

**Note**: Use the existing photos as examples:
- David's photo: `/commish.png`
- Brennan's photo: `/brennan.png`
- Cole's photo: `/cole.png`

### 5. Save and Deploy

After making changes:
1. Save the `teams.ts` file
2. Run `make start` to see your changes locally
3. Deploy to your hosting platform

## Example Updates

### Changing a Team Name
```typescript
// Before
name: "Old Team Name",

// After
name: "New Team Name",
```

### Adding a New Owner Photo
```typescript
// Before
ownerPhoto: "/placeholder.svg",

// After
ownerPhoto: "/kevin-photo.jpg",
```

### Updating Team Description
```typescript
// Before
description: "A powerhouse team with strategic depth.",

// After
description: "A powerhouse team that dominates the competition with strategic depth and explosive plays.",
```

## File Structure

```
public/
├── commish.png          # David's photo
├── brennan.png          # Brennan's photo
├── cole.png             # Cole's photo
├── team-logos/          # Add team logos here
│   ├── il-duce.png
│   ├── big-mike.png
│   └── ...
└── owner-photos/        # Add more owner photos here
    ├── kevin-photo.jpg
    ├── henry-photo.jpg
    └── ...
```

## Tips

- **Keep descriptions concise** - they appear in small cards
- **Use high-quality images** - logos and photos should be clear
- **Test locally first** - use `make start` to preview changes
- **Backup your changes** - save a copy before making major updates

## Need Help?

If you run into issues:
1. Check that all quotes and commas are correct
2. Make sure image paths start with `/`
3. Verify the file is saved with `.ts` extension
4. Try running `make start` to see any error messages

The website will automatically update to show your changes once the configuration file is saved and the site is refreshed!
