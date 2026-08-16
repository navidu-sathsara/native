/**
 * Promotional & Limited Time Subscription Plans Store
 * Allows Super Admins to dynamically create flash sales and limited-time deals
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_ROOT = process.env.BOTHIVE_DATA_DIR ? path.resolve(process.env.BOTHIVE_DATA_DIR) : path.join(__dirname, '../..');
const FILE = path.join(DATA_ROOT, 'system_data/promo_plans.json');

const INITIAL_PROMO_PLANS = [
  {
    id: 'promo_flash_starter',
    name: 'Flash Fleet Special',
    badge: 'LIMITED 40% OFF',
    price: 6.99,
    period: '/ month',
    maxBots: 20,
    maxProxies: 10,
    features: [
      '20 Dedicated Minecraft Bot Slots',
      '10 Dedicated Premium SOCKS5 Proxies',
      'Anti-AFK & Mining Automation Modules',
      'Real-Time SSE Live Telemetry',
      'Hot-reloading Visual Scripts & Cron Jobs'
    ],
    highlight: true,
    active: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    createdAt: new Date().toISOString()
  }
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

class PromoPlanStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(FILE)) {
        const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        return { plans: Array.isArray(parsed.plans) ? parsed.plans : [] };
      }
    } catch (e) {
      console.error('Failed to load promo plans:', e);
    }
    const initial = { plans: INITIAL_PROMO_PLANS };
    this._save(initial);
    return initial;
  }

  _save(data) {
    ensureDir(path.dirname(FILE));
    fs.writeFileSync(FILE, JSON.stringify(data || this.data, null, 2), 'utf8');
  }

  listAll() {
    return this.data.plans;
  }

  listActive() {
    const now = new Date();
    return this.data.plans.filter((p) => {
      if (!p.active) return false;
      if (p.expiresAt && new Date(p.expiresAt) < now) return false;
      return true;
    });
  }

  get(id) {
    return this.data.plans.find((p) => p.id === id) || null;
  }

  create(input) {
    const id = 'promo_' + (input.name || 'deal').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) + '_' + crypto.randomBytes(2).toString('hex');
    const newPlan = {
      id,
      name: String(input.name || 'Special Promotional Plan').trim(),
      badge: String(input.badge || 'LIMITED OFFER').trim(),
      price: Math.max(0.50, Number(input.price || 4.99)),
      period: String(input.period || '/ month').trim(),
      maxBots: Math.max(1, parseInt(input.maxBots || 5, 10)),
      maxProxies: Math.max(0, parseInt(input.maxProxies || 0, 10)),
      features: Array.isArray(input.features)
        ? input.features.filter(Boolean)
        : (typeof input.features === 'string' ? input.features.split('\n').map(s => s.trim()).filter(Boolean) : []),
      highlight: input.highlight === true,
      active: input.active !== false,
      expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
      createdAt: new Date().toISOString()
    };
    this.data.plans.unshift(newPlan);
    this._save();
    return newPlan;
  }

  update(id, patch) {
    const plan = this.get(id);
    if (!plan) return null;

    if (patch.name !== undefined) plan.name = String(patch.name).trim();
    if (patch.badge !== undefined) plan.badge = String(patch.badge).trim();
    if (patch.price !== undefined) plan.price = Math.max(0.50, Number(patch.price));
    if (patch.period !== undefined) plan.period = String(patch.period).trim();
    if (patch.maxBots !== undefined) plan.maxBots = Math.max(1, parseInt(patch.maxBots, 10));
    if (patch.maxProxies !== undefined) plan.maxProxies = Math.max(0, parseInt(patch.maxProxies, 10));
    if (patch.features !== undefined) {
      plan.features = Array.isArray(patch.features)
        ? patch.features.filter(Boolean)
        : (typeof patch.features === 'string' ? patch.features.split('\n').map(s => s.trim()).filter(Boolean) : []);
    }
    if (patch.highlight !== undefined) plan.highlight = patch.highlight === true;
    if (patch.active !== undefined) plan.active = patch.active === true;
    if (patch.expiresAt !== undefined) plan.expiresAt = patch.expiresAt ? new Date(patch.expiresAt).toISOString() : null;

    this._save();
    return plan;
  }

  delete(id) {
    const idx = this.data.plans.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.plans.splice(idx, 1);
    this._save();
    return true;
  }

  toggleActive(id) {
    const plan = this.get(id);
    if (!plan) return null;
    plan.active = !plan.active;
    this._save();
    return plan;
  }
}

module.exports = { PromoPlanStore };
