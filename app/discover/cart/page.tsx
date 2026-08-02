"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { bookingStartForDate, checkPartnerAvailability, isPackageId } from "../../../lib/booking-availability";
import { isFeaturePreviewHost } from "../../../lib/feature-preview";
import { getSupabaseClient } from "../../../lib/supabase";
import styles from "./cart.module.css";

type CartItem = { id: string; category: string; name: string; price: number; currency: string; note: string };
type AvailabilityState = "idle" | "checking" | "available" | "unavailable" | "demo" | "error";

const demoItems: Record<string, CartItem> = {
  sonnenhof: { id: "sonnenhof", category: "Location", name: "Gut Sonnenhof", price: 6900, currency: "EUR", note: "Exklusive Nutzung · bis 140 Gäste" },
  luma: { id: "luma", category: "Fotografie", name: "Luma Fotografie", price: 2400, currency: "EUR", note: "Reportage · 8 Stunden" },
  lumiere: { id: "lumiere", category: "Catering", name: "Lumière Catering", price: 89, currency: "EUR", note: "Menüpreis · pro Person" },
};

const serviceLabels: Record<string, string> = { location: "Location", photography: "Fotografie", catering: "Catering" };

export default function CartDemo() {
  return <Suspense fallback={<main className={styles.loading}>Warenkorb wird geöffnet …</main>}><CartContent /></Suspense>;
}

