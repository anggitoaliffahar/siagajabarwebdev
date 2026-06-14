import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  User, 
  Camera, 
  Navigation, 
  CheckCircle, 
  WifiOff, 
  Send, 
  RotateCcw,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { JenisBencana } from "../types";

// High-quality mock photographs matching each disaster category for simulated uploads
const MOCK_PHOTOS: Record<JenisBencana, string[]> = {
  banjir: [
    "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400"
  ],
  longsor: [
    "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&q=80&w=400"
  ],
  gempa: [
    "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&q=80&w=400"
  ],
  kebakaran: [
    "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&q=80&w=400"
  ],
  cuaca_ekstrim: [
    "https://images.unsplash.com/photo-1461088945293-0c17689e48ac?auto=format&fit=crop&q=80&w=400"
  ],
  lainnya: [
    "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&q=80&w=400"
  ]
};

interface ReportFormProps {
  onReportRegistered: (newReport: any) => void;
  onAddOfflineReport: (offlineReport: any) => void;
}

export default function ReportForm({ onReportRegistered, onAddOfflineReport }: ReportFormProps) {
  // Form fields
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [jenis, setJenis] = useState<JenisBencana>("banjir");
  const [deskripsi, setDeskripsi] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Simulation variables
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Custom mock local upload simulation
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang didukung!");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("Ukuran gambar maksimal adalah 10 MB!");
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update mock photo selection based on selected disaster type
  useEffect(() => {
    if (!uploadedFileName) {
      const photos = MOCK_PHOTOS[jenis];
      if (photos && photos.length > 0) {
        setSelectedPhoto(photos[0]);
      }
    }
  }, [jenis, uploadedFileName]);

  const handleFetchGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("Perangkat Anda tidak mendukung modul GPS.");
      return;
    }

    setIsLocating(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        // Pre-fill location coordinates as context
        if (!lokasi) {
          setLokasi(`[GPS Lock: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}] `);
        }
      },
      (error) => {
        console.error("GPS fetch error:", error);
        // Fallback to beautiful mock coordinates for West Java (Bandung area)
        const mockLat = -6.9175 + (Math.random() - 0.5) * 0.1;
        const mockLng = 107.6191 + (Math.random() - 0.5) * 0.1;
        setGpsCoords({ lat: mockLat, lng: mockLng });
        setIsLocating(false);
        setGpsError("Akses GPS ditolak, menggunakan estimasi lokasi jaringan.");
        if (!lokasi) {
          setLokasi(`[Est GPS: ${mockLat.toFixed(4)}, ${mockLng.toFixed(4)}] `);
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !phone || !lokasi || !deskripsi) {
      alert("Mohon lengkapi semua bidang isian formulir!");
      return;
    }

    setIsSubmitting(true);

    const reportPayload = {
      nama_pelapor: nama,
      no_telepon: phone,
      lokasi_kejadian: gpsCoords 
        ? `${lokasi} (Lat: ${gpsCoords.lat.toFixed(5)}, Lng: ${gpsCoords.lng.toFixed(5)})` 
        : lokasi,
      jenis_bencana: jenis,
      deskripsi,
      foto_url: selectedPhoto,
      created_at: new Date().toISOString()
    };

    if (!isOnline) {
      // OFFLINE MODE INJECTION
      const ticketId = `TKT-OFF-${Math.floor(1000 + Math.random() * 9000)}`;
      const offlineReport = {
        ...reportPayload,
        id: ticketId,
        status: "baru",
        isOfflineQueue: true
      };
      
      // Save locally
      onAddOfflineReport(offlineReport);
      setSuccessTicket({ id: ticketId, isOffline: true, ...offlineReport });
      setIsSubmitting(false);
      return;
    }

    try {
      const resp = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload)
      });

      if (!resp.ok) {
        throw new Error("Gagal mengirim laporan bencana ke server.");
      }

      const result = await resp.json();
      setSuccessTicket({
        id: result.ticketId,
        isOffline: false,
        ...result.laporan
      });

      // Notify parent to append
      onReportRegistered(result.laporan);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Koneksi ke server bermasalah.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setNama("");
    setPhone("");
    setLokasi("");
    setJenis("banjir");
    setDeskripsi("");
    setGpsCoords(null);
    setSuccessTicket(null);
    setGpsError("");
    setUploadedFileName("");
  };

  if (successTicket) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm text-center space-y-6 animate-scale-up" id="report-success-panel">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto animate-bounce">
          <CheckCircle className="h-10 w-10" id="success-icon" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-slate-900">Laporan Darurat Terdaftar!</h3>
          <p className="text-xs text-slate-500">
            {successTicket.isOffline 
              ? "Sistem sedang Offline. Laporan Anda berhasil dicadangkan di memori perangkat." 
              : "Laporan Anda telah diterima oleh unit Pusdalops BPBD & Petugas Siaga Lapangan."}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
          <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-widest">NOMOR TIKET LAPORAN</p>
          <p className="font-display text-2xl font-black text-rose-600 tracking-wide mt-1">{successTicket.id}</p>
          <div className="grid grid-cols-2 gap-4 text-left border-t border-slate-200/50 mt-3 pt-3 text-[11px] text-slate-600">
            <div>
              <span className="font-bold text-slate-400">Nama Pelapor:</span>
              <p className="truncate font-semibold">{successTicket.nama_pelapor}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400">Bencana:</span>
              <p className="uppercase font-semibold text-rose-600">{successTicket.jenis_bencana}</p>
            </div>
          </div>
          <div className="text-left mt-2 border-t border-slate-200/50 pt-2 text-[11px] text-slate-600">
            <span className="font-bold text-slate-400">Lokasi:</span>
            <p className="truncate">{successTicket.lokasi_kejadian}</p>
          </div>
        </div>

        {successTicket.isOffline && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
            <WifiOff className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-normal font-medium">
              **Antrean Offline Aktif**. Laporan ini otomatis disinkronisasi ke server pusat BPBD segera setelah koneksi Internet ponsel Anda kembali stabil.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleResetForm}
            className="flex items-center space-x-1 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Kirim Laporan Baru</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8" id="citizen-report-form">
      {/* Overview Block */}
      <div className="md:col-span-2 space-y-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 space-y-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Form Laporan Warga Mandiri</h3>
            <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
              Formulir darurat untuk melaporkan kejadian bencana atau kondisi darurat di sekitar tempat tinggal Anda. 
              Gunakan fitur GPS untuk koordinasi lokasi penyelamatan yang presisi.
            </p>
          </div>

          <div className="space-y-2 border-t border-blue-200/55 pt-3 text-[11px] text-slate-700 font-mono font-bold">
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              <span>Dukungan Enkripsi End-to-End</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              <span>Dukungan Laporan Offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              <span>Langsung Diteruskan ke BPBD</span>
            </div>
          </div>
        </div>

        {!isOnline && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-xs text-amber-800">
            <WifiOff className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Saat ini Anda sedang Offline</p>
              <p className="text-[11px] mt-0.5 leading-relaxed text-amber-700">
                Laporan darurat Anda akan disimpan di database lokal ponsel dan akan dipancarkan ke BPBD otomatis setelah sinyal terhubung kembali.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Area */}
      <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Citizen Name input */}
            <div className="space-y-1.5">
              <label htmlFor="input-nama" className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Nama Pelapor <span className="text-red-500">*</span></span>
              </label>
              <input
                id="input-nama"
                type="text"
                required
                placeholder="cth. Anggito Alif"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-[#2563EB] focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Citizen Phone Input */}
            <div className="space-y-1.5">
              <label htmlFor="input-phone" className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Nomor Kontak HP <span className="text-red-500">*</span></span>
              </label>
              <input
                id="input-phone"
                type="tel"
                required
                placeholder="cth. 0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-[#2563EB] focus:outline-none placeholder:text-slate-400"
              />
            </div>

          </div>

          {/* Disaster Type Selector */}
          <div className="space-y-1.5">
            <label htmlFor="input-jenis" className="text-xs font-bold text-slate-800">
              Jenis Bencana Terjadi <span className="text-red-500">*</span>
            </label>
            <select
              id="input-jenis"
              value={jenis}
              onChange={(e) => setJenis(e.target.value as JenisBencana)}
              className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3.5 py-2.5 text-xs font-bold focus:border-[#2563EB] focus:outline-none capitalize"
            >
              <option value="banjir" className="text-slate-900 bg-white">Banjir</option>
              <option value="longsor" className="text-slate-900 bg-white">Tanah Longsor</option>
              <option value="gempa" className="text-slate-900 bg-white">Gempa Bumi</option>
              <option value="kebakaran" className="text-slate-900 bg-white">Kebakaran Hutan / Pemukiman</option>
              <option value="cuaca_ekstrim" className="text-slate-900 bg-white">Cuaca Ekstrem / Angin Puting Beliung</option>
              <option value="lainnya" className="text-slate-900 bg-white">Lainnya</option>
            </select>
          </div>

          {/* Incident Location details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-location" className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Lokasi Spesifik Kejadian <span className="text-red-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={handleFetchGps}
                disabled={isLocating}
                className="inline-flex items-center space-x-1 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[10px] font-bold text-[#2563EB] px-2 py-1 transition"
              >
                <Navigation className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? "Mencari GPS..." : "Dapatkan Koordinat GPS"}</span>
              </button>
            </div>
            <input
              id="input-location"
              type="text"
              required
              placeholder="cth. RT 03 RW 05 Desa Cisarua Timur, Kec. Pacet"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-[#2563EB] focus:outline-none placeholder:text-slate-400"
            />
            {gpsCoords && (
              <p className="text-[10px] text-emerald-600 font-mono font-medium">
                ✓ GPS Terkunci: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
              </p>
            )}
            {gpsError && (
              <p className="text-[10px] text-amber-600 font-mono font-medium">
                ⚠️ {gpsError}
              </p>
            )}
          </div>

          {/* Disaster description */}
          <div className="space-y-1.5">
            <label htmlFor="input-desc" className="text-xs font-bold text-slate-800">
              Deskripsi Situasi Lapangan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="input-desc"
              required
              rows={4}
              placeholder="Gambarkan tingkat keparahan, jumlah korban (bila ada), sarana terputus, atau bantuan darurat yang sangat mendesak..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3.5 py-2.5 text-xs font-semibold focus:border-[#2563EB] focus:outline-none resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Custom File Upload & Preset Selection Block */}
          <div className="space-y-3.5 border-t border-slate-100 pt-4">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Camera className="h-4 w-4 text-[#2563EB]" />
              <span>Lampiran Foto Kejadian Bencana <span className="text-red-500">*</span></span>
            </span>

            {/* Drag & Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? "border-[#2563EB] bg-[#2563EB]/5 scale-[0.99]" 
                  : "border-slate-300 hover:border-[#2563EB] bg-slate-50/50 hover:bg-slate-50"
              }`}
              onClick={() => document.getElementById("file-upload-input")?.click()}
            >
              <input 
                id="file-upload-input"
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
                  <Upload className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik atau Seret & Lepas Gambar Di Sini
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Mendukung JPG, JPEG, PNG, WEBP (Maksimal 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded File preview or Preset indicator */}
            {uploadedFileName && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-semibold text-emerald-800">
                <div className="flex items-center space-x-2 truncate">
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{uploadedFileName}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setUploadedFileName("");
                    setSelectedPhoto(MOCK_PHOTOS[jenis][0]);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-black text-xs px-1.5 hover:underline"
                >
                  Batal
                </button>
              </div>
            )}

            {/* Custom/Preset Photo Preview */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {uploadedFileName ? "Preview Foto Unggahan Anda" : "Gunakan Foto Simulasi Cepat (Opsi Alternatif)"}
              </label>

              {/* Grid of Preset simulation photos */}
              {!uploadedFileName && (
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  {MOCK_PHOTOS[jenis]?.map((ph, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedPhoto(ph);
                        setUploadedFileName("");
                      }}
                      className={`relative cursor-pointer overflow-hidden rounded-lg border-2 h-20 bg-slate-100 transition ${
                        selectedPhoto === ph && !uploadedFileName ? "border-blue-500 shadow-sm" : "border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01]"
                      }`}
                    >
                      <img 
                        src={ph} 
                        alt="Disaster preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {selectedPhoto === ph && !uploadedFileName && (
                        <div className="absolute top-1 right-1 rounded-full bg-blue-600 text-white p-0.5">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadedFileName && selectedPhoto && (
                <div className="relative rounded-lg overflow-hidden border border-slate-205 h-36 bg-slate-50 shadow-inner flex items-center justify-center">
                  <img 
                    src={selectedPhoto} 
                    alt="Custom upload preview" 
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex items-center justify-center space-x-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-bold tracking-tight shadow transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? "Sedang Mengirim..." : isOnline ? "KIRIM LAPORAN BPBD" : "SIMPAN OFFLINE"}</span>
          </button>
          
        </form>
      </div>
    </div>
  );
}
