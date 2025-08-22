export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed';
  proposedBy: string;
  proposedDate: Date;
  votingDeadline: Date;
  category: 'rule-change' | 'format-change' | 'league-expansion' | 'other';
}

export const PROPOSALS: Proposal[] = [
  {
    id: "proposal-001",
    title: "Allow Trading of Draft Picks Up to One Year Ahead",
    description: "Proposal to be allowed to trade draft picks up to one year ahead. So, anything for the draft on Monday and next year's draft is fair game to trade.",
    status: 'active',
    proposedBy: "Brennan Champion",
    proposedDate: new Date('2025-08-20'),
    votingDeadline: new Date('2025-09-05'),
    category: 'rule-change'
  }
];

// Helper function to get proposal by ID
export const getProposalById = (id: string): Proposal | undefined => {
  return PROPOSALS.find(proposal => proposal.id === id);
};

// Helper function to get active proposals
export const getActiveProposals = (): Proposal[] => {
  return PROPOSALS.filter(proposal => proposal.status === 'active');
};
