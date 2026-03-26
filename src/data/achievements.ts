import { Achievement } from '../types';
import { 
  Trophy, Users, Star, History, Zap, Package, 
  Award, Crown, Globe, Shield, Target, Flame, 
  TrendingUp, Wallet, Calendar, Gift, Map, 
  Crosshair, Activity, Layers, Eye 
} from 'lucide-react';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-pick',
    title: 'First Pick',
    description: 'Abrir tu primer sobre.',
    reward: '100 Coins',
    icon: Zap
  },
  {
    id: 'roster-builder',
    title: 'Roster Builder',
    description: 'Conseguir 15 jugadores de un mismo equipo.',
    reward: 'Icono de Equipo Plata',
    icon: Users
  },
  {
    id: 'full-squad',
    title: 'The Full Squad',
    description: 'Completar una franquicia entera (Jugadores + Coach).',
    reward: 'Carta "Special Edition"',
    icon: Star
  },
  {
    id: 'vintage-collector',
    title: 'Vintage Collector',
    description: 'Conseguir 5 cartas de "Historical Duos".',
    reward: 'Badge: "History Buff"',
    icon: History
  },
  {
    id: 'dynasty-hunter',
    title: 'Dynasty Hunter',
    description: 'Desbloquear tu primera carta de Dinastía.',
    reward: 'Aura dorada en el perfil',
    icon: Trophy
  },
  {
    id: 'pack-master',
    title: 'Pack Master',
    description: 'Completar 3 logros anteriores.',
    reward: 'Pack Gratis',
    icon: Package
  },
  {
    id: 'dynasty-foundation',
    title: 'Dynasty Foundation',
    description: 'Collect Magic Johnson (1980) and Larry Bird (1984) Finals MVPs.',
    reward: '500 Coins',
    icon: Crown
  },
  {
    id: 'goats-reign',
    title: "The GOAT's Reign",
    description: 'Collect all 6 Michael Jordan Finals MVP cards.',
    reward: '"Chicago Legend" Badge',
    icon: Trophy
  },
  {
    id: 'modern-dominance',
    title: 'Modern Dominance',
    description: 'Collect LeBron James Finals MVP cards from 3 different franchises.',
    reward: 'Ultra Rare Pack',
    icon: Star
  },
  {
    id: 'european-takeover',
    title: 'European Takeover',
    description: 'Collect Tony Parker, Dirk Nowitzki, and Nikola Jokic Finals MVPs.',
    reward: '"Global Scout" Title',
    icon: Globe
  },
  {
    id: 'bill-russell-disciple',
    title: 'The Bill Russell Disciple',
    description: 'Collect 10 different Finals MVP cards.',
    reward: '1,000 Coins',
    icon: Award
  },
  {
    id: 'breaking-the-glass',
    title: 'Breaking the Glass',
    description: 'Collect Wilt Chamberlain and Dennis Rodman Season Record cards.',
    reward: '"Glass Cleaner" Aura',
    icon: Shield
  },
  {
    id: 'beyond-the-arc',
    title: 'Beyond the Arc',
    description: 'Collect Stephen Curry (402 Triples) and Klay Thompson records.',
    reward: '"Splash Town" Animation',
    icon: Zap
  },
  {
    id: 'point-god-disciple',
    title: "Point God's Disciple",
    description: 'Collect John Stockton and Nate Archibald Season Record cards.',
    reward: '300 Coins',
    icon: Target
  },
  {
    id: 'defensive-wall',
    title: 'Defensive Wall',
    description: 'Collect Mark Eaton and Victor Wembanyama Blocks Record cards.',
    reward: '"Not In My House" Badge',
    icon: Shield
  },
  {
    id: 'mr-triple-double',
    title: 'Mr. Triple Double',
    description: "Collect Russell Westbrook's 42 Triple-Double record card.",
    reward: '500 Coins',
    icon: TrendingUp
  },
  {
    id: 'mambas-legacy',
    title: "Mamba's Legacy",
    description: 'Collect 4 Kobe Bryant All-Star MVP cards.',
    reward: '"Mamba Mentality" Title',
    icon: Flame
  },
  {
    id: 'starry-night',
    title: 'Starry Night',
    description: 'Collect 5 different All-Star MVP cards.',
    reward: 'All-Star Special Pack',
    icon: Star
  },
  {
    id: 'youngest-oldest',
    title: 'Youngest & Oldest',
    description: 'Collect LeBron James (2006) and Shaq (2009) All-Star MVPs.',
    reward: '400 Coins',
    icon: History
  },
  {
    id: 'perfect-weekend',
    title: 'Perfect Weekend',
    description: "Collect the current year's All-Star MVP and a Slam Dunk Champ.",
    reward: '"Star Power" Glow',
    icon: Zap
  },
  {
    id: 'bench-mafia',
    title: 'Bench Mafia',
    description: 'Collect Jamal Crawford and Lou Williams (all versions).',
    reward: '"Sixth Man" Badge',
    icon: Users
  },
  {
    id: 'xfactor-found',
    title: 'X-Factor Found',
    description: 'Collect 10 different 6th Man of the Year (6MOY) cards.',
    reward: '250 Coins',
    icon: Zap
  },
  {
    id: 'ginobilis-spirit',
    title: "Ginobili's Spirit",
    description: 'Collect Manu Ginobili\'s 6MOY and Finals MVP cards.',
    reward: '"Winning Culture" Title',
    icon: Trophy
  },
  {
    id: 'impact-player',
    title: 'Impact Player',
    description: 'Collect Robert Horry and Andre Iguodala cards.',
    reward: '300 Coins',
    icon: Zap
  },
  {
    id: 'content-consumer',
    title: 'Content Consumer',
    description: 'Watch 25 Reward Ads (Adsterra Integration).',
    reward: '"Premium Access" (1h No Ads)',
    icon: Eye
  },
  {
    id: 'market-whale',
    title: 'Market Whale',
    description: 'Spend 10,000 Coins in the virtual store.',
    reward: '"Tycoon" Card Border',
    icon: Wallet
  },
  {
    id: 'daily-investor',
    title: 'Daily Investor',
    description: 'Open the Daily Free Pack 10 days in a row.',
    reward: 'Guaranteed Rare Card',
    icon: Calendar
  },
  {
    id: 'support-the-game',
    title: 'Support the Game',
    description: 'Click on 5 different "Bonus Coin" offers.',
    reward: '2,000 Coins',
    icon: Gift
  },
  {
    id: 'future-2026',
    title: 'The 2026 Future',
    description: 'Collect the Top 3 Rookies of the 2025/26 Class (Flagg, Bailey, Harper).',
    reward: '"Scout Master" Title',
    icon: Map
  },
  {
    id: 'california-dreamin',
    title: 'California Dreamin\'',
    description: 'Collect all Finals MVPs from Lakers and Warriors franchises.',
    reward: 'Gold Card Skin',
    icon: Map
  },
  {
    id: 'texas-triangle',
    title: 'Texas Triangle',
    description: 'Collect a Finals MVP from Spurs, Rockets, and Mavericks.',
    reward: '600 Coins',
    icon: Map
  },
  {
    id: 'efficiency-expert',
    title: 'Efficiency Expert',
    description: 'Collect Kevin Durant and LeBron James High FG% record cards.',
    reward: '"Sniper" Badge',
    icon: Crosshair
  },
  {
    id: 'iron-man',
    title: 'Iron Man',
    description: "Collect A.C. Green's consecutive games record card.",
    reward: '"Indestructible" Aura',
    icon: Activity
  },
  {
    id: 'double-trouble',
    title: 'Double Trouble',
    description: 'Collect 5 different "Shared MVP" cards (Co-MVPs).',
    reward: '450 Coins',
    icon: Layers
  },
  {
    id: 'efficiency-king',
    title: 'Efficiency King',
    description: 'Collect Nikola Jokic and Stephen Curry efficiency record cards.',
    reward: '"Analytics God" Title',
    icon: TrendingUp
  },
  {
    id: 'the-untouchables',
    title: 'The Untouchables',
    description: 'Collect 5 cards with records set before 1980.',
    reward: 'Vintage Card Filter',
    icon: History
  }
];
