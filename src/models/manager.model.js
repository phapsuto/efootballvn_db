const mongoose = require('mongoose');

const ManagerSchema = new mongoose.Schema(
  {
    efhubId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    shortName: { type: String },
    nationality: { type: String },
    team: { type: String, index: true },

    formation: { type: String, index: true },
    playstyleProficiency: {
      quickCounter: { type: Number, default: 0 },
      possessionGame: { type: Number, default: 0 },
      longBallCounter: { type: Number, default: 0 },
      outWide: { type: Number, default: 0 },
      longBall: { type: Number, default: 0 }
    },

    affinity: {
      attack: { type: Number },
      midfield: { type: Number },
      defense: { type: Number }
    },

    imageUrl: { type: String },

    source: {
      site: { type: String, default: 'efhub.com' },
      managerUrl: { type: String },
      scrapedAt: { type: Date }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ManagerSchema.index({ name: 'text', team: 'text' });

module.exports = mongoose.model('Manager', ManagerSchema);
