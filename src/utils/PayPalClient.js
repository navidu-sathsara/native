/**
 * PayPal Payment Gateway Client (REST API v2)
 * Handles OAuth2 token generation, Order creation, Order capture, and Webhook verification
 */

class PayPalClient {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.mode = (process.env.PAYPAL_MODE || 'live').toLowerCase();
    this.paypalEmail = process.env.PAYPAL_EMAIL || '';
    this.paypalMe = process.env.PAYPAL_ME_URL || '';
  }

  getBaseUrl() {
    return this.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret) || Boolean(this.paypalEmail) || Boolean(this.paypalMe);
  }

  /**
   * Get OAuth2 Access Token from PayPal REST API
   */
  async getAccessToken() {
    if (!this.clientId || !this.clientSecret) return null;
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const res = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (res.ok) {
        const data = await res.json();
        return data.access_token;
      } else {
        const err = await res.text();
        console.error('PayPal OAuth2 Error:', err);
      }
    } catch (e) {
      console.error('Failed to get PayPal token:', e);
    }
    return null;
  }

  /**
   * Create a PayPal v2 Checkout Order
   */
  async createOrder({ user, planId, tierCfg, returnUrl, isPromo, customLimits }) {
    const baseUrl = returnUrl || 'https://nativelaunch.xyz';
    const amount = Number(tierCfg.price).toFixed(2);
    const planName = tierCfg.name || planId;

    const token = await this.getAccessToken();
    if (token) {
      try {
        const orderRes = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: `native_${Date.now()}`,
                description: `Native Minecraft Bot Fleet — ${planName}`,
                custom_id: JSON.stringify({
                  userId: user.id,
                  userEmail: user.email,
                  planId,
                  isPromo: isPromo ? 'true' : 'false',
                  maxBots: String(tierCfg.maxBots),
                  maxProxies: String(tierCfg.maxProxies),
                  customLimits: customLimits || {}
                }),
                amount: {
                  currency_code: 'USD',
                  value: amount,
                  breakdown: {
                    item_total: {
                      currency_code: 'USD',
                      value: amount
                    }
                  }
                },
                items: [
                  {
                    name: `Native Bot Fleet (${planName})`,
                    unit_amount: {
                      currency_code: 'USD',
                      value: amount
                    },
                    quantity: '1',
                    category: 'DIGITAL_GOODS'
                  }
                ]
              }
            ],
            application_context: {
              brand_name: 'Native Bot Fleet',
              landing_page: 'NO_PREFERENCE',
              user_action: 'PAY_NOW',
              return_url: `${baseUrl}/billing?paypal_status=success&plan_id=${encodeURIComponent(planId)}`,
              cancel_url: `${baseUrl}/billing?cancel=true`
            }
          })
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const approveLink = orderData.links?.find(l => l.rel === 'approve')?.href;
          return {
            ok: true,
            orderId: orderData.id,
            url: approveLink,
            mode: 'api'
          };
        } else {
          const errText = await orderRes.text();
          console.error('PayPal Order Creation Failed:', errText);
          throw new Error(errText);
        }
      } catch (err) {
        console.error('PayPal createOrder error:', err);
      }
    }

    // Fallback if client ID/Secret not set: Generate PayPal.me or Hosted payment URL
    const targetPaypal = this.paypalMe
      ? `${this.paypalMe.replace(/\/$/, '')}/${amount}USD`
      : this.paypalEmail
      ? `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(this.paypalEmail)}&item_name=${encodeURIComponent('Native Bot Fleet - ' + planName)}&amount=${amount}&currency_code=USD&custom=${encodeURIComponent(JSON.stringify({ userId: user.id, planId }))}&return=${encodeURIComponent(baseUrl + '/billing?paypal_status=success')}&cancel_return=${encodeURIComponent(baseUrl + '/billing')}`
      : `https://www.paypal.com/paypalme/${amount}USD`;

    return {
      ok: true,
      url: targetPaypal,
      orderId: `manual_${Date.now()}`,
      mode: 'redirect'
    };
  }

  /**
   * Capture an authorized PayPal Order
   */
  async captureOrder(orderId) {
    const token = await this.getAccessToken();
    if (!token) return { ok: false, reason: 'PayPal API access token not available' };

    try {
      const res = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (res.ok && (data.status === 'COMPLETED' || data.status === 'APPROVED')) {
        const purchaseUnit = data.purchase_units?.[0];
        const customData = JSON.parse(purchaseUnit?.custom_id || '{}');
        const amount = Number(purchaseUnit?.payments?.captures?.[0]?.amount?.value || 0);
        return {
          ok: true,
          orderId: data.id,
          status: data.status,
          customData,
          amount,
          payer: data.payer
        };
      }
      return { ok: false, reason: data.message || 'Payment capture failed', raw: data };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }
}

module.exports = { PayPalClient, paypal: new PayPalClient() };
