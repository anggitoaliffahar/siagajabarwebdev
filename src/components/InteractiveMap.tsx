import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { 
  Filter, 
  MapPin, 
  Map as MapIcon, 
  AlertOctagon, 
  ExternalLink,
  Navigation,
  CheckCircle,
  Clock
} from "lucide-react";
import { TitikRawan, JenisBencana, TingkatRisiko } from "../types";

// Setup unique colors corresponding to disaster types
const BENCANA_THEMES: Record<JenisBencana, { color: string; badge: string }> = {
  banjir: { color: "#3b82f6", badge: "bg-blue-100 text-blue-800" }, // Blue
  longsor: { color: "#f59e0b", badge: "bg-amber-100 text-amber-800" }, // Amber
  gempa: { color: "#ef4444", badge: "bg-red-100 text-red-800" }, // Red
  kebakaran: { color: "#de3a1b", badge: "bg-orange-100 text-orange-800" }, // Fire
  cuaca_ekstrim: { color: "#8b5cf6", badge: "bg-purple-100 text-purple-800" }, // Purple
  lainnya: { color: "#64748b", badge: "bg-slate-100 text-slate-800" }
};

export const getImpactRadius = (jenis: JenisBencana, risiko: TingkatRisiko): { radius: number; label: string; desc: string } => {
  if (risiko === "rendah") {
    return { radius: 150, label: "150 meter", desc: "Dampak sangat lokal dan terbatas pada area sekitar kejadian." };
  }
  
  const config: Record<JenisBencana, Record<"sedang" | "tinggi", { radius: number; label: string; desc: string }>> = {
    banjir: {
      sedang: { radius: 500, label: "500 meter", desc: "Potensi genangan air setinggi 30-70 cm di dataran rendah sekitarnya." },
      tinggi: { radius: 1500, label: "1.5 kilometer", desc: "Bahaya luapan air bandang cepat, potensi evakuasi darurat pemukiman padat." }
    },
    longsor: {
      sedang: { radius: 300, label: "300 meter", desc: "Zona waspada runtuhan material batuan/tanah di lereng terdekat." },
      tinggi: { radius: 800, label: "800 meter", desc: "Daerah aliran material guguran tanah kritis. Kosongkan daerah tepat di bawah kaki bukit." }
    },
    gempa: {
      sedang: { radius: 3000, label: "3.0 kilometer", desc: "Radius rambatan getaran sedang, potensi keretakan struktur sipil non-beton." },
      tinggi: { radius: 8000, label: "8.0 kilometer", desc: "Radius epicenter kerusakan guncangan tinggi. Waspada reruntuhan gedung & gempa susulan." }
    },
    kebakaran: {
      sedang: { radius: 300, label: "300 meter", desc: "Zonasi asap tebal menyesakkan dan potensi lompatan bara api berembus angin." },
      tinggi: { radius: 800, label: "800 meter", desc: "Penyebaran api agresif di lahan kering. Risiko tinggi sesak nafas akut & penyebaran masif." }
    },
    cuaca_ekstrim: {
      sedang: { radius: 2000, label: "1.5 - 2.0 kilometer", desc: "Sapuan angin kencang lokal & curah hujan lebat merusak atap ringan." },
      tinggi: { radius: 5000, label: "4.0 - 5.0 kilometer", desc: "Siklon angin puting beliung agresif, potensi pohon tumbang & kerusakan tiang listrik." }
    },
    lainnya: {
      sedang: { radius: 500, label: "500 meter", desc: "Perkiraan zona ancaman sedang untuk insiden/bencana terkait." },
      tinggi: { radius: 1500, label: "1.5 kilometer", desc: "Perkiraan kawasan dampak tinggi. Ikuti instruksi komando BPBD setempat." }
    }
  };

  return config[jenis]?.[risiko as "sedang" | "tinggi"] || { radius: 500, label: "500 meter", desc: "Area batasan siaga bencana." };
};

interface InteractiveMapProps {
  titikRawan: TitikRawan[];
}

