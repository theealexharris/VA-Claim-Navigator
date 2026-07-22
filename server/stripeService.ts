import { getUncachableStripeClient } from './stripeClient';

export class StripeService {
  // Verify a promotion code exists and is active
  async verifyPromotionCode(promotionCodeId: string): Promise<{ valid: boolean; code?: string; percentOff?: number; amountOff?: number; error?: string }> {
    const stripe = await getUncachableStripeClient();
    try {
      const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId, { expand: ['coupon'] }) as any;

      if (!promotionCode.active) {
        return { valid: false, error: 'Promotion code is not active' };
      }

      const coupon = promotionCode.coupon;
      return {
        valid: true,
        code: promotionCode.code,
        percentOff: coupon?.percent_off ?? undefined,
        amountOff: coupon?.amount_off ?? undefined,
      };
    } catch (error: any) {
      console.error('Error verifying promotion code:', error.message);
      return { valid: false, error: error.message };
    }
  }

  // List all active promotion codes
  async listPromotionCodes(): Promise<any[]> {
    const stripe = await getUncachableStripeClient();
    try {
      const promotionCodes = await stripe.promotionCodes.list({ active: true, limit: 100, expand: ['data.coupon'] }) as any;
      return promotionCodes.data.map((pc: any) => {
        const coupon = pc.coupon;
        return {
          id: pc.id,
          code: pc.code,
          active: pc.active,
          couponId: coupon?.id,
          percentOff: coupon?.percent_off,
          amountOff: coupon?.amount_off,
          restrictions: pc.restrictions,
        };
      });
    } catch (error: any) {
      console.error('Error listing promotion codes:', error.message);
      return [];
    }
  }
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async customerExists(customerId: string): Promise<boolean> {
    const stripe = await getUncachableStripeClient();
    try {
      const customer = await stripe.customers.retrieve(customerId);
      // Also treat soft-deleted customers as non-existent so a fresh one is created
      return !(customer as any).deleted;
    } catch {
      // Any error (404, resource_missing, network, wrong mode, etc.) → customer doesn't exist
      // This is a read-only check so failing safe is the correct behavior
      return false;
    }
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    promotionCode?: string,
    metadata?: { userId: string; tier: string; [key: string]: string | undefined }
  ) {
    const stripe = await getUncachableStripeClient();

    // Always show admin email in checkout contact field
    await stripe.customers.update(customerId, { email: 'ADMINDESK@VACLAIMNAVIGATOR.COM' });

    const sessionConfig: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    // Forward all provided metadata (userId, tier, addon_type, affiliate_ref, …)
    // so the webhook can act on every field — not just userId/tier.
    if (metadata?.userId && metadata?.tier) {
      const meta: Record<string, string> = {};
      for (const [k, v] of Object.entries(metadata)) {
        if (typeof v === 'string' && v.length > 0) meta[k] = v;
      }
      sessionConfig.metadata = meta;
    }

    if (promotionCode) {
      sessionConfig.discounts = [{ promotion_code: promotionCode }];
    } else {
      sessionConfig.allow_promotion_codes = true;
    }

    return await stripe.checkout.sessions.create(sessionConfig);
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }
}

export const stripeService = new StripeService();
