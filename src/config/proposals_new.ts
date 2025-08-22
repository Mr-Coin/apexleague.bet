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
  },
  {
    id: "proposal-002",
    title: "Create $APX Token with Liquidity Pool",
    description: "Proposal to create $APX Token! Everyone pools $100 each for a slick liquidity pool to pump this thing! 🚀\n\nTokenomics:\n\n1. 50M total supply (capped): 1M $APX per member (12M for 12 members), 37M for prize pool, 1M for liquidity pool.\n\n2. Prize pool: 37M $APX Yearly rewards paid from prize pool:\n   ◦ 500k champ\n   ◦ 250k 2nd\n   ◦ 100k 3rd\n   ◦ 100k last place\n\n3. Liquidity pool: 1M token allocation backed by $100 each from 12 members for a pool value of $1,200, valuing each token at $0.0012. Each team starts with 1M tokens, so your initial stack is worth $1,200 (1M × $0.0012).\n\n4. Utility: Use $APX to sweeten player trades, side bets, buying waiver position, anything you want!",
    status: 'active',
    proposedBy: "Brennan Champion",
    proposedDate: new Date('2025-08-22'),
    votingDeadline: new Date('2025-09-10'),
    category: 'format-change'
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
