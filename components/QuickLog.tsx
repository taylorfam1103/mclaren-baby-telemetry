"use client";

import { Baby, BedDouble, Milk, Plus, X } from "lucide-react";
import { useState } from "react";
import { BABY_ID, supabase } from "@/lib/supabase";

type Kind = "feed" | "diaper" | "sleep" | "pump";
type FeedUnit = "ml" | "oz";

const ML_PER_OZ = 29.5735;

const mlPresets = [15, 30, 45, 60, 90];
const ozPresets = [0.5, 1, 1.5, 2, 3];

const toMl = (value: number, unit: FeedUnit) =>
  unit === "ml" ? value : value * ML_PER_OZ;

const formatNumber = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

export function QuickLog({ onLogged }: { onLogged: () => void }) {
  const [kind, setKind] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);

  const [feedUnit, setFeedUnit] = useState<FeedUnit>("ml");
  const [amount, setAmount] = useState(30);
  const [customAmount, setCustomAmount] = useState("");

  const [milkType, setMilkType] =
    useState<"breast_milk" | "formula">("breast_milk");

  const [diaper, setDiaper] =
    useState<"wet" | "dirty" | "both">("wet");

  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);

  const presets = feedUnit === "ml" ? mlPresets : ozPresets;

  function choosePreset(value: number) {
    setAmount(toMl(value, feedUnit));
    setCustomAmount("");
  }

  function handleCustomAmount(value: string) {
    setCustomAmount(value);

    const parsed = Number(value);

    if (!Number.isNaN(parsed) && parsed >= 0) {
      setAmount(toMl(parsed, feedUnit));
    }
  }

  function changeFeedUnit(nextUnit: FeedUnit) {
    if (nextUnit === feedUnit) return;

    if (customAmount !== "") {
      const converted =
        nextUnit === "oz"
          ? amount / ML_PER_OZ
          : amount;

      setCustomAmount(
        nextUnit === "oz"
          ? formatNumber(converted)
          : formatNumber(Math.round(converted))
      );
    }

    setFeedUnit(nextUnit);
  }

  async function save() {
    setBusy(true);

    try {
      const amountMl = Math.round(amount * 10) / 10;

      if (!supabase) {
        const current = JSON.parse(
          localStorage.getItem("mclaren-demo-events") || "[]"
        );

        current.unshift({
          id: crypto.randomUUID(),
          kind,
          at: new Date().toISOString(),
          amount: amountMl,
          milkType,
          diaper,
          left,
          right,
        });

        localStorage.setItem(
          "mclaren-demo-events",
          JSON.stringify(current)
        );
      } else {
        const now = new Date().toISOString();

        if (kind === "feed") {
          await supabase.from("feeds").insert({
            baby_id: BABY_ID,
            occurred_at: now,
            amount_ml: amountMl,
            milk_type: milkType,
          });
        }

        if (kind === "diaper") {
          await supabase.from("diapers").insert({
            baby_id: BABY_ID,
            occurred_at: now,
            kind: diaper,
          });
        }

        if (kind === "pump") {
          await supabase.from("pumps").insert({
            baby_id: BABY_ID,
            occurred_at: now,
            left_ml: left,
            right_ml: right,
          });
        }

        if (kind === "sleep") {
          const { data: active } = await supabase
            .from("sleeps")
            .select("id")
            .eq("baby_id", BABY_ID)
            .is("ended_at", null)
            .maybeSingle();

          if (active?.id) {
            await supabase
              .from("sleeps")
              .update({ ended_at: now })
              .eq("id", active.id);
          } else {
            await supabase.from("sleeps").insert({
              baby_id: BABY_ID,
              started_at: now,
            });
          }
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
        <button
          className="quick papaya-fill"
          onClick={() => setKind("feed")}
        >
          <Milk size={22} />
          <span>Feed</span>
        </button>

        <button
          className="quick"
          onClick={() => setKind("diaper")}
        >
          <Baby size={22} />
          <span>Diaper</span>
        </button>

        <button
          className="quick"
          onClick={() => setKind("sleep")}
        >
          <BedDouble size={22} />
          <span>Sleep</span>
        </button>

        <button
          className="quick"
          onClick={() => setKind("pump")}
        >
          <Plus size={22} />
          <span>Pump</span>
        </button>
      </section>

      {kind && (
        <div
          className="sheet-backdrop"
          onClick={() => setKind(null)}
        >
          <section
            className="sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />

            <div className="sheet-title-row">
              <div>
                <span className="eyebrow">QUICK LOG</span>

                <h2>
                  {kind === "feed"
                    ? "Fuel stop"
                    : kind === "diaper"
                    ? "Diaper"
                    : kind === "sleep"
                    ? "Sleep stint"
                    : "Pump session"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setKind(null)}
              >
                <X size={20} />
              </button>
            </div>

            {kind === "feed" && (
              <>
                <div className="amount-heading">
                  <label className="field-label">Amount</label>

                  <div className="unit-toggle">
                    <button
                      className={feedUnit === "ml" ? "active" : ""}
                      onClick={() => changeFeedUnit("ml")}
                    >
                      mL
                    </button>

                    <button
                      className={feedUnit === "oz" ? "active" : ""}
                      onClick={() => changeFeedUnit("oz")}
                    >
                      oz
                    </button>
                  </div>
                </div>

                <div className="preset-row">
                  {presets.map((preset) => {
                    const presetMl = toMl(preset, feedUnit);

                    const isActive =
                      customAmount === "" &&
                      Math.abs(amount - presetMl) < 0.2;

                    return (
                      <button
                        key={preset}
                        className={
                          isActive
                            ? "preset active"
                            : "preset"
                        }
                        onClick={() => choosePreset(preset)}
                      >
                        {preset}
                        <small>{feedUnit}</small>
                      </button>
                    );
                  })}
                </div>

                <div className="custom-amount">
                  <label>
                    Custom amount
                    <div className="custom-input-wrap">
                      <input
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step={feedUnit === "oz" ? "0.1" : "1"}
                        placeholder={
                          feedUnit === "oz"
                            ? "Example: 1.25"
                            : "Example: 35"
                        }
                        value={customAmount}
                        onChange={(e) =>
                          handleCustomAmount(e.target.value)
                        }
                      />

                      <span>{feedUnit}</span>
                    </div>
                  </label>
                </div>

                <div className="conversion-readout">
                  <span>Fuel load</span>

                  <strong>
                    {Math.round(amount * 10) / 10} mL
                    <small>
                      {(amount / ML_PER_OZ).toFixed(2)} oz
                    </small>
                  </strong>
                </div>

                <div className="segmented">
                  <button
                    className={
                      milkType === "breast_milk"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setMilkType("breast_milk")
                    }
                  >
                    Breast milk
                  </button>

                  <button
                    className={
                      milkType === "formula"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setMilkType("formula")
                    }
                  >
                    Formula
                  </button>
                </div>
              </>
            )}

            {kind === "diaper" && (
              <div className="choice-stack">
                {(["wet", "dirty", "both"] as const).map(
                  (value) => (
                    <button
                      key={value}
                      className={
                        diaper === value
                          ? "choice active"
                          : "choice"
                      }
                      onClick={() => setDiaper(value)}
                    >
                      {value === "wet"
                        ? "💧 Wet"
                        : value === "dirty"
                        ? "💩 Dirty"
                        : "💧💩 Both"}
                    </button>
                  )
                )}
              </div>
            )}

            {kind === "sleep" && (
              <p className="helper">
                One tap starts a sleep stint. If Mclaren is
                already sleeping, this tap marks him awake.
              </p>
            )}

            {kind === "pump" && (
              <div className="pump-grid">
                <label>
                  Left (mL)
                  <input
                    inputMode="numeric"
                    type="number"
                    value={left}
                    onChange={(e) =>
                      setLeft(Number(e.target.value))
                    }
                  />
                </label>

                <label>
                  Right (mL)
                  <input
                    inputMode="numeric"
                    type="number"
                    value={right}
                    onChange={(e) =>
                      setRight(Number(e.target.value))
                    }
                  />
                </label>
              </div>
            )}

            <button
              className="save-button"
              onClick={save}
              disabled={
                busy ||
                (kind === "feed" && amount <= 0)
              }
            >
              {busy ? "Logging…" : "LOG NOW"}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
