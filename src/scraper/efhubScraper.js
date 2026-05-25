const { chromium } = require('playwright');
const env = require('../config/env');
const Player = require('../models/player.model');
const USER_AGENTS = require('./userAgents');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PLAYER_TYPE_MAP = {
  1: 'Standard',
  2: 'Featured',
  3: 'POTW',
  4: 'Show Time',
  5: 'Legendary',
  6: 'Highlight',
  7: 'Big Time',
  8: 'Epic'
};

const STAT_KEY_ALIASES = {
  offensiveawareness: 'offensiveAwareness',
  attackingprowess: 'offensiveAwareness',
  ballcontrol: 'ballControl',
  dribbling: 'dribbling',
  tightpossession: 'tightPossession',
  lowpass: 'lowPass',
  loftedpass: 'loftedPass',
  finishing: 'finishing',
  heading: 'heading',
  placekicking: 'setPieceTaking',
  setpiecetaking: 'setPieceTaking',
  curl: 'curl',
  speed: 'speed',
  acceleration: 'acceleration',
  kickingpower: 'kickingPower',
  jump: 'jump',
  physicalcontact: 'physicalContact',
  physical: 'physicalContact',
  balance: 'balance',
  stamina: 'stamina',
  defensiveawareness: 'defensiveAwareness',
  defensiveengagement: 'trackingBack',
  interception: 'trackingBack',
  trackingback: 'trackingBack',
  tackling: 'ballWinning',
  ballwinning: 'ballWinning',
  aggression: 'aggression',
  goalkeeping: 'gkAwareness',
  gkawareness: 'gkAwareness',
  gkcatching: 'gkCatching',
  gkparrying: 'gkClearing',
  gkclearing: 'gkClearing',
  gkreflexes: 'gkReflexes',
  gkreach: 'gkReach'
};

const toTitleCaseFromSlug = (value) =>
  String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toConditionGrade = (raw) => {
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
      return upper;
    }
  }

  const numeric = toNumber(raw);
  const mapping = {
    5: 'A',
    4: 'B',
    3: 'C',
    2: 'D',
    1: 'E',
    0: 'E'
  };

  return mapping[numeric] || 'C';
};

const toStatAliasKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

class EfhubScraper {
  constructor(options = {}) {
    const baseUrl = options.baseUrl || env.EFHUB_BASE_URL || 'https://efhub.com';

    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.playerListUrl =
      options.playerListUrl || env.EFHUB_PLAYER_LIST_URL || `${this.baseUrl}/players`;

    this.headless = options.headless ?? env.SCRAPER_HEADLESS;
    this.timeoutMs = options.timeoutMs ?? env.SCRAPER_TIMEOUT_MS;
    this.minDelayMs = options.minDelayMs ?? env.SCRAPER_MIN_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? env.SCRAPER_MAX_DELAY_MS;
    this.persistToDb = options.persistToDb ?? true;

    this.browser = null;
  }

  randomDelayMs() {
    return randomInt(this.minDelayMs, this.maxDelayMs);
  }

