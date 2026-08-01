"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBudgetItem, deleteBudgetItem, fetchBudget, saveTotalBudget, updateBudgetItem, type BudgetItem, type BudgetStatus } from "../../lib/budget";
import { createGuest, deleteGuest, fetchGuests, updateGuest, type Guest, type RsvpStatus } from "../../lib/guests";
import { getSupabaseClient } from "../../lib/supabase";
import { createTask, deleteTask, fetchTasks, updateTask, type Task } from "../../lib/tasks";
import { ensureWeddingWorkspace } from "../../lib/workspace";

const sections = ["Übersicht", "Planung", "Kalender", "Budget", "Anbieter", "Gäste"] as const;
type Section = (typeof sections)[number];

const vendors = [
  { icon: "📷", name: "Luma Fotografie", meta: "Fotografie · Köln", match: 96, price: "ab 2.400 €" },
  { icon: "♫", name: "DJ Marcelle", meta: "DJ · Düsseldorf", match: 93, price: "ab 1.350 €" },
  { icon: "✿", name: "Maison Fleur", meta: "Floristik · Bonn", match: 91, price: "ab 1.800 €" },
];

const publicAppUrl = "https://ouivio-website-git-feat-ouivio-core-foundation-ouivio.vercel.app";

function Ring({ value }: { value: number }) {
  return <div className="ring" style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}><span>{value}%</span></div>;
}

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState<Section>("Übersicht");
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weddingId, setWeddingId] = useState("");
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [query, setQuery] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskMeta, setTaskMeta] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalBudgetInput, setTotalBudgetInput] = useState("");
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [budgetTitle, setBudgetTitle] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetPlanned, setBudgetPlanned] = useState("");
  const [budgetPaid, setBudgetPaid] = useState("");
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus>("planned");
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestGroup, setGuestGroup] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestDietaryNotes, setGuestDietaryNotes] = useState("");
  const [guestStatus, setGuestStatus] = useState<RsvpStatus>("open");
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const done = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const plannedBudget = budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const paidBudget = budgetItems.reduce((sum, item) => sum + item.paidAmount, 0);
  const availableBudget = Math.max(totalBudget - plannedBudget, 0);
  const budgetProgress = totalBudget ? Math.min(Math.round((plannedBudget / totalBudget) * 100), 100) : 0;
  const acceptedGuests = guests.filter((guest) => guest.status === "accepted").length;
  const openGuests = guests.filter((guest) => guest.status === "open").length;
  const guestProgress = guests.length ? Math.round((acceptedGuests / guests.length) * 100) : 0;
  const filteredVendors = useMemo(() => vendors.filter((vendor) => `${vendor.name} ${vendor.meta}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const toggleTask = async (id: string) => {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask || taskSaving) return;
    const nextTask = { ...currentTask, done: !currentTask.done };
    setTaskError("");
    setTaskSaving(true);
    setTasks((current) => current.map((task) => task.id === id ? nextTask : task));
    try {
      const savedTask = await updateTask(nextTask);
      setTasks((current) => current.map((task) => task.id === id ? savedTask : task));
    } catch {
      setTasks((current) => current.map((task) => task.id === id ? currentTask : task));
      setTaskError("Die Aufgabe konnte nicht synchronisiert werden. Bitte versucht es erneut.");
    } finally {
      setTaskSaving(false);
    }
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskMeta("");
    setTaskDueDate("");
    setEditingTaskId(null);
  };

  const submitTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title || !weddingId || taskSaving) return;
    setTaskError("");
    setTaskSaving(true);
    try {
      if (editingTaskId) {
        const currentTask = tasks.find((task) => task.id === editingTaskId);
        if (!currentTask) return;
        const savedTask = await updateTask({ ...currentTask, title, meta: taskMeta.trim(), dueDate: taskDueDate || null });
        setTasks((current) => current.map((task) => task.id === editingTaskId ? savedTask : task));
      } else {
        const savedTask = await createTask(weddingId, { title, meta: taskMeta.trim(), dueDate: taskDueDate || null });
        setTasks((current) => [...current, savedTask]);
      }
      resetTaskForm();
    } catch {
      setTaskError("Die Aufgabe konnte nicht gespeichert werden. Bitte versucht es erneut.");
    } finally {
      setTaskSaving(false);
    }
  };

  const editTask = (task: Task) => {
    setTaskTitle(task.title);
    setTaskMeta(task.meta);
    setTaskDueDate(task.dueDate ?? "");
    setEditingTaskId(task.id);
  };

  const removeTask = async (id: string) => {
    if (taskSaving) return;
    const previousTasks = tasks;
    setTaskError("");
    setTaskSaving(true);
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingTaskId === id) resetTaskForm();
    try {
      await deleteTask(id);
    } catch {
      setTasks(previousTasks);
      setTaskError("Die Aufgabe konnte nicht gelöscht werden. Bitte versucht es erneut.");
    } finally {
      setTaskSaving(false);
    }
  };

  const resetBudgetForm = () => {
    setBudgetTitle("");
    setBudgetCategory("");
    setBudgetPlanned("");
    setBudgetPaid("");
    setBudgetStatus("planned");
    setEditingBudgetId(null);
  };

  const submitTotalBudget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(totalBudgetInput);
    if (!weddingId || budgetSaving || !Number.isFinite(value) || value < 0) return;
    setBudgetError("");
    setBudgetSaving(true);
    try {
      const savedBudget = await saveTotalBudget(weddingId, value);
      setTotalBudget(savedBudget);
      setTotalBudgetInput(String(savedBudget));
    } catch {
      setBudgetError("Das Gesamtbudget konnte nicht gespeichert werden.");
    } finally {
      setBudgetSaving(false);
    }
  };

  const submitBudgetItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = budgetTitle.trim();
    const category = budgetCategory.trim();
    const plannedAmount = Number(budgetPlanned);
    const paidAmount = Number(budgetPaid || 0);
    if (!weddingId || budgetSaving || !title || !category || !Number.isFinite(plannedAmount) || !Number.isFinite(paidAmount) || plannedAmount < 0 || paidAmount < 0) return;
    setBudgetError("");
    setBudgetSaving(true);
    try {
      if (editingBudgetId) {
        const currentItem = budgetItems.find((item) => item.id === editingBudgetId);
        if (!currentItem) return;
        const savedItem = await updateBudgetItem({ ...currentItem, title, category, plannedAmount, paidAmount, status: budgetStatus });
        setBudgetItems((current) => current.map((item) => item.id === editingBudgetId ? savedItem : item));
      } else {
        const savedItem = await createBudgetItem(weddingId, { title, category, plannedAmount, paidAmount, status: budgetStatus });
        setBudgetItems((current) => [...current, savedItem]);
      }
      resetBudgetForm();
    } catch {
      setBudgetError("Der Budgetposten konnte nicht gespeichert werden.");
    } finally {
      setBudgetSaving(false);
    }
  };

  const editBudgetItem = (item: BudgetItem) => {
    setBudgetTitle(item.title);
    setBudgetCategory(item.category);
    setBudgetPlanned(String(item.plannedAmount));
    setBudgetPaid(String(item.paidAmount));
    setBudgetStatus(item.status);
    setEditingBudgetId(item.id);
  };

  const removeBudgetItem = async (id: string) => {
    if (budgetSaving) return;
    const previousItems = budgetItems;
    setBudgetError("");
    setBudgetSaving(true);
    setBudgetItems((current) => current.filter((item) => item.id !== id));
    if (editingBudgetId === id) resetBudgetForm();
    try {
      await deleteBudgetItem(id);
    } catch {
      setBudgetItems(previousItems);
      setBudgetError("Der Budgetposten konnte nicht gelöscht werden.");
    } finally {
      setBudgetSaving(false);
    }
  };

  const resetGuestForm = () => {
    setGuestName("");
    setGuestGroup("");
    setGuestEmail("");
    setGuestDietaryNotes("");
    setGuestStatus("open");
    setEditingGuestId(null);
  };

  const submitGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = guestName.trim();
    if (!weddingId || guestSaving || !name) return;
    setGuestError("");
    setGuestSaving(true);
    try {
      if (editingGuestId) {
        const currentGuest = guests.find((guest) => guest.id === editingGuestId);
        if (!currentGuest) return;
        const savedGuest = await updateGuest({ ...currentGuest, name, group: guestGroup.trim(), email: guestEmail.trim(), dietaryNotes: guestDietaryNotes.trim(), status: guestStatus });
        setGuests((current) => current.map((guest) => guest.id === editingGuestId ? savedGuest : guest));
      } else {
        const savedGuest = await createGuest(weddingId, { name, group: guestGroup.trim(), email: guestEmail.trim(), dietaryNotes: guestDietaryNotes.trim() });
        setGuests((current) => [...current, savedGuest]);
      }
      resetGuestForm();
    } catch {
      setGuestError("Der Gast konnte nicht gespeichert werden.");
    } finally {
      setGuestSaving(false);
    }
  };

  const editGuest = (guest: Guest) => {
    setGuestName(guest.name);
    setGuestGroup(guest.group);
    setGuestEmail(guest.email);
    setGuestDietaryNotes(guest.dietaryNotes);
    setGuestStatus(guest.status);
    setEditingGuestId(guest.id);
  };

  const removeGuest = async (id: string) => {
    if (guestSaving) return;
    const previousGuests = guests;
    setGuestError("");
    setGuestSaving(true);
    setGuests((current) => current.filter((guest) => guest.id !== id));
    if (editingGuestId === id) resetGuestForm();
    try {
      await deleteGuest(id);
    } catch {
      setGuests(previousGuests);
      setGuestError("Der Gast konnte nicht gelöscht werden.");
    } finally {
      setGuestSaving(false);
    }
  };

  const copyInvitationLink = async (guest: Guest) => {
    try {
      await navigator.clipboard.writeText(invitationUrl(guest.inviteToken));
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(null), 2500);
    } catch {
      setGuestError("Der Link konnte nicht kopiert werden.");
    }
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    let activeSubscription = true;

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!activeSubscription) return;
        if (!data.user) {
          router.replace("/login");
          return;
        }
        const workspaceId = await ensureWeddingWorkspace(data.user);
        const [cloudTasks, cloudBudget, cloudGuests] = await Promise.all([fetchTasks(workspaceId), fetchBudget(workspaceId), fetchGuests(workspaceId)]);
        if (!activeSubscription) return;
        setWeddingId(workspaceId);
        setTasks(cloudTasks);
        setTasksLoading(false);
        setTotalBudget(cloudBudget.totalBudget);
        setTotalBudgetInput(String(cloudBudget.totalBudget));
        setBudgetItems(cloudBudget.items);
        setBudgetLoading(false);
        setGuests(cloudGuests);
        setGuestsLoading(false);
        setUserEmail(data.user.email ?? "Ouivio Konto");
        setAuthReady(true);
      } catch {
        if (activeSubscription) {
          setTasksLoading(false);
          setBudgetLoading(false);
          setGuestsLoading(false);
          setAuthError("Der persönliche Workspace konnte noch nicht geladen werden.");
        }
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      activeSubscription = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!weddingId) return;
    let activeSubscription = true;
    const refreshGuests = async () => {
      try {
        const cloudGuests = await fetchGuests(weddingId);
        if (activeSubscription) setGuests(cloudGuests);
      } catch {
        if (activeSubscription) setGuestError("Neue Rückmeldungen konnten gerade nicht geladen werden.");
      }
    };
    const interval = window.setInterval(() => void refreshGuests(), 10000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshGuests();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      activeSubscription = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [weddingId]);

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
    router.replace("/login");
  };

  if (!authReady) {
    return <main className="auth-loading" aria-live="polite"><span>Ouivio</span><p role={authError ? "alert" : undefined}>{authError || "Euer Workspace wird sicher geöffnet …"}</p>{authError && <button className="secondary-button" onClick={() => window.location.reload()} type="button">Erneut versuchen</button>}</main>;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="logo" href="/" aria-label="Zur Ouivio Startseite">Ouivio<span>.</span></Link>
        <nav aria-label="Hauptnavigation">
          {sections.map((item) => <button className={active === item ? "active" : ""} key={item} onClick={() => setActive(item)}><i aria-hidden>{item === "Übersicht" ? "⌂" : item === "Planung" ? "✓" : item === "Kalender" ? "□" : item === "Budget" ? "€" : item === "Anbieter" ? "◇" : "♙"}</i><span>{item}</span></button>)}
        </nav>
        <div className="profile"><span>{accountInitials(userEmail)}</span><div><strong>{userEmail}</strong><small>Sicher angemeldet</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><small>Wedding workspace</small><strong>{active}</strong></div>
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen …" /></label>
          <button className="logout-button" onClick={signOut} type="button">Abmelden</button>
          <span className="avatar" aria-label="Angemeldetes Konto">{accountInitials(userEmail)}</span>
        </header>

        {active === "Übersicht" && <>
          <section className="hero">
            <div><p className="eyebrow">Guten Morgen, ihr zwei</p><h1>Eure Hochzeit.<br/>Ein klarer Plan.</h1><p>Alles Wichtige an einem Ort – von der ersten Idee bis zum letzten Tanz.</p><button onClick={() => setActive("Planung")}>Planung fortsetzen <span>→</span></button></div>
            <div className="hero-side"><p>Noch</p><strong>379</strong><span>Tage bis zu eurem Ja</span><div><Ring value={progress}/><p><b>{done} von {tasks.length}</b><small>Meilensteine erledigt</small></p></div></div>
          </section>
          <section className="stats-grid">
            <button className="card stat" onClick={() => setActive("Budget")}><span>Budget</span><strong>{formatMoney(plannedBudget)}</strong><small>von {formatMoney(totalBudget)} eingeplant</small><div className="progress"><i style={{width:`${budgetProgress}%`}}/></div></button>
            <button className="card stat" onClick={() => setActive("Gäste")}><span>Gäste</span><strong>{guests.length}</strong><small>{acceptedGuests} Zusagen · {openGuests} offen</small><div className="progress"><i style={{width:`${guestProgress}%`}}/></div></button>
            <button className="card stat" onClick={() => setActive("Anbieter")}><span>Anbieter</span><strong>3 Matches</strong><small>Für euch vorausgewählt</small><div className="faces"><i>📷</i><i>♫</i><i>✿</i></div></button>
          </section>
          <section className="detail-grid">
            <article className="card"><div className="card-head"><div><small>Als Nächstes</small><h2>Eure Aufgaben</h2></div><button onClick={() => setActive("Planung")}>Alle ansehen →</button></div>{tasksLoading ? <p className="empty-state">Aufgaben werden geladen …</p> : tasks.length === 0 ? <p className="empty-state">Noch keine Aufgaben. Beginnt mit eurem ersten Schritt.</p> : tasks.slice(0,3).map((task) => <button className="row task" disabled={taskSaving} onClick={() => void toggleTask(task.id)} key={task.id}><span className={task.done ? "check done" : "check"}>{task.done ? "✓" : ""}</span><span><strong>{task.title}</strong><small>{task.meta || formatDueDate(task.dueDate)}</small></span></button>)}</article>
            <article className="card"><div className="card-head"><div><small>Ouivio Auswahl</small><h2>Beste Matches</h2></div><button onClick={() => setActive("Anbieter")}>Entdecken →</button></div>{vendors.slice(0,2).map((vendor) => <div className="row vendor" key={vendor.name}><span className="vendor-icon">{vendor.icon}</span><span><strong>{vendor.name}</strong><small>{vendor.meta}</small></span><b>{vendor.match}%</b></div>)}</article>
          </section>
        </>}

        {active === "Planung" && <Page title="Planung" intro="Euer roter Faden bis zum Hochzeitstag. Erstellt Aufgaben, setzt Termine und behaltet jeden Meilenstein im Blick.">
          <div className="planning-grid">
            <form className="card task-form" onSubmit={submitTask}>
              <div className="card-head"><div><small>{editingTaskId ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</small><h2>{editingTaskId ? "Details aktualisieren" : "Was steht als Nächstes an?"}</h2></div><span className="storage-badge">Mit Supabase synchronisiert</span></div>
              <label>Titel<input autoComplete="off" maxLength={160} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Zum Beispiel: Einladungen gestalten" required value={taskTitle}/></label>
              <label>Notiz<input autoComplete="off" maxLength={240} onChange={(event) => setTaskMeta(event.target.value)} placeholder="Optionaler Hinweis" value={taskMeta}/></label>
              <label>Fällig am<input onChange={(event) => setTaskDueDate(event.target.value)} type="date" value={taskDueDate}/></label>
              {taskError && <p className="sync-error" role="alert">{taskError}</p>}
              <div className="form-actions"><button className="primary-button" disabled={taskSaving || !weddingId} type="submit">{taskSaving ? "Wird gespeichert …" : editingTaskId ? "Änderungen speichern" : "Aufgabe hinzufügen"}</button>{editingTaskId && <button className="secondary-button" disabled={taskSaving} onClick={resetTaskForm} type="button">Abbrechen</button>}</div>
            </form>
            <div className="card task-list">
              <div className="card-head"><div><small>{done} von {tasks.length} erledigt</small><h2>Eure Aufgaben</h2></div></div>
              {tasksLoading ? <p className="empty-state">Aufgaben werden geladen …</p> : tasks.length === 0 && <p className="empty-state">Noch keine Aufgaben. Legt links euren ersten Schritt an.</p>}
              {tasks.map((task) => <div className="row task-manage" key={task.id}>
                <button aria-label={`${task.title} als ${task.done ? "offen" : "erledigt"} markieren`} className={task.done ? "check done" : "check"} disabled={taskSaving} onClick={() => void toggleTask(task.id)} type="button">{task.done ? "✓" : ""}</button>
                <span><strong>{task.title}</strong><small>{task.meta || formatDueDate(task.dueDate) || "Ohne weitere Details"}</small></span>
                <em>{task.done ? "Erledigt" : "Offen"}</em>
                <div className="task-actions"><button disabled={taskSaving} onClick={() => editTask(task)} type="button">Bearbeiten</button><button className="danger" disabled={taskSaving} onClick={() => void removeTask(task.id)} type="button">Löschen</button></div>
              </div>)}
            </div>
          </div>
        </Page>}
        {active === "Kalender" && <Page title="Kalender" intro="Alle wichtigen Termine, Deadlines und Gespräche in einer gemeinsamen Zeitleiste."><div className="timeline card">{[["18 SEP","Gespräch mit Luma Fotografie","11:00 · Video-Call"],["25 SEP","Location-Begehung","15:30 · Gut Sonnenhof"],["12 OKT","Menüverkostung","18:00 · Restaurant Lumière"]].map((item) => <div className="event" key={item[1]}><b>{item[0]}</b><span><strong>{item[1]}</strong><small>{item[2]}</small></span></div>)}</div></Page>}
        {active === "Budget" && <Page title="Budget" intro="Klarheit über jede Ausgabe – geplant, reserviert und bezahlt.">
          <div className="budget-summary-grid">
            <article className="card budget-total">
              <small>Gesamtbudget</small><strong>{formatMoney(totalBudget)}</strong>
              <div className="progress"><i style={{width:`${budgetProgress}%`}}/></div>
              <p><span>{formatMoney(plannedBudget)} geplant</span><span>{formatMoney(availableBudget)} verfügbar</span></p>
              <p><span>{formatMoney(paidBudget)} bezahlt</span><span>{budgetProgress}% eingeplant</span></p>
            </article>
            <form className="card budget-total-form" onSubmit={submitTotalBudget}>
              <div className="card-head"><div><small>Budgetrahmen</small><h2>Gesamtbudget ändern</h2></div><span className="storage-badge">Synchronisiert</span></div>
              <label>Betrag in Euro<input min="0" onChange={(event) => setTotalBudgetInput(event.target.value)} required step="0.01" type="number" value={totalBudgetInput}/></label>
              <button className="primary-button" disabled={budgetSaving || budgetLoading} type="submit">{budgetSaving ? "Wird gespeichert …" : "Gesamtbudget speichern"}</button>
            </form>
          </div>
          <div className="budget-manage-grid">
            <form className="card budget-item-form" onSubmit={submitBudgetItem}>
              <div className="card-head"><div><small>{editingBudgetId ? "Posten bearbeiten" : "Neuer Posten"}</small><h2>{editingBudgetId ? "Ausgabe aktualisieren" : "Ausgabe hinzufügen"}</h2></div></div>
              <label>Bezeichnung<input maxLength={160} onChange={(event) => setBudgetTitle(event.target.value)} placeholder="Zum Beispiel: Hochzeitslocation" required value={budgetTitle}/></label>
              <label>Kategorie<input maxLength={80} onChange={(event) => setBudgetCategory(event.target.value)} placeholder="Zum Beispiel: Location" required value={budgetCategory}/></label>
              <div className="amount-fields"><label>Geplant (€)<input min="0" onChange={(event) => setBudgetPlanned(event.target.value)} required step="0.01" type="number" value={budgetPlanned}/></label><label>Bezahlt (€)<input min="0" onChange={(event) => setBudgetPaid(event.target.value)} step="0.01" type="number" value={budgetPaid}/></label></div>
              <label>Status<select onChange={(event) => setBudgetStatus(event.target.value as BudgetStatus)} value={budgetStatus}><option value="planned">Geplant</option><option value="reserved">Reserviert</option><option value="paid">Bezahlt</option></select></label>
              {budgetError && <p className="sync-error" role="alert">{budgetError}</p>}
              <div className="form-actions"><button className="primary-button" disabled={budgetSaving || budgetLoading} type="submit">{budgetSaving ? "Wird gespeichert …" : editingBudgetId ? "Änderungen speichern" : "Posten hinzufügen"}</button>{editingBudgetId && <button className="secondary-button" disabled={budgetSaving} onClick={resetBudgetForm} type="button">Abbrechen</button>}</div>
            </form>
            <article className="card budget-items">
              <div className="card-head"><div><small>{budgetItems.length} Budgetposten</small><h2>Eure Ausgaben</h2></div></div>
              {budgetLoading ? <p className="empty-state">Budget wird geladen …</p> : budgetItems.length === 0 && <p className="empty-state">Noch keine Ausgaben. Legt links euren ersten Budgetposten an.</p>}
              {budgetItems.map((item) => <div className="budget-item" key={item.id}>
                <span><strong>{item.title}</strong><small>{item.category} · {budgetStatusLabel(item.status)}</small></span>
                <span className="budget-amount"><strong>{formatMoney(item.plannedAmount)}</strong><small>{formatMoney(item.paidAmount)} bezahlt</small></span>
                <div className="task-actions"><button disabled={budgetSaving} onClick={() => editBudgetItem(item)} type="button">Bearbeiten</button><button className="danger" disabled={budgetSaving} onClick={() => void removeBudgetItem(item.id)} type="button">Löschen</button></div>
              </div>)}
            </article>
          </div>
        </Page>}
        {active === "Anbieter" && <Page title="Anbieter" intro="Handverlesene Profis, passend zu eurem Stil, Termin und Budget."><div className="vendor-grid">{filteredVendors.map((vendor) => <article className="card vendor-card" key={vendor.name}><div className="vendor-visual">{vendor.icon}</div><span className="match">{vendor.match}% Match</span><h2>{vendor.name}</h2><p>{vendor.meta}</p><strong>{vendor.price}</strong><button>Details ansehen →</button></article>)}</div></Page>}
        {active === "Gäste" && <Page title="Gäste" intro="Gäste verwalten, persönliche Einladungslinks teilen und Antworten automatisch empfangen.">
          <div className="guest-manage-grid">
            <form className="card guest-form" onSubmit={submitGuest}>
              <div className="card-head"><div><small>{editingGuestId ? "Gast bearbeiten" : "Neuer Gast"}</small><h2>{editingGuestId ? "Details aktualisieren" : "Person hinzufügen"}</h2></div><span className="storage-badge">Synchronisiert</span></div>
              <label>Name<input maxLength={160} onChange={(event) => setGuestName(event.target.value)} placeholder="Vor- und Nachname" required value={guestName}/></label>
              <label>Gruppe<input maxLength={80} onChange={(event) => setGuestGroup(event.target.value)} placeholder="Familie, Freunde, Arbeit …" value={guestGroup}/></label>
              <label>E-Mail-Adresse<input onChange={(event) => setGuestEmail(event.target.value)} placeholder="Optional" type="email" value={guestEmail}/></label>
              <label>Ernährungswünsche<input maxLength={240} onChange={(event) => setGuestDietaryNotes(event.target.value)} placeholder="Optional" value={guestDietaryNotes}/></label>
              {editingGuestId && <label>Status<select onChange={(event) => setGuestStatus(event.target.value as RsvpStatus)} value={guestStatus}><option value="open">Offen</option><option value="accepted">Zugesagt</option><option value="declined">Abgesagt</option></select></label>}
              {guestError && <p className="sync-error" role="alert">{guestError}</p>}
              <div className="form-actions"><button className="primary-button" disabled={guestSaving || guestsLoading} type="submit">{guestSaving ? "Wird gespeichert …" : editingGuestId ? "Änderungen speichern" : "Gast hinzufügen"}</button>{editingGuestId && <button className="secondary-button" disabled={guestSaving} onClick={resetGuestForm} type="button">Abbrechen</button>}</div>
            </form>
            <section className="card guest-list">
              <div className="card-head"><div><small>{acceptedGuests} von {guests.length} zugesagt</small><h2>Eure Gästeliste</h2></div></div>
              {guestsLoading ? <p className="empty-state">Gäste werden geladen …</p> : guests.length === 0 && <p className="empty-state">Noch keine Gäste. Fügt links die erste Person hinzu.</p>}
              {guests.map((guest) => <article className="guest-card" key={guest.id}>
                <div className="guest-main"><strong>{guest.name}</strong><small>{guest.group || "Ohne Gruppe"}{guest.email ? ` · ${guest.email}` : ""}</small>{guest.dietaryNotes && <small>🍽 {guest.dietaryNotes}</small>}</div>
                <span className={`rsvp-status ${guest.status}`}>{rsvpStatusLabel(guest.status)}</span>
                <div className="invite-actions">
                  <button disabled={guestSaving} onClick={() => void copyInvitationLink(guest)} type="button">{copiedGuestId === guest.id ? "Link kopiert ✓" : "Link kopieren"}</button>
                  <a href={whatsAppInvitationUrl(guest)} rel="noreferrer" target="_blank">Per WhatsApp</a>
                  <button disabled={guestSaving} onClick={() => editGuest(guest)} type="button">Bearbeiten</button>
                  <button className="danger" disabled={guestSaving} onClick={() => void removeGuest(guest.id)} type="button">Löschen</button>
                </div>
              </article>)}
            </section>
          </div>
        </Page>}
      </section>
    </main>
  );
}

function Page({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <section className="page"><p className="eyebrow red">Ouivio Workspace</p><h1>{title}</h1><p className="intro">{intro}</p>{children}</section>;
}

function formatDueDate(value: string | null) {
  if (!value) return "";
  return `Fällig am ${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`))}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

function budgetStatusLabel(status: BudgetStatus) {
  return status === "paid" ? "Bezahlt" : status === "reserved" ? "Reserviert" : "Geplant";
}

function rsvpStatusLabel(status: RsvpStatus) {
  return status === "accepted" ? "Zugesagt" : status === "declined" ? "Abgesagt" : "Offen";
}

function invitationUrl(token: string) {
  return `${publicAppUrl}/invite/${token}`;
}

function whatsAppInvitationUrl(guest: Guest) {
  const message = `Hallo ${guest.name}, hier ist deine persönliche Einladung zu unserer Hochzeit: ${invitationUrl(guest.inviteToken)}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function accountInitials(email: string) {
  return email.slice(0, 2).toUpperCase() || "OU";
}
