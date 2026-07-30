import Link from "next/link";

const principles = [
  {
    number: "01",
    title: "Ein Tag. Ein klarer Plan.",
    copy: "Paare konfigurieren ihre Hochzeit Schritt für Schritt – ohne unübersichtliche Listen, endlose Anfragen oder Planungschaos.",
  },
  {
    number: "02",
    title: "Alles passt zusammen.",
    copy: "Location, Dienstleister, Extras und Budget laufen in einem System zusammen und werden direkt miteinander abgestimmt.",
  },
  {
    number: "03",
    title: "Aus Planung wird Buchung.",
    copy: "Die komplette Auswahl landet transparent im Warenkorb. So wird aus einer Idee eine Hochzeit, die wirklich buchbar ist.",
  },
];

const journey = [
  ["01", "Rahmen festlegen", "Datum, Region, Gästezahl, Stil und Budget bilden die Grundlage."],
  ["02", "Hochzeit konfigurieren", "Ouivio zeigt passende Locations, Anbieter und Extras als zusammenhängendes Konzept."],
  ["03", "Gemeinsam entscheiden", "Das Paar vergleicht, passt an und behält Kosten sowie Aufgaben jederzeit im Blick."],
  ["04", "Gebündelt buchen", "Alle ausgewählten Leistungen werden zentral bestätigt und bezahlt."],
];

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link className="landing-logo" href="/" aria-label="Ouivio Startseite">
          Ouivio<span>.</span>
        </Link>
        <div className="landing-links">
          <a href="#idee">Die Idee</a>
          <a href="#so-funktionierts">So funktioniert&apos;s</a>
          <a href="#ueber-uns">Wer wir sind</a>
        </div>
        <Link className="nav-dashboard" href="/dashboard">
          Dashboard öffnen <span>→</span>
        </Link>
      </nav>

      <header className="landing-hero">
        <div className="hero-copy">
          <p className="landing-kicker">Die neue Art, Hochzeiten zu planen</p>
          <h1>
            Eure Hochzeit.
            <br />
            <em>Einfach gemacht.</em>
          </h1>
          <p className="landing-lead">
            Ouivio verbindet Inspiration, Planung und Buchung in einem einzigen
            Erlebnis. Ihr stellt eure Hochzeit zusammen – klar, schnell und ohne
            Planungsstress.
          </p>
          <div className="landing-actions">
            <Link className="primary-action" href="/dashboard">
              Produkt erleben <span>→</span>
            </Link>
            <a className="secondary-action" href="#idee">
              Unsere Vision
            </a>
          </div>
          <div className="landing-trust">
            <span>Eine zentrale Planung</span>
            <span>Volle Kostenkontrolle</span>
            <span>Passende Anbieter</span>
          </div>
        </div>

        <div className="product-stage" aria-label="Vorschau des Ouivio Dashboards">
          <div className="stage-glow" />
          <div className="mini-app">
            <div className="mini-sidebar">
              <b>Ouivio.</b>
              <i className="selected">⌂</i>
              <i>✓</i>
              <i>□</i>
              <i>€</i>
              <i>◇</i>
            </div>
            <div className="mini-content">
              <div className="mini-top">
                <span>Guten Morgen, ihr zwei</span>
                <i>S&amp;D</i>
              </div>
              <div className="mini-hero">
                <small>EURE HOCHZEIT</small>
                <strong>Ein klarer Plan.</strong>
                <p>Alles Wichtige an einem Ort.</p>
              </div>
              <div className="mini-stats">
                <div><small>Budget</small><b>25.000 €</b></div>
                <div><small>Gäste</small><b>86</b></div>
                <div><small>Fortschritt</small><b>68%</b></div>
              </div>
            </div>
          </div>
          <div className="stage-note">
            <span>Heute erledigt</span>
            <strong>Location bestätigt</strong>
            <small>Der nächste Schritt ist schon vorbereitet.</small>
          </div>
        </div>
      </header>

      <section className="landing-section idea-section" id="idee">
        <div className="section-intro">
          <p className="landing-kicker">Was wir vorhaben</p>
          <h2>Hochzeitsplanung neu gedacht.</h2>
          <p>
            Heute müssen Paare Informationen, Angebote und Entscheidungen an
            vielen Orten zusammensuchen. Ouivio macht daraus einen geführten,
            zusammenhängenden Weg.
          </p>
        </div>
        <div className="principle-grid">
          {principles.map((principle) => (
            <article className="principle-card" key={principle.number}>
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section journey-section" id="so-funktionierts">
        <div className="journey-heading">
          <p className="landing-kicker light">So funktioniert&apos;s</p>
          <h2>Von der ersten Idee bis zum Ja.</h2>
          <p>
            Ein geführter Prozess, der Entscheidungen vereinfacht und trotzdem
            Raum für eine persönliche Hochzeit lässt.
          </p>
        </div>
        <div className="journey-list">
          {journey.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section product-section">
        <div>
          <p className="landing-kicker">Das Produkt</p>
          <h2>Eine Oberfläche für die ganze Hochzeit.</h2>
          <p>
            Im Ouivio-Dashboard kommen Planung, Kalender, Budget, Gäste und
            Anbieter zusammen. Der aktuelle Prototyp zeigt bereits, wie sich
            dieser zentrale Workspace anfühlt.
          </p>
        </div>
        <Link className="product-cta" href="/dashboard">
          <span>Interaktiven Prototyp öffnen</span>
          <b>Dashboard ansehen →</b>
        </Link>
      </section>

      <section className="landing-section about-section" id="ueber-uns">
        <div className="about-label">
          <span>Wer wir sind</span>
          <b>Ouivio</b>
        </div>
        <div className="about-copy">
          <h2>Wir bauen die Plattform, die wir selbst bei Hochzeiten vermissen.</h2>
          <p>
            Ouivio entsteht aus einer einfachen Überzeugung: Eine Hochzeit darf
            komplex sein – ihre Planung sollte es nicht sein. Wir bringen Paare
            und ausgewählte Hochzeitsprofis in einem transparenten digitalen
            Prozess zusammen.
          </p>
          <p>
            Wir starten fokussiert, lernen gemeinsam mit Paaren und Anbietern
            und entwickeln daraus Schritt für Schritt den einfachsten Weg zur
            eigenen Hochzeit.
          </p>
        </div>
      </section>

      <section className="landing-cta">
        <p className="landing-kicker light">Ouivio beginnt jetzt</p>
        <h2>Planifiez. Réservez. Célébrez.</h2>
        <p>Entdeckt den ersten funktionierenden Produktbereich.</p>
        <Link className="white-action" href="/dashboard">
          Dashboard öffnen <span>→</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <Link className="landing-logo" href="/">Ouivio<span>.</span></Link>
        <p>Hochzeiten planen, zusammenstellen und buchen.</p>
        <span>© 2026 Ouivio</span>
      </footer>
    </main>
  );
}
