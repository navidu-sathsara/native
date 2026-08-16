/**
 * Tebex Gaming Payment Gateway Client
 * Handles Tebex Headless Basket API, Webhook verification, and Package Provisioning
 */
const crypto = require('crypto');

class TebexClient {
  constructor() {
    this.publicToken = process.env.TEBEX_PUBLIC_TOKEN || '';
    this.secretKey = process.env.TEBEX_SECRET_KEY || '';
    this.webhookSecret = process.env.TEBEX_WEBHOOK_SECRET || '';
    this.webstoreUrl = process.env.TEBEX_WEBSTORE_URL || '';
  }

  isConfigured() {
    return Boolean(this.publicToken || this.secretKey || this.webstoreUrl);
  }

  /**
   * Fetches all packages created under this Tebex Webstore
   */
  async getPackages() {
    if (!this.publicToken) return [];
    try {
      const res = await fetch(`https://headless.tebex.io/api/accounts/${this.publicToken}/packages`);
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json.data) ? json.data : [];
      }
    } catch (e) {
      console.error('Failed to fetch Tebex packages:', e);
    }
    return [];
  }

  /**
   * Creates a Tebex Headless Basket, attaches the matching package, and returns checkout URL
   */
  async createCheckoutSession({ user, planId, tierCfg, returnUrl, isPromo, customLimits }) {
    const baseUrl = returnUrl || 'http://localhost:3318';
    const successUrl = `${baseUrl}/billing?tebex_status=success&plan_id=${encodeURIComponent(planId)}&amount=${tierCfg.price}`;
    const cancelUrl = `${baseUrl}/billing?cancel=true`;

    if (this.publicToken) {
      try {
        // 1. Fetch available packages from Tebex
        const packages = await this.getPackages();

        // 2. Create the empty basket
        const createBasketRes = await fetch(`https://headless.tebex.io/api/accounts/${this.publicToken}/baskets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            complete_url: successUrl,
            cancel_url: cancelUrl,
            custom: {
              userId: user.id,
              userEmail: user.email,
              planId: planId,
              isPromo: isPromo ? 'true' : 'false',
              maxBots: String(tierCfg.maxBots),
              maxProxies: String(tierCfg.maxProxies),
              customLimits: JSON.stringify(customLimits || {})
            }
          })
        });

        if (!createBasketRes.ok) {
          const errText = await createBasketRes.text();
          throw new Error(`Failed to create Tebex basket: ${errText}`);
        }

        const basketData = await createBasketRes.json();
        const ident = basketData.data?.ident;
        if (!ident) throw new Error('No basket identifier returned by Tebex');

        // 3. Attach package to basket if packages are configured in Tebex
        if (packages.length > 0) {
          // Find package by plan name or matching price or id
          const targetPlanName = (tierCfg.name || '').toLowerCase();
          const matched = packages.find(p => {
            const pName = (p.name || '').toLowerCase();
            return pName.includes(planId.toLowerCase()) ||
                   pName.includes(targetPlanName) ||
                   Math.abs(Number(p.total_price || p.price || 0) - Number(tierCfg.price)) < 0.05;
          }) || packages[0];

          if (matched && matched.id) {
            const addPkgRes = await fetch(`https://headless.tebex.io/api/baskets/${ident}/packages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ package_id: matched.id })
            });
            if (!addPkgRes.ok) {
              console.warn('Could not attach package to basket:', await addPkgRes.text());
            }
          }
        } else {
          return {
            ok: false,
            reason: 'Tebex Store requires at least 1 Package created in Tebex Dashboard (Webstore -> Packages) to accept payments!'
          };
        }

        const checkoutLink = basketData.data?.links?.checkout || `https://checkout.tebex.io/checkout/${ident}`;
        return { ok: true, url: checkoutLink };
      } catch (err) {
        console.error('Tebex Headless API error:', err);
        return { ok: false, reason: err.message };
      }
    }

    return {
      ok: false,
      reason: 'Tebex is not configured with a valid Public Token'
    };
  }

  /**
   * Verify Tebex Webhook signature (X-BC-Sig or secret match)
   */
  verifyWebhook(reqBody, signatureHeader) {
    if (!this.webhookSecret) return true;
    try {
      const computed = crypto.createHmac('sha256', this.webhookSecret).update(typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody)).digest('hex');
      return computed === signatureHeader || signatureHeader === this.webhookSecret;
    } catch {
      return false;
    }
  }
}

module.exports = { TebexClient, tebex: new TebexClient() };
