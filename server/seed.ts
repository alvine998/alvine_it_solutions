import mongoose from "mongoose";
import User from "./models/User";
import Plan from "./models/Plan";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alvine_it_solution";

const SEED_PLANS = [
  {
    name: "Starter",
    price: 150000,
    credits: 500,
    duration_days: 30,
    cost_per_credit: 300,
    status: "active" as const,
    features: [
      "500 credits / month",
      "Model: auto",
      "Dashboard & usage logs",
      "Community support",
      "!No team seats",
    ],
  },
  {
    name: "Pro",
    price: 500000,
    credits: 3500,
    duration_days: 30,
    cost_per_credit: 140,
    status: "active" as const,
    features: [
      "3,500 credits / month",
      "Model: auto · best value",
      "Cost optimizer & fallback",
      "Priority support",
      "Team seats (5)",
    ],
  },
  {
    name: "Platinum",
    price: 1200000,
    credits: 12000,
    duration_days: 30,
    cost_per_credit: 100,
    status: "active" as const,
    features: [
      "12,000 credits / month",
      "Model: auto · max throughput",
      "Dedicated support & SLA",
      "SSO & audit logs",
      "Invoice & PO available",
    ],
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
    } else {
      // Create admin user
      const admin = new User({
        name: "admin",
        email: "admin@gmail.com",
        password: "admin1234",
        role: "admin",
      });

      await admin.save();
      console.log("Admin user created successfully");
      console.log("Email: admin@gmail.com");
      console.log("Password: admin1234");
    }

    // Seed AI Router plans (idempotent — skip names that already exist)
    for (const plan of SEED_PLANS) {
      const exists = await Plan.findOne({ name: plan.name });
      if (exists) {
        console.log(`Plan "${plan.name}" already exists, skipping`);
        continue;
      }
      await Plan.create(plan);
      console.log(`Plan "${plan.name}" created (IDR ${plan.price.toLocaleString("id-ID")}, ${plan.credits} credits)`);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Seed error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
