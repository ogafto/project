"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart2,
  Users2,
  FileText,
  HelpCircle,
  Settings,
  Bell,
  Plus,
  Search,
  Recycle,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Sparkles,
  ChevronDown,
  Check,
  Globe,
  SlidersHorizontal,
  X,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Info,
} from "lucide-react";

interface RegionData {
  id: string;
  country: string;
  continent: string;
  flag: string;
  factory: string;
  recycled: number;
  trend: "up" | "down";
  sparkline: number[];
  technology: "Mechanical" | "Energy recovery" | "Chemical";
  totalValue: string;
}

const initialRegions: RegionData[] = [
  {
    id: "usa",
    country: "USA",
    continent: "America",
    flag: "🇺🇸",
    factory: "253+",
    recycled: 35,
    trend: "up",
    sparkline: [20, 25, 22, 30, 28, 35],
    technology: "Mechanical",
    totalValue: "4,167,987 tons",
  },
  {
    id: "de",
    country: "German",
    continent: "Europe",
    flag: "🇩🇪",
    factory: "211+",
    recycled: 60,
    trend: "down",
    sparkline: [45, 40, 42, 38, 35, 30],
    technology: "Mechanical",
    totalValue: "2,571,193 tons",
  },
  {
    id: "jp",
    country: "Japan",
    continent: "Asia",
    flag: "🇯🇵",
    factory: "364+",
    recycled: 85,
    trend: "up",
    sparkline: [50, 65, 60, 75, 70, 85],
    technology: "Energy recovery",
    totalValue: "1,864,275 tons",
  },
  {
    id: "cn",
    country: "China",
    continent: "Asia",
    flag: "🇨🇳",
    factory: "855+",
    recycled: 25,
    trend: "down",
    sparkline: [30, 28, 26, 24, 25, 22],
    technology: "Chemical",
    totalValue: "8,643,742 tons",
  },
];

const weeklyData = [
  { week: "W1", past: [35, 60, 95, 45], active: [] },
  { week: "W2", past: [20, 40, 70, 50], active: [] },
  { week: "W3", past: [30, 55, 80, 65], active: [] },
  { week: "W4", past: [], active: [90, 70, 55, 45, 60, 30], peak: 82.6 },
  { week: "W5", past: [], active: [65, 45, 30, 20, 35, 55] },
  { week: "W6", past: [], active: [30, 25, 20, 15, 35, 50] },
  { week: "W7", past: [], active: [65, 45, 35, 25, 40, 55] },
  { week: "W8", past: [], active: [45, 35, 25, 15, 10, 5] },
];

interface AeuxDashboardProps {
  userName?: string;
  userTag?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

export default function AeuxDashboard({
  userName = "Alex Williamson",
  userTag = "#dela-1974",
  userAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  onLogout,
}: AeuxDashboardProps = {}) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("2 month");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState("All regions");
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [mapRegion, setMapRegion] = useState("Europe");
  const [isMapDropdownOpen, setIsMapDropdownOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("EcoPlastic");
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<string[]>([]);
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetType, setWidgetType] = useState("metric");
  const [hoveredWeek, setHoveredWeek] = useState<string | null>("W4");
  const [activeMapTooltip, setActiveMapTooltip] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Filtered regions based on search & continent filter
  const filteredRegions = initialRegions.filter((r) => {
    const matchesSearch =
      r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.continent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technology.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContinent =
      regionFilter === "All regions" || r.continent === regionFilter;
    return matchesSearch && matchesContinent;
  });

