/**
 * Shared Type Definitions for Siaga Jabar Project
 */

export type JenisBencana = 'banjir' | 'longsor' | 'gempa' | 'kebakaran' | 'cuaca_ekstrim' | 'lainnya';
export type TingkatRisiko = 'rendah' | 'sedang' | 'tinggi';
export type TingkatBahaya = 'aman' | 'siaga' | 'waspada' | 'awas';

export interface Admin {
  id: string;
  nama: string;
  email: string;
  created_at: string;
}

export interface TitikRawan {
  id: string;
  nama_lokasi: string;
  jenis_bencana: JenisBencana;
  tingkat_risiko: TingkatRisiko;
  latitude: number;
  longitude: number;
  deskripsi: string;
  kabupaten: string;
  status: 'dipublikasikan' | 'draft';
  created_at: string;
}

export interface Alert {
  id: string;
  judul: string;
  deskripsi: string;
  tingkat_bahaya: TingkatBahaya;
  wilayah_terdampak: string;
  status: 'aktif' | 'nonaktif';
  created_at: string;
}

export interface LaporanBencana {
  id: string; // e.g. "TKT-2491"
  nama_pelapor: string;
  no_telepon: string;
  lokasi_kejadian: string;
  jenis_bencana: JenisBencana;
  deskripsi: string;
  foto_url?: string;
  status: 'baru' | 'diproses' | 'selesai';
  catatan_admin?: string;
  created_at: string;
}

export interface DashboardStats {
  totalTitikRawan: number;
  totalAlertsAktif: number;
  totalLaporanBaru: number;
  totalLaporanSelesai: number;
  bencanaDistribution: Record<JenisBencana, number>;
  kabupatenDistribution: Record<string, number>;
}
