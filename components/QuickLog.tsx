"use client";

import { Baby, BedDouble, Milk, Plus, X } from "lucide-react";
import { useState } from "react";
import { BABY_ID, supabase } from "@/lib/supabase";

type Kind = "feed" | "diaper" | "sleep" | "pump";

const presets = [15, 30, 45, 60, 90];

export function QuickLog({ onLogged }: { onLogged: () => void }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(30);
  const [milkType, setMilkType] = useState<"breast_milk" | "formula">("breast_milk");
  const [diaper, setDiaper] = useState<"wet" | "dirty" | "both">("wet");
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);

  async function save() {
    setBusy(true);
    try {
      if (!supabase) {
        const current = JSON.parse(localStorage.getItem("mclaren-demo-events") || "[]");
        current.unshift({ id: crypto.randomUUID(), kind, at: new Date().toISOString(), amount, milkType, diaper, left, right });
        localStorage.setItem("mclaren-demo-events", JSON.stringify(current));
      } else {
        const now = new Date().toISOString();
        if (kind === "feed") await supabase.from("feeds").insert({ baby_id: BABY_ID, occurred_at: now, amount_ml: amount, milk_type: milkType });
        if (kind === "diaper") await supabase.from("diapers").insert({ baby_id: BABY_ID, occurred_at: now, kind: diaper });
        if (kind === "pump") await supabase.from("pumps").insert({ baby_id: BABY_ID, occurred_at: now, left_ml: left, right_ml: right });
        if (kind === "sleep") {
          const { data: active } = await supabase.from("sleeps").select("id").eq("baby_id", BABY_ID).is("ended_at", null).maybeSingle();
          if (active?.id) await supabase.from("sleeps").update({ ended_at: now }).eq("id", active.id);
          else await supabase.from("sleeps").insert({ baby_id: BABY_ID, started_at: now });
        }
      }
      setKind(null);
      onLogged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="quick-grid">
        <button className="quick papaya-fill" onClick={() => setKind("feed")}><Milk size={22}/><span>Feed</span></button>
        <button className="quick" onClick={() => setKind("diaper")}><Baby size={22}/><span>Diaper</span></button>
        <button className="quick" onClick={() => setKind("sleep")}><BedDouble size={22}/><span>Sleep</span></button>
        <button className="quick" onClick={() => setKind("pump")}><Plus size={22}/><span>Pump</span></button>
      </section>

      {kind && (
        <div className="sheet-backdrop" onClick={() => setKind(null)}>
          <section className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title-row">
              <div><span className="eyebrow">QUICK LOG</span><h2>{kind === "feed" ? "Fuel stop" : kind === "diaper" ? "Diaper" : kind === "sleep" ? "Sleep stint" : "Pump session"}</h2></div>
              <button className="icon-button" onClick={() => setKind(null)}><X size={20}/></button>
            </div>

            {kind === "feed" && <>
              <label className="field-label">Amount</label>
              <div className="preset-row">{presets.map(p => <button key={p} className={amount === p ? "preset active" : "preset"} onClick={() => setAmount(p)}>{p}<small>mL</small></button>)}</div>
              <div className="segmented"><button className={milkType === "breast_milk" ? "active" : ""} onClick={() => setMilkType("breast_milk")}>Breast milk</button><button className={milkType === "formula" ? "active" : ""} onClick={() => setMilkType("formula")}>Formula</button></div>
            </>}

            {kind === "diaper" && <div className="choice-stack">
              {(["wet","dirty","both"] as const).map(v => <button key={v} className={diaper === v ? "choice active" : "choice"} onClick={() => setDiaper(v)}>{v === "wet" ? "💧 Wet" : v === "dirty" ? "💩 Dirty" : "💧💩 Both"}</button>)}
            </div>}

            {kind === "sleep" && <p className="helper">One tap starts a sleep stint. If Mclaren is already sleeping, this tap marks him awake.</p>}

            {kind === "pump" && <div className="pump-grid"><label>Left (mL)<input inputMode="numeric" type="number" value={left} onChange={e => setLeft(Number(e.target.value))}/></label><label>Right (mL)<input inputMode="numeric" type="number" value={right} onChange={e => setRight(Number(e.target.value))}/></label></div>}

            <button className="save-button" onClick={save} disabled={busy}>{busy ? "Logging…" : "LOG NOW"}</button>
          </section>
        </div>
      )}
    </>
  );
}
