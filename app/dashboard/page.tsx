"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createBudgetItem,
  deleteBudgetItem,
  fetchBudget,
  saveTotalBudget,
  updateBudgetItem,
  type BudgetItem,
  type BudgetStatus,
} from "../../lib/budget";
import {
  createGuest,
  deleteGuest,
  fetchGuests,
  updateGuest,
  type Guest,
  type RsvpStatus,
} from "../../lib/guests";
import { getSupabaseClient } from "../../lib/supabase";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type Task,
} from "../../lib/tasks";
import { ensureWeddingWorkspace } from "../../lib/workspace";
import { ensureAccountProfile } from "../../lib/account";
import { readDemoBooking, type DemoBooking } from "../../lib/demo-booking";
import { fetchFavoritePackages, toggleFavoritePackage, type FavoritePackage } from "../../lib/favorite-packages";
import { fetchCartPackages, removeCartPackage, type CartPackage } from "../../lib/cart-items";
import {
  createCustomerEvent,
  deleteCustomerEvent,
  fetchCustomerEvents,
  updateCustomerEvent,
  type CustomerEvent,
} from "../../lib/customer-events";
import {
  fetchWeddingPlan,
  updateWeddingPlan,
  type WeddingPlan,
} from "../../lib/wedding-plan";

const sections = [
  "Übersicht",
  "Planung",
  "Kalender",
  "Budget",
  "Anbieter",
  "Gäste",
] as const;
type Section = (typeof sections)[number];

const publicAppUrl =
  "https://ouivio-website-git-feat-ouivio-core-foundation-ouivio.vercel.app";

