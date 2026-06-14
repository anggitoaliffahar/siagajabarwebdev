import { 
  Flame, 
  Map, 
  Compass, 
  PhoneCall, 
  BookOpen, 
  Activity, 
  AlertOctagon,
  ShieldCheck
} from "lucide-react";

export default function EvacuationArticles() {
  const hotlines = [
    { name: "Pusdalops BPBD Jabar", phone: "022-7315274", note: "Pusat Pengendali Operasi Utama" },
    { name: "Basarnas Jawa Barat", phone: "022-7780001", note: "Tim Reaksi Pertolongan & Penyelamatan" },
    { name: "Call Center Darurat Indonesia", phone: "112", note: "Bebas pulsa, darurat umum seluruh wilayah" },
    { name: "Ambulans Kegawatdaruratan", phone: "118", note: "Evakuasi medis kritis" },
    { name: "Pemadam Kebakaran Jabar", phone: "022-113", note: "Insiden kebakaran pemukiman/hutan" },
    { name: "Polda Jabar (Kepolisian)", phone: "022-7800013", note: "Keamanan pelaporan darurat" }
  ];

  const disasterGuides = [
    {
      title: "Bencana Banjir (Siku Citarum / Kali)",
      icon: <Activity className="h-6 w-6 text-[#2563EB]" />,
      color: "border-blue-200 bg-blue-50/70 shadow-blue-500/5",
      dos: [
        "Segera putuskan aliran listrik dari meteran pusat rumah.",
        "Pindahkan barang elektronik dan surat berharga ke lantai atas.",
        "Pantau Tinggi Muka Air (TMA) di pos pantau Sungai Citarum terdekat.",
        "Segera mengungsi jika ada instruksi siaga merah dari BPBD.",
      ],
      donts: [
        "Jangan bermain, berenang, atau berjalan menerobos arus air banjir.",
        "Jangan mengonsumsi air sumur yang telah keruh terendam air banjir.",
        "Jangan berteduh di dekat gardu listrik aktif."
      ]
    },
    {
      title: "Tanah Longsor (Cadas Pangeran / Tebing)",
      icon: <AlertOctagon className="h-6 w-6 text-amber-500" />,
      color: "border-amber-200 bg-amber-50/70 shadow-amber-500/5",
      dos: [
        "Waspadai rekahan tanah baru atau rembesan air tiba-tiba di tebing.",
        "Evakuasi mandiri menjauhi lereng curam jika curah hujan ekstrem >1 jam.",
        "Bila terdengar gemuruh keras, segera lari tegak lurus mengarah ke samping tebing.",
        "Pasang terpal pada rekahan tanah atas lereng jika kondisi masih aman."
      ],
      donts: [
        "Jangan berada di dalam rumah yang terletak tepat di bawah kaki tebing terjal.",
        "Jangan menebang pohon penahan lereng untuk pelebaran jembatan warga.",
        "Jangan melintasi jalur rawan longsor saat cuaca kabut dan hujan lebat."
      ]
    },
    {
      title: "Gempa Bumi (Sesar Lembang / Megathrust)",
      icon: <Flame className="h-6 w-6 text-[#2563EB]" />,
      color: "border-blue-200 bg-blue-50/70 shadow-blue-500/5",
      dos: [
        "Merunduk, Lindungi Kepala, Berpegangan (Drop, Cover, Hold On).",
        "Berteduhlah di bawah kolong meja yang kokoh.",
        "Lari keluar ke tanah lapang jika struktur atap tidak runtuh.",
        "Selalu siapkan Tas Siaga Bencana (TSB) di dekat pintu keluar utama."
      ],
      donts: [
        "Jangan menggunakan eskalator atau lift gedung bertingkat saat guncangan.",
        "Jangan berdiri di dekat jendela kaca, tiang listrik, atau baliho besar.",
        "Jangan panik dan memicu desakan massa di pintu darurat yang sempit."
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in" id="evacuation-articles-module">
      
      {/* Title block */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div>
              <span className="inline-flex items-center space-x-1.5 border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-1 rounded-full text-xs text-[#2563EB] font-bold uppercase tracking-wider">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Offline Guidebook</span>
              </span>
            </div>
            <h2 className="font-display text-2xl font-black text-slate-900 sm:text-3xl">Pusat Informasi &amp; Kontak Darurat</h2>
            <p className="text-sm text-slate-600 font-medium">
              Informasi dasar ini dirancang ringan dan dapat diakses kapan saja secara offline saat jaringan mengalami gangguan parah di lapangan.
            </p>
          </div>
          <div>
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-slate-800">Local Cache Active</p>
                <p className="text-emerald-600 font-mono font-bold">OK - Terikat Offline Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Disaster specific instruction cards */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-display text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Compass className="h-5 w-5 text-[#2563EB]" />
            <span>Petunjuk Evakuasi Mandiri (Do &amp; Don't)</span>
          </h3>

          <div className="space-y-6">
            {disasterGuides.map((guide, idx) => (
              <div key={idx} className={`rounded-3xl border p-5 shadow-sm transition-all hover:scale-[1.01] duration-300 ${guide.color}`}>
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200/60">
                  {guide.icon}
                  <h4 className="font-display font-bold text-slate-900 text-base">{guide.title}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {/* Do Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-black tracking-widest text-emerald-700 uppercase">✓ TINDAKAN (DO)</p>
                    <ul className="space-y-1.5 text-xs text-slate-705 list-disc list-inside font-medium leading-relaxed">
                      {guide.dos.map((item, i) => (
                        <li key={i} className="leading-relaxed text-slate-700">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Don't Section */}
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-black tracking-widest text-red-700 uppercase">✗ HINDARI (DON'T)</p>
                    <ul className="space-y-1.5 text-xs text-slate-705 list-disc list-inside font-medium leading-relaxed">
                      {guide.donts.map((item, i) => (
                        <li key={i} className="leading-relaxed text-slate-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Hotline side list */}
        <div className="space-y-6">
          <h3 className="font-display text-xl font-bold text-slate-900 flex items-center space-x-2">
            <PhoneCall className="h-5 w-5 text-[#2563EB]" />
            <span>Kontak &amp; Telepon Darurat</span>
          </h3>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg space-y-4">
            
            {/* Highly outstanding banner with zero margin issues */}
            <div className="rounded-2xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-4 text-xs text-slate-700 font-semibold leading-relaxed shadow-sm">
              <span className="text-[#2563EB] font-bold block mb-1">PANGGILAN BEBAS PULSA</span>
              Tekan langsung nomor di bawah ini dari ponsel Anda dalam situasi bahaya. Seluruh panggilan <span className="font-bold text-[#2563EB]">112</span> bebas pulsa dari semua provider seluler.
            </div>

            <div className="divide-y divide-slate-100">
              {hotlines.map((hotline, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{hotline.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{hotline.note}</p>
                  </div>
                  <a
                    href={`tel:${hotline.phone}`}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/14 text-xs font-bold text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                    <span>{hotline.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
