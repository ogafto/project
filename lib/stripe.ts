import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  "sk_test_51U4VOzIlvznUtEgIUuM3x3RG44VTITD3hRZ9Nq7XLDsqPGJiJNXlmjmGHwxbXrw03jfvgSJlyGtox4NAjQEWAjxQ00X8tq9yFt";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  typescript: true,
});
