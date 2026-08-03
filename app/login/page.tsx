"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { ensureWeddingWorkspace } from "../../lib/workspace";
import { ensureAccountProfile, ensurePartnerProfile } from "../../lib/account";
import { isFeaturePreviewHost } from "../../lib/feature-preview";
import { isPartnerDemoAllowed } from "../../lib/partner-demo";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [partnerDemoAvailable, setPartnerDemoAvailable] = useState(false);
  const [registrationAvailable, setRegistrationAvailable] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [partnerCity, setPartnerCity] = useState("");
  const [partnerCategory, setPartnerCategory] = useState<"location" | "photography" | "catering">("location");
  const [accountType, setAccountType] = useState<"customer" | "partner">("customer");
  const [activeAccountEmail, setActiveAccountEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const isRouting = useRef(false);

  const routeAuthenticatedUser = useCallback(async (user: import("@supabase/supabase-js").User, partnerRegistrationRequested = false) => {
    if (isRouting.current) return;
    isRouting.current = true;
    setCheckingSession(true);

    try {
      const profile = await ensureAccountProfile(user);
      if (partnerRegistrationRequested && profile.type !== "partner") {
        setActiveAccountEmail(user.email || "einem Kundenkonto");
        isRouting.current = false;
        setCheckingSession(false);
        return;
      }
      if (profile.type === "partner") {
        const metadata = user.user_metadata;
        const partnerCategory = metadata.category === "location" || metadata.category === "photography" || metadata.category === "catering" ? metadata.category : undefined;
        const partnerCity = typeof metadata.city === "string" ? metadata.city : undefined;
        await ensurePartnerProfile(user.id, profile.displayName, { city: partnerCity, category: partnerCategory });
        router.replace("/partner");
      } else {
        await ensureWeddingWorkspace(user);
        router.replace("/dashboard");
      }
    } catch (caught) {
      isRouting.current = false;
      setCheckingSession(false);
      setError(authErrorMessage(caught));
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    const demoUrl = new URL(window.location.href);
    demoUrl.searchParams.set("demo", "1");
    setPartnerDemoAvailable(isPartnerDemoAllowed(demoUrl));
    const previewRegistrationAvailable = isFeaturePreviewHost(demoUrl);
    setRegistrationAvailable(previewRegistrationAvailable);
    const intent = demoUrl.searchParams.get("intent");
    if (intent === "partner") {
      setAccountType("partner");
      if (previewRegistrationAvailable) setMode("signup");
    }
    if (previewRegistrationAvailable && intent === "customer") {
      setAccountType("customer");
      setMode("signup");
    }
    if (demoUrl.searchParams.get("confirmed") === "1") {
      setSuccess("E-Mail bestätigt. Ihr könnt euch jetzt anmelden.");
    }
    const supabase = getSupabaseClient();
    const restoreSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (!active) return;
      if (sessionError) setError(authErrorMessage(sessionError));
      if (data.user) {
        await routeAuthenticatedUser(data.user, intent === "partner");
        return;
      }
      setCheckingSession(false);
    };

    void restoreSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void routeAuthenticatedUser(session.user, intent === "partner");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [routeAuthenticatedUser]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getSupabaseClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_type: accountType,
              display_name: accountType === "partner" ? businessName.trim() : displayName.trim(),
              ...(accountType === "partner" ? { city: partnerCity.trim(), category: partnerCategory } : {}),
            },
            emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.user && !data.session) {
          setSuccess("Bitte bestätigt eure E-Mail-Adresse. Danach könnt ihr eure Auswahl dauerhaft im Warenkorb speichern.");
          return;
        }
        if (!data.user) throw new Error("Konto konnte nicht angelegt werden.");
        await routeAuthenticatedUser(data.user);
        return;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      await routeAuthenticatedUser(data.user);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const signOutForPartnerRegistration = async () => {
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await getSupabaseClient().auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      isRouting.current = false;
      setActiveAccountEmail("");
      setMode("signup");
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.shell}>
      <section className={styles.panel} aria-labelledby="login-title">
        <Link className={styles.logo} href="/index.html#top">Ouivio<span>.</span></Link>
        <p className={styles.eyebrow}>{mode === "signup" ? accountType === "partner" ? "Partnerkonto anlegen" : "Kundenkonto anlegen" : "Geschützter Entwicklungszugang"}</p>
        <h1 id="login-title">{mode === "signup" ? accountType === "partner" ? "Euer Angebot beginnt hier." : "Eure Planung beginnt hier." : "Willkommen zurück."}</h1>
        <p className={styles.intro}>{mode === "signup" ? accountType === "partner" ? "Erstellt euer Partnerkonto. Danach richtet ihr Unternehmen, Leistungen, Pakete und Verfügbarkeit ein." : "Erstellt euer Kundenkonto, um eure Auswahl zu speichern und Verfügbarkeiten verbindlich zu prüfen." : "Meldet euch an, um eure persönliche Hochzeitsplanung fortzusetzen."}</p>

        {checkingSession ? <div className={styles.sessionCheck} role="status"><strong>Angemeldetes Konto wird geprüft …</strong><span>Wenn ihr bereits angemeldet seid, öffnen wir eure Planung automatisch.</span></div> : activeAccountEmail ? <>
          <div className={styles.prelaunch} role="status"><strong>Ihr seid bereits als Kunde angemeldet</strong><span>{activeAccountEmail} ist ein Kundenkonto. Für den Partner-Test benötigt ihr ein separates Konto mit eigener E-Mail-Adresse.</span></div>
          <button className={styles.existingAccount} disabled={busy} onClick={() => void signOutForPartnerRegistration()} type="button"><span>Kundenkonto auf diesem Gerät abmelden</span><strong>{busy ? "Einen Moment …" : "Partnerkonto anlegen →"}</strong></button>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </> : <>
          {registrationAvailable ? <div className={styles.previewNotice} role="status"><strong>Entwicklungs-Preview</strong><span>{accountType === "partner" ? "Die Partnerregistrierung ist für den gemeinsamen Marketplace-Test geöffnet. Vor dem Launch wird sie wieder über die Pilotphase gesteuert." : "Die Kundenregistrierung ist hier zum Testen geöffnet. Partner werden während der limitierten Pilotphase persönlich freigeschaltet."}</span></div> : <div className={styles.prelaunch} role="status"><strong>Registrierung noch nicht geöffnet</strong><span>Neue Kundenkonten werden erst zum offiziellen Start freigeschaltet.</span></div>}

          {registrationAvailable && mode === "signup" && <button className={styles.existingAccount} onClick={() => { setMode("signin"); setError(""); setSuccess(""); }} type="button"><span>Bereits registriert?</span><strong>Jetzt sicher anmelden →</strong></button>}
          <form className={styles.form} onSubmit={submit}>
            {mode === "signup" && (accountType === "partner" ? <>
              <label>Unternehmensname<input autoComplete="organization" onChange={(event) => setBusinessName(event.target.value)} placeholder="z. B. Studio Rosenlicht" required value={businessName}/></label>
              <label>Ort<input autoComplete="address-level2" onChange={(event) => setPartnerCity(event.target.value)} placeholder="z. B. Köln" required value={partnerCity}/></label>
              <label>Anbieterart<select onChange={(event) => setPartnerCategory(event.target.value as "location" | "photography" | "catering")} value={partnerCategory}><option value="location">Location</option><option value="photography">Fotografie</option><option value="catering">Catering</option></select></label>
            </> : <label>Eure Namen<input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="z. B. Emma & Noah" required value={displayName}/></label>)}
            <label>E-Mail-Adresse<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="ihr@beispiel.de" required type="email" value={email}/></label>
            <label>Passwort<input autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {success && <p className={styles.success} role="status">{success}</p>}
            <button className={styles.submit} disabled={busy} type="submit">{busy ? "Einen Moment …" : mode === "signup" ? "Konto anlegen" : "Sicher anmelden"}</button>
          </form>
          {registrationAvailable && <button className={styles.modeSwitch} onClick={() => { setMode(current => current === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }} type="button">{mode === "signin" ? accountType === "partner" ? "Noch kein Partnerkonto? Jetzt starten" : "Noch kein Konto? Jetzt starten" : accountType === "partner" ? "Ich habe bereits ein Partnerkonto" : "Ich möchte ein neues Kundenkonto anlegen"}</button>}
        </>}
        {partnerDemoAvailable && <Link className={styles.back} href="/partner?demo=1">Partner-Demo ohne Anmeldung öffnen →</Link>}
        <Link className={styles.back} href="/access">← Kontoart auswählen</Link>
        <Link className={styles.back} href="/index.html#top">← Zurück zur Startseite</Link>
      </section>
      <aside className={styles.promise} aria-label="Ouivio Vorteile">
        <p>Ouivio entsteht.</p>
        <strong>In Ruhe entwickeln.<br/>Sauber starten.</strong>
        <span>Die öffentliche Startseite ist bereits online. Der Workspace bleibt bis zur offiziellen Freigabe geschützt.</span>
      </aside>
    </main>
  );
}

function authErrorMessage(caught: unknown) {
  if (!(caught instanceof Error)) return "Anmeldung fehlgeschlagen.";
  if (caught.message === "Invalid login credentials") return "E-Mail-Adresse oder Passwort stimmen nicht.";
  if (caught.message.includes("already registered")) return "Für diese E-Mail-Adresse gibt es bereits ein Konto. Bitte meldet euch an.";
  if (caught.message.includes("Password should be")) return "Bitte verwendet ein Passwort mit mindestens acht Zeichen.";
  return "Das hat noch nicht funktioniert. Bitte versucht es erneut.";
}
