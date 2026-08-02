"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { ensureWeddingWorkspace } from "../../lib/workspace";
import { ensureAccountProfile, ensurePartnerProfile } from "../../lib/account";
import { isPartnerDemoAllowed } from "../../lib/partner-demo";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [partnerDemoAvailable, setPartnerDemoAvailable] = useState(false);

  useEffect(() => {
    const demoUrl = new URL(window.location.href);
    demoUrl.searchParams.set("demo", "1");
    setPartnerDemoAvailable(isPartnerDemoAllowed(demoUrl));
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

    try {
      const supabase = getSupabaseClient();
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
        <p className={styles.eyebrow}>Geschützter Entwicklungszugang</p>
        <h1 id="login-title">Willkommen zurück.</h1>
        <p className={styles.intro}>Der Ouivio Workspace befindet sich derzeit in Entwicklung. Die Anmeldung ist nur für bereits freigeschaltete Konten möglich.</p>

        <div className={styles.prelaunch} role="status">
          <strong>Registrierung noch nicht geöffnet</strong>
          <span>Neue Kunden- und Partnerkonten werden erst zum offiziellen Start freigeschaltet.</span>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <label>E-Mail-Adresse<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="ihr@beispiel.de" required type="email" value={email}/></label>
          <label>Passwort<input autoComplete="current-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password}/></label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} disabled={busy} type="submit">{busy ? "Einen Moment …" : "Sicher anmelden"}</button>
        </form>
        {partnerDemoAvailable && <Link className={styles.back} href="/partner?demo=1">Partner-Demo ohne Anmeldung öffnen →</Link>}
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
  return "Das hat noch nicht funktioniert. Bitte versucht es erneut.";
}