  const handleAddWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetTitle.trim()) return;
    setCustomWidgets([...customWidgets, widgetTitle.trim()]);
    setWidgetTitle("");
    setIsAddWidgetOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0E1510] text-[#111827] flex font-sans antialiased selection:bg-[#10B981] selection:text-white p-3 sm:p-5">
      
      {/* OUTER ROUNDED DASHBOARD CONTAINER (MOCKUP STYLE) */}
      <div className="w-full max-w-[1600px] mx-auto bg-[#0C130E] rounded-[28px] border border-[#1B291D] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR (DARK FOREST GREEN THEME) */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[260px] bg-[#0C130E] border-b lg:border-b-0 lg:border-r border-[#1B291D] p-5 flex flex-col justify-between shrink-0 select-none">
          
          <div className="space-y-6">
            
            {/* BRAND LOGO */}
            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-4 bg-[#00DF81] rounded-full" />
                <div className="w-1.5 h-6 bg-[#00DF81] rounded-full" />
                <div className="w-1.5 h-4 bg-[#00DF81] rounded-full" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                AeuxGlobal
              </span>
            </div>

            {/* WORKSPACE SELECTOR PILL */}
            <div className="relative">
              <button
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className="w-full bg-[#131E16] hover:bg-[#18261C] border border-[#1E3023] rounded-2xl p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#00DF81]/15 border border-[#00DF81]/30 flex items-center justify-center text-[#00DF81]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block leading-tight">
                      Team Workspace
                    </span>
                    <span className="text-xs font-semibold text-white block">
                      {selectedWorkspace}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Workspace Dropdown */}
              {isWorkspaceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#131E16] border border-[#1E3023] rounded-xl p-1.5 z-50 shadow-xl">
                  {["EcoPlastic", "BioTech Global", "CleanEnergy Labs"].map((ws) => (
                    <button
                      key={ws}
                      onClick={() => {
                        setSelectedWorkspace(ws);
                        setIsWorkspaceDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#1C2C20] rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>{ws}</span>
                      {selectedWorkspace === ws && (
                        <Check className="w-3.5 h-3.5 text-[#00DF81]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SEARCH BAR WITH SHORTCUT */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131E16] border border-[#1E3023] rounded-xl pl-9 pr-12 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00DF81] transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-[#0C130E] px-1.5 py-0.5 rounded border border-[#1E3023]">
                ⌘+F
              </span>
            </div>

            {/* NAVIGATION MENU */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2 block">
                NAVIGATION
              </span>

              {/* Dashboard */}
              <button
                onClick={() => setActiveNav("dashboard")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeNav === "dashboard"
                    ? "bg-[#18271C] text-white shadow-sm border border-[#243B2A]"
                    : "text-zinc-400 hover:text-white hover:bg-[#131E16]"
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeNav === "dashboard" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Dashboard</span>
              </button>

              {/* Analytics */}
              <button
                onClick={() => setActiveNav("analytics")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeNav === "analytics"
                    ? "bg-[#18271C] text-white shadow-sm border border-[#243B2A]"
                    : "text-zinc-400 hover:text-white hover:bg-[#131E16]"
                }`}
              >
                <BarChart2 className={`w-4 h-4 ${activeNav === "analytics" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Analytics</span>
              </button>

              {/* Team Structure */}
              <button
                onClick={() => setActiveNav("team")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeNav === "team"
                    ? "bg-[#18271C] text-white shadow-sm border border-[#243B2A]"
                    : "text-zinc-400 hover:text-white hover:bg-[#131E16]"
                }`}
              >
                <Users2 className={`w-4 h-4 ${activeNav === "team" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Team Structure</span>
              </button>

              {/* Reports with Badge 1 */}
              <button
                onClick={() => setActiveNav("reports")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeNav === "reports"
                    ? "bg-[#18271C] text-white shadow-sm border border-[#243B2A]"
                    : "text-zinc-400 hover:text-white hover:bg-[#131E16]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-4 h-4 ${activeNav === "reports" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                  <span>Reports</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-[#00DF81] text-[#0C130E] text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
              </button>

              {/* Support with Badge New */}
              <button
                onClick={() => setActiveNav("support")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeNav === "support"
                    ? "bg-[#18271C] text-white shadow-sm border border-[#243B2A]"
                    : "text-zinc-400 hover:text-white hover:bg-[#131E16]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className={`w-4 h-4 ${activeNav === "support" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                  <span>Support</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-[#00DF81] text-[#0C130E] text-[9px] font-bold uppercase tracking-wide">
                  New
                </span>
              </button>
            </div>

            {/* SETTINGS ITEM */}
            <div className="pt-4 border-t border-[#1B291D]">
              <button
                onClick={() => setActiveNav("settings")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeNav === "settings"
                    ? "bg-[#18271C] text-white shadow-sm border border-[#243B2A]"
                    : "text-zinc-400 hover:text-white hover:bg-[#131E16]"
                }`}
              >
                <Settings className={`w-4 h-4 ${activeNav === "settings" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Settings</span>
              </button>
            </div>

          </div>

          {/* USER ACCOUNT PILL AT BOTTOM */}
          <div className="pt-6 mt-6 border-t border-[#1B291D] relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2 block">
              USER ACCOUNT
            </span>
            <div className="flex items-center justify-between p-2 rounded-2xl bg-[#131E16] border border-[#1E3023]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-900 border border-[#00DF81]/30 shrink-0">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {userName}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {userTag}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Logout / Account Menu */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#131E16] border border-[#1E3023] rounded-xl p-1.5 z-50 shadow-2xl">
                <div className="px-3 py-2 border-b border-[#1E3023] mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#00DF81] block">Logged In</span>
                  <span className="text-xs font-semibold text-white block truncate">{userName}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>Log out</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </aside>

        {/* ========================================================================= */}
        {/* RIGHT MAIN CANVAS (CRISP CLEAN LIGHT/NEUTRAL THEME) */}
        {/* ========================================================================= */}
        <main className="flex-1 bg-[#F4F6F4] p-5 sm:p-7 overflow-y-auto">
          
          {/* HEADER BAR */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Dashboard
            </h1>

            <div className="flex items-center gap-3">
              {/* Notification Bell Button */}
              <button className="w-10 h-10 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/80 shadow-sm flex items-center justify-center text-zinc-700 relative transition-colors cursor-pointer">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-[#00DF81] absolute top-2.5 right-2.5 ring-2 ring-white" />
              </button>

              {/* Add Custom Widget Pill Button */}
              <button
                onClick={() => setIsAddWidgetOpen(true)}
                className="px-4 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Add Custom Widget</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP ROW: 3 STAT KPI CARDS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            
            {/* CARD 1: AIR POLLUTION LEVEL (FEATURED DARK PILL CARD) */}
            <div className="bg-[#0C1510] text-white rounded-[24px] p-6 shadow-sm flex items-center justify-between relative overflow-hidden border border-[#16271D]">
              <div>
                <span className="text-xs text-zinc-400 font-medium block mb-1">
                  Air Pollution Level
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  35.05 <span className="text-base sm:text-lg font-normal text-zinc-300">µg/m³</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-[#00DF81] font-medium">
                  <span>↗ 2.3% than last month</span>
                </div>
              </div>

              {/* Mini Vertical Neon Green Bars */}
              <div className="flex items-end gap-1.5 h-12">
                <div className="w-1.5 h-8 bg-[#00DF81]/40 rounded-full" />
                <div className="w-1.5 h-12 bg-[#00DF81] rounded-full" />
                <div className="w-1.5 h-6 bg-[#00DF81]/60 rounded-full" />
                <div className="w-1.5 h-10 bg-[#00DF81] rounded-full" />
                <div className="w-1.5 h-7 bg-[#00DF81]/80 rounded-full" />
              </div>
            </div>

            {/* CARD 2: ENVIRONMENTAL QUALITY INDEX */}
            <div className="bg-white text-[#111827] rounded-[24px] p-6 shadow-sm flex items-center justify-between border border-zinc-200/70">
              <div>
                <span className="text-xs text-zinc-500 font-medium block mb-1">
                  Environmental Quality Index
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                  75.50<span className="text-base sm:text-lg font-normal text-zinc-400">/100%</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-rose-500 font-medium">
                  <span>↘ 1.4% than last month</span>
                </div>
              </div>

              {/* Mini Red/Coral Bar Chart */}
              <div className="flex items-end gap-1.5 h-12">
                <div className="w-1.5 h-8 bg-rose-400/40 rounded-full" />
                <div className="w-1.5 h-11 bg-rose-500 rounded-full" />
                <div className="w-1.5 h-5 bg-rose-400/50 rounded-full" />
                <div className="w-1.5 h-10 bg-rose-500 rounded-full" />
                <div className="w-1.5 h-7 bg-rose-400/70 rounded-full" />
              </div>
            </div>

            {/* CARD 3: INVESTMENTS IN CLEAN TECHNOLOGIES */}
            <div className="bg-white text-[#111827] rounded-[24px] p-6 shadow-sm flex items-center justify-between border border-zinc-200/70">
              <div>
                <span className="text-xs text-zinc-500 font-medium block mb-1">
                  Investments in Clean Technologies
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                  $967,570
                </div>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-medium">
                  <span>↗ 5.1 than last month</span>
                </div>
              </div>

              {/* Mini Emerald Bar Chart */}
              <div className="flex items-end gap-1.5 h-12">
                <div className="w-1.5 h-8 bg-emerald-500/40 rounded-full" />
                <div className="w-1.5 h-12 bg-emerald-500 rounded-full" />
                <div className="w-1.5 h-6 bg-emerald-500/60 rounded-full" />
                <div className="w-1.5 h-11 bg-emerald-500 rounded-full" />
                <div className="w-1.5 h-7 bg-emerald-500/80 rounded-full" />
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* MIDDLE ROW: CLIMATE CHANGE INDEX CHART + TONS METRIC CARD */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            
            {/* LEFT: CLIMATE CHANGE INDEX (LARGE BAR CHART) */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-zinc-200/70 shadow-sm flex flex-col justify-between">
              
              {/* Header with Time Filter Dropdown */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-[#111827]">
                  Climate Change Index
                </h2>

                <div className="relative">
                  <button
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    className="px-3 py-1.5 bg-[#111827] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>{timeRange}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-300" />
                  </button>

                  {isTimeDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-32 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-40">
                      {["1 month", "2 month", "6 month", "1 year"].map((tr) => (
                        <button
                          key={tr}
                          onClick={() => {
                            setTimeRange(tr);
                            setIsTimeDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span>{tr}</span>
                          {timeRange === tr && <Check className="w-3 h-3 text-[#10B981]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Canvas with Y-Axis, Dashed Threshold, and W1-W8 Columns */}
              <div className="relative pt-6 pb-2">
                
                {/* Horizontal reference dashed lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-zinc-400 pb-6">
                  <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">100</div>
                  <div className="border-b border-dashed border-emerald-300/80 w-full pl-8 relative">
                    80
                  </div>
                  <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">60</div>
                  <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">40</div>
                  <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">20</div>
                  <div className="w-full pl-8">0</div>
                </div>

                {/* Bars Container */}
                <div className="grid grid-cols-8 gap-2 sm:gap-3 pl-8 h-48 items-end relative z-10">
                  {weeklyData.map((item) => (
                    <div
                      key={item.week}
                      onMouseEnter={() => setHoveredWeek(item.week)}
                      className="flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Floating Tooltip Pill (e.g. for Peak W4) */}
                      {item.peak && (
                        <div className="mb-1.5 px-2.5 py-1 bg-[#0C130E] text-white text-[10px] font-bold rounded-lg shadow-md flex items-center gap-1 animate-bounce">
                          <span>{item.peak} CCI</span>
                        </div>
                      )}

                      {/* Bar Group */}
                      <div className="flex items-end gap-1 justify-center w-full">
                        {/* If past weeks -> light gray bars */}
                        {item.past.length > 0 &&
                          item.past.map((val, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${val * 1.5}px` }}
                              className="w-1 sm:w-1.5 bg-zinc-300 rounded-full transition-all group-hover:bg-zinc-400"
                            />
                          ))}

                        {/* If active weeks -> vibrant green bars */}
                        {item.active.length > 0 &&
                          item.active.map((val, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${val * 1.5}px` }}
                              className={`w-1 sm:w-1.5 rounded-full transition-all ${
                                idx === 0 && item.week === "W4"
                                  ? "bg-[#0C130E]"
                                  : "bg-[#00DF81] group-hover:brightness-110"
                              }`}
                            />
                          ))}
                      </div>

                      {/* X-Axis Label */}
                      <span className="text-[10px] font-semibold text-zinc-400 mt-2 block">
                        {item.week}
                      </span>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* RIGHT: TONS METRIC CARD */}
            <div className="lg:col-span-4 bg-white rounded-[24px] p-6 border border-zinc-200/70 shadow-sm flex flex-col justify-between">
              
              <div>
                {/* Big Stat */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
                    99,681m
                  </span>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    TONS
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-2">
                  <span>↗ 20% reduced CO2</span>
                </div>
              </div>

              {/* Sub-breakdown: Mechanical & Chemical */}
              <div className="space-y-4 pt-6 border-t border-zinc-100 mt-6">
                
                {/* Mechanical Recycling */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111827] block">
                      Mechanical recycling
                    </span>
                    <span className="text-xs text-zinc-400 block font-medium">
                      1,697 TONS
                    </span>
                  </div>
                </div>

                {/* Chemical Recycling */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111827] block">
                      Chemical recycling
                    </span>
                    <span className="text-xs text-zinc-400 block font-medium">
                      913 TONS
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* BOTTOM ROW: PLASTIC RECYCLING BY REGION TABLE + GLOBAL POLLUTION MAP */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT: PLASTIC RECYCLING BY REGION (INTERACTIVE TABLE) */}
            <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-zinc-200/70 shadow-sm flex flex-col justify-between">
              
              <div>
                {/* Table Header with Filter */}
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-[#111827]">
                    Plastic Recycling by Region
                  </h2>

                  <div className="relative">
                    <button
                      onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                      className="px-3 py-1.5 bg-[#111827] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>{regionFilter}</span>
                      <ChevronDown className="w-3 h-3 text-zinc-300" />
                    </button>

                    {isRegionDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-36 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-40">
                        {["All regions", "America", "Europe", "Asia"].map((reg) => (
                          <button
                            key={reg}
                            onClick={() => {
                              setRegionFilter(reg);
                              setIsRegionDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex items-center justify-between"
                          >
                            <span>{reg}</span>
                            {regionFilter === reg && <Check className="w-3 h-3 text-[#10B981]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[11px] font-medium text-zinc-400 border-b border-zinc-100 pb-2">
                        <th className="pb-3 font-medium">Region</th>
                        <th className="pb-3 font-medium">Factory</th>
                        <th className="pb-3 font-medium">Recycled</th>
                        <th className="pb-3 font-medium">Dynamic</th>
                        <th className="pb-3 font-medium">Main Technologies</th>
                        <th className="pb-3 font-medium">Total Value</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 text-xs">
                      {filteredRegions.map((row) => (
                        <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors group">
                          
                          {/* Region + Flag */}
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{row.flag}</span>
                              <div>
                                <span className="font-bold text-[#111827] block leading-tight">
                                  {row.country}
                                </span>
                                <span className="text-[10px] text-zinc-400 block">
                                  {row.continent}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Factory */}
                          <td className="py-3.5 pr-3 font-semibold text-zinc-800">
                            {row.factory}
                          </td>

                          {/* Recycled % */}
                          <td className="py-3.5 pr-3 font-semibold text-zinc-800">
                            {row.recycled}%
                          </td>

                          {/* Dynamic Sparkline SVG */}
                          <td className="py-3.5 pr-3">
                            <div className="w-20 h-6">
                              <svg viewBox="0 0 80 24" className="w-full h-full overflow-visible">
                                <path
                                  d={
                                    row.trend === "up"
                                      ? "M0,18 Q20,16 35,8 T80,4"
                                      : "M0,6 Q25,8 45,18 T80,20"
                                  }
                                  fill="none"
                                  stroke={row.trend === "up" ? "#00DF81" : "#F43F5E"}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </td>

                          {/* Technology Pill */}
                          <td className="py-3.5 pr-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-block ${
                                row.technology === "Mechanical"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200/50"
                                  : row.technology === "Energy recovery"
                                  ? "bg-orange-50 text-orange-800 border border-orange-200/50"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                              }`}
                            >
                              {row.technology}
                            </span>
                          </td>

                          {/* Total Value */}
                          <td className="py-3.5 pr-3 font-semibold text-zinc-800 whitespace-nowrap">
                            {row.totalValue}
                          </td>

                          {/* Options */}
                          <td className="py-3.5 text-right">
                            <button className="text-zinc-400 hover:text-zinc-700 p-1">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* RIGHT: GLOBAL POLLUTION (MAP CARD) */}
            <div className="lg:col-span-4 bg-[#0C1510] text-white rounded-[24px] p-6 border border-[#16271D] shadow-sm flex flex-col justify-between relative overflow-hidden">
              
              {/* Header with Region Filter */}
              <div className="flex items-center justify-between mb-3 z-10">
                <h2 className="text-base font-bold text-white">
                  Global pollution
                </h2>

                <div className="relative">
                  <button
                    onClick={() => setIsMapDropdownOpen(!isMapDropdownOpen)}
                    className="px-3 py-1 bg-white text-[#111827] text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>{mapRegion}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-600" />
                  </button>

                  {isMapDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-32 bg-[#131E16] border border-[#1E3023] rounded-xl shadow-lg p-1 z-40">
                      {["Europe", "Asia", "Americas", "Global"].map((mreg) => (
                        <button
                          key={mreg}
                          onClick={() => {
                            setMapRegion(mreg);
                            setIsMapDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-[#1C2C20] rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span>{mreg}</span>
                          {mapRegion === mreg && <Check className="w-3 h-3 text-[#00DF81]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vector SVG Map Container */}
              <div className="relative w-full h-56 flex items-center justify-center my-2">
                <svg
                  viewBox="0 0 400 300"
                  className="w-full h-full object-contain filter drop-shadow-md"
                >
                  {/* Western Europe & Northern Europe */}
                  <path
                    d="M60,140 Q80,100 120,90 Q150,80 180,100 Q190,130 160,160 Q120,180 80,170 Z"
                    fill="#152B1E"
                    stroke="#234530"
                    strokeWidth="1"
                  />
                  <path
                    d="M100,50 Q130,40 160,60 Q150,90 120,90 Q90,80 100,50 Z"
                    fill="#152B1E"
                    stroke="#234530"
                    strokeWidth="1"
                  />
                  {/* Southern Europe / Mediterranean */}
                  <path
                    d="M120,180 Q160,170 190,190 Q180,240 140,230 Q110,210 120,180 Z"
                    fill="#152B1E"
                    stroke="#234530"
                    strokeWidth="1"
                  />
                  
                  {/* Central & Eastern Europe (Illuminated in High Green) */}
                  <path
                    d="M180,100 Q240,80 290,110 Q320,150 280,200 Q220,210 170,180 Q160,140 180,100 Z"
                    fill="#00DF81"
                    className="opacity-90 transition-opacity hover:opacity-100 cursor-pointer"
                  />
                  <path
                    d="M250,130 Q300,120 340,150 Q330,190 280,190 Z"
                    fill="#059669"
                    className="opacity-80"
                  />
                  <path
                    d="M200,60 Q270,50 310,80 Q290,120 240,100 Z"
                    fill="#10B981"
                    className="opacity-85"
                  />

                  {/* Radiating target dots */}
                  <circle cx="250" cy="150" r="4" fill="#FFFFFF" />
                  <circle cx="250" cy="150" r="10" fill="none" stroke="#FFFFFF" strokeWidth="1" className="animate-ping opacity-75" />
                </svg>

                {/* Floating Tooltip Card over Ukraine */}
                {activeMapTooltip && (
                  <div className="absolute top-12 left-6 bg-[#18271C]/90 backdrop-blur-md border border-[#2B4733] rounded-xl px-3 py-2 shadow-xl flex items-center gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-white block leading-tight">
                        Ukraine
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        High Level
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#00DF81]">
                      89% ↗
                    </span>
                  </div>
                )}

                {/* Floating '?' Help Button in Bottom-Left */}
                <button
                  onClick={() => setActiveMapTooltip(!activeMapTooltip)}
                  className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-[#131E16] hover:bg-[#1A2A1E] border border-[#1E3023] flex items-center justify-center text-zinc-400 text-xs font-bold transition-colors cursor-pointer"
                >
                  ?
                </button>

              </div>

            </div>

          </div>

        </main>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD CUSTOM WIDGET */}
      {/* ========================================================================= */}
      {isAddWidgetOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#0C130E] border border-[#1B291D] rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00DF81]/15 border border-[#00DF81]/30 flex items-center justify-center text-[#00DF81]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Custom Widget</h3>
                  <p className="text-xs text-zinc-400">Add a new metric or chart to your overview.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddWidgetOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWidgetSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Widget Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solar Energy Output"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  className="w-full bg-[#131E16] border border-[#1E3023] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00DF81]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Widget Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["metric", "chart", "table"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWidgetType(t)}
                      className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                        widgetType === t
                          ? "bg-[#00DF81] text-[#0C130E] border-[#00DF81]"
                          : "bg-[#131E16] text-zinc-300 border-[#1E3023] hover:border-zinc-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddWidgetOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00DF81] hover:bg-[#00c774] text-[#0C130E] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Add Widget
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
