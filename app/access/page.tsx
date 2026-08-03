import Link from "next/link";
import styles from "./access.module.css";

export default function AccessPage() {
  return <main className={styles.shell}>
    <header><Link className={styles.logo} href="/index.html#top">Ouivio<span>.</span></Link><Link className={styles.login} href="/login">Bereits ein Konto? Anmelden</Link></header>
    <section className={styles.intro}><small>Ouivio Zugang</small><h1>Wie möchtet ihr<br/>Ouivio nutzen?</h1><p>Wählt euren Einstieg. Nach der Anmeldung führt Ouivio automatisch in den passenden Bereich.</p></section>
    <section className={styles.choices} aria-label="Kontoart auswählen">
      <Link className={styles.choice} href="/login?intent=customer"><span className={styles.icon}>♡</span><small>Für Paare</small><h2>Meine Hochzeit planen</h2><p>Anbieter entdecken, Leistungen zusammenstellen und eure Planung an einem Ort organisieren.</p><b>Kundenkonto starten <i>→</i></b></Link>
      <Link className={`${styles.choice} ${styles.partner}`} href="/login?intent=partner"><span className={styles.icon}>✦</span><small>Für Unternehmen · Testbetrieb</small><h2>Leistungen anbieten</h2><p>Erstellt für die Entwicklung euer Partnerkonto und testet Profil, Pakete, Kalender und Buchungen.</p><b>Partnerkonto testen <i>→</i></b></Link>
    </section>
    <p className={styles.note}>Der Partnerzugang ist auf diesem Entwicklungs-Preview vorübergehend zum Testen geöffnet. Vor dem Launch wird er wieder über die Pilotphase freigeschaltet. Bereits vorhandene Konten führen euch nach der Anmeldung automatisch in den passenden Bereich.</p>
    <Link className={styles.demoLink} href="/partner?demo=1"><span aria-hidden="true">◉</span><span><small>Entwicklungsansicht</small><strong>Anbieter-Demo ohne Anmeldung öffnen →</strong></span></Link>
  </main>;
}
