"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ensureAccountProfile, ensurePartnerProfile } from "../../lib/account";
import { createPartnerEvent, deletePartnerEvent, fetchPartnerEvents, type PartnerCalendarEvent, type PartnerEventType } from "../../lib/partner-calendar";
import { getSupabaseClient } from "../../lib/supabase";
import styles from "./partner.module.css";

const nav = ["Übersicht", "Kalender", "Anfragen", "Buchungen", "Leistungen", "Profil"] as const;
type View = (typeof nav)[number];
const eventLabels: Record<PartnerEventType, string> = { inquiry: "Anfrage", option: "Option", booking: "Buchung", appointment: "Termin", blocked: "Blockiert" };

export default function PartnerDashboard() {
  const router = useRouter();
  const [view, setView] = useState<View>("Übersicht");
  const [ready, setReady] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [events, setEvents] = useState<PartnerCalendarEvent[]>([]);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [eventType, setEventType] = useState<PartnerEventType>("appointment");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) return router.replace("/login");
        const account = await ensureAccountProfile(data.user);
        if (account.type !== "partner") return router.replace("/dashboard");
        const partner = await ensurePartnerProfile(data.user.id, account.displayName);
        const calendarEvents = await fetchPartnerEvents(partner.id as string);
        if (!active) return;
        setBusinessName(partner.business_name as string);
        setPartnerId(partner.id as string);
        setEvents(calendarEvents);
        setReady(true);
      } catch { if (active) setError("Das Partner-Dashboard konnte nicht geladen werden."); }
    })();
    return () => { active = false; };
  }, [router]);

  const days = useMemo(() => calendarDays(month), [month]);
  const selectedEvents = events.filter((event) => dateKey(new Date(event.startsAt)) === selectedDay);
  const upcoming = events.filter((event) => new Date(event.endsAt) >= new Date()).slice(0, 4);
  const booked = events.filter((event) => event.type === "booking" && event.status !== "cancelled").length;
  const inquiries = events.filter((event) => event.type === "inquiry" && event.status !== "cancelled").length;

  const addEvent = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!partnerId || !title || !startsAt || !endsAt || saving) return;
    setSaving(true); setError("");
    try {
      const created = await createPartnerEvent(partnerId, { title: title.trim(), startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), location: location.trim(), notes: "", type: eventType });
      setEvents((current) => [...current, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setSelectedDay(dateKey(new Date(created.startsAt))); setTitle(""); setStartsAt(""); setEndsAt(""); setLocation("");
    } catch { setError("Der Termin konnte nicht gespeichert werden."); } finally { setSaving(false); }
  };

  const signOut = async () => { await getSupabaseClient().auth.signOut(); router.replace("/login"); };
  if (!ready) return <main className={styles.loading}><b>Ouivio.</b><p>{error || "Partnerbereich wird geöffnet …"}</p></main>;

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logo}>Ouivio<span>.</span></Link>
      <span className={styles.partnerBadge}>Partner</span>
      <nav>{nav.map((item) => <button className={view === item ? styles.active : ""} key={item} onClick={() => setView(item)}><i>{icon(item)}</i><span>{item}</span></button>)}</nav>
      <div className={styles.account}><b>{businessName.slice(0, 2).toUpperCase()}</b><span><strong>{businessName}</strong><small>Partnerkonto</small></span></div>
    </aside>
    <section className={styles.content}>
      <header className={styles.topbar}><div><small>Ouivio Partner</small><strong>{view}</strong></div><button onClick={() => setView("Kalender")}>+ Neuer Termin</button><button className={styles.logout} onClick={signOut}>Abmelden</button></header>
      {(view === "Übersicht" || view === "Kalender") && <>
        {view === "Übersicht" && <><section className={styles.welcome}><div><span>Guten Tag, {businessName}</span><h1>Heute im Blick.<br/>Jeden Termin im Griff.</h1><p>Eure Anfragen, Buchungen und Verfügbarkeiten – zentral in Ouivio geplant.</p></div><div className={styles.syncState}><i>✓</i><span><strong>Kalender aktuell</strong><small>Ouivio ist eure zentrale Planung</small></span></div></section><section className={styles.stats}><article><small>Neue Anfragen</small><strong>{inquiries}</strong><span>Offene Entscheidungen</span></article><article><small>Bestätigte Buchungen</small><strong>{booked}</strong><span>Im Ouivio-Kalender</span></article><article><small>Auslastung</small><strong>{events.length ? Math.min(98, Math.round(booked / Math.max(events.length, 1) * 100)) : 0}%</strong><span>Auf Basis eurer Termine</span></article></section></>}
        <section className={styles.calendarLayout}>
          <article className={styles.calendarCard}>
            <div className={styles.calendarHead}><div><small>Verfügbarkeit & Buchungen</small><h2>{month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</h2></div><div><button aria-label="Vorheriger Monat" onClick={() => setMonth(addMonths(month, -1))}>‹</button><button onClick={() => setMonth(startOfMonth(new Date()))}>Heute</button><button aria-label="Nächster Monat" onClick={() => setMonth(addMonths(month, 1))}>›</button></div></div>
            <div className={styles.weekdays}>{["Mo","Di","Mi","Do","Fr","Sa","So"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className={styles.monthGrid}>{days.map((day) => { const key = dateKey(day); const dayEvents = events.filter((event) => dateKey(new Date(event.startsAt)) === key); return <button aria-pressed={selectedDay === key} className={day.getMonth() !== month.getMonth() ? styles.outside : ""} key={key} onClick={() => setSelectedDay(key)}><span>{day.getDate()}</span><div>{dayEvents.slice(0,3).map((event) => <i className={styles[event.type]} key={event.id} title={event.title}/>)}</div></button>; })}</div>
            <div className={styles.legend}>{(["inquiry","option","booking","appointment","blocked"] as PartnerEventType[]).map((type) => <span key={type}><i className={styles[type]}/>{eventLabels[type]}</span>)}</div>
          </article>
          <aside className={styles.agenda}><div><small>{new Date(`${selectedDay}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long" })}</small><h2>{new Date(`${selectedDay}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}</h2></div>{selectedEvents.length ? selectedEvents.map((event) => <article key={event.id}><i className={styles[event.type]}/><div><small>{time(event.startsAt)}–{time(event.endsAt)} · {eventLabels[event.type]}</small><strong>{event.title}</strong><span>{event.location || "Ohne Ortsangabe"}</span></div><button aria-label={`${event.title} löschen`} onClick={() => void deletePartnerEvent(event.id).then(() => setEvents((current) => current.filter((item) => item.id !== event.id)))}>×</button></article>) : <p>Noch keine Termine an diesem Tag.</p>}</aside>
        </section>
        <section className={styles.bottomGrid}><form className={styles.eventForm} onSubmit={addEvent}><div><small>Ouivio Kalender</small><h2>Termin eintragen</h2></div><label>Titel<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Besichtigung, Hochzeit, Sperrzeit …"/></label><div><label>Beginn<input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required/></label><label>Ende<input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required/></label></div><div><label>Art<select value={eventType} onChange={(e) => setEventType(e.target.value as PartnerEventType)}>{Object.entries(eventLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Ort<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional"/></label></div>{error && <p role="alert">{error}</p>}<button disabled={saving}>{saving ? "Wird gespeichert …" : "Termin speichern"}</button></form><CalendarConnections /></section>
      </>}
      {!(["Übersicht", "Kalender"] as View[]).includes(view) && <section className={styles.placeholder}><small>Partner Workspace</small><h1>{view}</h1><p>Dieser Bereich wird als Nächstes mit den Kalenderdaten und euren Ouivio-Buchungen verbunden.</p><button onClick={() => setView("Kalender")}>Zum Kalender</button></section>}
    </section>
  </main>;
}

function CalendarConnections() { const [notice,setNotice] = useState(""); const providers = [{name:"Google Calendar",mark:"G",detail:"Zwei-Wege-Synchronisation"},{name:"Outlook / Microsoft 365",mark:"M",detail:"Microsoft Graph Kalender"},{name:"Apple Calendar",mark:"A",detail:"iCalendar / CalDAV"}]; return <article className={styles.connections}><div><small>Schnittstellen</small><h2>Kalender verbinden</h2><p>Belegte Zeiten werden nach der Einrichtung automatisch zwischen Ouivio und euren Kalendern abgeglichen.</p></div>{providers.map((provider) => <button key={provider.name} onClick={() => setNotice(`${provider.name}: Die Oberfläche ist bereit. Für die Live-Verbindung werden im nächsten Schritt die Anbieter-Zugangsdaten eingerichtet.`)}><b>{provider.mark}</b><span><strong>{provider.name}</strong><small>{provider.detail}</small></span><i>Verbinden →</i></button>)}{notice && <p className={styles.notice}>{notice}</p>}<div className={styles.security}>🔒 Verbindungen werden serverseitig verschlüsselt gespeichert.</div></article>; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, value: number) { return new Date(date.getFullYear(), date.getMonth() + value, 1); }
function dateKey(date: Date) { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,"0"); const d=String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
function calendarDays(month: Date) { const first=startOfMonth(month); const start=new Date(first); start.setDate(first.getDate()-((first.getDay()+6)%7)); return Array.from({length:42},(_,index)=>{const day=new Date(start);day.setDate(start.getDate()+index);return day;}); }
function time(value: string) { return new Date(value).toLocaleTimeString("de-DE", {hour:"2-digit",minute:"2-digit"}); }
function icon(view: View) { return view === "Übersicht" ? "⌂" : view === "Kalender" ? "□" : view === "Anfragen" ? "↗" : view === "Buchungen" ? "✓" : view === "Leistungen" ? "◇" : "○"; }
