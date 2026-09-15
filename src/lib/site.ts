// Central public contact points — dual-track for local (ID) + global (US/EU/AU/SG) buyers.
//
// TODO(owner): replace CALENDLY_URL with your real scheduling link
// (Calendly or Google Meet scheduler). Everything else already works.
export const SITE = {
  email: "hello@alvineitsolutions.com",
  phoneDisplay: "+62 857-0304-9632",
  // Pre-filled WhatsApp thread — English so both markets can use it.
  whatsapp:
    "https://wa.me/6285703049632?text=Hi%20Alvine%20IT%20Solution%2C%20I%27d%20like%20to%20discuss%20a%20project.%20My%20goal%20is...%20My%20timeline%20is...%20My%20budget%20is...",
  calendly: "https://calendly.com/alvine-it-solution/discovery",
  location: "Jakarta, Indonesia (GMT+7)",
  // Payments split by market — shown in Engagement + Footer.
  paymentsLocal: ["BCA", "Mandiri", "QRIS", "IDR transfer"],
  paymentsGlobal: ["Wise", "PayPal", "Stripe", "USD/SGD wire"],
} as const;
