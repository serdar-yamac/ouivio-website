import Link from "next/link";
import styles from "./access.module.css";

export default function AccessPage() {
  return <main className={styles.shell}>
    <header><Link className={styles.logo} href="/">Ouivio<span>.</span></Link><Link className={styles.login} href="/login">Bereits ein Konto? Anmelden</Link></header>
    <section className={styles.intro}><small>Ouivio Zugang</small><h1>Wie möchtet ihr<br/>Ouivio nutzen?</h1><p>Wählt euren Einstieg. Nach der Anmeldung führt Ouivio automatisch in den passenden Bereich.</p></section>
    <section className={styles.choices} aria-label="Kontoart auswählen">
      <Link className={styles.choice} href="/login?intent=customer"><span className={styles.icon}>♡</span><small>Für Paare</small><h2>Meine Hochzeit planen</h2><p>Anbieter entdecken, Leistungen zusammenstellen und eure Planung an einem Ort organisieren.</p><b>Kundenkonto starten <i>→</i></b></Link>
      <Link className={`${styles.choice} ${styles.partner}`} href="/#partner"><span className={styles.icon}>✦</span><small>Für Unternehmen</small><h2>Leistungen anbieten</h2><p>Erfahrt mehr über die limitierte Pilotphase und bewerbt euch als einer der ersten Anbieter.</p><b>Zur Pilotphase <i>→</i></b></Link>
    </section>
    <p className={styles.note}>Ihr habt bereits ein Konto? Meldet euch einfach mit eurer E-Mail-Adresse an. Ouivio öffnet euren Kunden- oder Partnerbereich automatisch.</p>
  </main>;
}
