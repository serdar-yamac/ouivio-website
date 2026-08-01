"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { ensureWeddingWorkspace } from "../../lib/workspace";
import { ensureAccountProfile, ensurePartnerProfile, type AccountType } from "../../lib/account";
import styles from "./login.module.css";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerNames, setPartnerNames] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void routeAuthenticatedUser(data.user);
    });
  }, [router]);

  const routeAuthenticatedUser = async (user: import("@supabase/supabase-js").User) => {
    const profile = await ensureAccountProfile(user);
    if (profile.type === "partner") {
      await ensurePartnerProfile(user.id, profile.displayName);
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
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { partner_names: accountType === "customer" ? partnerNames.trim() : undefined, account_type: accountType, display_name: partnerNames.trim() },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Bitte bestätigt eure E-Mail. Danach könnt ihr euch anmelden.");
          return;
        }
        if (data.user) await routeAuthenticatedUser(data.user);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        await routeAuthenticatedUser(data.user);
      }
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
        <p className={styles.eyebrow}>Euer Wedding Workspace</p>
        <h1 id="login-title">{mode === "signin" ? "Willkommen zurück." : "Startet euren gemeinsamen Plan."}</h1>
        <p className={styles.intro}>{mode === "signin" ? "Meldet euch an und plant genau dort weiter, wo ihr aufgehört habt." : "Erstellt ein Konto. Euer persönlicher Hochzeitsbereich wird automatisch angelegt."}</p>

        <div className={styles.tabs} role="tablist" aria-label="Anmeldung auswählen">
          <button aria-selected={mode === "signin"} onClick={() => setMode("signin")} role="tab" type="button">Anmelden</button>
          <button aria-selected={mode === "signup"} onClick={() => setMode("signup")} role="tab" type="button">Registrieren</button>
        </div>

        <form className={styles.form} onSubmit={submit}>
          {mode === "signup" && <fieldset className={styles.accountChoice}><legend>Wie möchtet ihr Ouivio nutzen?</legend><button aria-pressed={accountType === "customer"} onClick={() => setAccountType("customer")} type="button"><strong>Hochzeit planen</strong><span>Für Paare und ihre Planung</span></button><button aria-pressed={accountType === "partner"} onClick={() => setAccountType("partner")} type="button"><strong>Als Partner anbieten</strong><span>Für Locations und Dienstleister</span></button></fieldset>}
          {mode === "signup" && <label>{accountType === "partner" ? "Unternehmensname" : "Eure Namen"}<input autoComplete="name" maxLength={120} onChange={(event) => setPartnerNames(event.target.value)} placeholder={accountType === "partner" ? "Zum Beispiel: Gut Sonnenhof" : "Zum Beispiel: Sarah & Daniel"} required value={partnerNames}/></label>}
          <label>E-Mail-Adresse<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="ihr@beispiel.de" required type="email" value={email}/></label>
          <label>Passwort<input autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {message && <p className={styles.success} role="status">{message}</p>}
          <button className={styles.submit} disabled={busy} type="submit">{busy ? "Einen Moment …" : mode === "signin" ? "Sicher anmelden" : "Konto erstellen"}</button>
        </form>
        <Link className={styles.back} href="/">← Zurück zur Startseite</Link>
      </section>
      <aside className={styles.promise} aria-label="Ouivio Vorteile">
        <p>Alles für euren Tag.</p>
        <strong>Ein Konto.<br/>Ein klarer Plan.</strong>
        <span>Aufgaben, Termine, Budget und Gäste bleiben geschützt in eurem gemeinsamen Bereich.</span>
      </aside>
    </main>
  );
}

function authErrorMessage(caught: unknown) {
  if (!(caught instanceof Error)) return "Anmeldung fehlgeschlagen.";
  if (caught.message === "Invalid login credentials") return "E-Mail-Adresse oder Passwort stimmen nicht.";
  if (caught.message.toLowerCase().includes("already registered")) return "Für diese E-Mail-Adresse gibt es bereits ein Konto.";
  if (caught.message.toLowerCase().includes("password")) return "Das Passwort erfüllt die Sicherheitsanforderungen noch nicht.";
  return "Das hat noch nicht funktioniert. Bitte versucht es erneut.";
}
