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
    description: "All hat and no cattle, Brennan is Forte Worth Translpant.",
    ownerBlurb: "Brennan Joseph Champion has always had a knack for bending the rules just enough to slip through the cracks, so it was only natural he'd slither his way into a career as a lawyer—chasing ambulances and loopholes with equal fervor. As a staunch Catholic, he once sought divine counsel on his shady profession, only for God to quip, 'Do you know why I created snakes before lawyers? Because I needed the practice.'",
    draftPosition: 7
  },
  {
    id: "geriatric-unit",
    name: "Geriatric Unit",
    owner: "Kevin Killeen",
    logo: "/tbd.jpg",
    ownerPhoto: "/kevin.png", 
    description: "Husband and father with little time for fantasy football... leading to many losses.",
    ownerBlurb: "Kevin Killeen is a master musician with a knack for the trombone—once he starts blowing that horn, the ladies' panties don't just drop, they drip.  A man oozing charisma from every pore, Kevin once sweet-talked a prostitute into paying him after their session, turning the oldest profession into his personal ATM. But now, as a devoted father of two, he's traded those risky back-alley thrills for the safer highs of dad jokes",
    draftPosition: 8
  },
  {
    id: "painted-nails",
    name: "Painted Nail Zesty Boys 💅",
    owner: "Henry Erzinger",
    logo: "/tbd.jpg",
    ownerPhoto: "/hank.png",
    description: "Hank the Tank is focused on a playoff run this year.",
    ownerBlurb: "Henry Erzinger hails from the leafy suburbs of Chicago, where life was more about backyard barbecues than urban grit—leaving him blissfully unaware of the city's tougher tales like gang violence. A die-hard Chicago Bears fan through and through, Henry's loyalty has been a source of endless heartache, with season after season of dashed hopes testing his resolve. Even now, nearly two decades later, he lies awake at night replaying the agonizing 2007 Super Bowl loss to the Indianapolis Colts, wondering what might have been if Devin Hester's opening kickoff return had sparked a different destiny.",
    draftPosition: 4
  },
  {
    id: "team-smith",
    name: "Team Smith",
    owner: "Jake Smith",
    logo: "/tbd.jpg",
    ownerPhoto: "/jake.png",
    description: "Consistent and reliable, this team always puts up a fight.",
    ownerBlurb: "Jake Smith hails from the cushy confines of Overland Park in Kansas City, where he's a rabid devotee of all things KC—basking in the glory of multiple Super Bowl parades and a World Series victory. But when it comes to fantasy football, Jake's trophy case is as barren as a Chiefs bandwagon before Mahomes, proving that even in the heartland of winners, some dudes are doomed to eternal bench-sitter blues.",
    draftPosition: 5
  },
  {
    id: "gully",
    name: "Gully",
    owner: "Matt Gullickson",
    logo: "/tbd.jpg",
    ownerPhoto: "/matt.png", // Add Matt's photo when available
    description: "Back to back champ, someone needs to beat this guy.",
    ownerBlurb: "Matt Gullickson was born with congenital hypoplasia of the zygomaticus major and minor muscles, meaning he lacks the ability to smile. Embracing the glitch, Matt dove into lawyering, where his icy poker face intimidates juries and crushes negotiations. Shockingly, he's the back-to-back champ of the Apex league, leaving everyone stunned since we all figured he tuned into football about as often as he cracks a grin—never.",
    draftPosition: 12
  },
  {
    id: "josh-downs",
    name: "Josh Downs Syndrome",
    owner: "Stuart Alvey",
    logo: "/tbd.jpg",
    ownerPhoto: "/stu.png", // Add Stuart's photo when available
    description: "Creative team names and creative strategies on the field.",
    ownerBlurb: "Stuart Alvey, aka the future Beaver Baron of Noblesville, relishes his peaceful life far north of the Indianapolis chaos. A hardcore Colts fan, Stu loathes his team's endless mediocrity, tossing at night dreaming of a Super Bowl ring to soothe his playoff-deprived soul. Expecting another trash season for the Colts and his fantasy squad, he's pinning hopes on a holy trinity of titles from the Pacers, Colts, and Fever—just like the divine Trinity who graced him with his first sinful sacrament, transforming clumsy gropes into legendary bliss.",
    draftPosition: 9
  },
  {
    id: "free-tyreek",
    name: "Free Tyreek",
    owner: "Mike Tracy",
    logo: "/tbd.jpg",
    ownerPhoto: "/mike.png", // Add Mike's photo when available
    description: "Playing for any position but last.",
    ownerBlurb: "Mike Tracy might be the nominal owner of team 'Free Tyreek,' but with his secret weapon Brandon pulling the strings like a puppet master on Adderall, they've still only scraped together a pitiful handful of wins—barely enough to fill a glass of wine. Mike clings to the silver lining that he's never hit rock bottom in the standings, calling it a moral victory. He signed up for fantasy football dreaming of tight abs and locker-room romps, not this endless grind, but now he's balls-deep in the action, too hooked to bail without losing his dignity... or what's left of it.",
    draftPosition: 6
  },
  {
    id: "ceedeez-nuts",
    name: "CeeDeez Nuts",
    owner: "Sam Lohmar",
    logo: "/ceedeez.jpg",
    ownerPhoto: "/lohmar.png", // Add Sam's photo when available
    description: "With his first round pick, Sam plans to select the Browns Defense.",
    ownerBlurb: "Sam Lohmar traces his roots back to a proud German bloodline, which sailed smoothly through life until he pledged our fraternity and discovered a few brothers with Jewish heritage—suddenly, those family history lessons hit a bit too close to home. He's matured a tad in recent years and has decided to fully support both Ukraine and Isreal to make up for his ancestor's missteps.",
    draftPosition: 1
  },
  {
    id: "olave-garden",
    name: "Olave Garden",
    owner: "Joseph Ross",
    logo: "/tbd.jpg",
    ownerPhoto: "/joe.png", // Add Joseph's photo when available
    description: "Fresh ingredients and fresh strategies make this team a contender.",
    ownerBlurb: "Joe Ross ain't here to play nice—if you cross him, he'll swipe your girl faster than a stall door slams shut at Monon Bell. This savage relishes dropping deuces in Cole's backyard, turning them into gourmet treats for the dog Ralph. Skip buying his damage waiver, and you're dead to him—no friends, no mercy. These days, Joe's channeling that ruthless energy as a lawyer, locking up pedos left and right, proving he's the hero we didn't know we needed... or deserved.",
    draftPosition: 11
  },
  {
    id: "white-man-run",
    name: "Das how a white man run da ball",
    owner: "Rodrigo Rabanal",
    logo: "/tbd.jpg",
    ownerPhoto: "/drigo.png", // Add Rodrigo's photo when available
    description: "A team that knows how to move the ball and score points.",
    ownerBlurb: "Rodrigo Rabanal, aka Drigo, hails from a lineage of Peruvian shamans famed for ayahuasca rituals that peered into the future—forecasting everything from harvests to wars and probably who’d win the llama races. Drigo, though? He'll need a massive DMT hit just to hallucinate a shot at fantasy glory, because without some serious psychedelic intervention, a first place finish seems about as likely as peace in the Middle East.",
    draftPosition: 2
  },
  {
    id: "dark-web",
    name: "Dark Web Bitcoin Miners",
    owner: "Cole Thomas",
    logo: "/dwbm.jpg",
    ownerPhoto: "/cole.png",
    description: "Mining for fantasy gold with cutting-edge strategies.",
    ownerBlurb: "Cole Ellsworth Thomas is a die-hard crypto bro who thrives on hoarding fake internet moneys. He plans on retiring either on a yacht, or in a cardboard box next to the homeless shelter. This year Cole became a father, leading him to ditching the red-pill rage for rainbow flags, vowing to become a full-blown feminist. Who knew changing a few diapers could make a man think a woman can be President?",
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
