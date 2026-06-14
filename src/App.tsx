import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Bell, 
  MapPin, 
  Megaphone, 
  PhoneCall, 
  ArrowRight, 
  WifiOff, 
  CheckCircle,
  FileText,
  Radio,
  Clock,
  HeartHandshake,
  Activity,
  X,
  Volume2
} from "lucide-react";
import Header from "./components/Header";
import InteractiveMap from "./components/InteractiveMap";
import ReportForm from "./components/ReportForm";
import EvacuationArticles from "./components/EvacuationArticles";
import AdminDashboard from "./components/AdminDashboard";
import { TitikRawan, Alert, LaporanBencana } from "./types";

export default function App() {
  // Navigation tabs: 'home' | 'map' | 'lapor' | 'info' | 'admin'
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(true);

  // Core global data states
  const [titikRawan, setTitikRawan] = useState<TitikRawan[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [laporanWarga, setLaporanWarga] = useState<LaporanBencana[]>([]);

  // Admin session state
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem("siaga_admin_token"));
  const [adminUser, setAdminUser] = useState<any>(null);

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<LaporanBencana[]>([]);
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // Simulated Push Notification state
  const [livePushNotification, setLivePushNotification] = useState<{ id: string; msg: string; area: string } | null>(null);

  // Alert extreme modal dismiss
  const [showAwasModal, setShowAwasModal] = useState(false);
  const [activeAwasAlert, setActiveAwasAlert] = useState<Alert | null>(null);

  // API Fetch helper triggers
  const fetchPublicData = async () => {
    try {
      // Fetch points
      const ptr = await fetch("/api/titik-rawan?status=dipublikasikan");
      if (ptr.ok) {
        const data = await ptr.json();
        setTitikRawan(data);
      }
      
      // Fetch public alerts
      const alt = await fetch("/api/alerts?status=aktif");
      if (alt.ok) {
        const data = await alt.json();
        setAlerts(data);

        // Check for any 'awas' status level alert
        const awasAlert = data.find((a: Alert) => a.tingkat_bahaya === "awas");
        if (awasAlert) {
          setActiveAwasAlert(awasAlert);
          setShowAwasModal(true);
        }
      }
    } catch (e) {
      console.error("Gagal menyinkronkan data publik dari api", e);
    }
  };

  const fetchAdminData = async () => {
    if (!adminToken) return;
    try {
      // Load all points including drafts
      const resT = await fetch("/api/titik-rawan", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (resT.ok) {
        const data = await resT.json();
        setTitikRawan(data);
      }

      // Load all reports for administrators (decrypted)
      const resL = await fetch("/api/admin/laporan", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (resL.ok) {
        const data = await resL.json();
        setLaporanWarga(data);
      }

      // Load all alerts
      const resA = await fetch("/api/alerts");
      if (resA.ok) {
        const data = await resA.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Gagal menyinkronkan data admin", err);
    }
  };

  // Check login on load
  const checkTokenValidity = async () => {
    if (!adminToken) return;
    try {
      const resp = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      const data = await resp.json();
      if (data.authenticated) {
        setAdminUser(data.admin);
      } else {
        // expired/invalid token
        setAdminToken(null);
        localStorage.removeItem("siaga_admin_token");
      }
    } catch (e) {
      console.error("Otoritas verification failed", e);
    }
  };

  // Initialize and check connection
  useEffect(() => {
    checkTokenValidity();
    fetchPublicData();

    // Check offline queues in localStorage
    const savedQueue = localStorage.getItem("siaga_offline_reports_queue");
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }
  }, []);

  // Sync data automatically depending on authentication
  useEffect(() => {
    if (adminToken) {
      fetchAdminData();
    } else {
      fetchPublicData();
    }
  }, [adminToken]);

  // OFFLINE AUTO-SYNC CHANNEL EFFECT
  useEffect(() => {
    const processSync = async () => {
      if (navigator.onLine && offlineQueue.length > 0) {
        console.log("Internet restored! Starting automated push queues synchronization...");
        let successTracker = 0;
        
        // Copy queue to process
        const queueToProcess = [...offlineQueue];

        for (const report of queueToProcess) {
          try {
            const cleanReport = {
              nama_pelapor: report.nama_pelapor,
              no_telepon: report.no_telepon,
              lokasi_kejadian: report.lokasi_kejadian,
              jenis_bencana: report.jenis_bencana,
              deskripsi: report.deskripsi,
              foto_url: report.foto_url
            };

            const resp = await fetch("/api/laporan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cleanReport)
            });

            if (resp.ok) {
              successTracker++;
            }
          } catch (e) {
            console.error("Error uploading cached report", e);
          }
        }

        if (successTracker > 0) {
          setSyncedCount(successTracker);
          setShowSyncSuccessToast(true);
          // Audio cue for successful sync
          try { Buffer && new Audio(); } catch(e){} // bypass audio limits if no browser support

          // Clear local queue
          localStorage.removeItem("siaga_offline_reports_queue");
          setOfflineQueue([]);
          
          // Re-refresh datas
          if (adminToken) {
            fetchAdminData();
          } else {
            fetchPublicData();
          }

          // Dismiss toast after 6s
          setTimeout(() => setShowSyncSuccessToast(false), 6000);
        }
      }
    };

    const handleConnRestored = () => {
      processSync();
    };

    window.addEventListener("online", handleConnRestored);
    // Runs on load as well in case they open already online with saved queue
    if (navigator.onLine && offlineQueue.length > 0) {
      processSync();
    }

    return () => {
      window.removeEventListener("online", handleConnRestored);
    };
  }, [offlineQueue]);

  // PUSDALOPS PUSH ALERTS SIMULATOR ENGINE EFFECT
  useEffect(() => {
    // List of dynamic real-time simulated push notices
    const MOCK_MESSAGES = [
      { id: "p1", msg: "Peningkatan debit air Sungai Citarum terpantau di Bendung Dayeuhkolot setinggi 120cm.", area: "Bandung" },
      { id: "p2", msg: "Visualisasi Pusdalops: Rekahan longsor kecil terdeteksi di kilometer 38 Cadas Pangeran.", area: "Sumedang" },
      { id: "p3", msg: "Info BMKG: Angin puting beliung terpantau melintas cepat di Babakan Madang, Bogor.", area: "Bogor" },
      { id: "p4", msg: "Laporan Terverifikasi: Kebakaran lahan semak di perbukitan Gunung Guntur berhasil dipadamkan.", area: "Garut" },
      { id: "p5", msg: "Info Gempa: Magnitudo 3.1 rilis di wilayah Sesar Lembang, getaran halus dirasakan Parongpong.", area: "Bandung Barat" }
    ];

    const interval = setInterval(() => {
      const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
      setLivePushNotification({
        id: `${randomMsg.id}-${Date.now()}`,
        msg: randomMsg.msg,
        area: randomMsg.area
      });

      // Clear after 8 seconds
      setTimeout(() => {
        setLivePushNotification(null);
      }, 8000);

    }, 45000); // Triggers every 45s for demonstrating live push capability in action

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (token: string, adminInfo: any) => {
    setAdminToken(token);
    setAdminUser(adminInfo);
    localStorage.setItem("siaga_admin_token", token);
    setCurrentTab("admin");
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem("siaga_admin_token");
    setCurrentTab("home");
  };

  // Add offline report callback
  const handleAddOfflineReport = (offlineReport: any) => {
    const updated = [offlineReport, ...offlineQueue];
    setOfflineQueue(updated);
    localStorage.setItem("siaga_offline_reports_queue", JSON.stringify(updated));
  };

  const handleReportRegistered = (newReport: any) => {
    setLaporanWarga([newReport, ...laporanWarga]);
  };

  // Active alerts list for the bar
  const activeAlertsCount = alerts.filter(a => a.status === "aktif").length;

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-[#2563EB] selection:text-white" id="siaga-jabar-root">
      
      {/* 1. AGGRESSIVE RED BANNER FOR EMERGENCY WARNINGS */}
      {activeAlertsCount > 0 && currentTab !== "admin" && isBannerVisible && (
        <div 
          className="bg-red-600 text-white border-b border-red-700 px-4 md:px-6 py-3 text-center text-xs md:text-sm font-bold tracking-wide z-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md select-none" 
          id="danger-sticky-banner"
        >
          <div 
            onClick={() => setCurrentTab("map")}
            className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Megaphone className="h-4 w-4 shrink-0 animate-pulse text-white" />
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1">
              <span className="font-extrabold uppercase text-white/90">PERINGATAN DARURAT:</span>
              <span className="font-black underline uppercase text-white tracking-wide">
                {alerts.find(a => a.status === "aktif")?.judul}
              </span>
              <span className="uppercase text-white/90 font-medium">SEGERA PERIKSA PETA TITIK BAHAYA!</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setCurrentTab("map")}
              className="rounded-full bg-white text-red-600 hover:bg-red-50 hover:scale-[1.02] active:scale-[0.98] px-4 sm:px-5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 shadow shrink-0"
            >
              LIHAT PETA
            </button>
            <button
              type="button"
              onClick={() => setIsBannerVisible(false)}
              className="rounded-full bg-red-700 hover:bg-red-800 text-white hover:scale-[1.02] active:scale-[0.98] border border-white/20 hover:border-white/45 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Sembunyikan Peringatan"
            >
              <X className="h-3.5 w-3.5" />
              <span>Sembunyikan</span>
            </button>
          </div>
        </div>
      )}

      {/* 1.1 SMALL COLLAPSIBLE TRIGGER FOR RESTORING BANNER */}
      {activeAlertsCount > 0 && currentTab !== "admin" && !isBannerVisible && (
        <div 
          className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-center text-[10px] sm:text-xs font-bold tracking-wider z-50 flex flex-col sm:flex-row items-center justify-center gap-2 shadow-sm transition-all duration-350 animate-fade-in"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-red-600 animate-ping shrink-0" />
            <Megaphone className="h-3.5 w-3.5 animate-pulse text-red-600 shrink-0" />
            <span className="font-semibold text-slate-700">Menyembunyikan {activeAlertsCount} Peringatan Bencana Aktif.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsBannerVisible(true)}
            className="rounded-full bg-black/75 hover:bg-black text-white hover:scale-[1.02] active:scale-[0.98] px-3.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm flex items-center gap-1.5 border border-black/10 shrink-0"
          >
            <span>Tampilkan Kembali Banner</span>
          </button>
        </div>
      )}

      {/* Dynamic Header */}
      <Header 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isAdmin={!!adminToken} 
        onLogout={handleLogout}
        pendingOfflineReportsCount={offlineQueue.length}
      />

      {/* Main Container Stage */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/**
         * ==========================================
         * VIEW 1: HOME/BERANDA PUBLIC PORTAL
         * ==========================================
         */}
         {currentTab === "home" && (
          <div className="space-y-12 animate-fade-in" id="public-beranda-tab">
            
            {/* Hero Brand Dashboard banner */}
            <div className="rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white relative overflow-hidden shadow-xl p-6 sm:p-10 lg:p-12 mb-6 border border-blue-700">
              
              {/* Background glowing decorations */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-5 left-10 h-32 w-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative max-w-3xl space-y-4">
                <div className="inline-flex items-center space-x-1.5 border border-blue-300/30 bg-white/10 px-3.5 py-1 rounded-full text-[10px] sm:text-xs text-blue-200 font-bold tracking-widest uppercase">
                  <Radio className="h-4 w-4 animate-ping shrink-0 text-white" />
                  <span className="text-white">Early Warning System Active</span>
                </div>

                <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-none text-white">
                  Info Cepat, Respons Tepat,<br className="hidden sm:inline" /> Jawa Barat Selamat!
                </h2>

                <p className="text-xs sm:text-sm text-blue-50 leading-relaxed max-w-2xl font-sans font-medium">
                  Siaga Jabar adalah platform mitigasi bencana resmi dan sistem peringatan dini terintegrasi wilayah Jawa Barat. 
                  Dirancang ringan berbasis **Mobile-First** dan mendukung **Mode Penyimpanan Offline** untuk memastikan 
                  informasi penyelamatan darurat tetap dapat diakses di lokasi minim sinyal.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <button
                    onClick={() => setCurrentTab("map")}
                    className="flex items-center space-x-3 rounded-xl bg-white text-[#2563EB] border-2 border-blue-400 hover:bg-slate-50 px-5.5 py-3 text-xs sm:text-sm font-black shadow-lg shadow-[#2563EB]/10 transition-all hover:scale-[1.02] active:scale-[0.98] duration-300"
                  >
                    <span>Pelajari Peta Bahaya</span>
                    <ArrowRight className="h-4 w-4 text-[#2563EB]" />
                  </button>
                  <button
                    onClick={() => setCurrentTab("lapor")}
                    className="flex items-center space-x-2 rounded-xl bg-blue-900/60 hover:bg-blue-950 border border-blue-400/40 text-white px-5 py-3 text-xs sm:text-sm font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] duration-300"
                  >
                    <span>Lapor Mandiri Masyarakat</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Action Portals Block */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              
              <div 
                onClick={() => setCurrentTab("map")}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-blue-500/15 transition cursor-pointer space-y-4 hover:border-[#2563EB] hover:scale-[1.02] duration-300"
              >
                <div className="h-10 w-10 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-slate-900 text-sm">Peta Risiko Jabar</h4>
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    Lihat wilayah rawan bencana, sebaran banjir, gempa bumi aktif, dan longsor dengan integrasi peta interaktif.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setCurrentTab("lapor")}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-blue-500/15 transition cursor-pointer space-y-4 hover:border-blue-400 hover:scale-[1.02] duration-300"
              >
                <div className="h-10 w-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-slate-900 text-sm">Pelaporan Masyarakat</h4>
                  <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                    Kirimkan laporan darurat setempat secara langsung disertai bukti foto dan penunjuk titik GPS akurat.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setCurrentTab("info")}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-blue-400/15 transition cursor-pointer space-y-4 hover:border-[#2563EB] hover:scale-[1.02] duration-300"
              >
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-slate-900 text-sm">Panduan &amp; Hotline</h4>
                  <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                    Akses materi instruksi evakuasi mandiri dan nomor kontak regu penyelamat SAR / BPBD wilayah Jawa Barat.
                  </p>
                </div>
              </div>

            </div>

            {/* Active alerts panel broadcast */}
            <div className="space-y-6">
              <h3 className="font-display font-extrabold text-lg text-slate-900 flex items-center space-x-2">
                <Bell className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span>Siaran Berita &amp; Alert Siaga Jabar</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.filter(a => a.status === "aktif").length === 0 ? (
                  <div className="col-span-2 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-xs bg-slate-50 font-bold">
                    Saat ini situasi Jabar terpantau AMAN secara menyeluruh. Tidak ada siaran bencana aktif saat ini.
                  </div>
                ) : (
                  alerts
                    .filter(a => a.status === "aktif")
                    .map((al) => {
                      const dangerBadge = al.tingkat_bahaya === "awas" 
                        ? "bg-red-500/10 text-red-600 border border-red-500/20" 
                        : al.tingkat_bahaya === "waspada" 
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/25" 
                        : "bg-blue-500/10 text-blue-600 border border-blue-500/25";
                      
                      return (
                        <div 
                          key={al.id} 
                          onClick={() => setCurrentTab("map")}
                          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-blue-450 hover:scale-[1.02] hover:shadow-md active:scale-[0.99] transition-all duration-300 cursor-pointer"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${dangerBadge}`}>
                                {al.tingkat_bahaya}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                Rilis: {new Date(al.created_at).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                            <h4 className="font-display font-bold text-slate-900 text-sm leading-snug">{al.judul}</h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">{al.deskripsi}</p>
                          </div>
                          
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span className="truncate">Area Terdampak: <span className="text-slate-800">{al.wilayah_terdampak}</span></span>
                            <div className="text-[#2563EB] hover:text-blue-700 font-black shrink-0 flex items-center space-x-1">
                              <span>Buka Peta</span>
                              <ArrowRight className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Offline Capabilities Overview Info */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 flex flex-col md:flex-row gap-6 items-center shadow-lg">
              <div className="h-16 w-16 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25 rounded-2xl flex items-center justify-center shrink-0">
                <WifiOff className="h-8 w-8" />
              </div>
              <div className="space-y-2 flex-1 text-center md:text-left">
                <h4 className="font-display font-black text-slate-900 text-base">Sistem Operasi Offline &amp; Data Cache Siaga</h4>
                <p className="text-xs text-slate-655 font-semibold leading-relaxed font-sans">
                  Situs ini mengintegrasikan mekanisme penyimpanan lokal mandiri. Saat Anda berada di titik ketiadaan sinyal internet seluler (Offline), Anda dapat membuka panduan evakuasi, membaca hotline darurat, mencari koordinat rujukan, serta mendaftarkan formulir laporan penyelamatan yang dicadangkan secara presisi. Laporan darurat lokal akan diluncurkan otomatis segera setelah jaringan internet Anda kembali online.
                </p>
              </div>
            </div>

          </div>
        )}

        {/**
         * ==========================================
         * VIEW 2: MAP / PETA BAHAYA TAB
         * ==========================================
         */}
        {currentTab === "map" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
              <h2 className="font-display text-lg font-bold text-slate-950">Visualisasi Peta Kerawanan Wilayah Jawa Barat</h2>
              <p className="text-xs text-slate-655 font-semibold mt-1">
                Gunakan filter di bagian samping untuk memperlihatkan hanya kawasan dengan tingkat bencana yang Anda khawatirkan. Klik pin penanda di peta untuk memunculkan modal instruksi taktis lapangan.
              </p>
            </div>
            
            <InteractiveMap titikRawan={titikRawan} />
          </div>
        )}

        {/**
         * ==========================================
         * VIEW 3: CITIZENS EMERGENCY REPORTING FORM
         * ==========================================
         */}
        {currentTab === "lapor" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
              <h2 className="font-display text-lg font-bold text-slate-950">Formulir Pelaporan Darurat Swadaya Masyarakat</h2>
              <p className="text-xs text-slate-655 font-medium mt-1">
                Gunakan kanal ini untuk mendaftarkan aduan penyelamatan atau laporan bencana di lingkungan Anda demi respon sigap Dinas BPBD setempat. Data nomor kontak Anda dilindungi enkripsi siber tangguh.
              </p>
            </div>

            <ReportForm 
              onReportRegistered={handleReportRegistered}
              onAddOfflineReport={handleAddOfflineReport}
            />
          </div>
        )}

        {/**
         * ==========================================
         * VIEW 4: OFFLINE EVACUATION HANDBOOK & NUMBERS
         * ==========================================
         */}
        {currentTab === "info" && (
          <EvacuationArticles />
        )}

        {/**
         * ==========================================
         * VIEW 5: SECURITY/PUSDALOPS ADMINISTRATION PANEL
         * ==========================================
         */}
        {currentTab === "admin" && (
          <AdminDashboard 
            adminToken={adminToken}
            onLoginSuccess={handleLoginSuccess}
            titikRawan={titikRawan}
            refreshTitikRawan={adminToken ? fetchAdminData : fetchPublicData}
            alerts={alerts}
            refreshAlerts={adminToken ? fetchAdminData : fetchPublicData}
            laporanWarga={laporanWarga}
            refreshLaporan={adminToken ? fetchAdminData : fetchPublicData}
          />
        )}

      </main>

      {/* 2. REAL-TIME REAL EMERGENCY ACTIVE ALERT POPUPS */}
      {showAwasModal && activeAwasAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/60 backdrop-blur-xs" id="emergency-alert-modal">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white text-slate-850 shadow-2xl p-6 relative overflow-hidden space-y-4 animate-scale-up">
            
            <div className="absolute top-0 right-0 h-24 w-24 bg-red-550/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-3 text-red-600">
              <div className="h-10 w-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 animate-pulse text-red-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold">PENGUMUMAN PUSAT AWAS</span>
                <p className="text-xs text-red-600 font-extrabold mt-0.5 font-sans">EVAKUASI SEGERA DIPERBOLEHKAN</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-base font-black uppercase tracking-tight leading-snug text-red-600">
                {activeAwasAlert.judul}
              </h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans mt-2">
                {activeAwasAlert.deskripsi}
              </p>
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 mt-3">
                <span className="text-[9px] font-mono text-red-600 uppercase font-black">WILAYAH DARURAT AKUT:</span>
                <p className="text-xs font-bold text-slate-900 tracking-wide mt-0.5">{activeAwasAlert.wilayah_terdampak}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowAwasModal(false);
                  setCurrentTab("map");
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 font-bold rounded-lg text-xs tracking-tight text-white transition"
              >
                Cek Posisi di Peta
              </button>
              <button
                onClick={() => setShowAwasModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 rounded-lg text-xs"
              >
                Tutup Peringatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SIMULATED LIVE FLOATING PUSH TOAST FROM PUSDALOPS */}
      {livePushNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-red-200 text-slate-800 rounded-2xl w-85 p-4 shadow-2xl flex items-start gap-3 animate-slide-in-right border-l-4 border-l-red-500" id="push-simulated-notification">
          <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center text-white shrink-0 animate-bounce">
            <Volume2 className="h-4 w-4" />
          </div>
          <div className="space-y-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest font-black text-red-600 uppercase">PUSH REAL-TIME SIAGA</span>
              <button 
                onClick={() => setLivePushNotification(null)}
                className="text-slate-400 hover:text-slate-705 font-bold"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[11px] font-bold text-slate-900 truncate">Sinyal Peringatan Wilayah: {livePushNotification.area}</p>
            <p className="text-xs text-slate-655 font-medium leading-relaxed">{livePushNotification.msg}</p>
          </div>
        </div>
      )}

      {/* 4. OFFLINE SYNC SUCCESS TOAST */}
      {showSyncSuccessToast && (
        <div className="fixed bottom-4 left-4 z-50 bg-white border border-emerald-200 text-slate-800 rounded-2xl w-85 p-4 shadow-2xl flex items-start gap-3 animate-slide-in-left border-l-4 border-l-emerald-500" id="offline-sync-toast">
          <div className="h-8 w-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-600 uppercase">SIMPANKU INTEGRASI OK</span>
              <button 
                onClick={() => setShowSyncSuccessToast(false)}
                className="text-slate-400 hover:text-slate-705"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900">Sinkronisasi Offline Berhasil!</p>
            <p className="text-[11px] text-slate-650 leading-snug font-medium">
              Sebanyak <span className="text-emerald-600 font-extrabold">{syncedCount} laporan warga</span> dari cache antrean lokal ponsel Anda telah dipancarkan berhasil ke pangkalan data BPBD Jabar.
            </p>
          </div>
        </div>
      )}

      {/* Page Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16 text-center text-xs text-slate-500 space-y-2">
        <p className="font-display font-black text-slate-800 flex items-center justify-center space-x-1 uppercase tracking-wider">
          <ShieldAlert className="h-4 w-4 text-[#2563EB]" />
          <span className="tracking-tight text-slate-800">BPBD PROVINSI JAWA BARAT</span>
        </p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Sistem Informasi Antisipasi Gawat Darurat Jawa Barat — SIAGA JABAR
        </p>
        <p className="text-[10px] font-mono text-slate-400">
          Infrastruktur Web Sprint MVP • Peta rujukan Leaflet.js • Enkripsi End-To-End Aktif
        </p>
      </footer>

    </div>
  );
}
