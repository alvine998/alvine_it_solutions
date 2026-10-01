import mongoose from "mongoose";
import User from "./models/User";
import Plan from "./models/Plan";
import PortfolioApp from "./models/PortfolioApp";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alvine_it_solution";

const SEED_PORTFOLIO_APPS = [
  {
    slug: "goldbricks",
    title: { en: "Goldbricks Realtors", id: "Goldbricks Realtors", zh: "Goldbricks Realtors" },
    category: { en: "Web Application", id: "Aplikasi Web", zh: "Web应用" },
    description: {
      en: "A property agency website for Goldbricks Realtors featuring primary & secondary property listings, project galleries, and KPR bank partner integration.",
      id: "Website agen properti untuk Goldbricks Realtors dengan daftar properti primer & sekunder, galeri proyek, dan integrasi mitra bank KPR.",
      zh: "为Goldbricks Realtors打造的房地产代理网站，包含一手和二手房产列表、项目画廊以及KPR银行合作伙伴集成。",
    },
    problem: {
      en: "Manual property updates via chat slowed agents down and lost buyer leads.",
      id: "Update properti manual via chat memperlambat agen dan menghilangkan leads.",
      zh: "经聊天手动更新房源拖慢经纪人效率并流失线索。",
    },
    solution: {
      en: "Laravel + MySQL for fast CRUD, SEO-friendly listings, and easy handover to their in-house admin.",
      id: "Laravel + MySQL untuk CRUD cepat, listing SEO-friendly, dan handover mudah.",
      zh: "Laravel + MySQL 实现快速 CRUD、SEO 友好列表，便于交接。",
    },
    timeline: { en: "6 weeks", id: "6 minggu", zh: "6 周" },
    results: {
      en: ["Property search <2s", "KPR partner integration live", "Deployed + admin handover docs"],
      id: ["Pencarian properti <2 dtk", "Integrasi mitra KPR live", "Deploy + dokumen handover"],
      zh: ["房源搜索 <2秒", "KPR 合作集成上线", "部署 + 管理交接文档"],
    },
    tech: ["Laravel", "MySQL"],
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://goldbricks.co.id",
    status: "active" as const,
    sortOrder: 1,
  },
  {
    slug: "stokinventory",
    title: { en: "Stokinventory", id: "Stokinventory", zh: "Stokinventory" },
    category: { en: "Web Application", id: "Aplikasi Web", zh: "Web应用" },
    description: {
      en: "A comprehensive inventory management app with real-time analytics, budget planning, and supply chain optimization.",
      id: "Aplikasi manajemen inventaris komprehensif dengan analitik real-time, perencanaan anggaran, dan optimalisasi rantai pasok.",
      zh: "全面的库存管理应用，具有实时分析、预算规划和供应链优化功能。",
    },
    problem: {
      en: "Stock counts in spreadsheets caused overselling and no real-time visibility.",
      id: "Stok di spreadsheet menyebabkan overselling dan tanpa visibilitas real-time.",
      zh: "表格管理库存导致超卖且无实时可见性。",
    },
    solution: {
      en: "Laravel + MySQL with queued reports so dashboards stay fast as SKUs grow.",
      id: "Laravel + MySQL dengan laporan antrian agar dashboard tetap cepat.",
      zh: "Laravel + MySQL + 队列报表，SKU 增长仍保持快速。",
    },
    timeline: { en: "8 weeks", id: "8 minggu", zh: "8 周" },
    results: {
      en: ["Real-time stock dashboard", "Budget planning module", "Role-based access control"],
      id: ["Dashboard stok real-time", "Modul budget planning", "Akses berbasis peran"],
      zh: ["实时库存看板", "预算规划模块", "基于角色的权限"],
    },
    tech: ["Laravel", "MySQL"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://stokinventory.com",
    status: "active" as const,
    sortOrder: 2,
  },
  {
    slug: "kerja-aja-dulu",
    title: { en: "Kerja Aja Dulu", id: "Kerja Aja Dulu", zh: "Kerja Aja Dulu" },
    category: { en: "Web Application", id: "Aplikasi Web", zh: "Web应用" },
    description: {
      en: "A job portal connecting employers and job seekers with AI-driven matching and interview scheduling.",
      id: "Portal lowongan kerja yang menghubungkan perusahaan dan pencari kerja dengan pencocokan berbasis AI dan penjadwalan wawancara.",
      zh: "连接雇主和求职者的招聘平台，具有AI驱动的匹配和面试安排功能。",
    },
    problem: {
      en: "Employers drowned in unfiltered applicants; seekers never heard back.",
      id: "Perusahaan kebanjiran pelamar tak terfilter; kandidat tak pernah dapat kabar.",
      zh: "雇主被未筛选简历淹没，求职者石沉大海。",
    },
    solution: {
      en: "Next.js + Express + MySQL for SEO job pages plus a fast matching API.",
      id: "Next.js + Express + MySQL untuk halaman SEO + API matching cepat.",
      zh: "Next.js + Express + MySQL，SEO 职位页 + 高速匹配 API。",
    },
    timeline: { en: "8 weeks", id: "8 minggu", zh: "8 周" },
    results: {
      en: ["AI matching v1 live", "Interview scheduling flow", "Employer + seeker portals"],
      id: ["AI matching v1 live", "Alur scheduling interview", "Portal employer + seeker"],
      zh: ["AI 匹配 v1 上线", "面试安排流程", "雇主 + 求职者双端"],
    },
    tech: ["Next.js", "Express.js", "MySQL"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://kerjaajadulu.com",
    status: "active" as const,
    sortOrder: 3,
  },
  {
    slug: "kasirin-app",
    title: { en: "Kasirin App", id: "Kasirin App", zh: "Kasirin App" },
    category: { en: "Mobile Application", id: "Aplikasi Mobile", zh: "移动应用" },
    description: {
      en: "A secure POS & wallet app for managing sales with biometric authentication and instant transaction notifications.",
      id: "Aplikasi dompet aman untuk mengelola aset digital dengan otentikasi biometrik dan notifikasi transaksi instan.",
      zh: "安全的移动钱包应用，用于管理数字资产，具有生物识别认证和即时交易通知。",
    },
    problem: {
      en: "Small retailers needed a fast offline-tolerant POS that staff could trust.",
      id: "Retail kecil butuh POS cepat yang toleran offline dan dipercaya staf.",
      zh: "小零售商需要快速、容忍离线且值得信赖的 POS。",
    },
    solution: {
      en: "Cross-platform mobile with local-first storage and biometric gate for payouts.",
      id: "Mobile lintas platform dengan penyimpanan local-first + biometric gate.",
      zh: "跨平台 + 本地优先存储 + 生物识别门禁。",
    },
    timeline: { en: "6 weeks", id: "6 minggu", zh: "6 周" },
    results: {
      en: ["Play Store release", "Biometric login", "Offline-first POS mode"],
      id: ["Rilis Play Store", "Login biometrik", "Mode POS offline-first"],
      zh: ["Play Store 上架", "生物识别登录", "离线优先 POS 模式"],
    },
    tech: ["React Native", "TypeScript", "SQLite"],
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://play.google.com/store/apps/details?id=com.kasirinku.app&hl=id",
    status: "active" as const,
    sortOrder: 4,
  },
  {
    slug: "tokotitoh-app",
    title: { en: "Tokotitoh App", id: "Tokotitoh App", zh: "Tokotitoh App" },
    category: { en: "Mobile Application", id: "Aplikasi Mobile", zh: "移动应用" },
    description: {
      en: "A modern e-commerce app for buying and selling products with a seamless shopping experience.",
      id: "Aplikasi e-commerce modern untuk jual beli produk dengan pengalaman belanja yang mulus.",
      zh: "现代电商应用，提供无缝的购物体验，支持产品买卖。",
    },
    problem: {
      en: "Sellers juggled chat orders with no catalog, stock, or order status.",
      id: "Seller kewalahan order via chat tanpa katalog dan status order.",
      zh: "卖家靠聊天接单，无目录、库存与订单状态。",
    },
    solution: {
      en: "Node.js + PostgreSQL + Redis for fast catalog reads and reliable order queues.",
      id: "Node.js + PostgreSQL + Redis untuk katalog cepat dan antrian order andal.",
      zh: "Node.js + PostgreSQL + Redis，目录读取快、订单队列可靠。",
    },
    timeline: { en: "7 weeks", id: "7 minggu", zh: "7 周" },
    results: {
      en: ["Play Store release", "Seller + buyer flows", "Push order notifications"],
      id: ["Rilis Play Store", "Alur seller + buyer", "Notifikasi push order"],
      zh: ["Play Store 上架", "买卖双端流程", "订单推送通知"],
    },
    tech: ["Node.js", "PostgreSQL", "Redis"],
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://play.google.com/store/apps/details?id=com.tokonyang_app&hl=id",
    status: "active" as const,
    sortOrder: 5,
  },
  {
    slug: "midland-properti",
    title: { en: "Midland Properti", id: "Midland Properti", zh: "Midland Properti" },
    category: { en: "Web Application", id: "Aplikasi Web", zh: "Web应用" },
    description: {
      en: "A real estate platform for property listings, virtual tours, and seamless transaction processes.",
      id: "Platform real estat untuk daftar properti, tur virtual, dan proses transaksi yang lancar.",
      zh: "房地产平台，提供房产列表、虚拟导览和无缝交易流程。",
    },
    problem: {
      en: "Static listings with slow image loads killed mobile inquiries.",
      id: "Listing statis dengan gambar lambat membunuh inquiry mobile.",
      zh: "静态列表图片加载慢，移动端咨询流失。",
    },
    solution: {
      en: "React + optimized images + Python API for <2s loads on mid-range Android.",
      id: "React + optimasi gambar + API Python untuk load <2 dtk di Android menengah.",
      zh: "React + 图片优化 + Python API，中端安卓 <2秒加载。",
    },
    timeline: { en: "5 weeks", id: "5 minggu", zh: "5 周" },
    results: {
      en: ["Listings + galleries live", "WhatsApp lead capture", "<2s LCP on 4G"],
      id: ["Listing + galeri live", "Lead capture WhatsApp", "LCP <2 dtk di 4G"],
      zh: ["列表 + 画廊上线", "WhatsApp 线索承接", "4G 下 LCP <2秒"],
    },
    tech: ["React", "Python", "Docker"],
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://midlandproperti.id/",
    status: "active" as const,
    sortOrder: 6,
  },
  {
    slug: "bm-transport-logistik",
    title: { en: "BM Transport Logistik", id: "BM Transport Logistik", zh: "BM Transport Logistik" },
    category: { en: "Web Application", id: "Aplikasi Web", zh: "Web应用" },
    description: {
      en: "Logistics and delivery tracking app with real-time GPS, route optimization, and automated notifications.",
      id: "Aplikasi pelacakan logistik dan pengiriman dengan GPS real-time, optimalisasi rute, dan notifikasi otomatis.",
      zh: "物流和配送跟踪应用，具有实时GPS、路线优化和自动通知功能。",
    },
    problem: {
      en: "Customers called dispatch for every parcel because tracking was manual.",
      id: "Pelanggan menelepon dispatch untuk setiap paket karena tracking manual.",
      zh: "因手工跟踪，客户每单都打电话问调度。",
    },
    solution: {
      en: "Flutter + Go + Firebase for real-time location at low server cost.",
      id: "Flutter + Go + Firebase untuk lokasi real-time dengan biaya server rendah.",
      zh: "Flutter + Go + Firebase，低服务器成本实现实时定位。",
    },
    timeline: { en: "8 weeks", id: "8 minggu", zh: "8 周" },
    results: {
      en: ["Real-time GPS tracking", "Route optimization v1", "Auto delivery notifications"],
      id: ["Tracking GPS real-time", "Optimasi rute v1", "Notifikasi otomatis"],
      zh: ["实时 GPS 跟踪", "路线优化 v1", "自动配送通知"],
    },
    tech: ["Flutter", "Go", "Firebase"],
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=450&fit=crop&q=70&auto=format",
    liveUrl: "https://bmtransportlogistik.com",
    status: "active" as const,
    sortOrder: 7,
  },
];

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

    // Seed portfolio apps (idempotent — skip slugs that already exist)
    for (const app of SEED_PORTFOLIO_APPS) {
      const exists = await PortfolioApp.findOne({ slug: app.slug });
      if (exists) {
        console.log(`Portfolio app "${app.slug}" already exists, skipping`);
        continue;
      }
      await PortfolioApp.create(app);
      console.log(`Portfolio app "${app.slug}" created`);
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
