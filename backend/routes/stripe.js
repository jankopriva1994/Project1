const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Mapování Price ID → počet tokenů (z .env)
function getTokensForPrice(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_BASIC]:      parseInt(process.env.TOKENS_BASIC)      || 50000,
    [process.env.STRIPE_PRICE_PRO]:        parseInt(process.env.TOKENS_PRO)        || 200000,
    [process.env.STRIPE_PRICE_ENTERPRISE]: parseInt(process.env.TOKENS_ENTERPRISE) || 1000000,
  };
  return map[priceId] || 0;
}

function getPlanName(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_BASIC]:      'basic',
    [process.env.STRIPE_PRICE_PRO]:        'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise',
  };
  return map[priceId] || 'unknown';
}

// ── POST /api/stripe/create-checkout ──────────────────────────
// Vytvoří Stripe Checkout session a vrátí URL
router.post('/create-checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;
  if (!priceId) return res.status(400).json({ error: 'Chybí priceId' });

  try {
    // Najdi nebo vytvoř Stripe customer
    let { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', req.user.id)
      .single();

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || profile.email,
        metadata: { supabase_id: req.user.id }
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/administrace.html?payment=success`,
      cancel_url:  `${process.env.FRONTEND_URL}/administrace.html?payment=cancelled`,
      metadata: { supabase_id: req.user.id }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Chyba při vytváření platby' });
  }
});

// ── POST /api/stripe/portal ───────────────────────────────────
// Stripe Customer Portal – správa karet, zrušení
router.post('/portal', requireAuth, async (req, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', req.user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return res.status(400).json({ error: 'Nemáte aktivní předplatné' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/administrace.html`
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Chyba při otevírání portálu' });
  }
});

// ── POST /api/stripe/webhook ───────────────────────────────────
// Stripe posílá události sem – zde přidáváme tokeny po platbě
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // Nové předplatné nebo obnova
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const priceId    = invoice.lines.data[0]?.price?.id;
        const subId      = invoice.subscription;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) break;

        const tokens   = getTokensForPrice(priceId);
        const planName = getPlanName(priceId);

        // Přidej tokeny
        await supabase.rpc('increment_tokens', {
          p_user_id: profile.id,
          p_amount:  tokens
        }).catch(async () => {
          // Fallback pokud RPC neexistuje
          const { data: p } = await supabase
            .from('profiles')
            .select('tokens_balance')
            .eq('id', profile.id)
            .single();
          await supabase
            .from('profiles')
            .update({ tokens_balance: (p?.tokens_balance || 0) + tokens, plan: planName })
            .eq('id', profile.id);
        });

        // Zaznamenej transakci
        await supabase.from('token_transactions').insert({
          user_id: profile.id,
          amount: tokens,
          type: 'subscription',
          description: `Předplatné ${planName} – ${tokens.toLocaleString()} tokenů`
        });

        // Ulož/aktualizuj subscription záznam
        const periodStart = new Date(invoice.period_start * 1000).toISOString();
        const periodEnd   = new Date(invoice.period_end   * 1000).toISOString();

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: profile.id,
            stripe_customer_id:     customerId,
            stripe_subscription_id: subId,
            stripe_price_id:        priceId,
            plan_name:              planName,
            status:                 'active',
            tokens_per_period:      tokens,
            current_period_start:   periodStart,
            current_period_end:     periodEnd,
            updated_at:             new Date().toISOString()
          }, { onConflict: 'stripe_subscription_id' });

        await supabase
          .from('profiles')
          .update({ plan: planName })
          .eq('id', profile.id);

        console.log(`✅ Platba úspěšná: ${planName} pro ${profile.id}, +${tokens} tokenů`);
        break;
      }

      // Zrušení předplatného
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', sub.customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', profile.id);
        }

        console.log(`❌ Předplatné zrušeno: ${sub.id}`);
        break;
      }

      // Neúspěšná platba
      case 'invoice.payment_failed': {
        const invoice    = event.data.object;
        const customerId = invoice.customer;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_customer_id', customerId);
        }

        console.log(`⚠️ Platba selhala pro zákazníka: ${customerId}`);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
});

module.exports = router;
