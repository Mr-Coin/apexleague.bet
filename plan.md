# Team Badges Implementation Plan

## Overview
This document outlines the plan for implementing a badge system on the Teams page where each team can display various achievement and status badges on their team cards.

## Badge Definitions

| Badge Name | Description | Image Theme | Badge Color | Badge Assignments |
|------------|-------------|-------------|-------------|-------------------|
| **Toilet** | Got last place | Toilet icon | Brown/Red | Lohmar, Drigo |
| **Shotgun** | Shotgun'd after a bad week | Shotgun weapon icon | Orange/Yellow |
| **Champ** | Won a season. | Crown icon | Gold/Yellow | Gully (Won twice so he gets two badges) |
| **Double Up** | Won two seasons in a row. | Two trophies icon | Gold with special effects | Gully | 
| **Got Milk?** | Completed the Hot Ones punishment. | Milk Carton icon | Red/Orange | Lohmar |
| **Painted** | Completed the full body paint CFG punishment. | Paint brush or paint splatter icon | Multi-color | Drigo |
| **On Target** | Made the playoffs. | Target or playoff bracket icon | Blue/Green |
| **Judge** | Commissioner.  | Gavel or law related icon | Blue/Green | David |
| **Gestapo** | Roster Integrity advocate.  | Binoculars themed icon | Blue/Green | Cole , Brennan | 
| **Positive** | Finished a season with a positive record  | Plus (+) icon | Blue/Green | Gully, Olave Garden, IL Duce, Josh Downs, Geriatric Unit, Big Mike, Gully, Stu, Olave, Geriatric Unit, Dark Web  |

## Technical Implementation

### 1. Badge Component
- Create a reusable `Badge` component in `src/components/ui/badge.tsx`
- Each badge should display the icon and tooltip on hover
- Badges should be small (16x16px or similar compact size)
- Support for different badge colors using Tailwind CSS classes
- **No emojis** - use a simple icon package (Lucide React, Heroicons, or similar)

### 2. Badge Configuration
- Create a new configuration file: `src/config/badges.ts`
- Define badge metadata (name, description, icon, color, etc.)
- Make badges easily configurable and extensible

### 3. Team Badge Assignment
- Modify `src/config/teams.ts` to include a `badges` array for each team
- Each team can have multiple badges
- Badges should be displayed in a horizontal row on the team card
- Badges should be located beneath the Team Name and above the Owner's name
- **Badges should be centered** on the team card

### 4. Team Card Updates
- Update the team card component to display assigned badges
- Position badges prominently on the team card
- **Badges should wrap to multiple lines** for mobile compatibility
- If a player has more than one of the same badge, display a **superscript number** next to it (do not display duplicate badges)
- When the user hovers on a badge, or clicks on a badge, the badge description should appear
- **Badges can be displayed in any order** (no priority system needed)

### 5. Badge Assignments

 - Assign the badges according to the table. 
 - Assign the badges to the correct teams. 
 - do not assign badges to random teams
 - do not assign badges to a team if it has not been specified in the table. 

## File Structure Changes

```
src/
├── components/
│   ├── ui/
│   │   └── badge.tsx (new)
│   └── TeamsSection.tsx (modified)
├── config/
│   ├── badges.ts (new)
│   └── teams.ts (modified)
└── types/
    └── index.ts (modified - add badge types)
```

## Configuration Example

```typescript
// src/config/badges.ts
export const BADGES = {
  toilet: {
    id: 'toilet',
    name: 'Toilet',
    description: 'Got Last Place',
    icon: 'ToiletIcon', // Icon component from icon package
    color: 'brown',
    backgroundColor: 'bg-amber-100',
    textColor: 'text-amber-800'
  },
  // ... other badges
}

// src/config/teams.ts
export const TEAMS = [
  {
    id: 'team1',
    name: 'Team Name',
    // ... other team properties
    badges: ['champ', 'playoffs'] // Array of badge IDs
  }
]
```

## Implementation Steps

1. **Phase 1**: Create the Badge component and basic styling
2. **Phase 2**: Create the badges configuration file
3. **Phase 3**: Update the teams configuration to include badges
4. **Phase 4**: Modify the TeamsSection component to display badges
5. **Phase 5**: Test and refine the badge display
6. **Phase 6**: Add hover effects and tooltips

## Design Considerations

- Badges should be **small** (16x16px or similar compact size)
- Use **Tailwind CSS color classes** for consistent styling
- **No emojis** - use icon package components
- Badges should be **centered** on team cards
- **Badges should wrap to multiple lines** for mobile compatibility
- Use consistent sizing and spacing
- Ensure badges are accessible with proper alt text
- **Badges can be displayed in any order** (no priority system)
- Make badges responsive for mobile devices

## Future Enhancements

- Badge unlock animations
- Badge history tracking
- Badge filtering options
- Badge statistics page
- Custom badge creation for special events
