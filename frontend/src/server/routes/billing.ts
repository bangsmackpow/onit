// api/src/routes/billing.ts
import { Hono } from 'hono'
import Stripe from 'stripe'
import { Env, Variables } from '../types'

const billing = new Hono<{ Bindings: Env, Variables: Variables }>()

// ============================================================================
// CREATE CHECKOUT SESSION
// ============================================================================
billing.post('/create-checkout-session', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)

    // 1. Get tenant info
    const tenantRes = await c.env.DB
      .prepare('SELECT id, name, stripe_customer_id FROM tenants WHERE id = ?')
      .bind(tenantId)
      .first() as any

    if (!tenantRes) return c.json({ error: 'Tenant not found' }, 404)

    // 2. Create or Retrieve Customer
    let customerId = tenantRes.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: tenantRes.name,
        metadata: { tenantId }
      })
      customerId = customer.id
      await c.env.DB
        .prepare('UPDATE tenants SET stripe_customer_id = ? WHERE id = ?')
        .bind(customerId, tenantId)
        .run()
    }

    // 3. Create Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ONIT Premium (Household Package)',
              description: 'Family Sharing, R2 Media Storage, and Unlimited Reminders',
            },
            unit_amount: 499, // $4.99
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${c.req.header('Origin')}/dashboard?checkout=success`,
      cancel_url: `${c.req.header('Origin')}/dashboard/family?checkout=cancel`,
      metadata: { tenantId }
    })

    return c.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }
})

// ============================================================================
// STRIPE WEBHOOK
// ============================================================================
billing.post('/webhook', async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY)
  const signature = c.req.header('stripe-signature') as string
  const body = await c.req.text()

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed', err.message)
    return c.text(`Webhook Error: ${err.message}`, 400)
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const tenantId = session.metadata?.tenantId
    const subscriptionId = session.subscription as string

    if (tenantId) {
      await c.env.DB
        .prepare("UPDATE tenants SET plan = 'premium', stripe_subscription_id = ? WHERE id = ?")
        .bind(subscriptionId, tenantId)
        .run()
      
      console.log(`Tenant ${tenantId} upgraded to Premium`)
    }
  }

  return c.json({ received: true })
})

export default billing