  pickUserAgent() {
    return USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)];
  }

  async delayWithLog(message) {
    const waitMs = this.randomDelayMs();
    // eslint-disable-next-line no-console
    console.log(`[scraper] ${message} | sleep ${waitMs}ms`);
    await sleep(waitMs);
  }

  async launch() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.headless
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async createStealthContext() {
    const context = await this.browser.newContext({
      userAgent: this.pickUserAgent(),
      viewport: {
        width: randomInt(1280, 1720),
        height: randomInt(720, 1080)
      },
      locale: 'en-US',
      timezoneId: env.SCRAPER_BROWSER_TIMEZONE || env.SCRAPER_TIMEZONE || 'Asia/Ho_Chi_Minh'
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
    });

    await context.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9'
    });

    return context;
  }

  async gotoWithDelay(page, url) {
    await this.delayWithLog(`Before request: ${url}`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: this.timeoutMs
    });
    await page.waitForLoadState('networkidle', { timeout: this.timeoutMs }).catch(() => null);
  }

  normalizePlayerUrlCandidate(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) {
      return null;
    }

    const match = value.match(
      /(?:https?:\/\/[^/]+)?(?:\/[a-z]{2})?\/players\/(\d{6,})(?:[/?#]|$)/i
    );
    if (!match) {
      return null;
    }

    return `${this.baseUrl}/players/${match[1]}`;
  }

  addLinkCandidate(linkSet, candidate, maxPlayers) {
    if (linkSet.size >= maxPlayers) {
      return;
    }

    const normalized = this.normalizePlayerUrlCandidate(candidate);
    if (!normalized) {
      return;
    }

    linkSet.add(normalized);
  }

  extractPlayerUrlsFromHtml(html, maxPlayers) {
    const urls = new Set();

    const regexes = [
      /href="((?:\/[a-z]{2})?\/players\/\d{6,}(?:[^"]*)?)"/g,
      /href=\\"((?:\\\/[a-z]{2})?\\\/players\\\/\d{6,}(?:[^"]*)?)\\"/g,
      /"playerId":"(\d{6,})"/g,
      /\\"playerId\\":\\"(\d{6,})\\"/g
    ];

    for (const regex of regexes) {
      for (const match of html.matchAll(regex)) {
        if (match[1]) {
          const candidate = String(match[1]).replace(/\\\//g, '/');
          if (/^\d{6,}$/.test(candidate)) {
            this.addLinkCandidate(urls, `/players/${candidate}`, maxPlayers);
          } else {
            this.addLinkCandidate(urls, candidate, maxPlayers);
          }
        }
      }
    }

    return [...urls];
  }

  async extractPlayerUrlsFromDom(page, maxPlayers) {
    const urls = new Set();

    const hrefs = await page
      .$$eval('a[href*="/players/"]', (anchors) =>
        anchors.map((anchor) => anchor.getAttribute('href') || '')
      )
      .catch(() => []);

    for (const href of hrefs) {
      this.addLinkCandidate(urls, href, maxPlayers);
    }

    return [...urls];
  }

  async discoverPlayerLinks({ maxPlayers = 40 } = {}) {
    const context = await this.createStealthContext();
    const page = await context.newPage();

    const links = new Set();
    const sources = [this.playerListUrl, this.baseUrl];

    try {
      for (const source of sources) {
        await this.gotoWithDelay(page, source);

        // Scroll to trigger lazy content before extracting links.
        await page.evaluate(() => {
          const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
          let moved = 0;

          for (let i = 0; i < 6; i += 1) {
            window.scrollBy(0, step);
            moved += step;
          }

          if (moved > 0) {
            window.scrollTo(0, 0);
          }
        }).catch(() => null);
        await sleep(1000);

        const domLinks = await this.extractPlayerUrlsFromDom(page, maxPlayers);
        for (const link of domLinks) {
          if (links.size >= maxPlayers) {
            break;
          }
          links.add(link);
        }

        const html = await page.content();
        const discovered = this.extractPlayerUrlsFromHtml(html, maxPlayers);

        for (const link of discovered) {
          if (links.size >= maxPlayers) {
            break;
          }
          links.add(link);
        }

        // eslint-disable-next-line no-console
        console.log(`[scraper] source=${source} total_links=${links.size}`);

        if (links.size >= maxPlayers) {
          break;
        }
      }

      return [...links];
    } finally {
      await context.close();
    }
  }

  parsePossiblyEscapedJson(rawObjectString) {
    if (!rawObjectString) {
      return null;
    }

    const candidates = [
      rawObjectString,
      rawObjectString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    ];

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch (error) {
        // ignore
      }
    }

    return null;
  }

  findJsonObject(content, key) {
    const patterns = [`\\"${key}\\":{`, `"${key}":{`];

    for (const pattern of patterns) {
      const keyStart = content.indexOf(pattern);
      if (keyStart === -1) {
        continue;
      }

      const braceStart = content.indexOf('{', keyStart);
      if (braceStart === -1) {
        continue;
      }

      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = braceStart; i < content.length; i += 1) {
        const char = content[i];

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (char === '\\') {
            escaped = true;
          } else if (char === '"') {
            inString = false;
          }
          continue;
        }

        if (char === '"') {
          inString = true;
          continue;
        }

        if (char === '{') {
          depth += 1;
          continue;
        }

        if (char === '}') {
          depth -= 1;
          if (depth === 0) {
            return content.slice(braceStart, i + 1);
          }
        }
      }
    }

    return null;
  }

  findJsonArray(content, key) {
    const patterns = [`\\"${key}\\":[`, `"${key}":[`];

    for (const pattern of patterns) {
      const keyStart = content.indexOf(pattern);
      if (keyStart === -1) {
        continue;
      }

      const bracketStart = content.indexOf('[', keyStart);
      if (bracketStart === -1) {
        continue;
      }

      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = bracketStart; i < content.length; i += 1) {
        const char = content[i];

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (char === '\\') {
            escaped = true;
          } else if (char === '"') {
            inString = false;
          }
          continue;
        }

        if (char === '"') {
          inString = true;
          continue;
        }

        if (char === '[') {
          depth += 1;
          continue;
        }

        if (char === ']') {
          depth -= 1;
          if (depth === 0) {
            return content.slice(bracketStart, i + 1);
          }
        }
      }
    }

    return null;
  }

  extractNextFlightPayload(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    const chunks = [];
    const regex = /<script>self\.__next_f\.push\(\[\d+,"([\s\S]*?)"\]\)<\/script>/g;

    for (const match of content.matchAll(regex)) {
      const rawChunk = match[1];
      if (!rawChunk) {
        continue;
      }

      try {
        const decoded = JSON.parse(`"${rawChunk}"`);
        if (decoded) {
          chunks.push(decoded);
        }
      } catch (error) {
        // ignore malformed chunk
      }
    }

    return chunks.join('\n');
  }

  extractPlayerSnapshot(content) {
    const nextFlightPayload = this.extractNextFlightPayload(content);
    const source = nextFlightPayload || content;

    const playerRaw =
      this.findJsonObject(source, 'player') || this.findJsonObject(content, 'player');
    const baseStatsRaw =
      this.findJsonObject(source, 'baseStats') || this.findJsonObject(content, 'baseStats');
    const additionalPositionsRaw =
      this.findJsonArray(source, 'additionalPositions') ||
      this.findJsonArray(content, 'additionalPositions');

    const player = this.parsePossiblyEscapedJson(playerRaw) || {};
    const baseStats = this.parsePossiblyEscapedJson(baseStatsRaw) || {};
    const additionalPositions =
      this.parsePossiblyEscapedJson(additionalPositionsRaw) || [];

    const initialLevelCapMatch =
      source.match(/\\"initialLevelCap\\":(\d+)/) ||
      source.match(/"initialLevelCap":(\d+)/) ||
      content.match(/\\"initialLevelCap\\":(\d+)/) ||
      content.match(/"initialLevelCap":(\d+)/);
    const positionMatch =
      source.match(/\\"position\\":\\"([A-Z]{2,3})\\"/) ||
      source.match(/"position":"([A-Z]{2,3})"/) ||
      content.match(/\\"position\\":\\"([A-Z]{2,3})\\"/) ||
      content.match(/"position":"([A-Z]{2,3})"/);

    return {
      player,
      baseStats,
      additionalPositions: Array.isArray(additionalPositions) ? additionalPositions : [],
      position: positionMatch ? String(positionMatch[1] || '').toUpperCase() : null,
      initialLevelCap: initialLevelCapMatch ? Number(initialLevelCapMatch[1]) : null
    };
  }

  normalizeStats(statsObject) {
    const normalized = {};

    Object.entries(statsObject || {}).forEach(([rawKey, value]) => {
      const numeric = toNumber(value);
      if (numeric === null) {
        return;
      }

      const aliasKey = toStatAliasKey(rawKey);
      const key = STAT_KEY_ALIASES[aliasKey];
      if (!key) {
        return;
      }

      normalized[key] = Math.round(numeric);
    });

    return normalized;
  }

  async extractDisplayedStats(page) {
    const rows = await page
      .$$eval(
        '#player-screenshot-root div.flex.items-center.justify-between.gap-2.rounded, #player-screenshot-root div.flex.justify-between.items-center',
        (elements) =>
          elements.reduce((output, row) => {
            const label =
              row.querySelector('span.truncate')?.textContent?.trim() ||
              row.querySelector('span:first-child')?.textContent?.trim() ||
              '';

            const inlineValues = Array.from(row.querySelectorAll('span.inline-flex'))
              .map((node) => node.textContent?.trim() || '')
              .filter((text) => /\d/.test(text));
            const valueText =
              inlineValues[inlineValues.length - 1] ||
              row.querySelector('span:last-child')?.textContent?.trim() ||
              '';

            if (!label || !valueText) {
              return output;
            }

            const matched = valueText.match(/\d+(?:\.\d+)?/);
            if (!matched) {
              return output;
            }

            output[label] = Number(matched[0]);
            return output;
          }, {})
      )
      .catch(() => ({}));

    return this.normalizeStats(rows);
  }

  getStatsShapeScore(statsObject) {
    const values = Object.values(statsObject || {}).filter((value) =>
      Number.isFinite(Number(value))
    );
    const count = values.length;
    if (count === 0) {
      return -100;
    }

    const histogram = values.reduce((acc, value) => {
      const key = String(Math.round(Number(value)));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const mostCommon = Math.max(...Object.values(histogram));
    const dominantRatio = mostCommon / count;
    const suspiciousUniform = count >= 18 && dominantRatio >= 0.8;

    return count - (suspiciousUniform ? 20 : 0);
  }

  pickBestStats(candidates) {
    const validCandidates = (Array.isArray(candidates) ? candidates : []).map((candidate) =>
      this.normalizeStats(candidate)
    );

    if (validCandidates.length === 0) {
      return {};
    }

    const ranked = validCandidates
      .map((stats) => ({ stats, score: this.getStatsShapeScore(stats) }))
      .sort((a, b) => b.score - a.score);

    return ranked[0]?.stats || {};
  }

  async extractLevelCapFromDom(page) {
    const levelCap = await page
      .evaluate(() => {
        const normalizedText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

        const allNodes = Array.from(document.querySelectorAll('#player-screenshot-root *'));
        for (const node of allNodes) {
          const text = normalizedText(node.textContent);
          if (!/level cap/i.test(text)) {
            continue;
          }

          const inlineMatch = text.match(/level cap[^0-9]*(\d{1,3})/i);
          if (inlineMatch) {
            return Number(inlineMatch[1]);
          }

          const parentText = normalizedText(node.parentElement?.textContent);
          const parentMatch = parentText.match(/level cap[^0-9]*(\d{1,3})/i);
          if (parentMatch) {
            return Number(parentMatch[1]);
          }
        }

        return null;
      })
      .catch(() => null);

    return toNumber(levelCap);
  }

  async triggerProgressionToMax(page) {
    const clickedAuto = await page
      .evaluate(() => {
        const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const hints = ['auto max', 'maximise ovr', 'maximize ovr', 'max ovr', 'max all'];
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const target = buttons.find((button) => {
          const title = normalize(button.getAttribute('title'));
          const label = normalize(button.getAttribute('aria-label'));
          const text = normalize(button.textContent);

          return hints.some((hint) => title.includes(hint) || label.includes(hint) || text.includes(hint));
        });

        if (!target) {
          return false;
        }

        target.click();
        return true;
      })
      .catch(() => false);

    if (clickedAuto) {
      await sleep(1200);
    }

    const changed = await page
      .$$eval(
        [
          'input.stat-slider-input[type="range"]',
          'input.mobile-prog-slider[type="range"]',
          '#player-screenshot-root input[type="range"]'
        ].join(', '),
        (inputs) => {
          let adjusted = 0;

          inputs.forEach((input) => {
            const min = Number(input.min || 0);
            const max = Number(input.max || input.getAttribute('aria-valuemax') || 0);
            if (!Number.isFinite(max) || max <= min) {
              return;
            }

            input.value = String(max);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            adjusted += 1;
          });

          return adjusted;
        }
      )
      .catch(() => 0);

    if (changed > 0) {
      await sleep(1500);
    }

    return clickedAuto || changed > 0;
  }

  async extractText(page, selectors) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if ((await locator.count()) === 0) {
        continue;
      }

      const text = ((await locator.textContent()) || '').replace(/\s+/g, ' ').trim();
      if (text) {
        return text;
      }
    }

    return null;
  }

  dedupe(values) {
    return [...new Set(values.filter(Boolean))];
  }

  deriveIdFromUrl(url) {
    const clean = url.split('?')[0].replace(/\/$/, '');
    const segments = clean.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  }

  toAbsoluteUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    if (raw.startsWith('//')) {
      return `https:${raw}`;
    }

    if (raw.startsWith('/')) {
      return `${this.baseUrl}${raw}`;
    }

    return raw;
  }

  buildCardType(playerType) {
    const numeric = toNumber(playerType);
    if (numeric === null) {
      return 'Unknown';
    }

    return PLAYER_TYPE_MAP[numeric] || `Type ${numeric}`;
  }

  async scrapePlayerByUrl(playerUrl) {
    const context = await this.createStealthContext();
    const page = await context.newPage();

    try {
      await this.gotoWithDelay(page, playerUrl);

      const html = await page.content();
      const snapshot = this.extractPlayerSnapshot(html);
      const playerData = snapshot.player || {};

      const level1StatsFromDom = await this.extractDisplayedStats(page);
      const dynamicTriggered = await this.triggerProgressionToMax(page);
      const maxStatsFromDom = await this.extractDisplayedStats(page);
      const levelCapFromDom = await this.extractLevelCapFromDom(page);

      const baseStats = this.pickBestStats([snapshot.baseStats, level1StatsFromDom]);
      const maxStats = this.pickBestStats([maxStatsFromDom, snapshot.baseStats, level1StatsFromDom]);

      const fallbackName = await this.extractText(page, ['#player-screenshot-root h1', 'h1']);
      const efhubId = this.deriveIdFromUrl(playerUrl);

      const additionalPositions = Array.isArray(playerData.additionalPositions)
        ? playerData.additionalPositions
        : snapshot.additionalPositions;

      const positions = this.dedupe([
        (playerData.position || snapshot.position || '').toUpperCase(),
        ...(Array.isArray(additionalPositions)
          ? additionalPositions.map((entry) => String(entry.position || '').toUpperCase())
          : [])
      ]);

      const playstyles = this.dedupe([
        playerData.playingStyle ? toTitleCaseFromSlug(playerData.playingStyle) : null,
        ...(Array.isArray(playerData.comSkills)
          ? playerData.comSkills.map((skill) => toTitleCaseFromSlug(skill))
          : [])
      ]);

      const skills = this.dedupe(
        Array.isArray(playerData.skills)
          ? playerData.skills.map((skill) => toTitleCaseFromSlug(skill))
          : []
      );

      const levelCap =
        toNumber(playerData.levelCap) ||
        toNumber(snapshot.initialLevelCap) ||
        toNumber(levelCapFromDom) ||
        1;

      const title = await page.title().catch(() => '');
      const titleOverallMatch = String(title || '').match(/(\d{2,3})\s*OVR/i);
      const overall = toNumber(playerData.overallRating) || toNumber(titleOverallMatch?.[1]);
      const imageUrl =
        this.toAbsoluteUrl(playerData.imageUrl) ||
        this.toAbsoluteUrl(
          await page
            .$eval('#player-screenshot-root img', (img) => img.getAttribute('src'))
            .catch(() => null)
        );

      return {
        efhubId,
        slug: playerData.slug || efhubId,
        name: playerData.name || fallbackName || `Player ${efhubId}`,
        shortName: playerData.name || fallbackName || `Player ${efhubId}`,
        nationality: playerData.nationality || '',
        club: playerData.team || '',
        league: playerData.league || '',
        positions,
        cardType: this.buildCardType(playerData.playerType),
        rarity: this.buildCardType(playerData.playerType),
        overall: {
          base: overall,
          max: overall
        },
        levels: {
          current: 1,
          max: levelCap
        },
        stats: {
          level1: baseStats,
          maxLevel: maxStats,
          perLevel: []
        },
        skills,
        playstyles,
        condition: {
          form: toConditionGrade(playerData.condition ?? playerData.form),
          injuryResistance: toNumber(playerData.injuryResistance)
        },
        images: {
          card: imageUrl,
          portrait: imageUrl,
          thumbnail: imageUrl
        },
        source: {
          site: 'efhub.com',
          playerUrl,
          scrapedAt: new Date(),
          parser: dynamicTriggered ? 'players-route-dynamic' : 'players-route-static'
        }
      };
    } finally {
      await context.close();
    }
  }

  async upsertPlayer(playerData) {
    if (!this.persistToDb) {
      return null;
    }

    await Player.findOneAndUpdate(
      { efhubId: playerData.efhubId },
      { $set: playerData },
      { upsert: true, new: true }
    );

    return playerData;
  }

  async scrapeAndUpsertPlayers({ maxPlayers = 25, persistToDb = this.persistToDb } = {}) {
    this.persistToDb = persistToDb;
    await this.launch();

    const links = await this.discoverPlayerLinks({ maxPlayers });
    const results = {
      attempted: 0,
      success: 0,
      failed: 0,
      links,
      players: []
    };

    for (const link of links) {
      results.attempted += 1;

      try {
        const playerDoc = await this.scrapePlayerByUrl(link);
        if (this.persistToDb) {
          await this.upsertPlayer(playerDoc);
        }

        results.players.push(playerDoc);

        results.success += 1;
        // eslint-disable-next-line no-console
        console.log(
          `[scraper] ${this.persistToDb ? 'upserted' : 'scraped'} player ${playerDoc.efhubId} - ${playerDoc.name}`
        );
      } catch (error) {
        results.failed += 1;
        // eslint-disable-next-line no-console
        console.error(`[scraper] failed for ${link}`, error.message);
      }
    }

    return results;
  }
}

module.exports = EfhubScraper;
