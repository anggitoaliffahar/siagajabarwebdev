import { useState, useEffect } from "react";
import { ShieldAlert, Wifi, WifiOff, MapPin, Bell, Radio, UserCheck, Menu, X, User } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
  pendingOfflineReportsCount: number;
}

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  isAdmin, 
  onLogout,
  pendingOfflineReportsCount 
}: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gpsSupported, setGpsSupported] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("geolocation" in navigator) {
      setGpsSupported(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const menuItems = [
    { id: "home", label: "Beranda" },
    { id: "map", label: "Peta Bahaya" },
    { id: "lapor", label: "Lapor Mandiri" },
    { id: "info", label: "Panduan Evakuasi" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Brand/Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab("home")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-blue-500/20 text-white">
              <ShieldAlert className="h-6 w-6" id="logo-icon" />
            </div>
            <div>
              <h1 className="font-display text-lg font-black tracking-tight text-[#1D4ED8] sm:text-xl">SIAGA <span className="text-[#2563EB]">JABAR</span></h1>
              <p className="font-mono text-[9px] text-blue-500 font-extrabold tracking-widest uppercase">Disaster Response & Early Warning</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === item.id
                    ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 shadow-inner"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right widgets: GPS, Offline Indicator, Authority Area */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Offline sync badge */}
            {pendingOfflineReportsCount > 0 && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-[10px] font-mono font-bold text-amber-600 border border-amber-500/20 tracking-tight animate-bounce">
                <Radio className="h-3 w-3" />
                <span>{pendingOfflineReportsCount} Sync Pending</span>
              </span>
            )}

            {/* GPS Lock status */}
            <span className={`inline-flex items-center space-x-1 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              gpsSupported ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}>
              <MapPin className="h-3 w-3 text-emerald-650" />
              <span>GPS: Active</span>
            </span>

            {/* Offline/Online System */}
            <span className={`inline-flex items-center space-x-1.5 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              isOnline ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-blue-600" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                  <span>LOCAL MODE</span>
                </>
              )}
            </span>

            {/* Admin trigger/status */}
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentTab("admin")}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-[11px] font-black tracking-wider uppercase transition-all ${
                    currentTab === "admin"
                      ? "bg-[#2563EB] border-[#2563EB] text-white"
                      : "bg-white border-slate-200 text-[#2563EB] hover:bg-slate-50"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>BPBD Portal</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-2 py-1.5 font-mono text-[11px] text-slate-400 hover:text-slate-800 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                id="admin-login-button"
                onClick={() => setCurrentTab("admin")}
                className={`flex items-center justify-center h-10 w-10 rounded-xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-sm cursor-pointer ${
                  currentTab === "admin"
                    ? "bg-[#2563EB] border-[#2563EB] text-white shadow-md shadow-blue-500/20"
                    : "bg-white border-slate-200 text-slate-500 hover:text-[#2563EB] hover:border-[#2563EB]/45 hover:bg-slate-50"
                }`}
                title="Masuk Sistem Otoritas BPBD"
              >
                <User className="h-4.5 w-4.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Mobile menu and status indicators */}
          <div className="flex items-center space-x-2 md:hidden">
            {pendingOfflineReportsCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
            
            <span className={`p-1.5 rounded-full ${isOnline ? "text-blue-600" : "text-amber-500"}`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </span>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-slate-500 hover:text-slate-900"
              id="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-2 pt-2 pb-4 space-y-1 shadow-lg">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider ${
                currentTab === item.id
                  ? "bg-[#2563EB]/10 text-[#2563EB] font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Action button for Mobile */}
          <div className="pt-4 pb-2 border-t border-slate-200 px-3">
            {isAdmin ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentTab("admin");
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>DASHBOARD ADMIN BPBD</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center py-2.5 text-xs font-mono text-slate-400"
                >
                  Logout Administrator
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCurrentTab("admin");
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300"
              >
                <User className="h-4 w-4 shrink-0 text-slate-500" />
                <span>OTORITAS MASUK (BPBD)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
