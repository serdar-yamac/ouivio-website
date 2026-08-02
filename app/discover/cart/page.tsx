"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { isFeaturePreviewHost } from "../../../lib/feature-preview";
import { getSupabaseClient } from "../../../lib/supabase";
import styles from "./cart.module.css";

const checkoutItems = {
  sonnenhof: { category: "Location", name: "Gut Sonnenhof", price: 6900, note: "Exklusive Nutzung · bis 140 Gäste" },
  luma: { category: "Fotografie", name: "Luma Fotografie", price: 2400, note: "Reportage · 8 Stunden" },
  lumiere: { category: "Catering", name: "Lumière Catering", price: 89, note: "Menüpreis · pro Person" },
} as const;

export default function CartDemo() {
  return <Suspense fallback={<main className={styles.loading}>Warenkorb wird geöffnet …</main>}><CartDemoContent /></Suspense>;
}

function CartDemoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout" | "complete">("cart");
  const itemIds = (params.get("items") || "").split(",").filter((id): id is keyof typeof checkoutItems => id in checkoutItems);
  const items = itemIds.map(id => checkoutItems[id]);
  const startDate = params.get("start") || "2027-06-19";
  const endDate = params.get("end") || startDate;
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  const formattedDate = new Date(`${startDate}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const formattedEndDate = new Date(`${endDate}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    const demoAllowed = isFeaturePreviewHost(window.location) && new URLSearchParams(window.location.search).get("demo") === "1";
    void getSupabaseClient().auth.getUser().then(({ data }) => {
      if (!data.user && !demoAllowed) router.replace("/login");
      else setReady(true);
    });
  }, [router]);

  if (!ready) return <main className={styles.loading}>Warenkorb wird geöffnet …</main>;
  if (!items.length) return <main className={styles.loading}>Keine Leistungen gewählt. <Link href="/discover">Zur Auswahl</Link></main>;

  return <main className={styles.page}>
    <header><Link href="/">Ouivio<span>.</span></Link><Link href="/discover">← Zurück zur Auswahl</Link><small>Checkout-Preview</small></header>
    <section className={styles.layout}>
      <main>
        <p className={styles.eyebrow}>Direktbuchung</p>
        <h1>{step === "cart" ? "Euer Warenkorb" : step === "checkout" ? "Checkout vorbereiten" : "Checkout gespeichert"}</h1>
        {step === "complete" ? <section className={styles.success}><strong>✓</strong><h2>Checkout-Preview gespeichert.</h2><p>Es wurde weder bezahlt noch reserviert. Als Nächstes verbinden wir die Mehranbieter-Verfügbarkeitsprüfung und die sichere Zahlung.</p><Link href="/discover">Weitere Anbieter entdecken</Link></section> : <>
          <section className={styles.items}>{items.map(item => <article className={styles.item} key={item.name}><div><p>{item.category} · {item.name}</p><h2>{item.note}</h2><span>{formattedDate}{startDate !== endDate ? ` bis ${formattedEndDate}` : ""}</span></div><b>{money.format(item.price)}{item.category === "Catering" && <small> / Person</small>}</b></article>)}</section>
          <section className={styles.info}><h2>{step === "cart" ? "Vor dem Checkout" : "Kontaktdaten & Zahlung"}</h2>{step === "cart" ? <p>Ihr seid angemeldet. Im nächsten Schritt prüft ihr die Buchungsdaten und bestätigt, dass Ouivio die Verfügbarkeit aller gewählten Leistungen gemeinsam prüfen darf.</p> : <><label>Name<input autoComplete="name" placeholder="Vor- und Nachname" /></label><label>E-Mail-Adresse<input autoComplete="email" placeholder="name@beispiel.de" type="email" /></label><p>Dies ist ein Checkout-Preview: Es wird keine Zahlung ausgelöst und keine Reservierung angelegt. Preise und Verfügbarkeit werden vor einer späteren Buchung serverseitig bestätigt.</p></>}<button onClick={() => setStep(step === "cart" ? "checkout" : "complete")}>{step === "cart" ? "Weiter zum Checkout" : "Checkout-Preview abschließen"}</button></section>
        </>}
      </main>
      <aside><small>Zusammenfassung</small><div><span>Leistungen</span><strong>{items.length} ausgewählt</strong></div><div><span>Hochzeitstermin</span><strong>{formattedDate}</strong></div><div><span>Gesamt ab</span><strong>{money.format(total)}{items.some(item => item.category === "Catering") ? " + Catering pro Person" : ""}</strong></div><p>Keine versteckten Gebühren. Dieser Preview-Checkout speichert noch keine Buchung und keine Zahlung.</p></aside>
    </section>
  </main>;
}
