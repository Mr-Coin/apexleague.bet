# Draft Configuration System

This document explains how to configure the draft notification and conclusion messages on the APEX Fantasy Football website.

## Configuration File

The draft configuration is located in `src/config/draft.ts`. This file contains all the settings for both the draft notification and draft conclusion sections.

## Configuration Options

### Main Toggle Settings

- `showDraftNotification`: Set to `true` to show the draft notification section (for upcoming drafts)
- `showDraftConclusion`: Set to `true` to show the draft conclusion header (for completed drafts)

### Draft Notification Settings

When `showDraftNotification` is `true`, the following settings control the draft notification:

- `title`: The main title (e.g., "Draft Day")
- `subtitle`: The subtitle (e.g., "APEX Fantasy Football Draft")
- `date`: The draft date (e.g., "Mon, Aug 25, 2025")
- `time`: The draft time (e.g., "7:30–9:00pm")
- `timezone`: The timezone (e.g., "(America/Chicago)")
- `meetLink`: The Google Meet link URL
- `meetLinkText`: The text for the meet link button

### Draft Conclusion Settings

When `showDraftConclusion` is `true`, the following settings control the draft conclusion header:

- `title`: The main title (e.g., "Draft Complete")
- `message`: The message text (e.g., "The 2025 Draft has officially concluded. Consult your ESPN Fantasy app for results.")

## Usage Examples

### For an Upcoming Draft

```typescript
export const DRAFT_CONFIG: DraftConfig = {
  showDraftNotification: true,
  showDraftConclusion: false,
  // ... rest of config
};
```

### For a Completed Draft

```typescript
export const DRAFT_CONFIG: DraftConfig = {
  showDraftNotification: false,
  showDraftConclusion: true,
  // ... rest of config
};
```

### For No Draft-Related Messages

```typescript
export const DRAFT_CONFIG: DraftConfig = {
  showDraftNotification: false,
  showDraftConclusion: false,
  // ... rest of config
};
```

## Styling

- **Draft Notification**: Uses the primary color scheme (blue/purple gradient)
- **Draft Conclusion**: Uses a green color scheme to indicate completion

## Future Use

This configuration system makes it easy to:
1. Turn on/off draft notifications for future seasons
2. Update draft information without modifying component code
3. Switch between draft notification and conclusion messages
4. Customize the appearance and content of draft-related messages

Simply update the configuration file and the changes will be reflected immediately on the website.
