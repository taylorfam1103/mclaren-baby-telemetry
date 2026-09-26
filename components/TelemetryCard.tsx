import { ReactNode } from "react";

type Props = {
  eyebrow: string;
  value: string;
  sub: string;
  icon: ReactNode;
  accent?: "papaya" | "teal" | "white";
};

export function TelemetryCard({ eyebrow, value, sub, icon, accent = "papaya" }: Props) {
  return (
    <article className={`telemetry-card ${accent}`}>
      <div className="telemetry-topline">
        <span className="eyebrow">{eyebrow}</span>
        <span className="telemetry-icon">{icon}</span>
      </div>
      <strong className="telemetry-value">{value}</strong>
      <span className="telemetry-sub">{sub}</span>
    </article>
  );
}
