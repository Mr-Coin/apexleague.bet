import React from "react";
import { 
  Toilet, 
  Crosshair, 
  Crown, 
  Trophy, 
  Milk, 
  Paintbrush, 
  Target, 
  Gavel, 
  Binoculars, 
  Star 
} from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
  textColor: string;
}

export const BADGES: Record<string, Badge> = {
  toilet: {
    id: 'toilet',
    name: 'Toilet',
    description: 'Got last place',
    icon: React.createElement(Toilet, { className: "w-4 h-4" }),
    color: '#8B4513',
    backgroundColor: 'bg-amber-100',
    textColor: 'text-amber-800'
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    description: 'Shotgun\'d after a bad week',
    icon: React.createElement(Crosshair, { className: "w-4 h-4" }),
    color: '#FF8C00',
    backgroundColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  },
  champ: {
    id: 'champ',
    name: 'Champ',
    description: 'Won a season',
    icon: React.createElement(Crown, { className: "w-4 h-4" }),
    color: '#FFD700',
    backgroundColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  doubleUp: {
    id: 'doubleUp',
    name: 'Double Up',
    description: 'Won two seasons in a row',
    icon: React.createElement(Trophy, { className: "w-4 h-4" }),
    color: '#FFD700',
    backgroundColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  gotMilk: {
    id: 'gotMilk',
    name: 'Got Milk?',
    description: 'Completed the Hot Ones punishment',
    icon: React.createElement(Milk, { className: "w-4 h-4" }),
    color: '#DC143C',
    backgroundColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  painted: {
    id: 'painted',
    name: 'Painted',
    description: 'Completed the full body paint CFG punishment',
    icon: React.createElement(Paintbrush, { className: "w-4 h-4" }),
    color: '#FF69B4',
    backgroundColor: 'bg-pink-100',
    textColor: 'text-pink-800'
  },
  onTarget: {
    id: 'onTarget',
    name: 'On Target',
    description: 'Made the playoffs',
    icon: React.createElement(Target, { className: "w-4 h-4" }),
    color: '#4169E1',
    backgroundColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  judge: {
    id: 'judge',
    name: 'Judge',
    description: 'Commissioner',
    icon: React.createElement(Gavel, { className: "w-4 h-4" }),
    color: '#228B22',
    backgroundColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  gestapo: {
    id: 'gestapo',
    name: 'Gestapo',
    description: 'Roster Integrity advocate',
    icon: React.createElement(Binoculars, { className: "w-4 h-4" }),
    color: '#228B22',
    backgroundColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  positive: {
    id: 'positive',
    name: 'Positive',
    description: 'Finished a season with a positive record',
    icon: React.createElement(Star, { className: "w-4 h-4" }),
    color: '#FFD700',
    backgroundColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  }
};

export const getBadgeById = (id: string): Badge | undefined => {
  return BADGES[id];
};

export const getBadgesByIds = (ids: string[]): Badge[] => {
  return ids.map(id => BADGES[id]).filter(Boolean);
};
