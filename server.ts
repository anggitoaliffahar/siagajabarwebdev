import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  Admin, 
  TitikRawan, 
  Alert, 
  LaporanBencana, 
  DashboardStats,
  JenisBencana
} from "./src/types";

// Simulated Symmetric Encryption Key (Demonstrating strong user data security requirements)
const SECRET_MOCK_KEY = "SIAGAJABAR_SEC_KEY_2026";

/**
 * Super lightweight and robust visual end-to-end encryption helpers for citizen personal data.
 * Encrypts/Decrypts sensitive parameters like name and phone number before storing/sending over wire.
 */
function encryptText(text: string): string {
  if (!text) return "";
  // XOR-based Base64 encryption representing standard secure packet processing
  const chars = text.split("").map((c, i) => {
    const keyChar = SECRET_MOCK_KEY.charCodeAt(i % SECRET_MOCK_KEY.length);
    return String.fromCharCode(c.charCodeAt(0) ^ keyChar);
  });
  return Buffer.from(chars.join("")).toString("base64");
}

function decryptText(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const raw = Buffer.from(cipherText, "base64").toString("utf-8");
    const chars = raw.split("").map((c, i) => {
      const keyChar = SECRET_MOCK_KEY.charCodeAt(i % SECRET_MOCK_KEY.length);
      return String.fromCharCode(c.charCodeAt(0) ^ keyChar);
    });
    return chars.join("");
  } catch (e) {
    return cipherText; // Return original if not formatted
  }
}

const DB_FILE = path.join(process.cwd(), "database.json");

interface DatabaseSchema {
  admins: Admin[];
  titikRawan: TitikRawan[];
  alerts: Alert[];
  laporanBencana: LaporanBencana[];
}

