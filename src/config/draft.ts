export interface DraftConfig {
  // Whether to show the draft notification section
  showDraftNotification: boolean;
  
  // Whether to show the draft conclusion header
  showDraftConclusion: boolean;
  
  // Draft notification settings (when showDraftNotification is true)
  draftNotification: {
    title: string;
    subtitle: string;
    date: string;
    time: string;
    timezone: string;
    meetLink: string;
    meetLinkText: string;
  };
  
  // Draft conclusion settings (when showDraftConclusion is true)
  draftConclusion: {
    title: string;
    message: string;
  };
}

export const DRAFT_CONFIG: DraftConfig = {
  // Set to false to hide the draft notification section
  showDraftNotification: false,
  
  // Set to true to show the draft conclusion header
  showDraftConclusion: true,
  
  // Draft notification configuration (for future use)
  draftNotification: {
    title: "Draft Day",
    subtitle: "APEX Fantasy Football Draft",
    date: "Mon, Aug 25, 2025",
    time: "7:30–9:00pm",
    timezone: "(America/Chicago)",
    meetLink: "https://meet.google.com/cvq-pcru-tcu",
    meetLinkText: "Google Meet Link"
  },
  
  // Draft conclusion configuration
  draftConclusion: {
    title: "Draft Complete",
    message: "The 2025 Draft has officially concluded. Consult your ESPN Fantasy app for results."
  }
};
