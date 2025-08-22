# Proposals Configuration Guide

This guide explains how to update proposal information in the APEX Fantasy Football League website without needing to know how to code.

## What You Can Update

Each proposal has the following configurable fields:

- **Title**: The name of the proposal
- **Description**: Detailed explanation of what the proposal entails
- **Status**: Current status (active, passed, failed)
- **Proposed By**: Who submitted the proposal
- **Proposed Date**: When the proposal was submitted
- **Voting Deadline**: When voting ends
- **Category**: Type of proposal (rule-change, format-change, league-expansion, other)
- **Comments**: Discussion and feedback from league members

## How to Update Proposals

### 1. Edit the Configuration File

Open the file: `src/config/proposals.ts`

### 2. Find the Proposal You Want to Update

Each proposal is defined in a section that looks like this:

```typescript
{
  id: "proposal-001",
  title: "Increase Keeper Limit to 3 Players",
  description: "Proposal to increase the keeper limit from 2 players to 3 players...",
  status: 'active',
  proposedBy: "Brennan Champion",
  proposedDate: new Date('2025-08-15'),
  votingDeadline: new Date('2025-09-01'),
  category: 'rule-change',
  comments: [...]
}
```

### 3. Update the Fields

Simply change the text between the quotes (`"..."`) for any field you want to update:

- **title**: Change the proposal title
- **description**: Update the proposal description
- **proposedBy**: Change who proposed it
- **category**: Update the proposal category

### 4. Update Dates

For dates, use the format: `new Date('YYYY-MM-DD')`

```typescript
// Example date formats
proposedDate: new Date('2025-08-15'),
votingDeadline: new Date('2025-09-01'),
```

### 5. Update Status

Change the status to reflect the current state:

```typescript
status: 'active'    // Currently being discussed
status: 'passed'    // Proposal was approved
status: 'failed'    // Proposal was rejected
```

## Adding New Proposals

### 1. Create a New Proposal Entry

Add a new proposal object to the `PROPOSALS` array:

```typescript
{
  id: "proposal-004", // Use the next sequential number
  title: "Your Proposal Title",
  description: "Detailed description of your proposal...",
  status: 'active',
  proposedBy: "Your Name",
  proposedDate: new Date('2025-08-20'),
  votingDeadline: new Date('2025-09-05'),
  category: 'rule-change', // Choose appropriate category
  comments: [] // Start with empty comments array
}
```

### 2. Choose a Category

Select from these predefined categories:

- **rule-change**: Changes to league rules
- **format-change**: Changes to league format or structure
- **league-expansion**: Adding teams or expanding the league
- **other**: Miscellaneous proposals

## Managing Comments

### Comments are Automatically Added

The commenting system works automatically - users can add comments directly on the website. You don't need to manually add comments to the configuration file.

### Comment Structure

Each comment automatically includes:

- **Author**: Name entered by the user
- **Text**: The comment content
- **Timestamp**: When the comment was posted
- **ID**: Unique identifier (auto-generated)

## Example Updates

### Changing a Proposal Title
```typescript
// Before
title: "Old Proposal Title",

// After
title: "New Proposal Title",
```

### Updating Voting Deadline
```typescript
// Before
votingDeadline: new Date('2025-09-01'),

// After
votingDeadline: new Date('2025-09-15'),
```

### Changing Proposal Status
```typescript
// Before
status: 'active',

// After
status: 'passed',
```

### Adding a New Proposal
```typescript
// Add this to the PROPOSALS array
{
  id: "proposal-004",
  title: "Implement Superflex Position",
  description: "Add a superflex position allowing QBs in the flex spot for more strategic depth.",
  status: 'active',
  proposedBy: "Mike Tracy",
  proposedDate: new Date('2025-08-22'),
  votingDeadline: new Date('2025-09-10'),
  category: 'format-change',
  comments: []
}
```

## File Structure

```
src/config/
└── proposals.ts          # Main proposals configuration file
```

## Tips

- **Keep descriptions clear**: Make sure league members understand what they're voting on
- **Set realistic deadlines**: Give enough time for discussion and voting
- **Use appropriate categories**: Helps organize and filter proposals
- **Update status promptly**: Change from 'active' to 'passed' or 'failed' when voting ends
- **Test locally**: Use `make start` to preview changes before deploying

## Need Help?

If you run into issues:
1. Check that all quotes and commas are correct
2. Verify date formats use `new Date('YYYY-MM-DD')`
3. Ensure the proposal ID is unique
4. Try running `make start` to see any error messages

The proposals page will automatically update to show your changes once the configuration file is saved and the site is refreshed!
