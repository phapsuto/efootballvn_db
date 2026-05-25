import type { Player } from '@/types/domain';

export const MOCK_PLAYERS: Player[] = [
  {
    efhubId: '88041460859805',
    slug: 'clarence-seedorf',
    name: 'Clarence Seedorf',
    shortName: 'C. Seedorf',
    nationality: 'Netherlands',
    club: 'AC Milan',
    league: 'Italian League',
    positions: ['DMF', 'CMF', 'AMF'],
    cardType: 'Legendary',
    rarity: 'Legendary',
    overall: { base: 86, max: 97 },
    levels: { current: 1, max: 35 },
    stats: {
      level1: {
        offensiveAwareness: 66,
        finishing: 64,
        lowPass: 77,
        speed: 79,
        acceleration: 79,
        ballWinning: 76,
        trackingBack: 79,
        defensiveAwareness: 75,
        stamina: 82,
        physicalContact: 78
      },
      maxLevel: {
        offensiveAwareness: 83,
        finishing: 79,
        lowPass: 91,
        speed: 90,
        acceleration: 90,
        ballWinning: 89,
        trackingBack: 90,
        defensiveAwareness: 88,
        stamina: 94,
        physicalContact: 89
      },
      perLevel: []
    },
    skills: [
      'doubleTouch',
      'marseilleTurn',
      'longRangeShooting',
      'oneTouchPass',
      'throughPassing',
      'manMarking',
      'interception',
      'blocker'
    ],
    playstyles: ['Box To Box', 'incisiveRun'],
    condition: { form: 'C', injuryResistance: 2 },
    build: { pointsCap: 68 },
    positionRatings: {
      GK: 45,
      CB: 84,
      LB: 87,
      RB: 87,
      DMF: 86,
      CMF: 87,
      LMF: 87,
      RMF: 87,
      AMF: 84,
      LWF: 85,
      RWF: 85,
      SS: 83,
      CF: 80
    },
    images: {
      card: 'https://efimg.com/efootballhub22/images/player_cards/88041460859805_l.png',
      portrait: 'https://efimg.com/efootballhub22/images/player_cards/88041460859805_l.png',
      thumbnail:
        'https://efimg.com/efootballhub22/images/mini-cards/mini-cards/88041460859805_l.png'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: '2026-04-14T00:00:00.000Z'
    }
  },
  {
    efhubId: '88029951111111',
    slug: 'lionel-messi',
    name: 'Lionel Messi',
    shortName: 'L. Messi',
    nationality: 'Argentina',
    club: 'Inter Miami',
    league: 'MLS',
    positions: ['RWF', 'SS', 'AMF'],
    cardType: 'Epic',
    rarity: 'Epic',
    overall: { base: 95, max: 101 },
    levels: { current: 1, max: 30 },
    stats: {
      level1: {
        offensiveAwareness: 90,
        finishing: 90,
        lowPass: 89,
        speed: 82,
        acceleration: 88,
        ballWinning: 42,
        trackingBack: 38,
        defensiveAwareness: 45,
        stamina: 76,
        physicalContact: 62
      },
      maxLevel: {
        offensiveAwareness: 96,
        finishing: 96,
        lowPass: 95,
        speed: 88,
        acceleration: 94,
        ballWinning: 48,
        trackingBack: 44,
        defensiveAwareness: 50,
        stamina: 82,
        physicalContact: 68
      },
      perLevel: []
    },
    skills: [
      'doubleTouch',
      'soleControl',
      'outsideCurler',
      'longRangeShooting',
      'throughPassing',
      'oneTouchPass'
    ],
    playstyles: ['Creative Playmaker', 'Mazing Run'],
    condition: { form: 'B', injuryResistance: 2 },
    build: { pointsCap: 64 },
    positionRatings: {
      GK: 40,
      CB: 55,
      LB: 64,
      RB: 63,
      DMF: 70,
      CMF: 81,
      LMF: 86,
      RMF: 87,
      AMF: 95,
      LWF: 96,
      RWF: 98,
      SS: 97,
      CF: 93
    },
    images: {
      card: 'https://placehold.co/300x420/111827/f9fafb.png?text=Lionel+Messi',
      portrait: 'https://placehold.co/300x420/111827/f9fafb.png?text=Lionel+Messi',
      thumbnail: 'https://placehold.co/180x180/111827/f9fafb.png?text=Messi'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: '2026-04-14T00:00:00.000Z'
    }
  },
  {
    efhubId: '88027772222222',
    slug: 'erling-haaland',
    name: 'Erling Haaland',
    shortName: 'E. Haaland',
    nationality: 'Norway',
    club: 'Manchester City',
    league: 'English League',
    positions: ['CF'],
    cardType: 'Highlight',
    rarity: 'Highlight',
    overall: { base: 93, max: 99 },
    levels: { current: 1, max: 30 },
    stats: {
      level1: {
        offensiveAwareness: 90,
        finishing: 92,
        lowPass: 72,
        speed: 85,
        acceleration: 78,
        ballWinning: 40,
        trackingBack: 37,
        defensiveAwareness: 41,
        stamina: 80,
        physicalContact: 90
      },
      maxLevel: {
        offensiveAwareness: 96,
        finishing: 98,
        lowPass: 78,
        speed: 91,
        acceleration: 85,
        ballWinning: 45,
        trackingBack: 42,
        defensiveAwareness: 46,
        stamina: 86,
        physicalContact: 96
      },
      perLevel: []
    },
    skills: [
      'firstTimeShot',
      'heading',
      'acrobaticFinishing',
      'risingShots',
      'aerialSuperiority'
    ],
    playstyles: ['Goal Poacher'],
    condition: { form: 'C', injuryResistance: 3 },
    build: { pointsCap: 64 },
    positionRatings: {
      GK: 40,
      CB: 62,
      LB: 57,
      RB: 58,
      DMF: 66,
      CMF: 74,
      LMF: 70,
      RMF: 72,
      AMF: 83,
      LWF: 88,
      RWF: 89,
      SS: 94,
      CF: 99
    },
    images: {
      card: 'https://placehold.co/300x420/0f172a/f9fafb.png?text=Erling+Haaland',
      portrait: 'https://placehold.co/300x420/0f172a/f9fafb.png?text=Erling+Haaland',
      thumbnail: 'https://placehold.co/180x180/0f172a/f9fafb.png?text=Haaland'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: '2026-04-14T00:00:00.000Z'
    }
  }
];