function CartContent() {
  const router = useRouter();
  const params = useSearchParams();
  const packageIds = useMemo(() => (params.get("packages") || "").split(",").filter(isPackageId), [params]);
  const demoItemIds = useMemo(() => (params.get("items") || "").split(",").filter((id) => id in demoItems), [params]);
  const startDate = params.get("start") || "2027-06-19";
  const endDate = params.get("end") || startDate;
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"cart" | "checkout" | "complete">("cart");
  const [availability, setAvailability] = useState<Record<string, AvailabilityState>>({});
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  useEffect(() => {
    const demoAllowed = isFeaturePreviewHost(window.location) && new URLSearchParams(window.location.search).get("demo") === "1";
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user && !demoAllowed) { router.replace("/login?intent=customer"); return; }

      if (!packageIds.length) {
        setItems(demoItemIds.map((id) => demoItems[id]));
        setReady(true);
        return;
      }

      const { data, error } = await supabase.rpc("search_published_partner_packages", { requested_service_types: null, requested_city: null });
      if (error) { setAvailabilityMessage("Die Anbieterpakete konnten nicht geladen werden."); setReady(true); return; }
      const mapped = (data ?? []).filter((item: { package_id: string }) => packageIds.includes(item.package_id)).map((item: { package_id: string; service_type: string; partner_name: string; package_name: string; price_amount: number; currency: string; duration_minutes: number }) => ({
        id: item.package_id,
        category: serviceLabels[item.service_type] || item.service_type,
        name: `${item.partner_name} · ${item.package_name}`,
        price: Number(item.price_amount),
        currency: item.currency,
        note: `${item.duration_minutes / 60} Stunden · veröffentlichtes Anbieterpaket`,
      }));
      setItems(mapped);
      setReady(true);
    };
    void load();
  }, [demoItemIds, packageIds, router]);

  const hasLivePackages = packageIds.length > 0;
  const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const formattedDate = new Date(`${startDate}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const formattedEndDate = new Date(`${endDate}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  const checkAvailability = async () => {
    if (!hasLivePackages) {
      setAvailability(Object.fromEntries(items.map((item) => [item.id, "demo"] as const)));
      setAvailabilityMessage("Musterangebote sind nicht an einen echten Partnerkalender gebunden. Der folgende Checkout bleibt deshalb ein klar gekennzeichneter Preview.");
      return;
    }
    setAvailability(Object.fromEntries(items.map((item) => [item.id, "checking"] as const)));
    setAvailabilityMessage("");
    try {
      const checks = await Promise.all(items.map(async (item) => [item.id, await checkPartnerAvailability(item.id, startDate)] as const));
      const next = Object.fromEntries(checks.map(([id, isAvailable]) => [id, isAvailable ? "available" : "unavailable"] as const));
      setAvailability(next);
      setAvailabilityMessage(checks.every(([, isAvailable]) => isAvailable)
        ? `Alle ausgewählten Leistungen sind am ${formattedDate} verfügbar.`
        : "Mindestens eine Leistung ist für diesen Termin nicht verfügbar. Bitte passt eure Auswahl oder den Termin an.");
    } catch {
      setAvailability(Object.fromEntries(items.map((item) => [item.id, "error"] as const)));
      setAvailabilityMessage("Die Verfügbarkeit konnte gerade nicht geprüft werden. Bitte versucht es erneut.");
    }
  };

  const checking = Object.values(availability).includes("checking");
  const canContinue = items.length > 0 && items.every((item) => availability[item.id] === (hasLivePackages ? "available" : "demo"));

  if (!ready) return <main className={styles.loading}>Warenkorb wird geöffnet …</main>;
  if (!items.length) return <main className={styles.loading}>Keine buchbaren Leistungen gewählt. <Link href="/discover">Zur Auswahl</Link></main>;

  return <main className={styles.page}>
    <header><Link href="/">Ouivio<span>.</span></Link><Link href="/discover">← Zurück zur Auswahl</Link><small>{hasLivePackages ? "Verfügbarkeit" : "Checkout-Preview"}</small></header>
    <section className={styles.layout}>
      <main>
        <p className={styles.eyebrow}>Direktbuchung</p>
        <h1>{step === "cart" ? "Euer Warenkorb" : step === "checkout" ? "Checkout vorbereiten" : "Checkout gespeichert"}</h1>
        {step === "complete" ? <section className={styles.success}><strong>✓</strong><h2>Checkout-Preview gespeichert.</h2><p>Es wurde weder bezahlt noch reserviert. Nach der endgültigen Live-Prüfung folgt als nächster Schritt die sichere Zahlung.</p><Link href="/discover">Weitere Anbieter entdecken</Link></section> : <>
          <section className={styles.items}>{items.map((item) => <article className={styles.item} key={item.id}><div><p>{item.category} · {item.name}</p><h2>{item.note}</h2><span>{formattedDate}{startDate !== endDate ? ` bis ${formattedEndDate}` : ""}</span>{availability[item.id] && <small>{availability[item.id] === "available" ? "✓ Zum gewünschten Termin verfügbar" : availability[item.id] === "unavailable" ? "Nicht verfügbar" : availability[item.id] === "demo" ? "Musterangebot · keine Live-Prüfung" : "Verfügbarkeit wird geprüft …"}</small>}</div><b>{money.format(item.price)}{item.category === "Catering" && <small> / Person</small>}</b></article>)}</section>
          <section className={styles.info}><h2>{step === "cart" ? "Verfügbarkeit vor dem Checkout" : "Kontaktdaten & Zahlung"}</h2>{step === "cart" ? <><p>{hasLivePackages ? `Ouivio prüft die freigegebenen Ressourcen der Anbieter für ${bookingStartForDate(startDate).slice(0, 10)}. Private Kalenderdetails bleiben dabei geschützt.` : "Die ausgewählten Musterangebote führen durch den Ablauf, ohne eine Verfügbarkeit, Buchung oder Zahlung auszulösen."}</p><button onClick={checkAvailability} disabled={checking}>{checking ? "Verfügbarkeit wird geprüft …" : hasLivePackages ? "Verfügbarkeit prüfen" : "Demo-Verfügbarkeit anzeigen"}</button>{availabilityMessage && <p role="status">{availabilityMessage}</p>}{canContinue && <button onClick={() => setStep("checkout")}>Weiter zum Checkout</button>}</> : <><label>Name<input autoComplete="name" placeholder="Vor- und Nachname" /></label><label>E-Mail-Adresse<input autoComplete="email" placeholder="name@beispiel.de" type="email" /></label><p>Dies ist ein Checkout-Preview: Es wird keine Zahlung ausgelöst und keine Reservierung angelegt. Preise und Verfügbarkeit werden vor einer späteren Buchung serverseitig bestätigt.</p><button onClick={() => setStep("complete")}>Checkout-Preview abschließen</button></>}</section>
        </>}
      </main>
      <aside><small>Zusammenfassung</small><div><span>Leistungen</span><strong>{items.length} ausgewählt</strong></div><div><span>Hochzeitstermin</span><strong>{formattedDate}</strong></div><div><span>Gesamt ab</span><strong>{money.format(total)}{items.some((item) => item.category === "Catering") ? " + Catering pro Person" : ""}</strong></div><p>{hasLivePackages ? "Verfügbarkeit wird in Echtzeit gegen die Partnerressourcen geprüft. Eine Zahlung oder Reservierung entsteht erst im späteren, verbindlichen Buchungsschritt." : "Keine versteckten Gebühren. Dieser Preview-Checkout speichert noch keine Buchung und keine Zahlung."}</p></aside>
    </section>
  </main>;
}
