const MOCK_PLAYERS = [
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
    overall: {
      base: 86,
      max: 97
    },
    levels: {
      current: 1,
      max: 35
    },
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
    condition: {
      form: 'C',
      injuryResistance: 2
    },
    images: {
      card: 'https://efimg.com/efootballhub22/images/player_cards/88041460859805_l.png',
      portrait: 'https://efimg.com/efootballhub22/images/player_cards/88041460859805_l.png',
      thumbnail: 'https://efimg.com/efootballhub22/images/mini-cards/mini-cards/88041460859805_l.png'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: new Date('2026-04-14T00:00:00.000Z')
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
    overall: {
      base: 95,
      max: 101
    },
    levels: {
      current: 1,
      max: 30
    },
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
    condition: {
      form: 'B',
      injuryResistance: 2
    },
    images: {
      card: 'https://efimg.com/efootballhub22/images/player_cards/88029951111111_l.png',
      portrait: 'https://efimg.com/efootballhub22/images/player_cards/88029951111111_l.png',
      thumbnail: 'https://efimg.com/efootballhub22/images/mini-cards/mini-cards/88029951111111_l.png'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: new Date('2026-04-14T00:00:00.000Z')
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
    overall: {
      base: 93,
      max: 99
    },
    levels: {
      current: 1,
      max: 30
    },
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
    condition: {
      form: 'C',
      injuryResistance: 3
    },
    images: {
      card: 'https://efimg.com/efootballhub22/images/player_cards/88027772222222_l.png',
      portrait: 'https://efimg.com/efootballhub22/images/player_cards/88027772222222_l.png',
      thumbnail: 'https://efimg.com/efootballhub22/images/mini-cards/mini-cards/88027772222222_l.png'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: new Date('2026-04-14T00:00:00.000Z')
    }
  },
  {
    efhubId: '88026663333333',
    slug: 'kevin-de-bruyne',
    name: 'Kevin De Bruyne',
    shortName: 'K. De Bruyne',
    nationality: 'Belgium',
    club: 'Manchester City',
    league: 'English League',
    positions: ['AMF', 'CMF'],
    cardType: 'Standard',
    rarity: 'Standard',
    overall: {
      base: 91,
      max: 97
    },
    levels: {
      current: 1,
      max: 28
    },
    stats: {
      level1: {
        offensiveAwareness: 84,
        finishing: 82,
        lowPass: 93,
        speed: 72,
        acceleration: 73,
        ballWinning: 58,
        trackingBack: 56,
        defensiveAwareness: 60,
        stamina: 84,
        physicalContact: 72
      },
      maxLevel: {
        offensiveAwareness: 90,
        finishing: 88,
        lowPass: 99,
        speed: 78,
        acceleration: 80,
        ballWinning: 64,
        trackingBack: 62,
        defensiveAwareness: 66,
        stamina: 90,
        physicalContact: 78
      },
      perLevel: []
    },
    skills: [
      'throughPassing',
      'weightedPass',
      'oneTouchPass',
      'longRangeShooting',
      'pinpointCrossing'
    ],
    playstyles: ['Creative Playmaker'],
    condition: {
      form: 'B',
      injuryResistance: 2
    },
    images: {
      card: 'https://efimg.com/efootballhub22/images/player_cards/88026663333333_l.png',
      portrait: 'https://efimg.com/efootballhub22/images/player_cards/88026663333333_l.png',
      thumbnail: 'https://efimg.com/efootballhub22/images/mini-cards/mini-cards/88026663333333_l.png'
    },
    source: {
      site: 'mock',
      playerUrl: '',
      scrapedAt: new Date('2026-04-14T00:00:00.000Z')
    }
  }
];

module.exports = MOCK_PLAYERS;
