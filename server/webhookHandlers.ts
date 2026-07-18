import Stripe from 'stripe';
import { getUncachableStripeClient } from './stripeClient';
import { InsforgeStorageService } from './insforge-storage-service';
import * as affiliateStore from './affiliateStore';

const storage = new InsforgeStorageService();

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not set; webhook events will not be processed.');
      throw new Error('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      const stripe = await getUncachableStripeClient();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
      throw new Error('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const rawTier = (session.metadata?.tier as string) || 'pro';
        const addonType = session.metadata?.addon_type;
        const validTiers = ['starter', 'pro', 'deluxe', 'business'];
        const tier = validTiers.includes(rawTier) ? rawTier : 'pro';
        if (userId) {
          try {
            if (addonType === 'supplemental_statement') {
              // Add-on purchase: grant 1 additional statement, do not change tier
              await storage.incrementSupplementalAllowed(userId, 1, undefined);
              console.log(`[STRIPE WEBHOOK] Granted 1 extra supplemental statement to user ${userId}`);
            } else {
              // Normal plan purchase: update tier
              await storage.updateUser(userId, {
                subscription_tier: tier as any,
                stripe_subscription_id: session.subscription as string || undefined,
              });
              console.log(`[STRIPE WEBHOOK] Updated user ${userId} to tier ${tier}`);
              // Grant 2 supplemental statements on first paid plan purchase
              if (tier === 'pro' || tier === 'deluxe' || tier === 'business') {
                const status = await storage.getSupplementalStatus(userId, undefined);
                if (status.allowed === 0) {
                  await storage.incrementSupplementalAllowed(userId, 2, undefined);
                  console.log(`[STRIPE WEBHOOK] Granted 2 supplemental statements to new ${tier} user ${userId}`);
                }
              }
            }
          } catch (e: any) {
            console.error('[STRIPE WEBHOOK] Failed to update user:', e.message);
          }
        }

        // Affiliate attribution: if the checkout carried an affiliate_ref, credit
        // the referring affiliate with their commission on the amount paid.
        const affiliateRef = session.metadata?.affiliate_ref;
        if (affiliateRef && addonType !== 'supplemental_statement') {
          try {
            const amountPaid = (session.amount_total ?? 0) / 100; // cents → dollars
            const email = session.customer_details?.email || session.customer_email || 'referral';
            const referral = affiliateStore.recordConversion(affiliateRef, email, amountPaid);
            if (referral) {
              console.log(`[AFFILIATE] Conversion for code ${affiliateRef}: $${referral.monthlyEarn.toFixed(2)} commission`);
            } else {
              console.log(`[AFFILIATE] Conversion carried unknown code ${affiliateRef} — skipped`);
            }
          } catch (e: any) {
            console.error('[AFFILIATE] Failed to record conversion:', e.message);
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const tier = subscription.status === 'active' ? 'pro' : 'starter';
        try {
          const stripe = await getUncachableStripeClient();
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && customer.metadata?.userId) {
            await storage.updateUser(customer.metadata.userId, {
              subscription_tier: tier as any,
              stripe_subscription_id: subscription.status === 'active' ? subscription.id : undefined,
            });
            console.log(`[STRIPE WEBHOOK] Updated subscription for user ${customer.metadata.userId}`);
          }
        } catch (e: any) {
          console.error('[STRIPE WEBHOOK] Subscription update failed:', e.message);
        }
        break;
      }
      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }
  }
}
