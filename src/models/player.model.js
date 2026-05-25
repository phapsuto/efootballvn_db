const mongoose = require('mongoose');

const StatsByLevelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    overall: { type: Number },
    stats: { type: Map, of: Number, default: {} }
  },
  { _id: false }
);

const CardImageSchema = new mongoose.Schema(
  {
    card: { type: String },
    portrait: { type: String },
    render: { type: String },
    thumbnail: { type: String }
  },
  { _id: false }
);

const PlayerSchema = new mongoose.Schema(
  {
    efhubId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, index: true },

    name: { type: String, required: true, index: true },
    shortName: { type: String },
    nationality: { type: String, index: true },
    club: { type: String, index: true },
    league: { type: String, index: true },

    positions: { type: [String], default: [] },
    cardType: { type: String, index: true },
    rarity: { type: String },

    overall: {
      base: { type: Number },
      max: { type: Number }
    },

    levels: {
      current: { type: Number, default: 1 },
      max: { type: Number, default: 1 }
    },

    stats: {
      level1: { type: Map, of: Number, default: {} },
      maxLevel: { type: Map, of: Number, default: {} },
      perLevel: { type: [StatsByLevelSchema], default: [] }
    },

    skills: { type: [String], default: [] },
    playstyles: { type: [String], default: [] },

    condition: {
      form: { type: String, default: 'C' },
      injuryResistance: { type: Number }
    },

    managerAffinity: {
      quickCounter: { type: Number },
      possessionGame: { type: Number },
      longBallCounter: { type: Number },
      outWide: { type: Number },
      longBall: { type: Number }
    },

    images: { type: CardImageSchema, default: {} },

    source: {
      site: { type: String, default: 'efhub.com' },
      playerUrl: { type: String },
      scrapedAt: { type: Date }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

PlayerSchema.index({ name: 'text', shortName: 'text', club: 'text' });

module.exports = mongoose.model('Player', PlayerSchema);
