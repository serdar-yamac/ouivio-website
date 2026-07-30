const tasks = [
  { title: "Fotograf auswählen", meta: "Empfohlen bis 20. September", done: false },
  { title: "Save-the-Date versenden", meta: "86 Empfänger vorbereitet", done: false },
  { title: "Location bestätigen", meta: "Gut Sonnenhof · Köln", done: true },
];

const vendors = [
  { icon: "📷", name: "Luma Fotografie", meta: "Fotografie · Köln", match: 96 },
  { icon: "♫", name: "DJ Marcelle", meta: "DJ · Düsseldorf", match: 93 },
  { icon: "✿", name: "Maison Fleur", meta: "Floristik · Bonn", match: 91 },
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="logo">Ouivio</div>
        <nav>
          {['Übersicht','Planung','Kalender','Budget','Anbieter','Gäste','Nachrichten'].map((item, index) => (
            <button className={index === 0 ? 'active' : ''} key={item}>{item}</button>
          ))}
        </nav>
        <div className="profile"><span>S&D</span><div><strong>Sarah & Daniel</strong><small>14. August 2027</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><input aria-label="Suche" placeholder="Aufgaben, Anbieter oder Nachrichten suchen …"/><button>🔔</button></header>
        <section className="hero">
          <div><p className="eyebrow">Eure Hochzeit</p><h1>Hallo Sarah & Daniel.</h1><p>Alles läuft nach Plan. Als Nächstes solltet ihr euren Fotografen auswählen und die Gästeliste finalisieren.</p></div>
          <div className="countdown"><div><b>380</b><span>Tage</span></div><div><b>11</b><span>Monate</span></div><div><b>54%</b><span>geplant</span></div></div>
        </section>

        <section className="stats-grid">
          <article className="card"><div className="card-head"><h2>Planungsfortschritt</h2><a href="#tasks">Öffnen</a></div><strong className="metric">54 %</strong><div className="progress"><i style={{width:'54%'}} /></div><footer><span>13 erledigt</span><span>11 offen</span></footer></article>
          <article className="card"><div className="card-head"><h2>Budget</h2><a href="#budget">Details</a></div><strong className="metric">13.200 €</strong><div className="progress"><i style={{width:'53%'}} /></div><footer><span>von 25.000 €</span><span>11.800 € frei</span></footer></article>
          <article className="card"><div className="card-head"><h2>Gäste</h2><a href="#guests">Verwalten</a></div><strong className="metric">86</strong><div className="progress"><i style={{width:'72%'}} /></div><footer><span>62 zugesagt</span><span>24 offen</span></footer></article>
        </section>

        <section className="detail-grid">
          <article className="card" id="tasks"><div className="card-head"><h2>Nächste Aufgaben</h2><a href="#">Alle anzeigen</a></div>{tasks.map(task => <div className="row" key={task.title}><span className={task.done ? 'check done' : 'check'}>{task.done ? '✓' : ''}</span><div><strong>{task.title}</strong><small>{task.meta}</small></div>{!task.done && task.title.includes('Fotograf') && <em>Wichtig</em>}</div>)}</article>
          <article className="card"><div className="card-head"><h2>Passend für euch</h2><a href="#">Entdecken</a></div>{vendors.map(vendor => <div className="row vendor" key={vendor.name}><span className="vendor-icon">{vendor.icon}</span><div><strong>{vendor.name}</strong><small>{vendor.meta}</small></div><b>{vendor.match}%</b></div>)}</article>
        </section>
      </section>
    </main>
  );
}
