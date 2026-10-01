import { Router, Request, Response } from "express";
import multer from "multer";
import PortfolioApp from "../models/PortfolioApp";
import { requireAdmin } from "../middleware/auth";
import { uploadToR2 } from "../lib/r2";

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.get("/admin", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { slug: { $regex: search, $options: "i" } },
        { "title.en": { $regex: search, $options: "i" } },
        { "title.id": { $regex: search, $options: "i" } },
        { "title.zh": { $regex: search, $options: "i" } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page || "", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit || "", 10) || 10));
    const countFilter = { ...filter };
    delete countFilter.status;
    const [apps, total, activeCount, inactiveCount] = await Promise.all([
      PortfolioApp.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize),
      PortfolioApp.countDocuments(filter),
      PortfolioApp.countDocuments({ ...countFilter, status: "active" }),
      PortfolioApp.countDocuments({ ...countFilter, status: "inactive" }),
    ]);
    res.json({ apps, total, activeCount, inactiveCount, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const apps = await PortfolioApp.find({ status: "active" }).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ apps });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

router.post("/upload-image", requireAdmin, imageUpload.single("image"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No image file provided" });
    const url = await uploadToR2(new Uint8Array(file.buffer), file.mimetype, "portfolio-apps");
    res.status(201).json({ url });
  } catch (e: any) {
    console.error("Portfolio app image upload error:", e);
    const message = e?.message || "Failed to upload image";
    const status = message.includes("Only image") || message.includes("File too large") ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

router.get("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const app = await PortfolioApp.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "App not found" });
    res.json(app);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch app" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { slug, title, category, description, problem, solution, timeline, results, tech, image, liveUrl, status, sortOrder } = req.body;
    if (!slug || !title?.en?.trim()) return res.status(400).json({ error: "slug and English title are required" });
    const app = new PortfolioApp({
      slug: String(slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
      title,
      category,
      description,
      problem,
      solution,
      timeline,
      results: { en: [], id: [], zh: [], ...results },
      tech: Array.isArray(tech) ? tech.map(String).map((value: string) => value.trim()).filter(Boolean) : [],
      image: typeof image === "string" ? image.trim() : "",
      liveUrl: typeof liveUrl === "string" ? liveUrl.trim() : "",
      status: status === "inactive" ? "inactive" : "active",
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    });
    await app.save();
    res.status(201).json({ message: "Created", app });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "App slug already exists" });
    res.status(500).json({ error: "Failed to create app" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const app = await PortfolioApp.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "App not found" });
    const { slug, title, category, description, problem, solution, timeline, results, tech, image, liveUrl, status, sortOrder } = req.body;
    if (slug !== undefined) app.slug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (title !== undefined) app.title = title;
    if (category !== undefined) app.category = category;
    if (description !== undefined) app.description = description;
    if (problem !== undefined) app.problem = problem;
    if (solution !== undefined) app.solution = solution;
    if (timeline !== undefined) app.timeline = timeline;
    if (results !== undefined) app.results = results;
    if (tech !== undefined) app.tech = Array.isArray(tech) ? tech.map(String).map((value: string) => value.trim()).filter(Boolean) : [];
    if (image !== undefined) app.image = String(image).trim();
    if (liveUrl !== undefined) app.liveUrl = String(liveUrl).trim();
    if (status !== undefined) app.status = status === "inactive" ? "inactive" : "active";
    if (sortOrder !== undefined) app.sortOrder = Number(sortOrder) || 0;
    await app.save();
    res.json({ message: "Updated", app });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "App slug already exists" });
    res.status(500).json({ error: "Failed to update app" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const app = await PortfolioApp.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ error: "App not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete app" });
  }
});

export default router;
