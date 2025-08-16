import { cn } from "@/lib/utils";

export default function KpiCard({label,value,delta,hint,tone}:{label:string;value:string|number;delta?:string;hint?:string;tone?:"ok"|"warn"|"info"}) {
  const ring = tone==="ok"?"ring-brand-ok":tone==="warn"?"ring-brand-warn":tone==="info"?"ring-brand-info":"ring-brand-line/50";
  const toneText = tone === "ok" ? "text-brand-ok" : tone === "warn" ? "text-brand-warn" : tone === "info" ? "text-brand-info" : "text-brand-mute";
  
  return (
    <div className={cn(`rounded-xl2 bg-brand-card border border-brand-line p-4 ring-1`, ring)}>
      <div className="text-sm text-brand-mute">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {delta && <div className={cn("text-xs mt-1", toneText)}>{delta}</div>}
      {hint && <div className="text-xs mt-2 text-brand-mute">{hint}</div>}
    </div>
  );
}
