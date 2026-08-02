"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { isPartnerDemoAllowed } from "../../../lib/partner-demo";
import styles from "./cart.module.css";

const packages: Record<string, { price: number; duration: string }> = {
  Standesamt: { price: 1290, duration: "4 Stunden" },
  Reportage: { price: 2400, duration: "8 Stunden" },
  "Ganzer Tag": { price: 3250, duration: "12 Stunden" },
};

export default function CartDemo() { return <Suspense fallback={<main className={styles.loading}>Warenkorb wird geöffnet …</main>}><CartDemoContent /></Suspense>; }

function CartDemoContent() {
  const router = useRouter(); const params = useSearchParams(); const [ready, setReady] = useState(false); const [step, setStep] = useState<"cart"|"checkout"|"reserved">("cart");
  const selected = params.get("package") || "Reportage"; const date = params.get("date") || "2027-06-19";
  const item = useMemo(() => packages[selected] || packages.Reportage, [selected]);
  useEffect(() => { if (!isPartnerDemoAllowed(window.location)) return router.replace("/login"); setReady(true); }, [router]);
  if (!ready) return <main className={styles.loading}>Warenkorb wird geöffnet …</main>;
  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("de-DE", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
  return <main className={styles.page}><header><Link href="/">Ouivio<span>.</span></Link><Link href="/discover/luma?demo=1">← Zurück zu Luma</Link><small>Kundendemo</small></header><section className={styles.layout}><main><p className={styles.eyebrow}>Direktbuchung</p><h1>{step === "cart" ? "Euer Warenkorb" : step === "checkout" ? "Buchung vorbereiten" : "Termin reserviert"}</h1>{step === "reserved" ? <section className={styles.success}><strong>✓</strong><h2>15 Minuten für euch reserviert.</h2><p>Der Termin wurde im Partnerkalender vorgemerkt. In der echten Version folgt hier die sichere Zahlung; ohne Zahlungsbestätigung läuft die Reservierung automatisch ab.</p><Link href="/discover?demo=1">Weitere Anbieter entdecken</Link></section> : <><article className={styles.item}><div><p>Fotografie · Luma Fotografie</p><h2>{selected}</h2><span>{item.duration} · {formattedDate}</span></div><b>{new Intl.NumberFormat("de-DE", { style:"currency", currency:"EUR" }).format(item.price)}</b></article><section className={styles.info}><h2>{step === "cart" ? "Vor dem Checkout" : "Kontaktdaten & Zahlung"}</h2>{step === "cart" ? <p>Der Termin ist aktuell verfügbar. Beim Fortfahren reserviert Ouivio ihn für 15 Minuten, damit keine parallele Buchung entstehen kann.</p> : <><label>Name<input placeholder="Vor- und Nachname" /></label><label>E-Mail-Adresse<input placeholder="name@beispiel.de" type="email" /></label><p>Der Zahlungsanbieter wird erst vor dem Launch eingebunden. Diese Demo löst keine Zahlung und keine echte Buchung aus.</p></>}<button onClick={() => setStep(step === "cart" ? "checkout" : "reserved")}>{step === "cart" ? "Weiter zum Checkout" : "15 Minuten reservieren"}</button></section></>}</main><aside><small>Zusammenfassung</small><div><span>Leistung</span><strong>{selected}</strong></div><div><span>Hochzeitstermin</span><strong>{formattedDate}</strong></div><div><span>Gesamt</span><strong>{new Intl.NumberFormat("de-DE", { style:"currency", currency:"EUR" }).format(item.price)}</strong></div><p>Keine versteckten Gebühren. Endpreis und Verfügbarkeit werden vor der tatsächlichen Buchung serverseitig bestätigt.</p></aside></section></main>;
}
