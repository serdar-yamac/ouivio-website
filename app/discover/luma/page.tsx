"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isPartnerDemoAllowed } from "../../../lib/partner-demo";
import styles from "./profile.module.css";

const gallery = [
  { src: "/demo-providers/photography-luma.jpg", alt: "Brautpaar bei einem Spaziergang im Garten", label: "Paarportraits" },
  { src: "/demo-providers/photography-luma-ceremony.jpg", alt: "Fiktive Trauung im Garten", label: "Trauung" },
  { src: "/demo-providers/photography-luma-dinner.jpg", alt: "Festlich gedeckte Hochzeitstafel", label: "Dinner" },
  { src: "/demo-providers/photography-luma-dance.jpg", alt: "Fiktiver Hochzeitstanz mit Gästen", label: "Feier" },
] as const;

const packages = [
  { name: "Standesamt", duration: "4 Stunden", price: "ab 1.290 €", features: ["Mindestens 250 Bilder", "Private Online-Galerie", "Vorschau innerhalb 72 Stunden"] },
  { name: "Reportage", duration: "8 Stunden", price: "ab 2.400 €", featured: true, features: ["Mindestens 500 Bilder", "Kennenlernshooting", "Private Online-Galerie", "Vorschau innerhalb 72 Stunden"] },
  { name: "Ganzer Tag", duration: "12 Stunden", price: "ab 3.250 €", features: ["Mindestens 750 Bilder", "Kennenlernshooting", "Zweitfotograf optional", "Holzbox mit 30 Prints"] },
] as const;

