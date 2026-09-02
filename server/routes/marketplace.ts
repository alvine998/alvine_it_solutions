import { Router, Request, Response } from "express";
import multer from "multer";
import Marketplace from "../models/Marketplace";
import { uploadToR2 } from "../lib/r2";

const router = Router();

const marketplaceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function normalizeImages(body: any): string[] {
  // accept: images[], image (legacy string), images as JSON string
  if (Array.isArray(body.images)) return body.images.filter((u: any) => typeof u === "string" && u.trim()).slice(0, 10);
  if (typeof body.images === "string") {
    try {
      const parsed = JSON.parse(body.images);
      if (Array.isArray(parsed)) return parsed.filter((u: any) => typeof u === "string" && String(u).trim()).map((u: string) => String(u).trim()).slice(0, 10);
    } catch { /* not JSON */ }
    const s = String(body.images).trim();
    if (s) return [s];
  }
  if (typeof body.image === "string" && String(body.image).trim()) return [String(body.image).trim()];
  return [];
}

// POST /api/marketplace/upload-images — upload 1-10 images to R2 (admin)
router.post("/upload-images", marketplaceUpload.array("images", 10), async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: "No image files provided (field: images, max 10)" });
    const urls = await Promise.all(files.map((f) => uploadToR2(new Uint8Array(f.buffer), f.mimetype, "marketplace")));
    res.status(201).json({ urls });
  } catch (e: any) {
    console.error("Marketplace upload-images error:", e);
    // multer fileFilter / limits errors surface here
    const msg = e?.message || "Failed to upload images";
    const status = msg.includes("Only image") || msg.includes("Too many") || msg.includes("File too large") ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

// GET /api/marketplace?status=&category=&search=&page=&limit=&featured=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, category, search, page, limit, featured } = req.query as any;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;
    if (featured === "true") filter.featured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const [rows, total] = await Promise.all([
      Marketplace.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      Marketplace.countDocuments(filter),
    ]);
    res.json({
      items: rows,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch marketplace items" });
  }
});

// GET /api/marketplace/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await Marketplace.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Item not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// POST /api/marketplace — accepts { images: string[] } (max 10, R2 URLs) + legacy { image }
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, price, tech, category, demoUrl, downloadUrl, featured, status } = req.body;
    const images = normalizeImages(req.body);
    if (!name || !description || price === undefined) {
      return res.status(400).json({ error: "name, description and price are required" });
    }
    if (images.length > 10) return res.status(400).json({ error: "Maximum 10 images allowed" });
    const doc = new Marketplace({
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(price),
      tech: Array.isArray(tech) ? tech.filter((t: any) => String(t).trim()) : [],
      category: category || "web",
      images,
      image: images[0] || "",
      demoUrl: demoUrl || "",
      downloadUrl: downloadUrl || "",
      featured: !!featured,
      status: status || "active",
    });
    await doc.save();
    res.status(201).json({ message: "Created", item: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create marketplace item" });
  }
});

// PUT /api/marketplace/:id — partial update; pass images to replace, or omit to keep
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, description, price, tech, category, demoUrl, downloadUrl, featured, status } = req.body;
    const doc = await Marketplace.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Item not found" });
    if (name) doc.name = String(name).trim();
    if (description) doc.description = String(description).trim();
    if (price !== undefined) doc.price = Number(price);
    if (tech !== undefined) doc.tech = Array.isArray(tech) ? tech.filter((t: any) => String(t).trim()) : [];
    if (category) doc.category = category;
    if (req.body.images !== undefined || req.body.image !== undefined) {
      const images = normalizeImages(req.body);
      if (images.length > 10) return res.status(400).json({ error: "Maximum 10 images allowed" });
      (doc as any).images = images;
      doc.image = images[0] || "";
    }
    if (demoUrl !== undefined) doc.demoUrl = demoUrl;
    if (downloadUrl !== undefined) doc.downloadUrl = downloadUrl;
    if (featured !== undefined) doc.featured = !!featured;
    if (status) doc.status = status;
    await doc.save();
    res.json({ message: "Updated", item: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update marketplace item" });
  }
});

// DELETE /api/marketplace/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await Marketplace.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete marketplace item" });
  }
});

export default router;
