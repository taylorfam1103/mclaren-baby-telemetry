"use client";

import { Baby, BedDouble, Droplets, Gauge, Milk, Timer, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuickLog } from "@/components/QuickLog";
import { TelemetryCard } from "@/components/TelemetryCard";
import { BABY_ID, supabase } from "@/lib/supabase";

type Event = { id: string; type: "feed" | "diaper" | "sleep" | "pump"; at: string; label: string; detail: string };

const mlToOz = (ml: number) => (ml / 29.5735).toFixed(1);
const ago = (iso?: string | null) => {
  if (!iso) return "No data yet";
  const min = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""} ago`;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [feedsToday, setFeedsToday] = useState<{ amount_ml: number; occurred_at: string }[]>([]);
  const [diapersToday, setDiapersToday] = useState<{ kind: string; occurred_at: string }[]>([]);
  const [activeSleep, setActiveSleep] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!supabase) {
      const raw = JSON.parse(localStorage.getItem("mclaren-demo-events") || "[]");
      const demo: Event[] = raw.map((e: any) => ({
        id: e.id, type: e.kind, at: e.at,
        label: e.kind === "feed" ? `${e.amount} mL feed` : e.kind === "diaper" ? `${e.diaper} diaper` : e.kind === "pump" ? `${e.left + e.right} mL pumped` : "Sleep toggled",
        detail: e.kind === "feed" ? (e.milkType === "breast_milk" ? "Breast milk" : "Formula") : "Logged"
      }));
      setEvents(demo.slice(0, 8));
      const today = new Date().toDateString();
      setFeedsToday(raw.filter((e:any) => e.kind === "feed" && new Date(e.at).toDateString() === today).map((e:any) => ({amount_ml:e.amount, occurred_at:e.at})));
      setDiapersToday(raw.filter((e:any) => e.kind === "diaper" && new Date(e.at).toDateString() === today).map((e:any) => ({kind:e.diaper, occurred_at:e.at})));
      return;
    }

    const start = new Date(); start.setHours(0,0,0,0);
    const [f,d,s,p] = await Promise.all([
      supabase.from("feeds").select("id,occurred_at,amount_ml,milk_type").eq("baby_id",BABY_ID).gte("occurred_at", start.toISOString()).order("occurred_at",{ascending:false}),
      supabase.from("diapers").select("id,occurred_at,kind").eq("baby_id",BABY_ID).gte("occurred_at", start.toISOString()).order("occurred_at",{ascending:false}),
      supabase.from("sleeps").select("id,started_at,ended_at").eq("baby_id",BABY_ID).order("started_at",{ascending:false}).limit(10),
      supabase.from("pumps").select("id,occurred_at,left_ml,right_ml").eq("baby_id",BABY_ID).order("occurred_at",{ascending:false}).limit(10)
    ]);
    setFeedsToday(f.data || []); setDiapersToday(d.data || []);
    setActiveSleep((s.data || []).find((x:any) => !x.ended_at)?.started_at || null);
    const all: Event[] = [
      ...(f.data || []).map((x:any)=>({id:x.id,type:"feed" as const,at:x.occurred_at,label:`${x.amount_ml} mL feed`,detail:x.milk_type === "breast_milk" ? "Breast milk" : "Formula"})),
      ...(d.data || []).map((x:any)=>({id:x.id,type:"diaper" as const,at:x.occurred_at,label:`${x.kind} diaper`,detail:"Diaper change"})),
      ...(s.data || []).map((x:any)=>({id:x.id,type:"sleep" as const,at:x.started_at,label:x.ended_at ? "Sleep stint" : "Sleeping now",detail:x.ended_at ? `${Math.round((new Date(x.ended_at).getTime()-new Date(x.started_at).getTime())/60000)} min` : "Live stint"})),
      ...(p.data || []).map((x:any)=>({id:x.id,type:"pump" as const,at:x.occurred_at,label:`${x.left_ml+x.right_ml} mL pumped`,detail:`L ${x.left_ml} • R ${x.right_ml}`}))
    ].sort((a,b)=>+new Date(b.at)-+new Date(a.at)).slice(0,8);
    setEvents(all);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setInterval(() => setTick(v => v + 1), 30000); return () => clearInterval(id); }, []);

  const feedTotal = useMemo(() => feedsToday.reduce((a,b)=>a+b.amount_ml,0),[feedsToday]);
  const lastFeed = feedsToday[0];
  const lastDiaper = diapersToday[0];
  const wet = diapersToday.filter(d=>d.kind === "wet" || d.kind === "both").length;
  const dirty = diapersToday.filter(d=>d.kind === "dirty" || d.kind === "both").length;
  const sleepMins = activeSleep ? Math.floor((Date.now()-new Date(activeSleep).getTime())/60000) : 0;
  void tick;

  return (
    <main>
      <div className="ambient papaya-ambient"/><div className="ambient teal-ambient"/>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">M</span><div><span>MCLAREN</span><small>BABY TELEMETRY</small></div></div>
        <div className="live-pill"><i/> LIVE</div>
      </header>

      <section className="hero">
        <div><span className="eyebrow">CAR NO. 25 • NEWBORN</span><h1>Race control for<br/><em>the little guy.</em></h1><p>Everything Mclaren needs, logged at pit-stop speed.</p></div>
        <div className="hero-badge"><Gauge size={30}/><strong>DAY 2</strong><span>SESSION</span></div>
      </section>

      <section className="status-strip"><span><i className="dot papaya-dot"/> FEED STATUS</span><strong>{lastFeed ? ago(lastFeed.occurred_at) : "Ready"}</strong><span className="chevron">›</span></section>

      <section className="telemetry-grid">
        <TelemetryCard eyebrow="LAST FEED" value={lastFeed ? `${lastFeed.amount_ml} mL` : "—"} sub={lastFeed ? `${mlToOz(lastFeed.amount_ml)} oz • ${ago(lastFeed.occurred_at)}` : "Log first feed"} icon={<Milk size={20}/>} />
        <TelemetryCard eyebrow="LAST DIAPER" value={lastDiaper ? lastDiaper.kind.toUpperCase() : "—"} sub={lastDiaper ? ago(lastDiaper.occurred_at) : "Log first diaper"} icon={<Droplets size={20}/>} accent="teal" />
        <TelemetryCard eyebrow="SLEEP STINT" value={activeSleep ? `${Math.floor(sleepMins/60)}:${String(sleepMins%60).padStart(2,"0")}` : "AWAKE"} sub={activeSleep ? `Started ${new Date(activeSleep).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}` : "No active sleep"} icon={<BedDouble size={20}/>} accent="white" />
      </section>

      <section className="section-head"><div><span className="eyebrow">PIT WALL</span><h2>Quick log</h2></div><Zap size={20}/></section>
      <QuickLog onLogged={load}/>

      <section className="today-card">
        <div className="section-head compact"><div><span className="eyebrow">TODAY</span><h2>Session totals</h2></div><Timer size={20}/></div>
        <div className="today-metrics">
          <div><strong>{feedsToday.length}</strong><span>feeds</span></div>
          <div><strong>{feedTotal}</strong><span>mL total</span></div>
          <div><strong>{wet}</strong><span>wet</span></div>
          <div><strong>{dirty}</strong><span>dirty</span></div>
        </div>
      </section>

      <section className="timeline">
        <div className="section-head"><div><span className="eyebrow">RACE LOG</span><h2>Timeline</h2></div><Baby size={20}/></section>
        {events.length === 0 ? <div className="empty"><strong>Telemetry is quiet.</strong><span>Your first log will show up here.</span></div> : events.map((e, i) => <div className="event" key={`${e.type}-${e.id}`}><div className={`event-icon ${e.type}`}>{e.type === "feed" ? "🍼" : e.type === "diaper" ? "💧" : e.type === "sleep" ? "😴" : "🥛"}</div><div className="event-copy"><strong>{e.label}</strong><span>{e.detail}</span></div><time>{ago(e.at)}</time>{i < events.length-1 && <div className="event-line"/>}</div>)}
      </section>

      <footer><span>BUILT FOR MCLAREN • 2026</span><span className="footer-speed">///</span></footer>
    </main>
  );
}
