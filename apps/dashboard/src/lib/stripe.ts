import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function createBuildCharge(
  customerId: string,
  amountCents: number,
  description: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    customer: customerId,
    amount: amountCents,
    currency: 'usd',
    description,
    confirm: true,
    return_url: `${process.env.NEXTAUTH_URL}/builds`,
  });

  return paymentIntent;
}