export default function LumaProfile() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookingStep, setBookingStep] = useState<"idle" | "available" | "booking">("idle");
  const [selectedPackage, setSelectedPackage] = useState("Reportage");
  const [weddingDate, setWeddingDate] = useState("2027-06-19");
  const openCart = () => router.push(`/discover/cart?demo=1&package=${encodeURIComponent(selectedPackage)}&date=${weddingDate}`);

  useEffect(() => {
    if (!isPartnerDemoAllowed(window.location)) return router.replace("/login");
    setReady(true);
  }, [router]);

  if (!ready) return <main className={styles.loading}>Fotografenprofil wird geöffnet …</main>;

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/">Ouivio<span>.</span></Link>
      <Link className={styles.back} href="/discover?demo=1">← Alle Anbieter</Link>
      <Link className={styles.cartLink} href={`/discover/cart?demo=1&package=${encodeURIComponent(selectedPackage)}&date=${weddingDate}`}>Warenkorb</Link>
      <button aria-pressed={saved} onClick={() => setSaved(value => !value)}>{saved ? "♥ Gemerkt" : "♡ Merken"}</button>
    </header>

    <section className={styles.intro}>
      <div><p className={styles.eyebrow}>Fotografie · Köln & europaweit</p><h1>Luma<br/>Fotografie</h1><p className={styles.lead}>Echte Nähe, leise Momente und die große Freude dazwischen – als zeitlose, dokumentarische Hochzeitsreportage.</p><div className={styles.tags}><span>Dokumentarisch</span><span>Natürlich</span><span>Editorial</span><span>Warm</span></div></div>
      <div className={styles.heroImage}><Image src="/demo-providers/photography-luma.jpg" alt="Portfolioaufnahme von Luma Fotografie" fill priority sizes="(max-width: 800px) 100vw, 52vw"/></div>
    </section>

    <section className={styles.quickFacts} aria-label="Profilübersicht">
      <div><strong>4,9</strong><span>38 verifizierte Bewertungen</span></div><div><strong>ab 2.400 €</strong><span>für 8 Stunden Reportage</span></div><div><strong>72 Std.</strong><span>bis zur ersten Vorschau</span></div><div><strong>4–6 Wochen</strong><span>bis zur fertigen Galerie</span></div>
    </section>

    <section className={styles.portfolio}>
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>Ausgewählte Arbeiten</p><h2>Ein Hochzeitstag.<br/>So, wie er sich anfühlt.</h2><p>Eine zusammenhängende Auswahl zeigt mehr als einzelne Highlights: Licht, Nähe, Bewegung und die Geschichte des ganzen Tages.</p></div>
      <div className={styles.gallery}>{gallery.map((image, index) => <figure key={image.src} className={index === 0 ? styles.galleryLead : undefined}><div><Image src={image.src} alt={image.alt} fill sizes={index === 0 ? "(max-width: 800px) 100vw, 62vw" : "(max-width: 800px) 100vw, 31vw"}/></div><figcaption><span>0{index + 1}</span>{image.label}</figcaption></figure>)}</div>
    </section>

    <section className={styles.story}>
      <div><p className={styles.eyebrow}>Über Luma</p><h2>Beobachten statt inszenieren.</h2></div>
      <div><p>Ich begleite Hochzeiten ruhig und aufmerksam. Dabei gebe ich Orientierung, wenn sie gebraucht wird, und halte mich zurück, wenn echte Momente entstehen.</p><p>Meine Bilder sind warm, klar und unaufgeregt. Farben bleiben natürlich, Hauttöne lebendig und eure Reportage soll sich auch in vielen Jahren noch nach euch anfühlen.</p><dl><div><dt>Erfahrung</dt><dd>Über 90 Hochzeiten</dd></div><div><dt>Sprachen</dt><dd>Deutsch · Englisch</dd></div><div><dt>Reisegebiet</dt><dd>Deutschland · Europa</dd></div></dl></div>
    </section>

    <section className={styles.reports}>
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>Vollständige Geschichten</p><h2>Nicht nur die perfekten fünf Minuten.</h2><p>Diese Demo-Reportage zeigt beispielhaft, wie der Stil vom Ja-Wort bis zur Tanzfläche konsistent bleibt.</p></div>
      <div className={styles.reportStrip}>{gallery.slice(1).map(image => <div key={image.src}><Image src={image.src} alt={image.alt} fill sizes="(max-width: 800px) 100vw, 33vw"/></div>)}</div>
    </section>

    <section className={styles.packages}>
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>Pakete</p><h2>Transparent und vergleichbar.</h2><p>Alle Pakete enthalten persönliche Vorbereitung, professionell bearbeitete Bilder in hoher Auflösung und eine private Online-Galerie.</p></div>
      <div className={styles.packageGrid}>{packages.map(item => <article key={item.name} className={"featured" in item ? styles.featured : undefined}>{"featured" in item && <small>Am häufigsten gewählt</small>}<h3>{item.name}</h3><p>{item.duration}</p><strong>{item.price}</strong><ul>{item.features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul><button onClick={() => { setSelectedPackage(item.name); setBookingStep("available"); }}>Paket wählen & prüfen</button></article>)}</div>
    </section>

    <section className={styles.reviews}>
      <div><p className={styles.eyebrow}>Verifizierte Bewertung</p><blockquote>„Wir haben uns auf jedem Bild wiedererkannt. Luma war den ganzen Tag präsent, ohne dass wir die Kamera bemerkt haben.“</blockquote><p>Anna & Jonas · Sommerhochzeit 2026</p></div>
      <div className={styles.rating}><strong>4,9</strong><span>★★★★★</span><p>aus 38 Hochzeiten</p></div>
    </section>

    <aside className={styles.inquiry} aria-label="Verfügbarkeit prüfen"><div><span>{bookingStep === "available" ? `${selectedPackage} verfügbar` : "Reportagen ab"}</span><strong>{bookingStep === "available" ? weddingDate.split("-").reverse().join(".") : "2.400 €"}</strong></div><label>Hochzeitstermin<input type="date" value={weddingDate} onChange={(event) => { setWeddingDate(event.target.value); setBookingStep("idle"); }}/></label><button onClick={() => bookingStep === "available" ? openCart() : setBookingStep("available")}>{bookingStep === "available" ? "In den Warenkorb" : "Verfügbarkeit prüfen"}</button><small>Sofortige Prüfung · keine Anfrage</small></aside>
    {bookingStep === "available" && <div className={styles.toast} role="status"><strong>✓ Termin ist verfügbar.</strong> {selectedPackage} kann direkt gebucht werden.<button onClick={openCart}>Zum Warenkorb</button></div>}
  </main>;
}
