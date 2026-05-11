import Stripe from "stripe";
import axios from "axios";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VITE_APP_URL ||
  "http://localhost:5173";

const PRICE_MAP: Record<string, Record<string, string>> = {
  stripe: {
    pro: process.env.STRIPE_PRO_PRICE_ID!,
    investor: process.env.STRIPE_INVESTOR_PRICE_ID!,
  },

  lemonsqueezy: {
    pro: process.env.LEMONSQUEEZY_PRO_VARIANT_ID!,
    investor: process.env.LEMONSQUEEZY_INVESTOR_VARIANT_ID!,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    // =====================================================
    // AUTH
    // =====================================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Missing authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // =====================================================
    // BODY
    // =====================================================

    const {
      provider = "stripe",
      tier = "pro",
      email,
    } = req.body;

    // =====================================================
    // STRIPE
    // =====================================================

    if (provider === "stripe") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",

        payment_method_types: ["card"],

        line_items: [
          {
            price: PRICE_MAP.stripe[tier],
            quantity: 1,
          },
        ],

        success_url: `${APP_URL}/billing/success`,
        cancel_url: `${APP_URL}/pricing`,

        customer_email: email || user.email,

        metadata: {
          user_id: user.id,
          tier,
          provider: "stripe",
        },
      });

      return res.status(200).json({
        provider: "stripe",
        checkout_url: session.url,
      });
    }

    // =====================================================
    // PAYSTACK
    // =====================================================

    if (provider === "paystack") {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: email || user.email,
          amount: tier === "investor" ? 1900000 : 900000,

          metadata: {
            user_id: user.id,
            tier,
            provider: "paystack",
          },

          callback_url: `${APP_URL}/billing/success`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        provider: "paystack",
        checkout_url: response.data.data.authorization_url,
      });
    }

    // =====================================================
    // MONIEPOINT
    // =====================================================

    if (provider === "moniepoint") {
      const payload = {
        amount: tier === "investor" ? 19000 : 9000,
        currency: "NGN",
        customerName: user.email?.split("@")[0],
        customerEmail: email || user.email,

        redirectUrl: `${APP_URL}/billing/success`,

        metadata: {
          user_id: user.id,
          tier,
          provider: "moniepoint",
        },
      };

      const response = await axios.post(
        process.env.MONIEPOINT_CHECKOUT_URL!,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.MONIEPOINT_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        provider: "moniepoint",
        checkout_url:
          response.data.checkoutUrl ||
          response.data.data?.checkoutUrl,
      });
    }

    // =====================================================
    // OPAY
    // =====================================================

    if (provider === "opay") {
      const reference = crypto.randomUUID();

      const response = await axios.post(
        process.env.OPAY_CHECKOUT_URL!,
        {
          reference,
          amount: tier === "investor" ? 19000 : 9000,
          currency: "NGN",

          userInfo: {
            userEmail: email || user.email,
            userName: user.email?.split("@")[0],
          },

          callbackUrl: `${APP_URL}/billing/success`,

          metadata: {
            user_id: user.id,
            tier,
            provider: "opay",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPAY_SECRET_KEY}`,
            MerchantId: process.env.OPAY_MERCHANT_ID!,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        provider: "opay",
        checkout_url:
          response.data.cashierUrl ||
          response.data.data?.cashierUrl,
      });
    }

    // =====================================================
    // LEMON SQUEEZY
    // =====================================================

    if (provider === "lemonsqueezy") {
      const variantId = PRICE_MAP.lemonsqueezy[tier];

      const checkoutUrl =
        `https://pitchflix.lemonsqueezy.com/buy/${variantId}` +
        `?checkout[custom][user_id]=${user.id}` +
        `&checkout[custom][tier]=${tier}`;

      return res.status(200).json({
        provider: "lemonsqueezy",
        checkout_url: checkoutUrl,
      });
    }

    // =====================================================
    // UNKNOWN PROVIDER
    // =====================================================

    return res.status(400).json({
      error: "Unsupported billing provider",
    });
  } catch (error: any) {
    console.error("Billing subscribe error:", error);

    return res.status(500).json({
      error:
        error?.response?.data ||
        error.message ||
        "Internal server error",
    });
  }
}