function Ring({ value }: { value: number }) {
  return (
    <div
      className="ring"
      style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}
    >
      <span>{value}%</span>
    </div>
  );
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
  const [demoBooking, setDemoBooking] = useState<DemoBooking | null>(null);
  const [favoritePackages, setFavoritePackages] = useState<FavoritePackage[]>([]);
  const [cartPackages, setCartPackages] = useState<CartPackage[]>([]);
  const [savedPackageAction, setSavedPackageAction] = useState<string | null>(null);
  const [savedPackageError, setSavedPackageError] = useState("");
  const [weddingPlan, setWeddingPlan] = useState<WeddingPlan | null>(null);
  const [partnerNamesInput, setPartnerNamesInput] = useState("");
  const [weddingDateInput, setWeddingDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  const [customerEvents, setCustomerEvents] = useState<CustomerEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventEndsAt, setEventEndsAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const done = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const plannedBudget = budgetItems.reduce(
    (sum, item) => sum + item.plannedAmount,
    0,
  );
  const paidBudget = budgetItems.reduce(
    (sum, item) => sum + item.paidAmount,
    0,
  );
  const availableBudget = Math.max(totalBudget - plannedBudget, 0);
  const budgetProgress = totalBudget
    ? Math.min(Math.round((plannedBudget / totalBudget) * 100), 100)
    : 0;
  const acceptedGuests = guests.filter(
    (guest) => guest.status === "accepted",
  ).length;
  const openGuests = guests.filter((guest) => guest.status === "open").length;
  const guestProgress = guests.length
    ? Math.round((acceptedGuests / guests.length) * 100)
    : 0;
  const weddingCountdown = weddingPlan?.weddingDate
    ? Math.max(0, Math.ceil((new Date(`${weddingPlan.weddingDate}T12:00:00`).getTime() - startOfToday().getTime()) / 86_400_000))
    : null;
  const discoverHref = `/discover?${new URLSearchParams({
    ...(weddingPlan?.weddingDate ? { start: weddingPlan.weddingDate, end: weddingPlan.weddingDate } : {}),
    ...(weddingPlan?.location ? { city: weddingPlan.location } : {}),
  }).toString()}`;

  const removeCartItem = async (packageId: string) => {
    if (!weddingId || savedPackageAction) return;
    setSavedPackageAction(`cart-${packageId}`);
    setSavedPackageError("");
    try {
      await removeCartPackage(weddingId, packageId);
      setCartPackages((items) => items.filter((item) => item.packageId !== packageId));
    } catch {
      setSavedPackageError("Der Warenkorb konnte gerade nicht aktualisiert werden. Bitte versucht es erneut.");
    } finally {
      setSavedPackageAction(null);
    }
  };

  const removeFavoriteItem = async (packageId: string) => {
    if (!weddingId || savedPackageAction) return;
    setSavedPackageAction(`favorite-${packageId}`);
    setSavedPackageError("");
    try {
      await toggleFavoritePackage(weddingId, packageId, true);
      setFavoritePackages((items) => items.filter((item) => item.packageId !== packageId));
    } catch {
      setSavedPackageError("Der Favorit konnte gerade nicht entfernt werden. Bitte versucht es erneut.");
    } finally {
      setSavedPackageAction(null);
    }
  };

  const toggleTask = async (id: string) => {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask || taskSaving) return;
    const nextTask = { ...currentTask, done: !currentTask.done };
    setTaskError("");
    setTaskSaving(true);
    setTasks((current) =>
      current.map((task) => (task.id === id ? nextTask : task)),
    );
    try {
      const savedTask = await updateTask(nextTask);
      setTasks((current) =>
        current.map((task) => (task.id === id ? savedTask : task)),
      );
    } catch {
      setTasks((current) =>
        current.map((task) => (task.id === id ? currentTask : task)),
      );
      setTaskError(
        "Die Aufgabe konnte nicht synchronisiert werden. Bitte versucht es erneut.",
      );
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
        const savedTask = await updateTask({
          ...currentTask,
          title,
          meta: taskMeta.trim(),
          dueDate: taskDueDate || null,
        });
        setTasks((current) =>
          current.map((task) => (task.id === editingTaskId ? savedTask : task)),
        );
      } else {
        const savedTask = await createTask(weddingId, {
          title,
          meta: taskMeta.trim(),
          dueDate: taskDueDate || null,
        });
        setTasks((current) => [...current, savedTask]);
      }
      resetTaskForm();
    } catch {
      setTaskError(
        "Die Aufgabe konnte nicht gespeichert werden. Bitte versucht es erneut.",
      );
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
      setTaskError(
        "Die Aufgabe konnte nicht gelöscht werden. Bitte versucht es erneut.",
      );
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
    if (!weddingId || budgetSaving || !Number.isFinite(value) || value < 0)
      return;
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
    if (
      !weddingId ||
      budgetSaving ||
      !title ||
      !category ||
      !Number.isFinite(plannedAmount) ||
      !Number.isFinite(paidAmount) ||
      plannedAmount < 0 ||
      paidAmount < 0
    )
      return;
    setBudgetError("");
    setBudgetSaving(true);
    try {
      if (editingBudgetId) {
        const currentItem = budgetItems.find(
          (item) => item.id === editingBudgetId,
        );
        if (!currentItem) return;
        const savedItem = await updateBudgetItem({
          ...currentItem,
          title,
          category,
          plannedAmount,
          paidAmount,
          status: budgetStatus,
        });
        setBudgetItems((current) =>
          current.map((item) =>
            item.id === editingBudgetId ? savedItem : item,
          ),
        );
      } else {
        const savedItem = await createBudgetItem(weddingId, {
          title,
          category,
          plannedAmount,
          paidAmount,
          status: budgetStatus,
        });
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

  const submitWeddingPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!weddingId || planSaving) return;
    setPlanError("");
    setPlanSaving(true);
    try {
      const savedPlan = await updateWeddingPlan(weddingId, {
        partnerNames: partnerNamesInput.trim() || "Unsere Hochzeit",
        weddingDate: weddingDateInput || null,
        location: locationInput.trim(),
      });
      setWeddingPlan(savedPlan);
      setPartnerNamesInput(savedPlan.partnerNames);
      setWeddingDateInput(savedPlan.weddingDate ?? "");
      setLocationInput(savedPlan.location);
    } catch {
      setPlanError("Eure Planungsdaten konnten nicht gespeichert werden.");
    } finally {
      setPlanSaving(false);
    }
  };

  const resetEventForm = () => {
    setEventTitle("");
    setEventStartsAt("");
    setEventEndsAt("");
    setEventLocation("");
    setEventNotes("");
    setEditingEventId(null);
  };

  const submitCustomerEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!weddingId || eventSaving || !eventTitle.trim() || !eventStartsAt) return;
    setEventError("");
    setEventSaving(true);
    try {
      if (editingEventId) {
        const current = customerEvents.find((item) => item.id === editingEventId);
        if (!current) return;
        const saved = await updateCustomerEvent({
          ...current,
          title: eventTitle.trim(),
          startsAt: localDateTimeToIso(eventStartsAt),
          endsAt: eventEndsAt ? localDateTimeToIso(eventEndsAt) : null,
          location: eventLocation.trim(),
          notes: eventNotes.trim(),
        });
        setCustomerEvents((items) => items.map((item) => item.id === saved.id ? saved : item));
      } else {
        const saved = await createCustomerEvent(weddingId, {
          title: eventTitle.trim(),
          startsAt: localDateTimeToIso(eventStartsAt),
          endsAt: eventEndsAt ? localDateTimeToIso(eventEndsAt) : null,
          location: eventLocation.trim(),
          notes: eventNotes.trim(),
        });
        setCustomerEvents((items) => [...items, saved].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      }
      resetEventForm();
    } catch {
      setEventError("Der Termin konnte nicht gespeichert werden.");
    } finally {
      setEventSaving(false);
    }
  };

  const editCustomerEvent = (event: CustomerEvent) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventStartsAt(isoToLocalDateTime(event.startsAt));
    setEventEndsAt(event.endsAt ? isoToLocalDateTime(event.endsAt) : "");
    setEventLocation(event.location);
    setEventNotes(event.notes);
  };

  const removeCustomerEvent = async (id: string) => {
    if (eventSaving) return;
    const before = customerEvents;
    setEventSaving(true);
    setCustomerEvents((items) => items.filter((item) => item.id !== id));
    try {
      await deleteCustomerEvent(id);
      if (editingEventId === id) resetEventForm();
    } catch {
      setCustomerEvents(before);
      setEventError("Der Termin konnte nicht gelöscht werden.");
    } finally {
      setEventSaving(false);
    }
  };

  const submitGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = guestName.trim();
    if (!weddingId || guestSaving || !name) return;
    setGuestError("");
    setGuestSaving(true);
    try {
      if (editingGuestId) {
        const currentGuest = guests.find(
          (guest) => guest.id === editingGuestId,
        );
        if (!currentGuest) return;
        const savedGuest = await updateGuest({
          ...currentGuest,
          name,
          group: guestGroup.trim(),
          email: guestEmail.trim(),
          dietaryNotes: guestDietaryNotes.trim(),
          status: guestStatus,
        });
        setGuests((current) =>
          current.map((guest) =>
            guest.id === editingGuestId ? savedGuest : guest,
          ),
        );
      } else {
        const savedGuest = await createGuest(weddingId, {
          name,
          group: guestGroup.trim(),
          email: guestEmail.trim(),
          dietaryNotes: guestDietaryNotes.trim(),
        });
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

  const shareViaInstagram = async (guest: Guest) => {
    try {
      await navigator.clipboard.writeText(invitationMessage(guest));
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(null), 2500);
      window.open(
        "https://www.instagram.com/direct/inbox/",
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      setGuestError(
        "Der Einladungstext konnte nicht für Instagram kopiert werden.",
      );
    }
  };

  useEffect(() => {
    setDemoBooking(readDemoBooking());
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let activeSubscription = true;

    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!activeSubscription) return;
        if (!data.user) {
          router.replace("/access");
          return;
        }
        const account = await ensureAccountProfile(data.user);
        if (account.type === "partner") {
          router.replace("/partner");
          return;
        }
        const workspaceId = await ensureWeddingWorkspace(data.user);
        const [cloudTasks, cloudBudget, cloudGuests, cloudFavorites, cloudCart, cloudPlan, cloudEvents] = await Promise.all([
          fetchTasks(workspaceId),
          fetchBudget(workspaceId),
          fetchGuests(workspaceId),
          fetchFavoritePackages(workspaceId),
          fetchCartPackages(workspaceId),
          fetchWeddingPlan(workspaceId),
          fetchCustomerEvents(workspaceId),
        ]);
        if (!activeSubscription) return;
        setWeddingId(workspaceId);
        setTasks(cloudTasks);
        setTasksLoading(false);
        setTotalBudget(cloudBudget.totalBudget);
        setTotalBudgetInput(String(cloudBudget.totalBudget));
        setBudgetItems(cloudBudget.items);
        setBudgetLoading(false);
        setGuests(cloudGuests);
        setFavoritePackages(cloudFavorites);
        setCartPackages(cloudCart);
        setWeddingPlan(cloudPlan);
        setPartnerNamesInput(cloudPlan.partnerNames);
        setWeddingDateInput(cloudPlan.weddingDate ?? "");
        setLocationInput(cloudPlan.location);
        setCustomerEvents(cloudEvents);
        setGuestsLoading(false);
        setEventsLoading(false);
        setUserEmail(data.user.email ?? "Ouivio Konto");
        setAuthReady(true);
      } catch {
        if (activeSubscription) {
          setTasksLoading(false);
          setBudgetLoading(false);
          setGuestsLoading(false);
          setEventsLoading(false);
          setAuthError(
            "Der persönliche Workspace konnte noch nicht geladen werden.",
          );
        }
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/access");
      },
    );

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
        if (activeSubscription)
          setGuestError(
            "Neue Rückmeldungen konnten gerade nicht geladen werden.",
          );
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
    router.replace("/access");
  };

  if (!authReady) {
    return (
      <main className="auth-loading" aria-live="polite">
        <span>Ouivio</span>
        <p role={authError ? "alert" : undefined}>
          {authError || "Euer Workspace wird sicher geöffnet …"}
        </p>
        {authError && (
          <button
            className="secondary-button"
            onClick={() => window.location.reload()}
            type="button"
          >
            Erneut versuchen
          </button>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="logo" href="/index.html#top" aria-label="Zur Ouivio Startseite">
          Ouivio<span>.</span>
        </Link>
        <nav aria-label="Hauptnavigation">
          {sections.map((item) => (
            <button
              className={active === item ? "active" : ""}
              key={item}
              onClick={() => setActive(item)}
            >
              <i aria-hidden>
                {item === "Übersicht"
                  ? "⌂"
                  : item === "Planung"
                    ? "✓"
                    : item === "Kalender"
                      ? "□"
                      : item === "Budget"
                        ? "€"
                        : item === "Anbieter"
                          ? "◇"
                          : "♙"}
              </i>
              <span>{item}</span>
            </button>
          ))}
        </nav>
        <div className="profile">
          <span>{accountInitials(userEmail)}</span>
          <div>
            <strong>{userEmail}</strong>
            <small>Sicher angemeldet</small>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <small>Wedding workspace</small>
            <strong>{active}</strong>
          </div>
          <Link className="discover-button" href={discoverHref}>
            Anbieter entdecken →
          </Link>
          <button className="logout-button" onClick={signOut} type="button">
            Abmelden
          </button>
          <span className="avatar" aria-label="Angemeldetes Konto">
            {accountInitials(userEmail)}
          </span>
        </header>

        {active === "Übersicht" && (
          <>
            {demoBooking && <section className="card" style={{ marginBottom: 22, borderColor: "#f1c6cd", background: "#fffafa", display: "flex", gap: 24, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }} role="status"><div><small style={{ color: "#df1632", fontWeight: 800 }}>CHECKOUT-DEMO · NUR DIESES GERÄT</small><h2 style={{ margin: "6px 0" }}>Auswahl in eure Planung übernommen</h2><p style={{ margin: 0, color: "#6f6963" }}>{demoBooking.items.map((item) => item.name).join(" · ")} · {new Date(`${demoBooking.startDate}T12:00:00`).toLocaleDateString("de-DE")}</p></div><button className="primary-button" onClick={() => setActive("Budget")}>Demo-Budget ansehen →</button></section>}
            <section className="hero">
              <div>
                <p className="eyebrow">Eure persönliche Hochzeitsplanung</p>
                <h1>
                  {weddingPlan?.partnerNames || "Eure Hochzeit."}
                  <br />
                  Ein klarer Plan.
                </h1>
                <p>
                  {weddingPlan?.location
                    ? `Alles für eure Hochzeit in ${weddingPlan.location} – von der ersten Idee bis zum letzten Tanz.`
                    : "Legt Termin und Ort fest – danach begleitet euch Ouivio durch jeden nächsten Schritt."}
                </p>
                <button onClick={() => setActive("Planung")}>
                  {weddingPlan?.weddingDate ? "Planung fortsetzen" : "Planung einrichten"} <span>→</span>
                </button>
              </div>
              <div className="hero-side">
                <p>Noch</p>
                <strong>{weddingCountdown ?? "—"}</strong>
                <span>{weddingCountdown === null ? "Termin noch festlegen" : "Tage bis zu eurem Ja"}</span>
                <div>
                  <Ring value={progress} />
                  <p>
                    <b>
                      {done} von {tasks.length}
                    </b>
                    <small>Meilensteine erledigt</small>
                  </p>
                </div>
              </div>
            </section>
            <section className="stats-grid">
              <button className="card stat" onClick={() => setActive("Budget")}>
                <span>Budget</span>
                <strong>{formatMoney(plannedBudget)}</strong>
                <small>von {formatMoney(totalBudget)} eingeplant</small>
                <div className="progress">
                  <i style={{ width: `${budgetProgress}%` }} />
                </div>
              </button>
              <button className="card stat" onClick={() => setActive("Gäste")}>
                <span>Gäste</span>
                <strong>{guests.length}</strong>
                <small>
                  {acceptedGuests} Zusagen · {openGuests} offen
                </small>
                <div className="progress">
                  <i style={{ width: `${guestProgress}%` }} />
                </div>
              </button>
              <button
                className="card stat"
                onClick={() => setActive("Anbieter")}
              >
                <span>Warenkorb</span>
                <strong>{cartPackages.length}</strong>
                <small>{cartPackages.length === 1 ? "Leistung ausgewählt" : "Leistungen ausgewählt"}</small>
                <div className="faces">
                  <i>✓</i>
                  <i>⌕</i>
                </div>
              </button>
            </section>
            <section className="detail-grid">
              <article className="card">
                <div className="card-head">
                  <div>
                    <small>Als Nächstes</small>
                    <h2>Eure Aufgaben</h2>
                  </div>
                  <button onClick={() => setActive("Planung")}>
                    Alle ansehen →
                  </button>
                </div>
                {tasksLoading ? (
                  <p className="empty-state">Aufgaben werden geladen …</p>
                ) : tasks.length === 0 ? (
                  <p className="empty-state">
                    Noch keine Aufgaben. Beginnt mit eurem ersten Schritt.
                  </p>
                ) : (
                  tasks.slice(0, 3).map((task) => (
                    <button
                      className="row task"
                      disabled={taskSaving}
                      onClick={() => void toggleTask(task.id)}
                      key={task.id}
                    >
                      <span className={task.done ? "check done" : "check"}>
                        {task.done ? "✓" : ""}
                      </span>
                      <span>
                        <strong>{task.title}</strong>
                        <small>
                          {task.meta || formatDueDate(task.dueDate)}
                        </small>
                      </span>
                    </button>
                  ))
                )}
              </article>
              <article className="card">
                <div className="card-head">
                  <div><small>Ouivio Auswahl</small><h2>{cartPackages.length ? "Warenkorb" : "Merkliste"}</h2></div>
                  <button onClick={() => router.push(discoverHref)}>Anbieter entdecken →</button>
                </div>
                {cartPackages.length ? cartPackages.slice(0, 2).map((item) => <div className="row vendor" key={item.packageId}><span className="vendor-icon">✓</span><span><strong>{item.partnerName}</strong><small>{item.serviceType} · im Warenkorb</small></span><b>Ausgewählt</b></div>) : favoritePackages.length === 0 ? <p className="empty-state">Noch keine Angebote gemerkt. Entdeckt passende Anbieter über die Suche.</p> : favoritePackages.slice(0, 2).map((favorite) => <div className="row vendor" key={favorite.packageId}><span className="vendor-icon">♥</span><span><strong>{favorite.partnerName}</strong><small>{favorite.serviceType} · {favorite.city}</small></span><b>Gemerkt</b></div>)}
              </article>
            </section>
          </>
        )}

        {active === "Planung" && (
          <Page
            title="Planung"
            intro="Euer roter Faden bis zum Hochzeitstag. Erstellt Aufgaben, setzt Termine und behaltet jeden Meilenstein im Blick."
          >
            <form className="card plan-setup" onSubmit={submitWeddingPlan}>
              <div className="card-head"><div><small>Grundlage eurer Suche</small><h2>Eure Hochzeit einrichten</h2></div><span className="storage-badge">Synchronisiert</span></div>
              <p className="setup-copy">Diese Angaben gehören nur zu eurer Planung. Sie ersetzen die bisherigen Platzhalter im Dashboard und machen die Suche später schneller.</p>
              <div className="plan-fields">
                <label>Ihr als Paar<input maxLength={160} onChange={(event) => setPartnerNamesInput(event.target.value)} placeholder="Zum Beispiel: Sera & Serdar" value={partnerNamesInput}/></label>
                <label>Hochzeitstermin<input onChange={(event) => setWeddingDateInput(event.target.value)} type="date" value={weddingDateInput}/></label>
                <label>Wunschort<input maxLength={120} onChange={(event) => setLocationInput(event.target.value)} placeholder="Zum Beispiel: Köln" value={locationInput}/></label>
              </div>
              {planError && <p className="sync-error" role="alert">{planError}</p>}
              <button className="primary-button" disabled={planSaving} type="submit">{planSaving ? "Wird gespeichert …" : "Planungsdaten speichern"}</button>
            </form>
            <div className="planning-grid">
              <form className="card task-form" onSubmit={submitTask}>
                <div className="card-head">
                  <div>
                    <small>
                      {editingTaskId ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
                    </small>
                    <h2>
                      {editingTaskId
                        ? "Details aktualisieren"
                        : "Was steht als Nächstes an?"}
                    </h2>
                  </div>
                  <span className="storage-badge">
                    Mit Supabase synchronisiert
                  </span>
                </div>
                <label>
                  Titel
                  <input
                    autoComplete="off"
                    maxLength={160}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Zum Beispiel: Einladungen gestalten"
                    required
                    value={taskTitle}
                  />
                </label>
                <label>
                  Notiz
                  <input
                    autoComplete="off"
                    maxLength={240}
                    onChange={(event) => setTaskMeta(event.target.value)}
                    placeholder="Optionaler Hinweis"
                    value={taskMeta}
                  />
                </label>
                <label>
                  Fällig am
                  <input
                    onChange={(event) => setTaskDueDate(event.target.value)}
                    type="date"
                    value={taskDueDate}
                  />
                </label>
                {taskError && (
                  <p className="sync-error" role="alert">
                    {taskError}
                  </p>
                )}
                <div className="form-actions">
                  <button
                    className="primary-button"
                    disabled={taskSaving || !weddingId}
                    type="submit"
                  >
                    {taskSaving
                      ? "Wird gespeichert …"
                      : editingTaskId
                        ? "Änderungen speichern"
                        : "Aufgabe hinzufügen"}
                  </button>
                  {editingTaskId && (
                    <button
                      className="secondary-button"
                      disabled={taskSaving}
                      onClick={resetTaskForm}
                      type="button"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </form>
              <div className="card task-list">
                <div className="card-head">
                  <div>
                    <small>
                      {done} von {tasks.length} erledigt
                    </small>
                    <h2>Eure Aufgaben</h2>
                  </div>
                </div>
                {tasksLoading ? (
                  <p className="empty-state">Aufgaben werden geladen …</p>
                ) : (
                  tasks.length === 0 && (
                    <p className="empty-state">
                      Noch keine Aufgaben. Legt links euren ersten Schritt an.
                    </p>
                  )
                )}
                {tasks.map((task) => (
                  <div className="row task-manage" key={task.id}>
                    <button
                      aria-label={`${task.title} als ${task.done ? "offen" : "erledigt"} markieren`}
                      className={task.done ? "check done" : "check"}
                      disabled={taskSaving}
                      onClick={() => void toggleTask(task.id)}
                      type="button"
                    >
                      {task.done ? "✓" : ""}
                    </button>
                    <span>
                      <strong>{task.title}</strong>
                      <small>
                        {task.meta ||
                          formatDueDate(task.dueDate) ||
                          "Ohne weitere Details"}
                      </small>
                    </span>
                    <em>{task.done ? "Erledigt" : "Offen"}</em>
                    <div className="task-actions">
                      <button
                        disabled={taskSaving}
                        onClick={() => editTask(task)}
                        type="button"
                      >
                        Bearbeiten
                      </button>
                      <button
                        className="danger"
                        disabled={taskSaving}
                        onClick={() => void removeTask(task.id)}
                        type="button"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Page>
        )}
        {active === "Kalender" && (
          <Page
            title="Kalender"
            intro="Alle wichtigen Termine, Deadlines und Gespräche in einer gemeinsamen Zeitleiste."
          >
            <div className="planning-grid">
              <form className="card task-form" onSubmit={submitCustomerEvent}>
                <div className="card-head"><div><small>{editingEventId ? "Termin bearbeiten" : "Neuer Termin"}</small><h2>{editingEventId ? "Details aktualisieren" : "Was steht an?"}</h2></div><span className="storage-badge">Synchronisiert</span></div>
                <label>Titel<input maxLength={160} onChange={(event) => setEventTitle(event.target.value)} placeholder="Besichtigung, Gespräch, Probeessen …" required value={eventTitle}/></label>
                <div className="amount-fields"><label>Beginn<input onChange={(event) => setEventStartsAt(event.target.value)} required type="datetime-local" value={eventStartsAt}/></label><label>Ende<input min={eventStartsAt || undefined} onChange={(event) => setEventEndsAt(event.target.value)} type="datetime-local" value={eventEndsAt}/></label></div>
                <label>Ort<input maxLength={160} onChange={(event) => setEventLocation(event.target.value)} placeholder="Optional" value={eventLocation}/></label>
                <label>Notiz<input maxLength={240} onChange={(event) => setEventNotes(event.target.value)} placeholder="Optional" value={eventNotes}/></label>
                {eventError && <p className="sync-error" role="alert">{eventError}</p>}
                <div className="form-actions"><button className="primary-button" disabled={eventSaving} type="submit">{eventSaving ? "Wird gespeichert …" : editingEventId ? "Änderungen speichern" : "Termin hinzufügen"}</button>{editingEventId && <button className="secondary-button" onClick={resetEventForm} type="button">Abbrechen</button>}</div>
              </form>
              <div className="timeline card" aria-label="Eure nächsten Termine">
                <div className="card-head"><div><small>{customerEvents.length} persönliche Termine</small><h2>Euer Kalender</h2></div></div>
                {eventsLoading ? <p className="empty-state">Kalender wird geladen …</p> : customerEvents.length === 0 ? <p className="empty-state">Noch keine Termine. Tragt links eure erste Besichtigung oder Frist ein.</p> : customerEvents.map((item) => <div className="event" key={item.id}><b><span>{formatEventDay(item.startsAt)}</span><small>{formatEventMonth(item.startsAt)}</small></b><span className="event-details"><strong>{item.title}</strong><small>{formatEventDetails(item)}</small></span><div className="task-actions"><button disabled={eventSaving} onClick={() => editCustomerEvent(item)} type="button">Bearbeiten</button><button className="danger" disabled={eventSaving} onClick={() => void removeCustomerEvent(item.id)} type="button">Löschen</button></div></div>)}
                {demoBooking && <div className="event demo-event"><b><span>{new Date(`${demoBooking.startDate}T12:00:00`).toLocaleDateString("de-DE", { day: "2-digit" })}</span><small>DEMO</small></b><span className="event-details"><strong>Demo-Buchung in Vorbereitung</strong><small>{demoBooking.items.length} Leistung{demoBooking.items.length === 1 ? "" : "en"} · keine Reservierung</small></span></div>}
              </div>
            </div>
          </Page>
        )}
        {active === "Budget" && (
          <Page
            title="Budget"
            intro="Klarheit über jede Ausgabe – geplant, reserviert und bezahlt."
          >
            <div className="budget-summary-grid">
              <article className="card budget-total">
                <small>Gesamtbudget</small>
                <strong>{formatMoney(totalBudget)}</strong>
                <div className="progress">
                  <i style={{ width: `${budgetProgress}%` }} />
                </div>
                <p>
                  <span>{formatMoney(plannedBudget)} geplant</span>
                  <span>{formatMoney(availableBudget)} verfügbar</span>
                </p>
                <p>
                  <span>{formatMoney(paidBudget)} bezahlt</span>
                  <span>{budgetProgress}% eingeplant</span>
                </p>
              </article>
              <form
                className="card budget-total-form"
                onSubmit={submitTotalBudget}
              >
                <div className="card-head">
                  <div>
                    <small>Budgetrahmen</small>
                    <h2>Gesamtbudget ändern</h2>
                  </div>
                  <span className="storage-badge">Synchronisiert</span>
                </div>
                <label>
                  Betrag in Euro
                  <input
                    min="0"
                    onChange={(event) =>
                      setTotalBudgetInput(event.target.value)
                    }
                    required
                    step="0.01"
                    type="number"
                    value={totalBudgetInput}
                  />
                </label>
                <button
                  className="primary-button"
                  disabled={budgetSaving || budgetLoading}
                  type="submit"
                >
                  {budgetSaving
                    ? "Wird gespeichert …"
                    : "Gesamtbudget speichern"}
                </button>
              </form>
            </div>
            <div className="budget-manage-grid">
              <form
                className="card budget-item-form"
                onSubmit={submitBudgetItem}
              >
                <div className="card-head">
                  <div>
                    <small>
                      {editingBudgetId ? "Posten bearbeiten" : "Neuer Posten"}
                    </small>
                    <h2>
                      {editingBudgetId
                        ? "Ausgabe aktualisieren"
                        : "Ausgabe hinzufügen"}
                    </h2>
                  </div>
                </div>
                <label>
                  Bezeichnung
                  <input
                    maxLength={160}
                    onChange={(event) => setBudgetTitle(event.target.value)}
                    placeholder="Zum Beispiel: Hochzeitslocation"
                    required
                    value={budgetTitle}
                  />
                </label>
                <label>
                  Kategorie
                  <input
                    maxLength={80}
                    onChange={(event) => setBudgetCategory(event.target.value)}
                    placeholder="Zum Beispiel: Location"
                    required
                    value={budgetCategory}
                  />
                </label>
                <div className="amount-fields">
                  <label>
                    Geplant (€)
                    <input
                      min="0"
                      onChange={(event) => setBudgetPlanned(event.target.value)}
                      required
                      step="0.01"
                      type="number"
                      value={budgetPlanned}
                    />
                  </label>
                  <label>
                    Bezahlt (€)
                    <input
                      min="0"
                      onChange={(event) => setBudgetPaid(event.target.value)}
                      step="0.01"
                      type="number"
                      value={budgetPaid}
                    />
                  </label>
                </div>
                <label>
                  Status
                  <select
                    onChange={(event) =>
                      setBudgetStatus(event.target.value as BudgetStatus)
                    }
                    value={budgetStatus}
                  >
                    <option value="planned">Geplant</option>
                    <option value="reserved">Reserviert</option>
                    <option value="paid">Bezahlt</option>
                  </select>
                </label>
                {budgetError && (
                  <p className="sync-error" role="alert">
                    {budgetError}
                  </p>
                )}
                <div className="form-actions">
                  <button
                    className="primary-button"
                    disabled={budgetSaving || budgetLoading}
                    type="submit"
                  >
                    {budgetSaving
                      ? "Wird gespeichert …"
                      : editingBudgetId
                        ? "Änderungen speichern"
                        : "Posten hinzufügen"}
                  </button>
                  {editingBudgetId && (
                    <button
                      className="secondary-button"
                      disabled={budgetSaving}
                      onClick={resetBudgetForm}
                      type="button"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </form>
              <article className="card budget-items">
                <div className="card-head">
                  <div>
                    <small>{budgetItems.length} Budgetposten</small>
                    <h2>Eure Ausgaben</h2>
                  </div>
                </div>
                {budgetLoading ? (
                  <p className="empty-state">Budget wird geladen …</p>
                ) : (
                  budgetItems.length === 0 && (
                    <p className="empty-state">
                      Noch keine Ausgaben. Legt links euren ersten Budgetposten
                      an.
                    </p>
                  )
                )}
                {budgetItems.map((item) => (
                  <div className="budget-item" key={item.id}>
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.category} · {budgetStatusLabel(item.status)}
                      </small>
                    </span>
                    <span className="budget-amount">
                      <strong>{formatMoney(item.plannedAmount)}</strong>
                      <small>{formatMoney(item.paidAmount)} bezahlt</small>
                    </span>
                    <div className="task-actions">
                      <button
                        disabled={budgetSaving}
                        onClick={() => editBudgetItem(item)}
                        type="button"
                      >
                        Bearbeiten
                      </button>
                      <button
                        className="danger"
                        disabled={budgetSaving}
                        onClick={() => void removeBudgetItem(item.id)}
                        type="button"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))}
                {demoBooking && <div className="budget-item" style={{ background: "#fff8f8" }}><span><strong>Demo-Vormerkung · {demoBooking.items.map((item) => item.category).join(", ")}</strong><small>Nicht gespeichert · keine Reservierung</small></span><span className="budget-amount"><strong>{formatMoney(demoBooking.total)}</strong><small>0,00 € bezahlt</small></span></div>}
              </article>
            </div>
          </Page>
        )}
        {active === "Anbieter" && (
          <Page
            title="Anbieter"
            intro="Handverlesene Profis, passend zu eurem Stil, Termin und Budget."
          >
            <section style={{ marginBottom: 28 }}>
              <div className="card-head"><div><small>Bereit für den nächsten Schritt</small><h2>Eure Auswahl · Warenkorb</h2><p>Konkrete Pakete für euren Wunschtermin. Noch keine Reservierung und keine Zahlung.</p></div><button onClick={() => router.push(discoverHref)}>Auswahl ergänzen →</button></div>
              {savedPackageError && <p className="sync-error" role="alert">{savedPackageError}</p>}
              <div className="vendor-grid">
                {cartPackages.length === 0 ? <article className="card empty-vendor-card"><span aria-hidden="true">✓</span><h2>Noch nichts im Warenkorb</h2><p>Fügt ein passendes Live-Angebot aus der Suche hinzu, wenn ihr es für euren Termin weiterverfolgen möchtet.</p><button className="primary-button" onClick={() => router.push(discoverHref)}>Anbieter entdecken →</button></article> : cartPackages.map((item) => <article className="card vendor-card" key={item.packageId}><span className="match">✓ Im Warenkorb</span><h2>{item.partnerName}</h2><p>{item.serviceType} · {item.city}<br/>{item.packageName}<br/><small>{new Date(`${item.startsOn}T12:00:00`).toLocaleDateString("de-DE")}–{new Date(`${item.endsOn}T12:00:00`).toLocaleDateString("de-DE")}</small></p><strong>{new Intl.NumberFormat("de-DE", { style: "currency", currency: item.currency }).format(item.priceAmount)}</strong><div className="saved-package-actions"><button onClick={() => router.push(discoverHref)} type="button">Zur Suche →</button><button className="danger" disabled={Boolean(savedPackageAction)} onClick={() => void removeCartItem(item.packageId)} type="button">{savedPackageAction === `cart-${item.packageId}` ? "Wird entfernt …" : "Entfernen"}</button></div></article>)}
              </div>
            </section>
            <section>
              <div className="card-head"><div><small>Unverbindlich vorgemerkt</small><h2>Favoriten</h2><p>Interessante Angebote zum Vergleichen – unabhängig von eurem Warenkorb.</p></div></div>
            <div className="vendor-grid">
              {favoritePackages.length === 0 ? <article className="card empty-vendor-card"><span aria-hidden="true">♡</span><h2>Beginnt mit euren Favoriten</h2><p>Hier erscheinen ausschließlich Anbieter, die ihr selbst in der Ouivio-Suche gemerkt habt.</p><button className="primary-button" onClick={() => router.push(discoverHref)}>Anbieter entdecken →</button></article> : favoritePackages.map((favorite) => <article className="card vendor-card" key={favorite.packageId}><span className="match">♥ Gemerkt</span><h2>{favorite.partnerName}</h2><p>{favorite.serviceType} · {favorite.city}<br/>{favorite.packageName}</p><strong>{new Intl.NumberFormat("de-DE", { style: "currency", currency: favorite.currency }).format(favorite.priceAmount)}</strong><div className="saved-package-actions"><button onClick={() => router.push(discoverHref)} type="button">In Suche ansehen →</button><button className="danger" disabled={Boolean(savedPackageAction)} onClick={() => void removeFavoriteItem(favorite.packageId)} type="button">{savedPackageAction === `favorite-${favorite.packageId}` ? "Wird entfernt …" : "Entfernen"}</button></div></article>)}
            </div>
            </section>
          </Page>
        )}
        {active === "Gäste" && (
          <Page
            title="Gäste"
            intro="Gäste verwalten, persönliche Einladungslinks teilen und Antworten automatisch empfangen."
          >
            <div className="guest-manage-grid">
              <form className="card guest-form" onSubmit={submitGuest}>
                <div className="card-head">
                  <div>
                    <small>
                      {editingGuestId ? "Gast bearbeiten" : "Neuer Gast"}
                    </small>
                    <h2>
                      {editingGuestId
                        ? "Details aktualisieren"
                        : "Person hinzufügen"}
                    </h2>
                  </div>
                  <span className="storage-badge">Synchronisiert</span>
                </div>
                <label>
                  Name
                  <input
                    maxLength={160}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Vor- und Nachname"
                    required
                    value={guestName}
                  />
                </label>
                <label>
                  Gruppe
                  <input
                    maxLength={80}
                    onChange={(event) => setGuestGroup(event.target.value)}
                    placeholder="Familie, Freunde, Arbeit …"
                    value={guestGroup}
                  />
                </label>
                <label>
                  E-Mail-Adresse
                  <input
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="Optional"
                    type="email"
                    value={guestEmail}
                  />
                </label>
                <label>
                  Ernährungswünsche
                  <input
                    maxLength={240}
                    onChange={(event) =>
                      setGuestDietaryNotes(event.target.value)
                    }
                    placeholder="Optional"
                    value={guestDietaryNotes}
                  />
                </label>
                {editingGuestId && (
                  <label>
                    Status
                    <select
                      onChange={(event) =>
                        setGuestStatus(event.target.value as RsvpStatus)
                      }
                      value={guestStatus}
                    >
                      <option value="open">Offen</option>
                      <option value="accepted">Zugesagt</option>
                      <option value="declined">Abgesagt</option>
                    </select>
                  </label>
                )}
                {guestError && (
                  <p className="sync-error" role="alert">
                    {guestError}
                  </p>
                )}
                <div className="form-actions">
                  <button
                    className="primary-button"
                    disabled={guestSaving || guestsLoading}
                    type="submit"
                  >
                    {guestSaving
                      ? "Wird gespeichert …"
                      : editingGuestId
                        ? "Änderungen speichern"
                        : "Gast hinzufügen"}
                  </button>
                  {editingGuestId && (
                    <button
                      className="secondary-button"
                      disabled={guestSaving}
                      onClick={resetGuestForm}
                      type="button"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>
              </form>
              <section className="card guest-list">
                <div className="card-head">
                  <div>
                    <small>
                      {acceptedGuests} von {guests.length} zugesagt
                    </small>
                    <h2>Eure Gästeliste</h2>
                  </div>
                </div>
                {guestsLoading ? (
                  <p className="empty-state">Gäste werden geladen …</p>
                ) : (
                  guests.length === 0 && (
                    <p className="empty-state">
                      Noch keine Gäste. Fügt links die erste Person hinzu.
                    </p>
                  )
                )}
                {guests.map((guest) => (
                  <article className="guest-card" key={guest.id}>
                    <div className="guest-main">
                      <strong>{guest.name}</strong>
                      <small>
                        {guest.group || "Ohne Gruppe"}
                        {guest.email ? ` · ${guest.email}` : ""}
                      </small>
                      {guest.dietaryNotes && (
                        <small>🍽 {guest.dietaryNotes}</small>
                      )}
                    </div>
                    <span className={`rsvp-status ${guest.status}`}>
                      {rsvpStatusLabel(guest.status)}
                    </span>
                    <div className="invite-actions">
                      <button
                        disabled={guestSaving}
                        onClick={() => void copyInvitationLink(guest)}
                        type="button"
                      >
                        {copiedGuestId === guest.id
                          ? "Link kopiert ✓"
                          : "Link kopieren"}
                      </button>
                      <a
                        href={whatsAppInvitationUrl(guest)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        WhatsApp
                      </a>
                      <button
                        disabled={guestSaving}
                        onClick={() => void shareViaInstagram(guest)}
                        type="button"
                      >
                        Instagram
                      </button>
                      {guest.email && (
                        <a href={emailInvitationUrl(guest)}>E-Mail</a>
                      )}
                      <button
                        disabled={guestSaving}
                        onClick={() => editGuest(guest)}
                        type="button"
                      >
                        Bearbeiten
                      </button>
                      <button
                        className="danger"
                        disabled={guestSaving}
                        onClick={() => void removeGuest(guest.id)}
                        type="button"
                      >
                        Löschen
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </div>
          </Page>
        )}
      </section>
    </main>
  );
}

function Page({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page">
      <p className="eyebrow red">Ouivio Workspace</p>
      <h1>{title}</h1>
      <p className="intro">{intro}</p>
      {children}
    </section>
  );
}

function formatDueDate(value: string | null) {
  if (!value) return "";
  return `Fällig am ${new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`))}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function localDateTimeToIso(value: string) {
  return new Date(value).toISOString();
}

function isoToLocalDateTime(value: string) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatEventDay(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit" }).format(new Date(value));
}

function formatEventMonth(value: string) {
  return new Intl.DateTimeFormat("de-DE", { month: "short" }).format(new Date(value)).toUpperCase();
}

function formatEventDetails(event: CustomerEvent) {
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.startsAt));
  return [time, event.location, event.notes].filter(Boolean).join(" · ");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function budgetStatusLabel(status: BudgetStatus) {
  return status === "paid"
    ? "Bezahlt"
    : status === "reserved"
      ? "Reserviert"
      : "Geplant";
}

function rsvpStatusLabel(status: RsvpStatus) {
  return status === "accepted"
    ? "Zugesagt"
    : status === "declined"
      ? "Abgesagt"
      : "Offen";
}

function invitationUrl(token: string) {
  return `${publicAppUrl}/invite/${token}`;
}

function whatsAppInvitationUrl(guest: Guest) {
  return `https://wa.me/?text=${encodeURIComponent(invitationMessage(guest))}`;
}

function emailInvitationUrl(guest: Guest) {
  const subject = "Deine persönliche Hochzeitseinladung";
  return `mailto:${encodeURIComponent(guest.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(invitationMessage(guest))}`;
}

function invitationMessage(guest: Guest) {
  return `Hallo ${guest.name},\n\nwir möchten diesen besonderen Tag gerne mit dir feiern. Über deinen persönlichen Einladungslink kannst du uns direkt zu- oder absagen:\n\n${invitationUrl(guest.inviteToken)}\n\nWir freuen uns auf dich!`;
}

function accountInitials(email: string) {
  return email.slice(0, 2).toUpperCase() || "OU";
}
