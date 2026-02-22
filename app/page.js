"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  TrendingDown, Shield, Instagram, ArrowRight,
  Sparkles, Sun, Moon, Zap, Tag, BarChart2,
  Rabbit, Bell, LogOut, LogIn,
  ExternalLink, Trash2, ChevronDown, ChevronUp,
  ShoppingBag, Activity, Clock, CheckCircle2, TrendingUp,
  Linkedin, Github, Phone,
} from "lucide-react";
import Image from "next/image";
import AddProductForm from "@/components/AddProductForm";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ═══════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value;
  const fmtINR = v => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);
  return (
    <div style={{
      background: "var(--surface, #fff)",
      border: "1px solid rgba(249,115,22,0.4)",
      borderRadius: 10, padding: "8px 14px",
      boxShadow: "0 8px 28px rgba(249,115,22,0.2)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-3, #a89278)", marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#f97316" }}>{fmtINR(price)}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRICE HISTORY CHART
// ═══════════════════════════════════════════════════════════
function PriceChart({ data = [] }) {
  if (!data || data.length < 1) return null;
  const prices = data.map(d => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pad  = (maxP - minP) * 0.15 || maxP * 0.06 || 1000;
  const yMin = Math.max(0, Math.floor((minP - pad) / 1000) * 1000);
  const yMax = Math.ceil((maxP + pad) / 1000) * 1000;
  const fmtY = v => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 0 }).format(v);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="rgba(249,115,22,0.1)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-3, #a89278)", fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(249,115,22,0.15)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={fmtY}
          tick={{ fill: "var(--text-3, #a89278)", fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          tickLine={false}
          axisLine={false}
          width={54}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "rgba(249,115,22,0.25)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#f97316"
          strokeWidth={2.5}
          fill="url(#pg)"
          dot={{ r: 4, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════
// FORMAT PRICE
// ═══════════════════════════════════════════════════════════
function fmtPrice(val) {
  const n = parseFloat(String(val ?? "").replace(/[^0-9.]/g, ""));
  if (!n || isNaN(n)) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

// ═══════════════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════════════
function ProductCard({ product, onRemove }) {
  const [chartOpen, setChartOpen] = useState(false);
  const [removing,  setRemoving]  = useState(false);
  const [gone,      setGone]      = useState(false);
  const [imgErr,    setImgErr]    = useState(false);
  const [btnHov,    setBtnHov]    = useState(null);

  if (!product || gone) return null;

  const { name = "Product", image_url, current_price, original_price,
          target_price, url, store, price_history = [], last_checked } = product;

  const curr   = parseFloat(String(current_price  ?? "").replace(/[^0-9.]/g, "")) || 0;
  const orig   = parseFloat(String(original_price ?? "").replace(/[^0-9.]/g, "")) || 0;
  const target = parseFloat(String(target_price   ?? "").replace(/[^0-9.]/g, "")) || 0;

  const discount = orig > curr && orig > 0 ? Math.round(((orig - curr) / orig) * 100) : 0;
  const atTarget = target > 0 && curr > 0 && curr <= target;
  const priceUp  = orig > 0 && curr > orig;

  const { history, chartData } = (() => {
    let raw = price_history;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    if (!Array.isArray(raw) || raw.length === 0) return { history: [], chartData: [] };
    const fmtDate = (d) => {
      if (!d) return null;
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d).slice(0, 10);
        return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
      } catch { return String(d).slice(0, 10); }
    };
    const parsed = raw.map((p, i) => {
      if (p === null || p === undefined) return null;
      let priceVal = null;
      let dateVal  = null;
      if (typeof p === "number") {
        priceVal = p;
      } else if (typeof p === "string") {
        priceVal = parseFloat(p.replace(/[^0-9.]/g, ""));
      } else if (typeof p === "object") {
        priceVal = p.price ?? p.Price ?? p.value ?? p.amount ?? p.current_price ?? p.cost ?? p.rate;
        dateVal  = p.checked_at ?? p.date ?? p.Date ?? p.created_at ?? p.timestamp ?? p.time ?? p.recorded_at ?? p.at;
        if (priceVal === null || priceVal === undefined) {
          for (const v of Object.values(p)) {
            const n = parseFloat(String(v ?? "").replace(/[^0-9.]/g, ""));
            if (!isNaN(n) && n > 0) { priceVal = n; break; }
          }
        }
      }
      const n = parseFloat(String(priceVal ?? "").replace(/[^0-9.]/g, ""));
      if (isNaN(n) || n <= 0) return null;
      return { price: n, label: dateVal ? fmtDate(dateVal) : `Point ${i + 1}` };
    }).filter(Boolean);
    return { history: parsed.map(d => d.price), chartData: parsed };
  })();

  const checkedLabel = last_checked
    ? new Date(last_checked).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;
  const title = (name || "").length > 68 ? name.slice(0, 66) + "…" : name;
  const doRemove = async () => {
    setRemoving(true);
    setTimeout(() => setGone(true), 400);
    if (onRemove) await onRemove(product.id);
  };
  const abStyle = (key, danger) => ({
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "11px 6px", border: "none", cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
    background:
      btnHov === key && danger ? "rgba(239,68,68,0.09)" :
      btnHov === key           ? "rgba(249,115,22,0.07)" :
      key === "chart" && chartOpen ? "rgba(249,115,22,0.06)" : "transparent",
    color:
      btnHov === key && danger ? "#ef4444" :
      btnHov === key           ? "var(--orange-d)" :
      key === "chart" && chartOpen ? "var(--orange)" : "var(--text-2)",
    borderRight: key !== "remove" ? "1px solid var(--border)" : "none",
    transition: "background 0.18s, color 0.18s",
    textDecoration: "none",
  });

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
      transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.2s, opacity 0.38s",
      opacity: removing ? 0 : 1,
      transform: removing ? "scale(0.95) translateY(8px)" : "none",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform   = "translateY(-5px)";
      e.currentTarget.style.boxShadow   = "0 20px 56px rgba(249,115,22,0.15)";
      e.currentTarget.style.borderColor = "rgba(249,115,22,0.32)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform   = "none";
      e.currentTarget.style.boxShadow   = "0 2px 20px rgba(0,0,0,0.08)";
      e.currentTarget.style.borderColor = "var(--border)";
    }}>
      <div style={{ height: 3, background: atTarget ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f97316,#fb923c,#f59e0b)" }} />
      <div style={{ padding: "16px 16px 12px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{
          flexShrink: 0, width: 82, height: 82, borderRadius: 13, overflow: "hidden", position: "relative",
          background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.14)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!imgErr && image_url
            ? <img src={image_url} alt={name} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <ShoppingBag size={26} color="rgba(249,115,22,0.4)" />}
          {atTarget ? (
            <div style={{ position: "absolute", top: 5, left: 5, background: "#22c55e", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 5, letterSpacing: "0.03em", lineHeight: 1.4 }}>🎯 HIT</div>
          ) : discount > 0 ? (
            <div style={{ position: "absolute", top: 5, left: 5, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 5, letterSpacing: "0.03em" }}>-{discount}%</div>
          ) : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {store && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--orange-d)", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", padding: "2px 8px", borderRadius: 100 }}>
              <Tag size={8} />{store}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: "var(--text)", marginBottom: 10 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
            {curr > 0 && (
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 21, fontWeight: 800, lineHeight: 1, color: priceUp ? "#ef4444" : "var(--orange)" }}>
                {fmtPrice(curr)}
              </span>
            )}
            {orig > 0 && orig !== curr && (
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-3)", textDecoration: "line-through" }}>{fmtPrice(orig)}</span>
            )}
            {discount > 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 7px", borderRadius: 100, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>↓{discount}% off</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 100, color: "var(--text-2)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
          <Activity size={9} /> Tracking
        </span>
        {target > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, color: atTarget ? "#fff" : "#16a34a", background: atTarget ? "#22c55e" : "rgba(34,197,94,0.08)", border: atTarget ? "1px solid #22c55e" : "1px solid rgba(34,197,94,0.22)" }}>
            {atTarget && <CheckCircle2 size={9} />}
            {atTarget ? "Target hit!" : `🎯 Target: ${fmtPrice(target) ?? "—"}`}
          </span>
        )}
        {checkedLabel && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 100, color: "var(--text-2)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            <Clock size={9} /> {checkedLabel}
          </span>
        )}
      </div>
      <div style={{ maxHeight: chartOpen ? 600 : 0, overflow: "hidden", transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ margin: "4px 16px 14px", background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.14)", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><TrendingDown size={10} color="var(--orange)" /> Price History</span>
            {history.length >= 2 && <span style={{ fontSize: 9, color: "var(--text-3)" }}>{history.length} data points</span>}
          </div>
          {history.length >= 2 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 10.5, fontWeight: 700 }}>
                <span style={{ color: "#22c55e" }}>↓ Low: {fmtPrice(Math.min(...history))}</span>
                <span style={{ color: "#ef4444" }}>↑ High: {fmtPrice(Math.max(...history))}</span>
              </div>
              <PriceChart data={chartData} />
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(249,115,22,0.1)", border: "2px solid rgba(249,115,22,0.22)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <BarChart2 size={17} color="var(--orange)" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 3 }}>Tracking started</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>Chart will appear after a few price checks</div>
              {curr > 0 && (
                <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700, color: "var(--orange)" }}>
                  Current: {fmtPrice(curr)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 1, background: "var(--border)" }} />
      <div style={{ display: "flex" }}>
        <button style={abStyle("chart", false)} onClick={() => setChartOpen(o => !o)} onMouseEnter={() => setBtnHov("chart")} onMouseLeave={() => setBtnHov(null)}>
          <BarChart2 size={12} />{chartOpen ? "Hide" : "Chart"}{chartOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" style={abStyle("view", false)} onMouseEnter={() => setBtnHov("view")} onMouseLeave={() => setBtnHov(null)}>
            <ExternalLink size={12} /> View
          </a>
        )}
        <button style={abStyle("remove", true)} onClick={doRemove} onMouseEnter={() => setBtnHov("remove")} onMouseLeave={() => setBtnHov(null)}>
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SOCIAL ICON BUTTON — reusable animated icon link
// ═══════════════════════════════════════════════════════════
function SocialLink({ href, icon: Icon, label, color, hoverBg }) {
  const [hov, setHov] = useState(false);
  const isPhone = href.startsWith("tel:");
  return (
    <a
      href={href}
      target={isPhone ? "_self" : "_blank"}
      rel={isPhone ? undefined : "noopener noreferrer"}
      title={label}
      aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 10,
        border: `1px solid ${hov ? color + "44" : "var(--border)"}`,
        background: hov ? hoverBg : "var(--surface)",
        color: hov ? color : "var(--text-3)",
        transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 6px 20px ${hoverBg}` : "none",
        textDecoration: "none",
        flexShrink: 0,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Icon size={15} strokeWidth={2} />
    </a>
  );
}

// ═══════════════════════════════════════════════════════════
// AUTH BUTTON
// ═══════════════════════════════════════════════════════════
function AuthButton({ user, onSignOut }) {
  if (user) {
    return (
      <button
        onClick={onSignOut}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--surface)", border: "1px solid var(--border-o)",
          color: "var(--orange-d)", fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13, fontWeight: 600, padding: "7px 14px",
          borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,115,22,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; }}
      >
        <LogOut size={14} /> Sign out
      </button>
    );
  }
  return (
    <a href="/login" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "var(--orange)", color: "#fff",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 13, fontWeight: 700, padding: "7px 16px",
      borderRadius: 10, textDecoration: "none", transition: "opacity 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      <LogIn size={14} /> Sign in
    </a>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Home() {
  const [dark, setDark]         = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser]         = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("dd-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("dd-theme", dark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) {
        supabase.from("products").select("*").eq("user_id", user.id)
          .then(async ({ data: prods }) => {
            if (!prods?.length) { setProducts([]); return; }
            const withHistory = await Promise.all(
              prods.map(async (prod) => {
                const { data: ph } = await supabase
                  .from("price_history")
                  .select("price, checked_at")
                  .eq("product_id", prod.id)
                  .order("checked_at", { ascending: true });
                return { ...prod, price_history: ph ?? [] };
              })
            );
            setProducts(withHistory.filter(Boolean));
          });
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null); setProducts([]);
  };

  const handleRemove = async (id) => {
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const FEATURES = [
    { icon: Zap,       title: "Lightning Fast",  desc: "Extracts prices in seconds — handles JavaScript-heavy & dynamic storefronts.",            color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
    { icon: Shield,    title: "Always Reliable", desc: "Works across all major e-commerce sites with enterprise-grade anti-bot protection.",       color: "#06b6d4", bg: "rgba(6,182,212,0.1)"   },
    { icon: Bell,      title: "Smart Alerts",    desc: "Get notified the instant a price drops below your personal target — no manual checking.", color: "#a855f7", bg: "rgba(168,85,247,0.1)"  },
    { icon: BarChart2, title: "Price History",   desc: "See price trends over time so you always know the best moment to buy.",                    color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
    { icon: Tag,       title: "Any Store",       desc: "Amazon, Flipkart, Myntra, Meesho and more — if it has a price, we track it.",             color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    { icon: Rabbit,    title: "Zero Effort",     desc: "Just paste a URL. DropNotify handles all scraping, tracking and alerting automatically.", color: "#ec4899", bg: "rgba(236,72,153,0.1)"  },
  ];

  const STATS = [
    { value: "10K+",   label: "Products Tracked" },
    { value: "₹2.4Cr", label: "Savings Unlocked" },
    { value: "50+",    label: "Stores Supported"  },
  ];

  // ── Social links ──────────────────────────────────────────
  const SOCIALS = [
    {
      href:    "https://www.instagram.com/i_am_pritesh_._/",
      icon:    Instagram,
      label:   "Instagram — @i_am_pritesh_._",
      color:   "#e1306c",
      hoverBg: "rgba(225,48,108,0.12)",
    },
    {
      href:    "https://www.linkedin.com/in/pritesh-patil-5928402ab/",
      icon:    Linkedin,
      label:   "LinkedIn — Pritesh Patil",
      color:   "#0a66c2",
      hoverBg: "rgba(10,102,194,0.12)",
    },
    {
      href:    "https://github.com/priteshdev8767",
      icon:    Github,
      label:   "GitHub — priteshdev8767",
      color:   "#8b5cf6",
      hoverBg: "rgba(139,92,246,0.12)",
    },
    {
      href:    "tel:+918767944076",
      icon:    Phone,
      label:   "Call — +91 87679 44076",
      color:   "#22c55e",
      hoverBg: "rgba(34,197,94,0.12)",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root, [data-theme="light"] {
          --bg:        #faf8f5;
          --surface:   rgba(255,255,255,0.88);
          --border:    rgba(0,0,0,0.07);
          --border-o:  rgba(249,115,22,0.22);
          --text:      #1a1208;
          --text-2:    #6b5e4e;
          --text-3:    #a89278;
          --orange:    #f97316;
          --orange-d:  #ea580c;
          --glow:      rgba(249,115,22,0.14);
          --shadow:    0 8px 32px rgba(0,0,0,0.07);
          --shadow-lg: 0 24px 64px rgba(0,0,0,0.11);
          --hdr-bg:    rgba(250,248,245,0.82);
          --scrl:      rgba(249,115,22,0.3);
        }
        [data-theme="dark"] {
          --bg:        #0c0b09;
          --surface:   rgba(22,19,14,0.92);
          --border:    rgba(255,255,255,0.07);
          --border-o:  rgba(249,115,22,0.28);
          --text:      #f0e6d3;
          --text-2:    #a08060;
          --text-3:    #604838;
          --orange:    #fb923c;
          --orange-d:  #f97316;
          --glow:      rgba(249,115,22,0.2);
          --shadow:    0 8px 32px rgba(0,0,0,0.45);
          --shadow-lg: 0 24px 64px rgba(0,0,0,0.65);
          --hdr-bg:    rgba(12,11,9,0.88);
          --scrl:      rgba(249,115,22,0.4);
        }

        html { scroll-behavior: smooth; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; overflow-x: hidden;
          transition: background 0.4s, color 0.4s;
        }
        body::after {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.028;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .mesh { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .orb  { position: absolute; border-radius: 50%; filter: blur(110px); will-change: transform; }
        .o1 { width: 750px; height: 750px; top: -250px; right: -180px;
              background: radial-gradient(circle at 35% 45%, rgba(249,115,22,0.2), transparent 65%);
              animation: d1 20s ease-in-out infinite; }
        .o2 { width: 550px; height: 550px; bottom: -150px; left: -130px;
              background: radial-gradient(circle at 55% 50%, rgba(251,146,60,0.14), transparent 65%);
              animation: d2 26s ease-in-out infinite; }
        .o3 { width: 420px; height: 420px; top: 38%; left: 38%;
              background: radial-gradient(circle at 50% 50%, rgba(168,85,247,0.09), transparent 65%);
              animation: d3 18s ease-in-out infinite; }
        [data-theme="dark"] .o1 { opacity: 0.75; }
        [data-theme="dark"] .o2 { opacity: 0.7;  }
        @keyframes d1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,-70px) scale(1.06)} 66%{transform:translate(35px,45px) scale(0.94)} }
        @keyframes d2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(55px,-35px) scale(1.09)} 66%{transform:translate(-25px,55px) scale(0.91)} }
        @keyframes d3 { 0%,100%{transform:translate(0,0) scale(1) rotate(0deg)} 50%{transform:translate(-65px,-45px) scale(1.12) rotate(12deg)} }

        .hdr {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: var(--hdr-bg);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border-bottom: 1px solid var(--border);
          transition: background 0.4s, border-color 0.4s, box-shadow 0.3s;
        }
        .hdr.up { box-shadow: 0 2px 28px var(--glow); border-color: var(--border-o); }
        .hdr-inner { max-width: 1200px; margin: 0 auto; padding: 13px 24px; display: flex; align-items: center; justify-content: space-between; }

        .logo-for-light { height: 33px; width: auto; display: block; transition: opacity 0.2s; }
        .logo-for-dark  { height: 33px; width: auto; display: none;  transition: opacity 0.2s; }
        [data-theme="dark"] .logo-for-light { display: none;  }
        [data-theme="dark"] .logo-for-dark  { display: block; }
        .logo-for-light:hover, .logo-for-dark:hover { opacity: 0.8; }

        .hdr-r { display: flex; align-items: center; gap: 12px; }
        .live { display: flex; align-items: center; gap: 6px; background: rgba(34,197,94,0.09); border: 1px solid rgba(34,197,94,0.2); color: #16a34a; font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 100px; letter-spacing: 0.04em; transition: all 0.4s; }
        [data-theme="dark"] .live { color: #4ade80; background: rgba(74,222,128,0.07); border-color: rgba(74,222,128,0.18); }
        .ldot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; position: relative; }
        .ldot::after { content: ''; position: absolute; inset: -3px; background: #22c55e; border-radius: 50%; opacity: 0.35; animation: lp 1.8s ease-in-out infinite; }
        @keyframes lp { 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(2.2);opacity:0} }
        .tog { width: 46px; height: 26px; background: var(--border-o); border: 1px solid var(--border-o); border-radius: 100px; cursor: pointer; position: relative; transition: background 0.3s; flex-shrink: 0; }
        .tog:hover { background: rgba(249,115,22,0.28); }
        .tog-t { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--orange); display: flex; align-items: center; justify-content: center; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); color: white; }
        .tog-t.on { transform: translateX(20px); }

        .hero { position: relative; z-index: 10; padding: 144px 24px 80px; text-align: center; max-width: 1200px; margin: 0 auto; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border-o); color: var(--orange-d); padding: 7px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; letter-spacing: 0.01em; margin-bottom: 30px; box-shadow: 0 4px 24px var(--glow); animation: sD 0.65s cubic-bezier(0.16,1,0.3,1) both; transition: background 0.4s, border-color 0.4s; }
        .badge a { color: var(--orange-d); text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; transition: color 0.2s; }
        .badge a:hover { color: var(--orange); }
        .bdot { width: 7px; height: 7px; background: var(--orange); border-radius: 50%; flex-shrink: 0; }
        .htitle { font-family: 'Syne', sans-serif; font-size: clamp(3rem, 7.5vw, 6.2rem); font-weight: 800; line-height: 1.02; letter-spacing: -0.036em; color: var(--text); margin-bottom: 22px; animation: sU 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; transition: color 0.4s; }
        .htitle span { display: block; }
        .gtext { background: linear-gradient(120deg, #f97316 0%, #fb923c 25%, #f59e0b 55%, #ef4444 80%, #f97316 100%); background-size: 250% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: ts 5s linear infinite; }
        @keyframes ts { 0%{background-position:0% center} 100%{background-position:250% center} }
        .hsub { font-size: 1.15rem; color: var(--text-2); max-width: 520px; margin: 0 auto 52px; line-height: 1.72; animation: sU 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both; transition: color 0.4s; }
        .hform { animation: sU 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .hform form, .hform > div > form { width: 100% !important; }
        .hform input { width: 100% !important; }

        .stats { display: flex; max-width: 460px; margin: 52px auto 0; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow); animation: sU 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s both; transition: background 0.4s, border-color 0.4s; }
        .stat { flex: 1; padding: 20px 10px; text-align: center; position: relative; transition: background 0.2s; }
        .stat:hover { background: rgba(249,115,22,0.04); }
        .stat + .stat::before { content: ''; position: absolute; left: 0; top: 18%; bottom: 18%; width: 1px; background: var(--border); }
        .sv { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--orange); line-height: 1; margin-bottom: 5px; transition: color 0.4s; }
        .sl { font-size: 10.5px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }

        .feat-section { position: relative; z-index: 10; padding: 0 24px 90px; text-align: center; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, var(--border-o), transparent); max-width: 480px; margin: 0 auto 72px; }
        .sec-chip { display: inline-flex; align-items: center; gap: 7px; background: var(--surface); border: 1px solid var(--border-o); color: var(--orange-d); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 15px; border-radius: 100px; margin-bottom: 16px; transition: background 0.4s, border-color 0.4s, color 0.4s; }
        .sec-title { font-family: 'Syne', sans-serif; font-size: clamp(1.85rem, 3.8vw, 2.8rem); font-weight: 800; letter-spacing: -0.022em; color: var(--text); margin-bottom: 14px; line-height: 1.08; transition: color 0.4s; }
        .sec-sub { font-size: 1rem; color: var(--text-2); line-height: 1.68; max-width: 460px; margin: 0 auto 52px; transition: color 0.4s; }
        .feat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(288px, 1fr)); gap: 16px; max-width: 1000px; margin: 0 auto; }
        .fcard { background: var(--surface); border: 1px solid var(--border); border-radius: 22px; padding: 30px 26px; text-align: left; position: relative; overflow: hidden; cursor: default; transition: transform 0.38s cubic-bezier(0.16,1,0.3,1), box-shadow 0.38s, border-color 0.3s, background 0.4s; animation: fU 0.6s ease both; }
        .fcard:hover { transform: translateY(-8px) scale(1.012); box-shadow: var(--shadow-lg); border-color: var(--border-o); }
        .fcard-num { position: absolute; top: 16px; right: 20px; font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; color: var(--text-3); letter-spacing: 0.06em; }
        .ficon { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; position: relative; }
        .ficon::after { content: ''; position: absolute; inset: -5px; border-radius: 20px; opacity: 0.18; filter: blur(12px); background: inherit; transition: opacity 0.3s; }
        .fcard:hover .ficon::after { opacity: 0.45; }
        .ftitle { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: 8px; transition: color 0.4s; }
        .fdesc  { font-size: 0.875rem; color: var(--text-2); line-height: 1.68; transition: color 0.4s; }

        .prod-section { max-width: 1200px; margin: 0 auto; padding: 0 24px 100px; position: relative; z-index: 10; }
        .prod-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); transition: border-color 0.4s; }
        .prod-title { font-family: 'Syne', sans-serif; font-size: 1.65rem; font-weight: 800; color: var(--text); transition: color 0.4s; }
        .cpill { background: rgba(249,115,22,0.12); border: 1px solid var(--border-o); color: var(--orange-d); font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 100px; letter-spacing: 0.03em; }
        .prod-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); align-items: start; }
        .pitem { animation: fU 0.6s ease both; }

        .empty-wrap { max-width: 480px; margin: 0 auto; padding: 0 24px 100px; position: relative; z-index: 10; }
        .ecard { background: var(--surface); border: 2px dashed var(--border-o); border-radius: 28px; padding: 66px 40px; text-align: center; animation: fU 0.6s ease both; transition: background 0.4s, border-color 0.4s; }
        .eicon { width: 74px; height: 74px; background: rgba(249,115,22,0.09); border: 1px solid var(--border-o); border-radius: 22px; display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; }
        .etitle { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: var(--text); margin-bottom: 10px; transition: color 0.4s; }
        .esub { font-size: 0.9rem; color: var(--text-2); line-height: 1.68; margin-bottom: 22px; transition: color 0.4s; }
        .ecta { display: inline-flex; align-items: center; gap: 7px; color: var(--orange-d); font-size: 14px; font-weight: 700; }

        /* ── Footer ── */
        .foot {
          position: relative; z-index: 10;
          border-top: 1px solid var(--border);
          padding: 22px 24px;
          transition: border-color 0.4s;
        }
        .foot-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center;
          justify-content: space-between;
          flex-wrap: wrap; gap: 14px;
        }
        .foot-left {
          display: flex; flex-direction: column; gap: 3px;
        }
        .foot-copy {
          font-size: 13px; font-weight: 500;
          color: var(--text-2); transition: color 0.4s;
        }
        .foot-by {
          font-size: 11.5px; color: var(--text-3); transition: color 0.4s;
        }
        .foot-by strong { color: var(--orange-d); font-weight: 700; }
        .foot-socials {
          display: flex; align-items: center; gap: 8px;
        }
        .foot-sep {
          width: 1px; height: 20px;
          background: var(--border);
          margin: 0 4px; flex-shrink: 0;
        }

        @keyframes sD { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sU { from{opacity:0;transform:translateY(26px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fU { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--scrl); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--orange); }
        button:focus-visible, a:focus-visible { outline: 2px solid var(--orange); outline-offset: 3px; border-radius: 6px; }
        ::selection { background: rgba(249,115,22,0.2); color: var(--text); }

        @media (max-width: 520px) {
          .foot-inner { justify-content: center; text-align: center; }
          .foot-left { align-items: center; }
        }
      `}</style>

      <div className="mesh" aria-hidden="true">
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
      </div>

      {/* ── Header ── */}
      <header className={`hdr${scrolled ? " up" : ""}`}>
        <div className="hdr-inner">
          <Image src="/dropnotify-logo.svg"        alt="DropNotify" width={600} height={200} className="logo-for-light" />
          <Image src="/dropnotify-logo-header.svg" alt="DropNotify" width={600} height={200} className="logo-for-dark"  />
          <div className="hdr-r">
            <div className="live"><div className="ldot" /><span>Live</span></div>
            <button className="tog" onClick={() => setDark(d => !d)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
              <div className={`tog-t${dark ? " on" : ""}`}>
                {dark ? <Sun size={10} strokeWidth={2.5} /> : <Moon size={10} strokeWidth={2.5} />}
              </div>
            </button>
            <AuthButton user={user} onSignOut={handleSignOut} />
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        {/* ── Hero ── */}
        <section className="hero">
          <span className="badge">
            <span className="bdot" />
            ⚡ Built by {" "}
            <a href="https://www.instagram.com/i_am_pritesh_._/" target="_blank" rel="noopener noreferrer">
              <Instagram size={12} /> Pritesh Patil
            </a>
          </span>
          <h1 className="htitle">
            Never Miss a
            <span><span className="gtext">Price Drop</span></span>
          </h1>
          <p className="hsub">
            Track prices from any e-commerce site. Get instant alerts when prices fall to your target. Save more, every time.
          </p>
          <div className="hform" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div style={{ width: "100%", maxWidth: 620 }}>
              <AddProductForm user={user} />
            </div>
          </div>
          {safeProducts.length === 0 && (
            <div className="stats">
              {STATS.map(s => (
                <div key={s.label} className="stat">
                  <div className="sv">{s.value}</div>
                  <div className="sl">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Features ── */}
        {safeProducts.length === 0 && (
          <section className="feat-section">
            <div className="divider" />
            <div><span className="sec-chip"><Sparkles size={11} /> Why DropNotify</span></div>
            <h2 className="sec-title">Everything you need to<br />shop smarter</h2>
            <p className="sec-sub">Powerful tools, zero complexity. DropNotify does the heavy lifting so you never overpay again.</p>
            <div className="feat-grid">
              {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
                <div key={title} className="fcard" style={{ animationDelay: `${i * 0.07}s` }}>
                  <span className="fcard-num">0{i + 1}</span>
                  <div className="ficon" style={{ background: bg }}>
                    <Icon size={22} color={color} strokeWidth={2} style={{ position: "relative", zIndex: 1 }} />
                  </div>
                  <div className="ftitle">{title}</div>
                  <div className="fdesc">{desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Products ── */}
        {user && safeProducts.length > 0 && (
          <section className="prod-section">
            <div className="prod-hdr">
              <h2 className="prod-title">Your Tracked Products</h2>
              <span className="cpill">{safeProducts.length} {safeProducts.length === 1 ? "product" : "products"}</span>
            </div>
            <div className="prod-grid">
              {safeProducts.map((product, i) => (
                <div key={product.id} className="pitem" style={{ animationDelay: `${i * 0.07}s` }}>
                  <ProductCard product={product} onRemove={handleRemove} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {user && safeProducts.length === 0 && (
          <div className="empty-wrap">
            <div className="ecard">
              <div className="eicon"><TrendingDown size={30} color="#f97316" strokeWidth={1.5} /></div>
              <div className="etitle">No products yet</div>
              <p className="esub">Paste any product URL above to start tracking prices and unlock real savings!</p>
              <span className="ecta">Add your first product <ArrowRight size={15} /></span>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="foot">
          <div className="foot-inner">

            {/* Left: copyright + byline */}
            <div className="foot-left">
              <span className="foot-copy">© {new Date().getFullYear()} DropNotify · All rights reserved</span>
              <span className="foot-by">⚡ Crafted by <strong>Pritesh Patil</strong></span>
            </div>

            {/* Right: social icon buttons */}
            <div className="foot-socials">
              {/* First 3: social platforms */}
              {SOCIALS.slice(0, 3).map(s => (
                <SocialLink key={s.href} {...s} />
              ))}

              {/* Divider before phone */}
              <div className="foot-sep" />

              {/* Phone */}
              <SocialLink {...SOCIALS[3]} />
            </div>

          </div>
        </footer>
      </main>
    </>
  );
}