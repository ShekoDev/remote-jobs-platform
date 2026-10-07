"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Filters } from "@/lib/filters";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="card relative w-full max-w-md p-5 animate-rise">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-extrabold">{title}</h3><button onClick={onClose} className="btn btn-ghost h-8 w-8 p-0" aria-label="Close"><X size={16} /></button></div>
        {children}
      </div>
    </div>
  );
}

export function SaveSearchDialog({ filters, onClose, onSaved }: { filters: Filters; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/saved-searches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, filters }) });
    setBusy(false); onSaved(); onClose();
  };
  return (
    <Modal title="Save this search" onClose={onClose}>
      <input className="input" placeholder="e.g. Egypt · entry level · data" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus />
      <button className="btn btn-primary mt-3 w-full" disabled={busy || !name.trim()} onClick={submit}>Save search</button>
    </Modal>
  );
}

export function AlertDialog({ filters, onClose }: { filters: Filters; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("New fully remote jobs I can apply for");
  const [freq, setFreq] = useState<"INSTANT" | "DAILY" | "WEEKLY">("DAILY");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const submit = async () => {
    setState("busy");
    const r = await fetch("/api/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, name, filters, frequency: freq }) });
    setState(r.ok ? "done" : "error");
  };
  return (
    <Modal title="🔔 Create job alert" onClose={onClose}>
      {state === "done" ? (
        <div className="text-sm">Alert created. New jobs matching your current filters will be sent to <b>{email}</b> {freq.toLowerCase()}.<button className="btn btn-primary mt-3 w-full" onClick={onClose}>Done</button></div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Uses the filters you have applied right now.</p>
          <input className="input" placeholder="Alert name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="grid grid-cols-3 gap-1.5">{(["INSTANT", "DAILY", "WEEKLY"] as const).map((f) => <button key={f} className="chip justify-center" data-on={freq === f} onClick={() => setFreq(f)}>{f.charAt(0) + f.slice(1).toLowerCase()}</button>)}</div>
          {state === "error" && <p className="text-sm" style={{ color: "var(--bad)" }}>Enter a valid email address to create the alert.</p>}
          <button className="btn btn-primary w-full" disabled={state === "busy" || !email} onClick={submit}>Create alert</button>
        </div>
      )}
    </Modal>
  );
}