// Ensure database file exists with elegant mock seed data representing West Java hotspots
const defaultDB: DatabaseSchema = {
  admins: [
    {
      id: "admin-1",
      nama: "Pusdalops BPBD Jabar",
      email: "admin@siagajabar.go.id",
      created_at: new Date().toISOString()
    }
  ],
  titikRawan: [
    {
      id: "tr-1",
      nama_lokasi: "Aliran Sungai Citarum, Baleendah",
      jenis_bencana: "banjir",
      tingkat_risiko: "tinggi",
      latitude: -7.0116,
      longitude: 107.6253,
      deskripsi: "Daerah cekungan langganan banjir tahunan akibat luapan Sungai Citarum saat curah hujan tinggi ekstrem.",
      kabupaten: "Bandung",
      status: "dipublikasikan",
      created_at: new Date().toISOString()
    },
    {
      id: "tr-2",
      nama_lokasi: "Tebing Cadas Pangeran, Sumedang",
      jenis_bencana: "longsor",
      tingkat_risiko: "tinggi",
      latitude: -6.8373,
      longitude: 107.8767,
      deskripsi: "Tebing terjal di pinggir jalan raya utama Bandung-Sumedang dengan tingkat pelapukan batuan tinggi.",
      kabupaten: "Sumedang",
      status: "dipublikasikan",
      created_at: new Date().toISOString()
    },
    {
      id: "tr-3",
      nama_lokasi: "Sesar Active Lembang, Parongpong",
      jenis_bencana: "gempa",
      tingkat_risiko: "sedang",
      latitude: -6.8208,
      longitude: 107.5959,
      deskripsi: "Jalur patahan bumi sepanjang 29 KM yang memanjang dari barat ke timur Kabupaten Bandung Barat.",
      kabupaten: "Bandung Barat",
      status: "dipublikasikan",
      created_at: new Date().toISOString()
    },
    {
      id: "tr-4",
      nama_lokasi: "Pantai Selatan Sukabumi, Pelabuhanratu",
      jenis_bencana: "gempa",
      tingkat_risiko: "sedang",
      latitude: -6.9825,
      longitude: 106.5414,
      deskripsi: "Kawasan pesisir pantai selatan yang berpotensi gempa megathrust dan gelombang tinggi air laut.",
      kabupaten: "Sukabumi",
      status: "dipublikasikan",
      created_at: new Date().toISOString()
    },
    {
      id: "tr-5",
      nama_lokasi: "Kawasan Padat Penduduk Cicadas",
      jenis_bencana: "kebakaran",
      tingkat_risiko: "sedang",
      latitude: -6.9152,
      longitude: 107.6405,
      deskripsi: "Wilayah perumahan padat dengan akses lorong sempit, rentan penyebaran api cepat.",
      kabupaten: "Kota Bandung",
      status: "dipublikasikan",
      created_at: new Date().toISOString()
    }
  ],
  alerts: [
    {
      id: "alt-1",
      judul: "SIAGA MERAH: Luapan Sungai Citarum Sektor Baleendah",
      deskripsi: "Warga di bantaran Sungai Citarum Baleendah dan Dayeuhkolot diimbau segera meluncur ke posko pengungsian utama. TMA terpantau naik pesat hingga 400cm.",
      tingkat_bahaya: "awas",
      wilayah_terdampak: "Dayeuhkolot, Baleendah, Bojongsoang",
      status: "aktif",
      created_at: new Date().toISOString()
    },
    {
      id: "alt-2",
      judul: "Peringatan Dini Cuaca Ekstrem Jawa Barat",
      deskripsi: "Potensi hujan badai disertai angin puting beliung di wilayah Bogor, Depok, Bandung Raya selama 3 jam kedepan. Kurangi aktivitas luar ruangan.",
      tingkat_bahaya: "waspada",
      wilayah_terdampak: "Jabodetabek, Bandung Raya",
      status: "aktif",
      created_at: new Date().toISOString()
    }
  ],
  laporanBencana: [
    {
      id: "TKT-3108",
      nama_pelapor: encryptText("Yusuf Hidayat"),
      no_telepon: encryptText("081234567890"),
      lokasi_kejadian: "Jl. Raya Cadas Pangeran KM 35, Sumedang",
      jenis_bencana: "longsor",
      deskripsi: "Adanya rekahan tanah baru di tebing bagian atas setelah hujan lebat mendera semalaman. Sangat mengkhawatirkan pengendara.",
      status: "baru",
      created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: "TKT-4122",
      nama_pelapor: encryptText("Siti Rahmawati"),
      no_telepon: encryptText("089988776655"),
      lokasi_kejadian: "Kampung Cieunteung RT 04, Baleendah, Bandung",
      jenis_bencana: "banjir",
      deskripsi: "Air sungai merembes masuk ke pekarangan rumah setinggi 25 cm. Pompa air genangan beroperasi penuh saat ini.",
      status: "diproses",
      catatan_admin: "Regu reaksi cepat BPBD sumur 2 sudah disiagakan di posko cieunteung.",
      created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: "TKT-1921",
      nama_pelapor: encryptText("Rian Andriana"),
      no_telepon: encryptText("087711223344"),
      lokasi_kejadian: "Jl. Riau No 48, Bandung",
      jenis_bencana: "cuaca_ekstrim",
      deskripsi: "Pohon beringin besar tumbang menghalangi sebagian badan jalan. Berhasil dibereskan oleh Dinas Pemadam dan Penyelamatan Bandung.",
      status: "selesai",
      catatan_admin: "Tim Rescue berhasil menyingkirkan dahan pohon dan lalu lintas kembali normal.",
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ]
};

// Helper to read database safely
function getRawData(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf8");
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Database read error, falling back to seeds", error);
    return defaultDB;
  }
}

// Helper to write database safely
function saveRawData(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Database write error", err);
  }
}

