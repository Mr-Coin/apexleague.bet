export interface Team {
  id: string;
  name: string;
  owner: string;
  logo: string;
  ownerPhoto: string;
  description: string;
  ownerBlurb: string;
  draftPosition?: number;
}

export const TEAMS: Team[] = [
  {
    id: "il-duce",
    name: "IL DUCE",
    owner: "David Rasmussen",
    logo: "/tbd.jpg", // You can add team logos here
    ownerPhoto: "/commish.png",
    description: "The commissioner's squad, always grinding through the seasons.",
    ownerBlurb: "David Rasmussen, our fantasy football commish, kicked off this league two years ago dreaming of glory. That dream's a total bust so far, but he keeps grinding through the seasons. From Chicago's bullet-riddled hellhole, he dodges gang shootouts on his commute to slave away for banking tyrant Jamie Dimon—who's now yanked him back to the office five days a week, gutting his time to manage his squad, IL DUCE.",
    draftPosition: 10
  },
  {
    id: "big-mike",
    name: "Big Mike and the boys",
    owner: "Brennan Champion",
    logo: "/tbd.jpg",
    ownerPhoto: "/brennan.png",
    description: "A powerhouse team with strategic depth and consistent performance.",
    ownerBlurb: "Brennan Joseph Champion, the Chair of Roster Integrity, brings his analytical mind and strategic thinking to the gridiron. Known for his meticulous roster management and ability to spot hidden gems in the draft.",
    draftPosition: 7
  },
  {
    id: "geriatric-unit",
    name: "Geriatric Unit",
    owner: "Kevin Killeen",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Kevin's photo when available
    description: "Experience and wisdom on the field, proving age is just a number.",
    ownerBlurb: "Kevin Killeen brings years of fantasy football experience to the league. His strategic approach and veteran knowledge make him a formidable opponent year after year.",
    draftPosition: 8
  },
  {
    id: "painted-nails",
    name: "Painted Nail Zesty Boys 💅",
    owner: "Henry Erzinger",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Henry's photo when available
    description: "Style meets substance with this flashy but effective team.",
    ownerBlurb: "Henry Erzinger combines flair with football knowledge, creating a team that's as entertaining to watch as it is competitive on the field.",
    draftPosition: 4
  },
  {
    id: "team-smith",
    name: "Team Smith",
    owner: "Jake Smith",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Jake's photo when available
    description: "Consistent and reliable, this team always puts up a fight.",
    ownerBlurb: "Jake Smith approaches fantasy football with methodical precision, building rosters that consistently compete week in and week out.",
    draftPosition: 5
  },
  {
    id: "gully",
    name: "Gully",
    owner: "Matt Gullickson",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Matt's photo when available
    description: "A championship-caliber team with proven success in the league.",
    ownerBlurb: "Matt Gullickson has established himself as one of the league's elite managers, with multiple championships and a track record of excellence.",
    draftPosition: 12
  },
  {
    id: "josh-downs",
    name: "Josh Downs Syndrome",
    owner: "Stuart Alvey",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Stuart's photo when available
    description: "Creative team names and creative strategies on the field.",
    ownerBlurb: "Stuart Alvey brings creativity and innovation to his fantasy football approach, always looking for the next big thing in the NFL.",
    draftPosition: 9
  },
  {
    id: "free-tyreek",
    name: "Free Tyreek",
    owner: "Mike Tracy",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Mike's photo when available
    description: "Speed and agility define this explosive offensive team.",
    ownerBlurb: "Mike Tracy focuses on building fast, dynamic rosters that can put up points in a hurry, living up to his team's name.",
    draftPosition: 6
  },
  {
    id: "ceedeez-nuts",
    name: "CeeDeez Nuts",
    owner: "Sam Lohmar",
    logo: "/ceedeez.jpg",
    ownerPhoto: "/placeholder.svg", // Add Sam's photo when available
    description: "A team that's not afraid to take risks and make bold moves.",
    ownerBlurb: "Sam Lohmar embraces the unpredictable nature of fantasy football, making bold decisions that often pay off in big ways.",
    draftPosition: 1
  },
  {
    id: "olave-garden",
    name: "Olave Garden",
    owner: "Joseph Ross",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Joseph's photo when available
    description: "Fresh ingredients and fresh strategies make this team a contender.",
    ownerBlurb: "Joseph Ross brings a fresh perspective to fantasy football, always looking for new angles and strategies to gain an edge.",
    draftPosition: 11
  },
  {
    id: "white-man-run",
    name: "Das how a white man run da ball",
    owner: "Rodrigo Rabanal",
    logo: "/tbd.jpg",
    ownerPhoto: "/placeholder.svg", // Add Rodrigo's photo when available
    description: "A team that knows how to move the ball and score points.",
    ownerBlurb: "Rodrigo Rabanal has mastered the art of building balanced rosters that can both run and pass effectively.",
    draftPosition: 2
  },
  {
    id: "dark-web",
    name: "Dark Web Bitcoin Miners",
    owner: "Cole Thomas",
    logo: "/dwbm.jpg",
    ownerPhoto: "/cole.png",
    description: "Mining for fantasy gold with cutting-edge strategies.",
    ownerBlurb: "Cole Ellsworth Thomas, the Analyst of Roster Integrity, brings his analytical expertise to fantasy football. His deep understanding of player performance and market trends makes him a formidable opponent.",
    draftPosition: 3
  }
];

// Helper function to get team by ID
export const getTeamById = (id: string): Team | undefined => {
  return TEAMS.find(team => team.id === id);
};

// Helper function to get teams sorted by draft position
export const getTeamsByDraftOrder = (): Team[] => {
  return [...TEAMS].sort((a, b) => (a.draftPosition || 0) - (b.draftPosition || 0));
};
