import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Mail, 
  User, 
  Volume2, 
  Clock, 
  FileText, 
  Database, 
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";
import { TitikRawan, Alert, LaporanBencana, DashboardStats, JenisBencana, TingkatRisiko, TingkatBahaya } from "../types";

interface AdminDashboardProps {
  adminToken: string | null;
  onLoginSuccess: (token: string, adminInfo: any) => void;
  titikRawan: TitikRawan[];
  refreshTitikRawan: () => void;
  alerts: Alert[];
  refreshAlerts: () => void;
  laporanWarga: LaporanBencana[];
  refreshLaporan: () => void;
}

export default function AdminDashboard({
  adminToken,
  onLoginSuccess,
  titikRawan,
  refreshTitikRawan,
  alerts,
  refreshAlerts,
  laporanWarga,
  refreshLaporan
}: AdminDashboardProps) {
  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Active sub-section
  const [activeMenu, setActiveMenu] = useState<"stats" | "titik" | "alert" | "laporan">("stats");

  // Dynamic analytic summary stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Form modals state handlers
  const [editPoint, setEditPoint] = useState<Partial<TitikRawan> | null>(null);
  const [editAlert, setEditAlert] = useState<Partial<Alert> | null>(null);
  
  // Custom states for reports updating
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("baru");

  // Fetch admin dashboard stats
  const fetchStats = async () => {
    if (!adminToken) return;
    setIsStatsLoading(true);
    try {
      const resp = await fetch("/api/admin/dashboard/stats", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Gagal mengambil statistik analitik", e);
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchStats();
    }
  }, [adminToken, titikRawan, alerts, laporanWarga]);

  // Auth login action
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError("Harap masukkan email dan kata sandi!");
      return;
    }
    
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Login Gagal.");
      }

      const data = await resp.json();
      onLoginSuccess(data.token, data.admin);
    } catch (err: any) {
      setLoginError(err.message || "Gagal menghubungi auth server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // CRUD Titik Rawan Disaster Nodes
  const handleSavePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPoint) return;

    try {
      const isNew = !editPoint.id;
      const url = isNew ? "/api/admin/titik-rawan" : `/api/admin/titik-rawan/${editPoint.id}`;
      const method = isNew ? "POST" : "PUT";

      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify(editPoint)
      });

      if (!resp.ok) {
        throw new Error("Gagal menyimpan perubahan koordinat bencana.");
      }

      setEditPoint(null);
      refreshTitikRawan();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePoint = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus titik rawan bencana ini?")) return;
    try {
      const resp = await fetch(`/api/admin/titik-rawan/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (resp.ok) {
        refreshTitikRawan();
      }
    } catch (e) {
      alert("Gagal menghapus.");
    }
  };

  // CRUD Alerts Broadcasting
  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAlert) return;

    try {
      const isNew = !editAlert.id;
      const url = isNew ? "/api/admin/alerts" : `/api/admin/alerts/${editAlert.id}`;
      const method = isNew ? "POST" : "PUT";

      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify(editAlert)
      });

      if (!resp.ok) {
        throw new Error("Gagal menyimpan siaran alert");
      }

      setEditAlert(null);
      refreshAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus siaran darurat ini?")) return;
    try {
      const resp = await fetch(`/api/admin/alerts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (resp.ok) {
        refreshAlerts();
      }
    } catch (e) {
      alert("Hapus gagal.");
    }
  };

  // Resolve / process incoming report
  const handlePatchReport = async (reportId: string, status: 'baru' | 'diproses' | 'selesai') => {
    try {
      const resp = await fetch(`/api/admin/laporan/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ 
          status, 
          catatan_admin: selectedReportId === reportId ? catatanAdmin : undefined 
        })
      });

      if (resp.ok) {
        setSelectedReportId(null);
        setCatatanAdmin("");
        refreshLaporan();
      } else {
        alert("Gagal memperbarui status laporan.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Apakah anda yakin ingin menghapus/mengabaikan pengaduan warga ini?")) return;
    try {
      const resp = await fetch(`/api/admin/laporan/${reportId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (resp.ok) {
        refreshLaporan();
      }
    } catch (e) {
      alert("Gagal");
    }
  };

  /**
   * ==========================================
   * 1. LOGIN PORTAL GATE
   * ==========================================
   */
  if (!adminToken) {
    return (
      <div className="mx-auto max-w-md my-12" id="admin-login-gate">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Header block */}
          <div className="bg-slate-900 px-6 py-8 text-center text-white space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white animate-pulse">
              <Lock className="h-6 w-6" id="lock-icon" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Otoritas BPBD Jawa Barat</h3>
              <p className="text-xs text-slate-400">Pusat Data dan Pengendali Operasi Bencana (Pusdalops)</p>
            </div>
          </div>

          {/* Form container */}
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 font-medium">
                {loginError}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center space-x-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>Alamat Surat Elektronik</span>
              </label>
              <input
                type="email"
                required
                placeholder="cth. admin@siagajabar.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center space-x-1">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Kata Sandi Akses</span>
              </label>
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Simulated login action */}
            <button
               type="submit"
               disabled={isLoggingIn}
               className="w-full mt-2 flex items-center justify-center space-x-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs transition duration-200 uppercase"
            >
              <span>{isLoggingIn ? "Memverifikasi Kredensial..." : "Masuk Sistem Otoritas"}</span>
            </button>
          </form>

          {/* Credentials Helper footer */}
          <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AKUN PENGUJI DEFAULT (DEMO)</p>
            <div className="flex flex-col gap-2.5 mt-3">
              {/* Username row */}
              <div className="flex items-center justify-between bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-205/80 shadow-inner">
                <div className="text-left font-mono text-[11px] text-slate-700 min-w-0 flex-1 pr-2.5">
                  <span className="font-bold text-slate-400 mr-1.5 select-none text-[10px] tracking-wider uppercase">User:</span>
                  <span className="select-all font-medium text-slate-800 break-all">admin@siagajabar.go.id</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("admin@siagajabar.go.id");
                    setCopiedUser(true);
                    setTimeout(() => setCopiedUser(false), 2000);
                  }}
                  className={`flex items-center justify-center p-1.5 rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm shrink-0 ${
                    copiedUser 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800"
                  }`}
                  title="Salin Username"
                >
                  {copiedUser ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Password row */}
              <div className="flex items-center justify-between bg-slate-100/80 px-3 py-2 rounded-xl border border-slate-205/80 shadow-inner">
                <div className="text-left font-mono text-[11px] text-slate-700 min-w-0 flex-1 pr-2.5">
                  <span className="font-bold text-slate-400 mr-1.5 select-none text-[10px] tracking-wider uppercase">Pass:</span>
                  <span className="select-all font-medium text-slate-800 break-all">adminsiaga123</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("adminsiaga123");
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }}
                  className={`flex items-center justify-center p-1.5 rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm shrink-0 ${
                    copiedPass 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800"
                  }`}
                  title="Salin Kata Sandi"
                >
                  {copiedPass ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="authority-dashboard-panel">
      
      {/* Upper Navigation panel */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base">Dashboard Pusat Pengendali Operasi</h2>
            <p className="text-[10px] font-mono text-indigo-300">ADMINISTRATIVE COMMAND CENTRE • BPBD JAWA BARAT</p>
          </div>
        </div>

        {/* Sync, Refresh, Logout Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchStats}
            className="inline-flex items-center space-x-1 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold px-2.5 py-1.5 text-slate-300 transition"
          >
            <RefreshCw className="h-3 w-3" />
            <span>SEGARKAN DATA</span>
          </button>
        </div>
      </div>

      {/* Admin Horizontal Tabs */}
      <div className="border-b border-slate-200 flex space-x-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveMenu("stats")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all shrink-0 uppercase tracking-tight ${
            activeMenu === "stats" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Analis &amp; Statistik
        </button>
        <button
          onClick={() => setActiveMenu("titik")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all shrink-0 uppercase tracking-tight ${
            activeMenu === "titik" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Kelola Titik Rawan ({titikRawan.length})
        </button>
        <button
          onClick={() => setActiveMenu("alert")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all shrink-0 uppercase tracking-tight ${
            activeMenu === "alert" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Siaran Alert Aktif ({alerts.length})
        </button>
        <button
          onClick={() => setActiveMenu("laporan")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all shrink-0 uppercase tracking-tight ${
            activeMenu === "laporan" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Aduan Warga ({laporanWarga.length})
        </button>
      </div>

      {/**
       * ==========================================
       * SUB-SECTION 1: ANALYTICS & CHARS STATISTICS
       * ==========================================
       */}
      {activeMenu === "stats" && stats && (
        <div className="space-y-6 animate-fade-in" id="dashboard-analytics-tab">
          
          {/* Key Metrics grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            
            <div className="rounded-xl border border-slate-250 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">DATA TITIK RAWAN</span>
              <p className="font-display text-2xl font-black text-slate-900 mt-1">{stats.totalTitikRawan}</p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">✓ Terpetakan di Peta</span>
            </div>

            <div className="rounded-xl border border-slate-250 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">SIARAN ALERT AKTIF</span>
              <p className="font-display text-2xl font-black text-rose-600 mt-1">{stats.totalAlertsAktif}</p>
              <span className="text-[11px] text-rose-500 font-semibold mt-1 block">🛰️ Mengudara Real-time</span>
            </div>

            <div className="rounded-xl border border-slate-250 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">LAPORAN BARU MASUK</span>
              <p className="font-display text-2xl font-black text-amber-600 mt-1">{stats.totalLaporanBaru}</p>
              <span className="text-[11px] text-amber-500 font-semibold mt-1 block">⚠️ Perlu Tindakan Segera</span>
            </div>

            <div className="rounded-xl border border-slate-250 bg-white p-4 shadow-xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">ADUAN WARGA BERES</span>
              <p className="font-display text-2xl font-black text-emerald-600 mt-1">{stats.totalLaporanSelesai}</p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">✓ Selesai Dievakuasi</span>
            </div>

          </div>

          {/* Core Descriptive Charts (Tailwind engineered SVG bar charts representing high craft) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* Disaster Type distribution Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm">Distribusi Kategori Kerawanan Bencana</h4>
                <p className="text-[11px] text-slate-500">Jumlah titik rawan yang diposisikan berdasarkan potensi bahayanya.</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {Object.entries(stats.bencanaDistribution).map(([bencana, count]) => {
                  const maxVal = Math.max(...(Object.values(stats.bencanaDistribution) as number[]), 1);
                  const percentage = ((count as number) / maxVal) * 100;
                  
                  return (
                    <div key={bencana} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-semibold text-slate-700">{bencana.replace("_", " ")}</span>
                        <span className="font-mono text-slate-500 font-bold">{count} Titik</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regional breakdown map chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm">Fokus Kepadatan Wilayah Kabupaten / Kota</h4>
                <p className="text-[11px] text-slate-500">Pembagian zona siaga berdasarkan frekuensi kejadian daerah.</p>
              </div>

              <div className="space-y-3 pt-2" id="kabupaten-distribution-chart">
                {Object.entries(stats.kabupatenDistribution).length === 0 ? (
                  <p className="text-center py-12 text-slate-400 text-xs">Belum ada pemetaan data kabupaten.</p>
                ) : (
                  Object.entries(stats.kabupatenDistribution).map(([kab, count]) => {
                    const maxVal = Math.max(...(Object.values(stats.kabupatenDistribution) as number[]), 1);
                    const percentage = ((count as number) / maxVal) * 100;
                    
                    return (
                      <div key={kab} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{kab}</span>
                          <span className="font-mono text-slate-500 font-bold">{count} Wilayah</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-slate-800 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Security E2E and Cryptosegurity policies confirmation */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex gap-4 text-xs text-blue-900">
            <Database className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[11px]">Enkripsi Data Pengguna &amp; Perlindungan Siber</p>
              <p className="mt-1 text-blue-700 leading-normal">
                Setiap aduan warga yang masuk dienkripsi menggunakan standard simetris algoritma sebelum didaftarkan di cluster data master. Informasi sensitif (Nomor telepon dan Nama Lengkap) didekripsi secara langsung dan aman hanya oleh operator internal BPBD yang memiliki token otorisasi yang valid.
              </p>
            </div>
          </div>
        </div>
      )}


      {/**
       * ==========================================
       * SUB-SECTION 2: TITIK RAWAN DATA LIST (CRUD)
       * ==========================================
       */}
      {activeMenu === "titik" && (
        <div className="space-y-6 animate-fade-in" id="titik-rawan-crud-manager">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-slate-900 text-sm">Pengelolaan Koordinat Titik Rawan Bencana</h4>
            <button
              onClick={() => setEditPoint({
                nama_lokasi: "",
                jenis_bencana: "banjir",
                tingkat_risiko: "tinggi",
                latitude: -6.9175,
                longitude: 107.6191,
                deskripsi: "",
                kabupaten: "Bandung",
                status: "dipublikasikan"
              })}
              className="inline-flex items-center space-x-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Titik Baru</span>
            </button>
          </div>

          {/* Form Create / Edit Item is active */}
          {editPoint && (
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm space-y-4 animate-scale-up">
              <h5 className="font-display font-bold text-slate-900 border-b border-slate-100 pb-2 text-xs">
                {editPoint.id ? "Edit Koordinat Titik Bencana" : "Tambah Koordinat Titik Bencana Baru"}
              </h5>

              <form onSubmit={handleSavePoint} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Nama Lokasi / Tempat</label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Kelurahan Cigondewah Kidul RT 02"
                      value={editPoint.nama_lokasi || ""}
                      onChange={(e) => setEditPoint({ ...editPoint, nama_lokasi: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Kabupaten / Kota</label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Bandung, Cianjur, Bogor"
                      value={editPoint.kabupaten || ""}
                      onChange={(e) => setEditPoint({ ...editPoint, kabupaten: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Jenis Kerawanan</label>
                    <select
                      value={editPoint.jenis_bencana || "banjir"}
                      onChange={(e) => setEditPoint({ ...editPoint, jenis_bencana: e.target.value as JenisBencana })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none capitalize"
                    >
                      <option value="banjir">Banjir</option>
                      <option value="longsor">Tanah Longsor</option>
                      <option value="gempa">Gempa Bumi</option>
                      <option value="kebakaran">Kebakaran</option>
                      <option value="cuaca_ekstrim">Cuaca Ekstrem</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tingkat Risiko</label>
                    <select
                      value={editPoint.tingkat_risiko || "tinggi"}
                      onChange={(e) => setEditPoint({ ...editPoint, tingkat_risiko: e.target.value as TingkatRisiko })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="rendah">Rendah</option>
                      <option value="sedang">Sedang</option>
                      <option value="tinggi">Tinggi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Latitude (Lintang Utara/Selatan)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="-6.9175"
                      value={editPoint.latitude || ""}
                      onChange={(e) => setEditPoint({ ...editPoint, latitude: parseFloat(e.target.value) })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Longitude (Bujur Timur)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="107.6191"
                      value={editPoint.longitude || ""}
                      onChange={(e) => setEditPoint({ ...editPoint, longitude: parseFloat(e.target.value) })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>

                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Deskripsi/Status Zona</label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan latar belakang singkat dan history musibah di daerah ini..."
                    value={editPoint.deskripsi || ""}
                    onChange={(e) => setEditPoint({ ...editPoint, deskripsi: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Status Publikasi</label>
                    <select
                      value={editPoint.status || "dipublikasikan"}
                      onChange={(e) => setEditPoint({ ...editPoint, status: e.target.value as any })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="dipublikasikan">Dipublikasikan</option>
                      <option value="draft">Draft (Sembunyikan dari Peta)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditPoint(null)}
                    className="rounded bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Simpan Titik
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Points Table List */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto" id="points-editor-grid">
            <table className="w-full text-xs text-left text-slate-500">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Bencana</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Kabupaten</th>
                  <th className="px-4 py-3">Risiko</th>
                  <th className="px-4 py-3">Koordinat</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {titikRawan.map((point) => (
                  <tr key={point.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900 uppercase tracking-tight">{point.jenis_bencana}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[150px] truncate">{point.nama_lokasi}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{point.kabupaten}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold uppercase ${
                        point.tingkat_risiko === "tinggi" ? "text-red-600" : point.tingkat_risiko === "sedang" ? "text-amber-600" : "text-blue-500"
                      }`}>
                        {point.tingkat_risiko}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px]">{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        point.status === "dipublikasikan" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-slate-100 text-slate-500"
                      }`}>
                        {point.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => setEditPoint(point)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePoint(point.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/**
       * ==========================================
       * SUB-SECTION 3: BROADCAST ALERTS (SIARAN ALERT CRUD)
       * ==========================================
       */}
      {activeMenu === "alert" && (
        <div className="space-y-6 animate-fade-in" id="alerts-crud-manager">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-slate-900 text-sm">Pengiriman Siaran Peringatan Dini</h4>
            <button
              onClick={() => setEditAlert({
                judul: "",
                deskripsi: "",
                tingkat_bahaya: "siaga",
                wilayah_terdampak: "",
                status: "aktif"
              })}
              className="inline-flex items-center space-x-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Siaran Baru</span>
            </button>
          </div>

          {/* Form edit/create alert */}
          {editAlert && (
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm space-y-4 animate-scale-up">
              <h5 className="font-display font-bold text-slate-900 border-b border-slate-100 pb-2 text-xs">
                {editAlert.id ? "Edit Siaran Alert Bencana" : "Buat Siaran Alert Bencana Baru"}
              </h5>

              <form onSubmit={handleSaveAlert} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Judul Siaran Darurat</label>
                    <input
                      type="text"
                      required
                      placeholder="cth. STATUS AWAS LUAPAN BENDAH"
                      value={editAlert.judul || ""}
                      onChange={(e) => setEditAlert({ ...editAlert, judul: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Area Terdampak Wilayah</label>
                    <input
                      type="text"
                      required
                      placeholder="cth. Dayeuhkolot, Bojongsoang, Baleendah"
                      value={editAlert.wilayah_terdampak || ""}
                      onChange={(e) => setEditAlert({ ...editAlert, wilayah_terdampak: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Level/Tingkat Bahaya Bencana</label>
                    <select
                      value={editAlert.tingkat_bahaya || "siaga"}
                      onChange={(e) => setEditAlert({ ...editAlert, tingkat_bahaya: e.target.value as TingkatBahaya })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="aman">Aman (Hijau) 🟢</option>
                      <option value="siaga">Siaga (Kuning) 🟡</option>
                      <option value="waspada">Waspada (Jingga) 🟠</option>
                      <option value="awas">Awas Makro (Merah) 🔴</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Status Alert</label>
                    <select
                      value={editAlert.status || "aktif"}
                      onChange={(e) => setEditAlert({ ...editAlert, status: e.target.value as any })}
                      className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="aktif">Aktif Mengudara (Ditampilkan)</option>
                      <option value="nonaktif">Nonaktif (Arsip)</option>
                    </select>
                  </div>

                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Instruksi Detail Evakuasi Lapangan</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tuliskan arahan evakuasi, titik kumpul perahu, atau nomor tim rescue patroli wilayah setempat..."
                    value={editAlert.deskripsi || ""}
                    onChange={(e) => setEditAlert({ ...editAlert, deskripsi: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditAlert(null)}
                    className="rounded bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Kirim Siaran Alert
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Alert broadcast grid list cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="alerts-editor-grid">
            {alerts.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400 text-xs bg-white rounded-xl border">
                Belum ada siaran darurat aktif yang dikirimkan.
              </div>
            ) : (
              alerts.map((al) => {
                const threatColor = al.tingkat_bahaya === "awas" ? "border-red-500 bg-red-50/20" : al.tingkat_bahaya === "waspada" ? "border-amber-500 bg-amber-50/20" : "border-slate-200 bg-white";
                
                return (
                  <div key={al.id} className={`rounded-xl border p-4 shadow-xs space-y-3 flex flex-col justify-between ${threatColor}`}>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                          al.tingkat_bahaya === "awas" ? "bg-red-100 text-red-800" : al.tingkat_bahaya === "waspada" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          Level: {al.tingkat_bahaya}
                        </span>

                        <span className={`text-[10px] uppercase font-bold ${
                          al.status === "aktif" ? "text-emerald-600" : "text-slate-400"
                        }`}>
                          ● Status: {al.status}
                        </span>
                      </div>

                      <h5 className="font-display font-bold text-slate-900 text-xs">{al.judul}</h5>
                      <p className="text-[11px] text-slate-500 font-mono">Terdampak: {al.wilayah_terdampak}</p>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{al.deskripsi}</p>
                    </div>

                    <div className="flex justify-end gap-1 border-t border-slate-100 pt-2.5">
                      <button
                        onClick={() => setEditAlert(al)}
                        className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 px-2 py-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Koreksi</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(al.id)}
                        className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/**
       * ==========================================
       * SUB-SECTION 4: CITIZENS EMERGENCY REPORTS MANAGER
       * ==========================================
       */}
      {activeMenu === "laporan" && (
        <div className="space-y-6 animate-fade-in" id="citizens-reports-crud-manager">
          
          {/* Filtering state of reports */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <h4 className="font-display font-bold text-slate-900 text-sm">Pusat Validasi Pengaduan Warga (Operator Panel)</h4>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold">Status:</span>
              <button
                onClick={() => setReportStatusFilter("baru")}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase ${
                  reportStatusFilter === "baru" ? "bg-red-100 text-red-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500"
                }`}
              >
                Baru
              </button>
              <button
                onClick={() => setReportStatusFilter("diproses")}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase ${
                  reportStatusFilter === "diproses" ? "bg-amber-100 text-amber-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500"
                }`}
              >
                Diproses
              </button>
              <button
                onClick={() => setReportStatusFilter("selesai")}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase ${
                  reportStatusFilter === "selesai" ? "bg-emerald-100 text-emerald-800" : "bg-slate-50 hover:bg-slate-100 text-slate-500"
                }`}
              >
                Selesai
              </button>
            </div>
          </div>

          {/* Listing reports */}
          <div className="space-y-3" id="reports-editor-table">
            {laporanWarga.filter(l => l.status === reportStatusFilter).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Tidak ada laporan pengaduan warga status "{reportStatusFilter.toUpperCase()}" saat ini.
              </div>
            ) : (
              laporanWarga
                .filter(l => l.status === reportStatusFilter)
                .map((lp) => {
                  const isCurrentEditing = selectedReportId === lp.id;
                  
                  return (
                    <div key={lp.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      
                      {/* Top status tag metrics */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2">
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-black text-rose-600 text-sm">{lp.id}</span>
                          <span className="text-slate-300">|</span>
                          <span className="uppercase text-[9px] font-mono tracking-wider bg-rose-50 border border-rose-100 text-rose-800 font-extrabold px-1.5 py-0.5 rounded leading-none">
                            {lp.jenis_bencana}
                          </span>
                          <span className="text-[10px] text-slate-450 font-mono">
                            Diterima: {new Date(lp.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 self-start sm:self-auto">
                          
                          {lp.status === "baru" && (
                            <button
                              onClick={() => handlePatchReport(lp.id, "diproses")}
                              className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold hover:bg-amber-700 text-[10px] uppercase tracking-wide shadow"
                            >
                              Proses Investigasi
                            </button>
                          )}

                          {lp.status === "diproses" && (
                            <button
                              onClick={() => {
                                setSelectedReportId(lp.id);
                                handlePatchReport(lp.id, "selesai");
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-[10px] uppercase tracking-wide shadow"
                            >
                              Tandai Selesai
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedReportId(isCurrentEditing ? null : lp.id);
                              setCatatanAdmin(lp.catatan_admin || "");
                            }}
                            className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold"
                          >
                            {isCurrentEditing ? "Tutup Catatan" : "Beri Catatan Operator"}
                          </button>

                          <button
                            onClick={() => handleDeleteReport(lp.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 shrink-0"
                            title="Abaikan/Hapus Laporan Palsu"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        
                        </div>

                      </div>

                      {/* Decrypted Citizen details (Personal Protection decrypt overlay) */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-slate-700">
                        
                        <div className="md:col-span-1 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-mono uppercase font-bold text-slate-400">DETAIL KONTAK DARURAT (E2E DECRYPTED)</p>
                          <p className="text-xs font-bold text-slate-900 flex items-center space-x-1 mt-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>{lp.nama_pelapor}</span>
                          </p>
                          <p className="text-xs text-slate-600 font-semibold select-all">
                            {lp.no_telepon}
                          </p>
                        </div>

                        <div className="md:col-span-3 space-y-1.5">
                          <p className="text-xs font-bold text-slate-500">Lokasi Koordinat Kejadian</p>
                          <p className="text-xs font-semibold text-slate-900">{lp.lokasi_kejadian}</p>
                          <p className="text-xs font-bold text-slate-500 mt-2">Uraian Kasus</p>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">{lp.deskripsi}</p>
                        </div>

                      </div>

                      {/* Display photographs appended */}
                      {lp.foto_url && (
                        <div className="pt-2 flex items-center space-x-2">
                          <Eye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-semibold text-slate-500">Foto bukti terlampir:</span>
                          <a href={lp.foto_url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center space-x-0.5">
                            <span>Buka Gambar Pembukti</span>
                            <Eye className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {/* Operator comments details box */}
                      {lp.catatan_admin && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-xs text-emerald-800">
                          <span className="font-bold uppercase text-[9px] tracking-wider block">Catatan Pusdalops BPBD:</span>
                          <p className="mt-0.5">{lp.catatan_admin}</p>
                        </div>
                      )}

                      {/* Interactive inline comment editor */}
                      {isCurrentEditing && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/20 p-3 space-y-2 animate-scale-up">
                          <label className="text-[10px] font-bold uppercase text-slate-500">Ubah Catatan Operator BPBD</label>
                          <textarea
                            rows={2}
                            value={catatanAdmin}
                            onChange={(e) => setCatatanAdmin(e.target.value)}
                            placeholder="Tuliskan nama regu damkar/rescue yang dikirim atau perkembangan pelaporan evakuasi warga..."
                            className="w-full rounded border border-slate-300 p-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedReportId(null)}
                              className="px-3 py-1 bg-white border rounded text-[10px] font-bold text-slate-600"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handlePatchReport(lp.id, lp.status)}
                              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] font-bold"
                            >
                              Simpan Memo
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
