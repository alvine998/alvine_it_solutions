import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import contactRoutes from "./routes/contact";
import invoiceRoutes from "./routes/invoice";
import authRoutes from "./routes/auth";
import customerRoutes from "./routes/customer";
import timelineRoutes from "./routes/timeline";
import routerCustomerRoutes from "./routes/routerCustomer";
import RouterCustomer from "./models/RouterCustomer";
import routerModelRoutes from "./routes/routerModel";
import creditCustomerRoutes from "./routes/creditCustomer";
import creditLogRoutes from "./routes/creditLog";
import customerPlanRoutes from "./routes/customerPlan";
import planRoutes from "./routes/plan";
import orderRoutes from "./routes/order";
import paymentMethodRoutes from "./routes/paymentMethod";
import customerApiKeyRoutes from "./routes/customerApiKey";
import settingRoutes from "./routes/setting";

const app = express();
const PORT = process.env.PORT || 4005;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alvine_it_solution";

let dbConnected = false;

// Middleware
app.use(cors());
app.use(express.json());
// server/index.ts:29
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customers", timelineRoutes);
app.use("/api/router-customers", routerCustomerRoutes);
app.use("/api/router-models", routerModelRoutes);
app.use("/api/credit-customers", creditCustomerRoutes);
app.use("/api/credit-logs", creditLogRoutes);
app.use("/api/customer-plans", customerPlanRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/customer-api-keys", customerApiKeyRoutes);
app.use("/api/settings", settingRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  const status = dbConnected && mongoose.connection.readyState === 1 ? "ok" : "degraded";
  res.json({ status, db: dbConnected ? "connected" : "disconnected", timestamp: new Date().toISOString() });
});

// Start HTTP server immediately so health checks pass
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB in the background
console.log(`Connecting to MongoDB...`);
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    dbConnected = true;
    console.log("Connected to MongoDB");
    try {
      await (RouterCustomer as any).backfillRefCodes();
    } catch (e) {
      console.error("ref_code backfill error:", e);
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    console.error("Server will continue running with degraded status. API routes that require the database will return errors until MongoDB is available.");
  });

export default app;