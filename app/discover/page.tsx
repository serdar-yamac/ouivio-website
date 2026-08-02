"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isPartnerDemoAllowed } from "../../lib/partner-demo";
import styles from "./discover.module.css";

const providers = [
  { id:"sonnenhof", category:"Location", name:"Gut Sonnenhof", city:"Köln · 34 km", image:"/demo-providers/location-sonnenhof.jpg", price:"ab 6.900 €", match:"97%", summary:"Historischer Gutshof für entspannte Feiern im Grünen.", facts:["40–140 Gäste","Freie Trauung im Garten","Exklusive Nutzung bis 02:00 Uhr"], offerings:["Innenhof & Dinnerbereich","Festscheune","Getting-ready-Suite"] },
  { id:"luma", category:"Fotografie", name:"Luma Fotografie", city:"Köln · 12 km", image:"/demo-providers/photography-luma.jpg", price:"ab 2.400 €", match:"96%", summary:"Natürliche Hochzeitsreportagen mit dokumentarischer und zeitloser Bildsprache.", facts:["8–12 Stunden Begleitung","Vorschau innerhalb von 72 Stunden","Online-Galerie in 4–6 Wochen"], offerings:["Standesamt · 4 Stunden · ab 1.290 €","Reportage · 8 Stunden · ab 2.400 €","Ganztagsreportage · 12 Stunden · ab 3.250 €"] },
  { id:"lumiere", category:"Catering", name:"Lumière Catering", city:"Düsseldorf · 18 km", image:"/demo-providers/catering-menu.jpg", price:"ab 89 € / Person", match:"94%", summary:"Saisonale Hochzeitsmenüs mit moderner, natürlicher Handschrift.", facts:["30–220 Gäste","Vegetarisch & vegan","Verkostung vor Buchung"], offerings:["Geröstete Marktgemüse · Kräutercreme","Geschmorte Rinderbacke · Sellerie · Jus","Zitronentarte · Holunder · Beeren"] },
] as const;

export default function DiscoverDemo() {
  const router=useRouter(); const [ready,setReady]=useState(false); const [selected,setSelected]=useState<(typeof providers)[number]|null>(null);
  useEffect(()=>{ if(!isPartnerDemoAllowed(window.location)) return router.replace('/login'); setReady(true); },[router]);
  if(!ready) return <main className={styles.loading}>Ouivio Kundendemo wird geöffnet …</main>;
  return <main className={styles.shell}>
    <header><Link href="/">Ouivio<span>.</span></Link><div><small>Kundendemo</small><strong>Anbieter entdecken</strong></div><Link className={styles.partnerLink} href="/partner?demo=1">Partneransicht</Link></header>
    <section className={styles.hero}><small>Ouivio Auswahl</small><h1>Anbieter, die zu<br/>eurer Hochzeit passen.</h1><p>Vergleicht Stil, Leistungen, Kapazität und Preis – auf Basis derselben Daten, die Anbieter in ihrem Partnerbereich pflegen.</p></section>
    <nav className={styles.filters} aria-label="Anbieter filtern"><button>Alle</button><button>Locations</button><button>Fotografie</button><button>Catering</button></nav>
    <section className={styles.grid}>{providers.map(provider=><article key={provider.id}><button className={styles.card} onClick={()=>setSelected(provider)}><div className={styles.image}><Image alt={`${provider.name} – ${provider.category}`} fill sizes="(max-width: 760px) 100vw, 50vw" src={provider.image}/><b>{provider.match} Match</b></div><div className={styles.cardBody}><small>{provider.category} · {provider.city}</small><h2>{provider.name}</h2><p>{provider.summary}</p><div><strong>{provider.price}</strong><span>Profil ansehen →</span></div></div></button></article>)}</section>
    {selected&&<section className={styles.detail} aria-label={`${selected.name} Profil`}><button className={styles.close} onClick={()=>setSelected(null)}>Schließen ×</button><div className={styles.detailImage}><Image alt={`${selected.name} Titelbild`} fill sizes="50vw" src={selected.image}/></div><div className={styles.detailBody}><small>{selected.category} · {selected.match} Match</small><h2>{selected.name}</h2><p>{selected.summary}</p><h3>{selected.category==='Catering'?'Beispielgerichte':selected.category==='Fotografie'?'Pakete & Leistungen':'Bereiche & Möglichkeiten'}</h3><ul>{selected.offerings.map(item=><li key={item}>{item}</li>)}</ul><h3>Auf einen Blick</h3><ul>{selected.facts.map(item=><li key={item}>{item}</li>)}</ul><button className={styles.request}>Verfügbarkeit anfragen</button><em>Demo – noch keine echte Anfrage</em></div></section>}
  </main>;
}
