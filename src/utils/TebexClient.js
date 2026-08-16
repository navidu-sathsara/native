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
   * Creates a Tebex Headless Basket and returns the checkout redirect URL
   */
  async createCheckoutSession({ user, planId, tierCfg, returnUrl, isPromo, customLimits }) {
    const baseUrl = returnUrl || 'http://localhost:3318';
    const successUrl = `${baseUrl}/billing?tebex_status=success&plan_id=${encodeURIComponent(planId)}&amount=${tierCfg.price}`;
    const cancelUrl = `${baseUrl}/billing?cancel=true`;

    // 1. If Tebex Headless Public Token is configured
    if (this.publicToken) {
      try {
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

        if (createBasketRes.ok) {
          const basketData = await createBasketRes.json();
          const checkoutLink = basketData.data?.links?.checkout || (basketData.data?.ident ? `https://checkout.tebex.io/checkout/${basketData.data.ident}` : null);
          if (checkoutLink) {
            return { ok: true, url: checkoutLink };
          }
        }
      } catch (err) {
        console.error('Tebex Headless API error:', err);
      }
    }

    // 2. If Tebex Webstore URL is configured or Default Tebex Dynamic Checkout
    const targetStore = this.webstoreUrl ? this.webstoreUrl.replace(/\/$/, '') : 'https://checkout.tebex.io';
    const checkoutUrl = `${targetStore}?custom=${encodeURIComponent(JSON.stringify({
      userId: user.id,
      email: user.email,
      planId: planId,
      price: tierCfg.price,
      name: tierCfg.name,
      maxBots: tierCfg.maxBots,
      maxProxies: tierCfg.maxProxies,
    }))}&return_url=${encodeURIComponent(successUrl)}`;

    return {
      ok: true,
      url: checkoutUrl,
      note: this.publicToken ? undefined : 'Configured via Tebex Webstore checkout'
    };
  }

  /**
   * Verify Tebex Webhook signature (X-BC-Sig or secret match)
   */
  verifyWebhook(reqBody, signatureHeader) {
    if (!this.webhookSecret) return true; // If no secret configured, allow with caution
    try {
      const computed = crypto.createHmac('sha256', this.webhookSecret).update(typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody)).digest('hex');
      return computed === signatureHeader || signatureHeader === this.webhookSecret;
    } catch {
      return false;
    }
  }
}

module.exports = { TebexClient, tebex: new TebexClient() };