export default function InteractiveMap({ titikRawan }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedBencana, setSelectedBencana] = useState<string>("semua");
  const [selectedRisiko, setSelectedRisiko] = useState<string>("semua");
  const [activeItem, setActiveItem] = useState<TitikRawan | null>(null);

  // Filter items based on user choice
  const filteredPoints = titikRawan.filter((point) => {
    const matchBencana = selectedBencana === "semua" || point.jenis_bencana === selectedBencana;
    const matchRisiko = selectedRisiko === "semua" || point.tingkat_risiko === selectedRisiko;
    const matchPublished = point.status === "dipublikasikan";
    return matchBencana && matchRisiko && matchPublished;
  });

  // Setup Leaflet map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered on Bandung West Java (Java Barat hub)
    const bandungLat = -6.9175;
    const bandungLng = 107.6191;

    // Initialize leaflet instance
    const map = L.map(mapContainerRef.current, {
      center: [bandungLat, bandungLng],
      zoom: 9,
      zoomControl: false // Addcustom zoom controls at top right for aesthetics
    });

    // Elegant Light Map styled CartoDB Voyager tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Group layer for easy redrawing
    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;

    // Trigger map invalidation for proper boundaries sizing in dynamic containers
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when filteredPoints update
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup) return;

    // Clear old layers
    markersGroup.clearLayers();

    filteredPoints.forEach((point) => {
      const theme = BENCANA_THEMES[point.jenis_bencana] || BENCANA_THEMES.lainnya;
      const isDangerous = point.tingkat_risiko === "tinggi" || point.tingkat_risiko === "sedang";
      
      const pulseColor = point.tingkat_risiko === "tinggi" ? "bg-red-500" : point.tingkat_risiko === "sedang" ? "bg-amber-500" : "bg-blue-500";
      const mainColor = point.tingkat_risiko === "tinggi" ? "bg-rose-600" : point.tingkat_risiko === "sedang" ? "bg-amber-600" : "bg-blue-600";

      // 1. Get Radius details for Red (Tinggi) and Orange (Sedang)
      const radInfo = getImpactRadius(point.jenis_bencana, point.tingkat_risiko);

      // 2. Render visual circle radius layer if mark represents danger (high/medium risk)
      if (isDangerous) {
        const circleBg = point.tingkat_risiko === "tinggi" ? "#e11d48" : "#d97706";
        L.circle([point.latitude, point.longitude], {
          radius: radInfo.radius,
          color: circleBg,
          weight: 1.5,
          opacity: 0.7,
          dashArray: "4, 4",
          fillColor: circleBg,
          fillOpacity: 0.12,
          interactive: false // Enables clicking the marker below directly
        }).addTo(markersGroup);
      }

      // Premium pulsing procedural HTML marker
      const pulseMarkerXml = `
        <div class="relative flex h-8 w-8 items-center justify-center">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 ${mainColor} border-2 border-white shadow-md"></span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pulseMarkerXml,
        className: "custom-danger-pulse-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -10]
      });

      // 3. Radius metadata markup inside the popup card
      const radiusExplainHtml = isDangerous
        ? `<div class="mt-2 pt-1.5 border-t border-dashed border-red-200 text-[10px] text-slate-700 font-sans">
             <div class="flex items-center gap-1 font-bold text-red-600 uppercase tracking-tight text-[9px]">
               <span class="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping inline-block"></span>
               Radius Terdampak: ~${radInfo.label}
             </div>
             <p class="text-slate-500 text-[9px] leading-snug mt-0.5 font-medium">${radInfo.desc}</p>
           </div>`
        : `<div class="mt-2 pt-1.5 border-t border-slate-100 text-[9px] text-slate-500 font-sans">
             <span>Radius Terdampak: minimal (~${radInfo.label})</span>
           </div>`;

      // Customized popup contents
      const popupCardHtml = `
        <div class="font-sans text-xs p-1 max-w-[210px]" id="popup-${point.id}">
          <p class="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-tight">${point.jenis_bencana} - Risiko ${point.tingkat_risiko}</p>
          <p class="font-semibold text-slate-700 mt-1.5 text-xs">${point.nama_lokasi}</p>
          <p class="text-slate-550 leading-relaxed mt-1 text-[11px] font-medium">${point.deskripsi}</p>
          ${radiusExplainHtml}
          <p class="font-mono text-[9px] text-slate-400 mt-2">${point.kabupaten} • Jabar</p>
        </div>
      `;

      const m = L.marker([point.latitude, point.longitude], { icon: customIcon })
        .bindPopup(popupCardHtml)
        .addTo(markersGroup);

      // On marker click update sidebar item
      m.on("click", () => {
        setActiveItem(point);
      });
    });

    // Auto-adjust scale bounds to fit pins if items available
    if (filteredPoints.length > 0 && map) {
      const coords = filteredPoints.map(p => [p.latitude, p.longitude] as L.LatLngTuple);
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [filteredPoints]);

  const handleSelectItem = (item: TitikRawan) => {
    setActiveItem(item);
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([item.latitude, item.longitude], 12);
      
      // Auto-open point's popup
      const markersGroup = markersGroupRef.current;
      if (markersGroup) {
        markersGroup.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            const latLng = layer.getLatLng();
            if (latLng.lat === item.latitude && latLng.lng === item.longitude) {
              layer.openPopup();
            }
          }
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4" id="disasters-map-portal">
      
      {/* Search and point filters section */}
      <div className="lg:col-span-1 flex flex-col space-y-4">
        
        {/* Filter configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-display font-bold text-slate-900 flex items-center space-x-2 text-sm border-b border-slate-100 pb-2">
            <Filter className="h-4 w-4" style={{ color: '#9e9898' }} />
            <span>Penyaringan Wilayah</span>
          </h3>

          {/* Bencana type selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Bahaya</label>
            <select
              value={selectedBencana}
              onChange={(e) => {
                setSelectedBencana(e.target.value);
                setActiveItem(null);
              }}
              className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
            >
              <option value="semua" className="text-slate-900 bg-white">Semua Bencana</option>
              <option value="banjir" className="text-slate-900 bg-white">Banjir</option>
              <option value="longsor" className="text-slate-900 bg-white">Tanah Longsor</option>
              <option value="gempa" className="text-slate-900 bg-white">Gempa Bumi</option>
              <option value="kebakaran" className="text-slate-900 bg-white">Kebakaran</option>
              <option value="cuaca_ekstrim" className="text-slate-900 bg-white">Cuaca Ekstrem</option>
            </select>
          </div>

          {/* Risk severity selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Risiko</label>
            <select
              value={selectedRisiko}
              onChange={(e) => {
                setSelectedRisiko(e.target.value);
                setActiveItem(null);
              }}
              className="w-full rounded-xl bg-white text-slate-900 border border-slate-300 px-3 py-2 text-xs font-bold focus:border-blue-600 focus:outline-none"
            >
              <option value="semua" className="text-slate-900 bg-white">Semua Risiko</option>
              <option value="tinggi" className="text-slate-900 bg-white">Risiko Tinggi 🔴</option>
              <option value="sedang" className="text-slate-900 bg-white">Risiko Sedang 🟡</option>
              <option value="rendah" className="text-slate-900 bg-white">Risiko Rendah 🔵</option>
            </select>
          </div>
        </div>

        {/* Directory details of coordinates */}
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col max-h-[400px]">
          <h3 className="font-display font-semibold text-slate-900 text-xs border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Daftar Titik ({filteredPoints.length})</span>
            <MapIcon className="h-4 w-4 text-slate-400" />
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1 mt-2.5 pr-1" id="map-points-list">
            {filteredPoints.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                Tidak ada data wilayah yang sesuai filter.
              </div>
            ) : (
              filteredPoints.map((point) => {
                const isActive = activeItem?.id === point.id;
                const riskColor = point.tingkat_risiko === "tinggi" ? "text-red-600" : point.tingkat_risiko === "sedang" ? "text-amber-600" : "text-[#2563EB]";
                
                return (
                  <div
                    key={point.id}
                    id={`point-item-${point.id}`}
                    onClick={() => handleSelectItem(point)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? "bg-blue-50/75 border-[#2563EB] ring-2 ring-[#2563EB]/15 shadow-sm" 
                        : "border-slate-100 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-slate-500">
                        {point.jenis_bencana}
                      </span>
                      <span className={`text-[10px] uppercase font-bold flex items-center gap-1 ${riskColor}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>Risiko {point.tingkat_risiko}</span>
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-805 mt-1 line-clamp-1">{point.nama_lokasi}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans flex items-center space-x-1 font-semibold">
                      <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                      <span>{point.kabupaten}</span>
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Visual map rendering canvas and detail view */}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        
        {/* Map box */}
        <div className="relative rounded-xl border border-slate-300 shadow bg-slate-100 h-[380px] lg:h-[450px]">
          <div ref={mapContainerRef} className="absolute inset-0 rounded-xl" id="leaflet-disasters-map" />
          
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="rounded-lg bg-slate-900/90 backdrop-blur px-3 py-1.5 text-white shadow font-display font-medium text-xs flex items-center space-x-1.5 border border-white/10">
              <span className="h-1.5 w-1.5 bg-[#2563EB] rounded-full animate-ping" />
              <span>Peta Kerawanan Jawa Barat</span>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Overlay card beneath */}
        {activeItem && (() => {
          const isTinggi = activeItem.tingkat_risiko === "tinggi";
          const isSedang = activeItem.tingkat_risiko === "sedang";

          const borderStyle = isTinggi 
            ? "border-red-300 border-l-red-600" 
            : isSedang 
              ? "border-amber-300 border-l-amber-500" 
              : "border-blue-250 border-l-[#2563EB]";

          const badgeBg = isTinggi 
            ? "bg-red-50 text-red-700 border-red-100" 
            : isSedang 
              ? "bg-amber-50 text-amber-700 border-amber-100" 
              : "bg-blue-50 text-blue-700 border-blue-105";

          const iconBg = isTinggi 
            ? "bg-red-600 text-white animate-pulse" 
            : isSedang 
              ? "bg-amber-500 text-white" 
              : "bg-[#2563EB] text-white";

          const activeRadiusInfo = getImpactRadius(activeItem.jenis_bencana, activeItem.tingkat_risiko);

          return (
            <div className={`rounded-xl border-2 bg-white p-5 shadow-lg animate-scale-up border-l-8 ${borderStyle}`} id="active-hotspot-panel">
              <div className="flex flex-col md:flex-row items-stretch gap-5 justify-between">
                
                {/* Left Column: Basic Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-md ${iconBg}`}>
                    <AlertOctagon className="h-6 w-6" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-black text-slate-900 text-sm">{activeItem.nama_lokasi}</span>
                      <span className="uppercase text-[9px] font-mono tracking-widest bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded leading-none text-center">
                        {activeItem.jenis_bencana}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold font-sans mt-1.5">
                      {activeItem.deskripsi}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 mt-2.5 border-t border-slate-100 text-[10px] text-slate-500 uppercase font-mono font-bold">
                      <div>
                        <span className="text-slate-400">Wilayah:</span> <span className="text-slate-800 font-extrabold">{activeItem.kabupaten}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Ketinggian Bahaya:</span> <span className={isTinggi ? "text-red-600 font-black" : isSedang ? "text-amber-600 font-black" : "text-blue-600 font-black"}>{activeItem.tingkat_risiko}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Koordinat:</span> <span className="text-slate-800">{activeItem.latitude.toFixed(5)}, {activeItem.longitude.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Radius Estimator Info */}
                <div className={`w-full md:w-80 p-3.5 rounded-xl border flex flex-col gap-2 ${badgeBg}`} id="active-radius-info-card">
                  <div className="flex items-center justify-between border-b border-current/10 pb-1.5">
                    <span className="text-[10px] font-mono font-black tracking-wider uppercase flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                      </span>
                      <span>Radius Zona Terdampak</span>
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white shadow-xs border border-current leading-none">
                      ~{activeRadiusInfo.label}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <p className="text-[10px] font-black leading-tight uppercase font-sans tracking-wide">
                      {isTinggi ? "ZONA BAHAYA UTAMA (MERAH)" : isSedang ? "ZONA SIAGA WASPADA (ORANGE)" : "ZONA PERSYARATAN MINUM (BIRU)"}
                    </p>
                    <p className="text-[10px] opacity-90 font-medium leading-relaxed">
                      {activeRadiusInfo.desc}
                    </p>
                  </div>

                  <div className="mt-1 pt-1.5 border-t border-current/10 text-[9px] opacity-85 font-mono flex flex-col gap-1 text-left">
                    <p className="font-extrabold uppercase tracking-wider">📌 Instruksi BPBD Jawa Barat:</p>
                    <p className="font-semibold">• Hindari mendekat ke koordinat dalam radius {activeRadiusInfo.label}.</p>
                    <p className="font-semibold">• Evakuasi mandiri segera ke titik pengungsian terdekat jika eskalasi terus meningkat.</p>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </div>

    </div>
  );
}