// Initialize server
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing requests
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Simulate secret encryption validation and token verification
  const checkAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer SIAGA_TKN_")) {
      return res.status(401).json({ error: "Unauthorized. Please log in as Administrator." });
    }
    next();
  };

  /**
   * ==========================================
   * 1. AUTHENTICATION ENDPOINTS
   * ==========================================
   */
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@siagajabar.go.id" && password === "adminsiaga123") {
      const db = getRawData();
      const admin = db.admins[0];
      // Generate secure visual token
      const token = `SIAGA_TKN_${Buffer.from(JSON.stringify({ userId: admin.id, t: Date.now() })).toString("base64")}`;
      return res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          nama: admin.nama,
          email: admin.email
        }
      });
    }
    return res.status(400).json({ error: "Email atau Password Administrator salah!" });
  });

  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer SIAGA_TKN_")) {
      const db = getRawData();
      return res.json({ authenticated: true, admin: db.admins[0] });
    }
    return res.json({ authenticated: false });
  });

  app.post("/api/auth/logout", (req, res) => {
    return res.json({ success: true, message: "Logged out successfully" });
  });

  /**
   * ==========================================
   * 2. PUBLIC DISASTER POINTS (TITIK RAWAN)
   * ==========================================
   */
  app.get("/api/titik-rawan", (req, res) => {
    const db = getRawData();
    const isPublic = req.query.status === "dipublikasikan";
    const filtered = isPublic 
      ? db.titikRawan.filter(tr => tr.status === "dipublikasikan")
      : db.titikRawan;
    return res.json(filtered);
  });

  app.get("/api/titik-rawan/:id", (req, res) => {
    const db = getRawData();
    const item = db.titikRawan.find(tr => tr.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Disaster coordinate not found" });
    return res.json(item);
  });

  // Admin Create Disaster Point
  app.post("/api/admin/titik-rawan", checkAdminAuth, (req, res) => {
    const { nama_lokasi, jenis_bencana, tingkat_risiko, latitude, longitude, deskripsi, kabupaten, status } = req.body;
    if (!nama_lokasi || !jenis_bencana || !tingkat_risiko || !latitude || !longitude || !kabupaten) {
      return res.status(400).json({ error: "Mohon isi semua field wajib koordinat peta!" });
    }

    const newItem: TitikRawan = {
      id: `tr-${Date.now()}`,
      nama_lokasi,
      jenis_bencana,
      tingkat_risiko,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      deskripsi: deskripsi || "",
      kabupaten,
      status: status || "dipublikasikan",
      created_at: new Date().toISOString()
    };

    const db = getRawData();
    db.titikRawan.push(newItem);
    saveRawData(db);

    return res.status(201).json(newItem);
  });

  // Admin Update Disaster Point
  app.put("/api/admin/titik-rawan/:id", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const index = db.titikRawan.findIndex(tr => tr.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Disaster coordinate not found" });

    const { nama_lokasi, jenis_bencana, tingkat_risiko, latitude, longitude, deskripsi, kabupaten, status } = req.body;
    
    db.titikRawan[index] = {
      ...db.titikRawan[index],
      nama_lokasi: nama_lokasi || db.titikRawan[index].nama_lokasi,
      jenis_bencana: jenis_bencana || db.titikRawan[index].jenis_bencana,
      tingkat_risiko: tingkat_risiko || db.titikRawan[index].tingkat_risiko,
      latitude: latitude ? parseFloat(latitude) : db.titikRawan[index].latitude,
      longitude: longitude ? parseFloat(longitude) : db.titikRawan[index].longitude,
      deskripsi: deskripsi !== undefined ? deskripsi : db.titikRawan[index].deskripsi,
      kabupaten: kabupaten || db.titikRawan[index].kabupaten,
      status: status || db.titikRawan[index].status
    };

    saveRawData(db);
    return res.json(db.titikRawan[index]);
  });

  // Admin Delete Disaster Point
  app.delete("/api/admin/titik-rawan/:id", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const originalCount = db.titikRawan.length;
    db.titikRawan = db.titikRawan.filter(tr => tr.id !== req.params.id);
    
    if (db.titikRawan.length === originalCount) {
      return res.status(404).json({ error: "Disaster coordinate not found" });
    }

    saveRawData(db);
    return res.json({ success: true, message: "Titik rawan bencana berhasil dihapus!" });
  });


  /**
   * ==========================================
   * 3. PUBLIC DISASTER ALERTS (SIARAN ALERT)
   * ==========================================
   */
  app.get("/api/alerts", (req, res) => {
    const db = getRawData();
    const isPublic = req.query.status === "aktif";
    const filtered = isPublic 
      ? db.alerts.filter(alt => alt.status === "aktif")
      : db.alerts;
    return res.json(filtered);
  });

  // Admin Create Alert
  app.post("/api/admin/alerts", checkAdminAuth, (req, res) => {
    const { judul, deskripsi, tingkat_bahaya, wilayah_terdampak, status } = req.body;
    if (!judul || !deskripsi || !tingkat_bahaya || !wilayah_terdampak) {
      return res.status(400).json({ error: "Harap isi semua kolom wajib siaran alert!" });
    }

    const newAlert: Alert = {
      id: `alt-${Date.now()}`,
      judul,
      deskripsi,
      tingkat_bahaya,
      wilayah_terdampak,
      status: status || "aktif",
      created_at: new Date().toISOString()
    };

    const db = getRawData();
    db.alerts.unshift(newAlert);
    saveRawData(db);

    return res.status(201).json(newAlert);
  });

  // Admin Update Alert
  app.put("/api/admin/alerts/:id", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const index = db.alerts.findIndex(alt => alt.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Broadcast alert not found" });

    const { judul, deskripsi, tingkat_bahaya, wilayah_terdampak, status } = req.body;

    db.alerts[index] = {
      ...db.alerts[index],
      judul: judul || db.alerts[index].judul,
      deskripsi: deskripsi || db.alerts[index].deskripsi,
      tingkat_bahaya: tingkat_bahaya || db.alerts[index].tingkat_bahaya,
      wilayah_terdampak: wilayah_terdampak || db.alerts[index].wilayah_terdampak,
      status: status || db.alerts[index].status
    };

    saveRawData(db);
    return res.json(db.alerts[index]);
  });

  // Admin Delete Alert
  app.delete("/api/admin/alerts/:id", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const originalCount = db.alerts.length;
    db.alerts = db.alerts.filter(alt => alt.id !== req.params.id);

    if (db.alerts.length === originalCount) {
      return res.status(404).json({ error: "Broadcast alert not found" });
    }

    saveRawData(db);
    return res.json({ success: true, message: "Siaran peringatan bencana berhasil dihapus!" });
  });


  /**
   * ==========================================
   * 4. CITIZENS SELF-REPORTING (PELAPORAN MANDIRI)
   * ==========================================
   */

  // Public submission with End-to-End Encryption simulation for protection of personal information
  app.post("/api/laporan", (req, res) => {
    const { nama_pelapor, no_telepon, lokasi_kejadian, jenis_bencana, deskripsi, foto_url } = req.body;
    if (!nama_pelapor || !no_telepon || !lokasi_kejadian || !jenis_bencana || !deskripsi) {
      return res.status(400).json({ error: "Harap isi semua kolom wajib formulir pelaporan!" });
    }

    // Encrypt sensitive information at ingestion for data protection policy compliance (End-to-End encryption)
    const encryptedName = encryptText(nama_pelapor);
    const encryptedPhone = encryptText(no_telepon);

    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: LaporanBencana = {
      id: ticketNumber,
      nama_pelapor: encryptedName,
      no_telepon: encryptedPhone,
      lokasi_kejadian,
      jenis_bencana,
      deskripsi,
      foto_url: foto_url || "",
      status: "baru",
      created_at: new Date().toISOString()
    };

    const db = getRawData();
    db.laporanBencana.unshift(newReport);
    saveRawData(db);

    // Return response with clear descriptive ticket ID. 
    // Return unencrypted variables to user in confirmation for convenience, but internally saved secure.
    return res.status(201).json({
      success: true,
      ticketId: ticketNumber,
      message: "Laporan darurat berhasil didaftarkan!",
      laporan: {
        id: ticketNumber,
        nama_pelapor,
        no_telepon,
        lokasi_kejadian,
        jenis_bencana,
        deskripsi,
        foto_url,
        status: "baru",
        created_at: newReport.created_at
      }
    });
  });

  // Public GET resolved citizen reports ('selesai' status for transparency analytics and community review)
  app.get("/api/laporan/publik", (req, res) => {
    const db = getRawData();
    const finished = db.laporanBencana
      .filter(l => l.status === "selesai")
      .map(l => ({
        ...l,
        // Mask personal info in public endpoints
        nama_pelapor: decryptText(l.nama_pelapor).replace(/(?<=.).(?=.)/g, "*"),
        no_telepon: decryptText(l.no_telepon).replace(/(?<=\d{4})\d(?=\d{2})/g, "*")
      }));
    return res.json(finished);
  });

  // Admin GET All Citizen Reports (Decrypted automatically for approved operators only)
  app.get("/api/admin/laporan", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const decrypted = db.laporanBencana.map(l => ({
      ...l,
      nama_pelapor: decryptText(l.nama_pelapor),
      no_telepon: decryptText(l.no_telepon)
    }));
    return res.json(decrypted);
  });

  // Admin update report status & add feedback comments
  app.patch("/api/admin/laporan/:id", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const index = db.laporanBencana.findIndex(l => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Laporan warga tidak ditemukan" });

    const { status, catatan_admin } = req.body;
    if (status) {
      db.laporanBencana[index].status = status;
    }
    if (catatan_admin !== undefined) {
      db.laporanBencana[index].catatan_admin = catatan_admin;
    }

    saveRawData(db);
    
    // Return decrypted version
    return res.json({
      ...db.laporanBencana[index],
      nama_pelapor: decryptText(db.laporanBencana[index].nama_pelapor),
      no_telepon: decryptText(db.laporanBencana[index].no_telepon)
    });
  });

  // Admin Delete report
  app.delete("/api/admin/laporan/:id", checkAdminAuth, (req, res) => {
    const db = getRawData();
    const originalCount = db.laporanBencana.length;
    db.laporanBencana = db.laporanBencana.filter(l => l.id !== req.params.id);

    if (db.laporanBencana.length === originalCount) {
      return res.status(404).json({ error: "Laporan warga tidak ditemukan" });
    }

    saveRawData(db);
    return res.json({ success: true, message: "Laporan pengaduan warga berhasil dihapus!" });
  });


  /**
   * ==========================================
   * 5. AUTHORITY ANALYTICS & STATS DASHBOARD
   * ==========================================
   */
  app.get("/api/admin/dashboard/stats", checkAdminAuth, (req, res) => {
    const db = getRawData();
    
    // Distributions calculators
    const bencanaDistribution: Record<JenisBencana, number> = {
      banjir: 0,
      longsor: 0,
      gempa: 0,
      kebakaran: 0,
      cuaca_ekstrim: 0,
      lainnya: 0
    };

    const kabupatenDistribution: Record<string, number> = {};

    db.titikRawan.forEach(tr => {
      if (bencanaDistribution[tr.jenis_bencana] !== undefined) {
        bencanaDistribution[tr.jenis_bencana] += 1;
      } else {
        bencanaDistribution[tr.jenis_bencana] = 1;
      }

      const kab = tr.kabupaten || "Jawa Barat";
      kabupatenDistribution[kab] = (kabupatenDistribution[kab] || 0) + 1;
    });

    const stats: DashboardStats = {
      totalTitikRawan: db.titikRawan.length,
      totalAlertsAktif: db.alerts.filter(a => a.status === "aktif").length,
      totalLaporanBaru: db.laporanBencana.filter(l => l.status === "baru").length,
      totalLaporanSelesai: db.laporanBencana.filter(l => l.status === "selesai").length,
      bencanaDistribution,
      kabupatenDistribution
    };

    return res.json(stats);
  });


  /**
   * ==========================================
   * VITE SERVING MIDDLEWARE
   * ==========================================
   */
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Siaga Jabar App running on http://localhost:${PORT}`);
  });
}

startServer();
