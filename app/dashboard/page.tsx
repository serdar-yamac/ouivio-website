"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const sections = ["Übersicht", "Planung", "Kalender", "Budget", "Anbieter", "Gäste"] as const;
type Section = (typeof sections)[number];

const initialTasks = [
  { title: "Fotograf auswählen", meta: "Empfohlen bis 20. September", done: false },
  { title: "Save-the-Date versenden", meta: "86 Empfänger vorbereitet", done: false },
  { title: "Location bestätigen", meta: "Gut Sonnenhof · Köln", done: true },
  { title: "Menüverkostung terminieren", meta: "Bis 12. Oktober", done: false },
];

const vendors = [
  { icon: "📷", name: "Luma Fotografie", meta: "Fotografie · Köln", match: 96, price: "ab 2.400 €" },
  { icon: "♫", name: "DJ Marcelle", meta: "DJ · Düsseldorf", match: 93, price: "ab 1.350 €" },
  { icon: "✿", name: "Maison Fleur", meta: "Floristik · Bonn", match: 91, price: "ab 1.800 €" },
];

const guests = [
  { name: "Anna Keller", group: "Familie", status: "Zugesagt" },
  { name: "Mehmet Yılmaz", group: "Freunde", status: "Offen" },
  { name: "Laura & Tim", group: "Freunde", status: "Zugesagt" },
  { name: "Julia Sommer", group: "Arbeit", status: "Abgesagt" },
];

function Ring({ value }: { value: number }) {
  return <div className="ring" style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}><span>{value}%</span></div>;
}

