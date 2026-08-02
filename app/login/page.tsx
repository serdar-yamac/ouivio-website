"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { ensureWeddingWorkspace } from "../../lib/workspace";
import { ensureAccountProfile, ensurePartnerProfile } from "../../lib/account";
import { isFeaturePreviewHost } from "../../lib/feature-preview";
import { isPartnerDemoAllowed } from "../../lib/partner-demo";
import type { PartnerCategory } from "../../lib/partner-profile";
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
  const [accessIntent, setAccessIntent] = useState<"customer" | "partner" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "partner">("customer");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<PartnerCategory>("location");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const demoUrl = new URL(window.location.href);
    demoUrl.searchParams.set("demo", "1");
    setPartnerDemoAvailable(isPartnerDemoAllowed(demoUrl));
    const previewRegistrationAvailable = isFeaturePreviewHost(demoUrl);
    setRegistrationAvailable(previewRegistrationAvailable);
    const intent = demoUrl.searchParams.get("intent");
    if (previewRegistrationAvailable && (intent === "customer" || intent === "partner")) {
      setAccountType(intent);
      setAccessIntent(intent);
      setMode("signup");
    }
    if (demoUrl.searchParams.get("confirmed") === "1") {
      setSuccess("E-Mail bestätigt. Ihr könnt euch jetzt anmelden.");
    }
    const supabase = getSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void routeAuthenticatedUser(data.user);
    });
  }, [router]);

  const routeAuthenticatedUser = async (user: import("@supabase/supabase-js").User) => {
    const profile = await ensureAccountProfile(user);
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
  };

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
            data: { account_type: accountType, display_name: displayName.trim(), ...(accountType === "partner" ? { city: city.trim(), category } : {}) },
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

  return (
    <main className={styles.shell}>
      <section className={styles.panel} aria-labelledby="login-title">
        <Link className={styles.logo} href="/">Ouivio<span>.</span></Link>
        <p className={styles.eyebrow}>{mode === "signup" ? accountType === "partner" ? "Partnerkonto anlegen" : "Kundenkonto anlegen" : "Geschützter Entwicklungszugang"}</p>
        <h1 id="login-title">{mode === "signup" ? accountType === "partner" ? "Euer Angebot beginnt hier." : "Eure Planung beginnt hier." : "Willkommen zurück."}</h1>
        <p className={styles.intro}>{mode === "signup" ? accountType === "partner" ? "Erstellt euer Partnerkonto. Danach richtet ihr Unternehmen, Leistungen, Pakete und Verfügbarkeit ein." : "Erstellt euer Kundenkonto, um eure Auswahl zu speichern und Verfügbarkeiten verbindlich zu prüfen." : "Meldet euch an, um eure persönliche Hochzeitsplanung fortzusetzen."}</p>

        {registrationAvailable ? <div className={styles.previewNotice} role="status"><strong>Entwicklungs-Preview</strong><span>Kunden- und Partnerregistrierung sind hier zum Testen geöffnet. Sie bleiben auf localhost und dem Entwicklungsbranch begrenzt.</span></div> : <div className={styles.prelaunch} role="status"><strong>Registrierung noch nicht geöffnet</strong><span>Neue Kunden- und Partnerkonten werden erst zum offiziellen Start freigeschaltet.</span></div>}

        <form className={styles.form} onSubmit={submit}>
          {mode === "signup" && <>{!accessIntent && <div className={styles.accountTypeChoice} role="group" aria-label="Kontoart"><button aria-pressed={accountType === "customer"} onClick={() => setAccountType("customer")} type="button"><strong>Ich plane eine Hochzeit</strong><span>Kundenkonto</span></button><button aria-pressed={accountType === "partner"} onClick={() => setAccountType("partner")} type="button"><strong>Ich biete Leistungen an</strong><span>Partnerkonto</span></button></div>}<label>{accountType === "partner" ? "Unternehmensname" : "Eure Namen"}<input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder={accountType === "partner" ? "z. B. Gut Sonnenhof" : "z. B. Emma & Noah"} required value={displayName}/></label>{accountType === "partner" && <><label>Ort<input autoComplete="address-level2" onChange={(event) => setCity(event.target.value)} placeholder="z. B. Köln" required value={city}/></label><label>Anbieterart<select onChange={(event) => setCategory(event.target.value as PartnerCategory)} value={category}><option value="location">Location</option><option value="photography">Fotografie</option><option value="catering">Catering</option></select></label></>}</>}
          <label>E-Mail-Adresse<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="ihr@beispiel.de" required type="email" value={email}/></label>
          <label>Passwort<input autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">{success}</p>}
          <button className={styles.submit} disabled={busy} type="submit">{busy ? "Einen Moment …" : mode === "signup" ? "Konto anlegen" : "Sicher anmelden"}</button>
        </form>
        {registrationAvailable && <button className={styles.modeSwitch} onClick={() => { setMode(current => current === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); }} type="button">{mode === "signin" ? "Noch kein Konto? Jetzt starten" : "Bereits ein Konto? Anmelden"}</button>}
        {partnerDemoAvailable && <Link className={styles.back} href="/partner?demo=1">Partner-Demo ohne Anmeldung öffnen →</Link>}
        <Link className={styles.back} href="/access">← Kontoart auswählen</Link>
        <Link className={styles.back} href="/">← Zurück zur Startseite</Link>
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