export default function Home() {
  const [active, setActive] = useState<Section>("Übersicht");
  const [tasks, setTasks] = useState(initialTasks);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const done = tasks.filter((task) => task.done).length;
  const progress = Math.round((done / tasks.length) * 100);
  const filteredVendors = useMemo(() => vendors.filter((vendor) => `${vendor.name} ${vendor.meta}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const toggleTask = (title: string) => setTasks((current) => current.map((task) => task.title === title ? { ...task, done: !task.done } : task));

  useEffect(() => {
    const savedTasks = window.localStorage.getItem("ouivio.tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch {
        window.localStorage.removeItem("ouivio.tasks");
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem("ouivio.tasks", JSON.stringify(tasks));
  }, [loaded, tasks]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="logo" href="/" aria-label="Zur Ouivio Startseite">Ouivio<span>.</span></Link>
        <nav aria-label="Hauptnavigation">
          {sections.map((item) => <button className={active === item ? "active" : ""} key={item} onClick={() => setActive(item)}><i aria-hidden>{item === "Übersicht" ? "⌂" : item === "Planung" ? "✓" : item === "Kalender" ? "□" : item === "Budget" ? "€" : item === "Anbieter" ? "◇" : "♙"}</i><span>{item}</span></button>)}
        </nav>
        <div className="profile"><span>S&D</span><div><strong>Sarah & Daniel</strong><small>14. August 2027</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><small>Wedding workspace</small><strong>{active}</strong></div>
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen …" /></label>
          <button className="avatar" aria-label="Benachrichtigungen">S&D</button>
        </header>

        {active === "Übersicht" && <>
          <section className="hero">
            <div><p className="eyebrow">Guten Morgen, ihr zwei</p><h1>Eure Hochzeit.<br/>Ein klarer Plan.</h1><p>Alles Wichtige an einem Ort – von der ersten Idee bis zum letzten Tanz.</p><button onClick={() => setActive("Planung")}>Planung fortsetzen <span>→</span></button></div>
            <div className="hero-side"><p>Noch</p><strong>379</strong><span>Tage bis zu eurem Ja</span><div><Ring value={progress}/><p><b>{done} von {tasks.length}</b><small>Meilensteine erledigt</small></p></div></div>
          </section>
          <section className="stats-grid">
            <button className="card stat" onClick={() => setActive("Budget")}><span>Budget</span><strong>13.200 €</strong><small>von 25.000 € eingeplant</small><div className="progress"><i style={{width:"53%"}}/></div></button>
            <button className="card stat" onClick={() => setActive("Gäste")}><span>Gäste</span><strong>86</strong><small>62 Zusagen · 24 offen</small><div className="progress"><i style={{width:"72%"}}/></div></button>
            <button className="card stat" onClick={() => setActive("Anbieter")}><span>Anbieter</span><strong>3 Matches</strong><small>Für euch vorausgewählt</small><div className="faces"><i>📷</i><i>♫</i><i>✿</i></div></button>
          </section>
          <section className="detail-grid">
            <article className="card"><div className="card-head"><div><small>Als Nächstes</small><h2>Eure Aufgaben</h2></div><button onClick={() => setActive("Planung")}>Alle ansehen →</button></div>{tasks.slice(0,3).map((task) => <button className="row task" onClick={() => toggleTask(task.title)} key={task.title}><span className={task.done ? "check done" : "check"}>{task.done ? "✓" : ""}</span><span><strong>{task.title}</strong><small>{task.meta}</small></span></button>)}</article>
            <article className="card"><div className="card-head"><div><small>Ouivio Auswahl</small><h2>Beste Matches</h2></div><button onClick={() => setActive("Anbieter")}>Entdecken →</button></div>{vendors.slice(0,2).map((vendor) => <div className="row vendor" key={vendor.name}><span className="vendor-icon">{vendor.icon}</span><span><strong>{vendor.name}</strong><small>{vendor.meta}</small></span><b>{vendor.match}%</b></div>)}</article>
          </section>
        </>}

        {active === "Planung" && <Page title="Planung" intro="Euer roter Faden bis zum Hochzeitstag. Erledigt Aufgaben gemeinsam und behaltet jeden Meilenstein im Blick."><div className="card task-list">{tasks.map((task) => <button className="row task" onClick={() => toggleTask(task.title)} key={task.title}><span className={task.done ? "check done" : "check"}>{task.done ? "✓" : ""}</span><span><strong>{task.title}</strong><small>{task.meta}</small></span><em>{task.done ? "Erledigt" : "Offen"}</em></button>)}</div></Page>}
        {active === "Kalender" && <Page title="Kalender" intro="Alle wichtigen Termine, Deadlines und Gespräche in einer gemeinsamen Zeitleiste."><div className="timeline card">{[["18 SEP","Gespräch mit Luma Fotografie","11:00 · Video-Call"],["25 SEP","Location-Begehung","15:30 · Gut Sonnenhof"],["12 OKT","Menüverkostung","18:00 · Restaurant Lumière"]].map((item) => <div className="event" key={item[1]}><b>{item[0]}</b><span><strong>{item[1]}</strong><small>{item[2]}</small></span></div>)}</div></Page>}
        {active === "Budget" && <Page title="Budget" intro="Klarheit über jede Ausgabe – geplant, reserviert und bezahlt."><div className="budget-grid"><article className="card budget-total"><small>Gesamtbudget</small><strong>25.000 €</strong><div className="progress"><i style={{width:"53%"}}/></div><p><span>13.200 € geplant</span><span>11.800 € verfügbar</span></p></article><article className="card">{[["Location","7.500 €","30%"],["Fotografie","2.400 €","10%"],["Musik","1.350 €","5%"],["Floristik","1.800 €","7%"]].map((item) => <div className="budget-row" key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong><small>{item[2]}</small></div>)}</article></div></Page>}
        {active === "Anbieter" && <Page title="Anbieter" intro="Handverlesene Profis, passend zu eurem Stil, Termin und Budget."><div className="vendor-grid">{filteredVendors.map((vendor) => <article className="card vendor-card" key={vendor.name}><div className="vendor-visual">{vendor.icon}</div><span className="match">{vendor.match}% Match</span><h2>{vendor.name}</h2><p>{vendor.meta}</p><strong>{vendor.price}</strong><button>Details ansehen →</button></article>)}</div></Page>}
        {active === "Gäste" && <Page title="Gäste" intro="Zusagen, Gruppen und Wünsche eurer Gäste übersichtlich verwalten."><div className="card guest-table"><div className="table-head"><span>Name</span><span>Gruppe</span><span>Status</span></div>{guests.map((guest) => <div className="guest-row" key={guest.name}><strong>{guest.name}</strong><span>{guest.group}</span><em className={guest.status.toLowerCase()}>{guest.status}</em></div>)}</div></Page>}
      </section>
    </main>
  );
}

function Page({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <section className="page"><p className="eyebrow red">Ouivio Workspace</p><h1>{title}</h1><p className="intro">{intro}</p>{children}</section>;
}
