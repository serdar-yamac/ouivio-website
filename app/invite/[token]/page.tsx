"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchInvitation, submitRsvp, type Invitation, type RsvpStatus } from "../../../lib/guests";
import styles from "./invite.module.css";

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchInvitation(token).then((data) => {
      if (!active) return;
      setInvitation(data);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError("Diese Einladung ist nicht verfügbar.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  const respond = async (response: Exclude<RsvpStatus, "open">) => {
    if (!invitation || saving) return;
    setError("");
    setSaving(true);
    try {
      const currentStatus = await submitRsvp(token, response);
      setInvitation({ ...invitation, currentStatus });
    } catch {
      setError("Eure Antwort konnte nicht gespeichert werden. Bitte versucht es erneut.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className={styles.state}><span>Ouivio</span><p>Einladung wird geöffnet …</p></main>;
  if (!invitation) return <main className={styles.state}><span>Ouivio</span><h1>Einladung nicht gefunden</h1><p>{error || "Bitte prüfe, ob der vollständige Einladungslink geöffnet wurde."}</p><Link href="/index.html#top">Zur Ouivio Startseite</Link></main>;

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="invitation-title">
      <Link className={styles.logo} href="/index.html#top">Ouivio<span>.</span></Link>
      <p className={styles.kicker}>Persönliche Einladung</p>
      <h1 id="invitation-title">Du bist eingeladen,<br/>{invitation.guestName}</h1>
      <p className={styles.message}><strong>{invitation.partnerNames}</strong> möchten diesen besonderen Tag mit dir feiern.</p>
      {(invitation.weddingDate || invitation.weddingLocation) && <dl className={styles.details}>
        {invitation.weddingDate && <div><dt>Datum</dt><dd>{formatInvitationDate(invitation.weddingDate)}</dd></div>}
        {invitation.weddingLocation && <div><dt>Ort</dt><dd>{invitation.weddingLocation}</dd></div>}
      </dl>}
      {invitation.currentStatus === "open" ? <div className={styles.actions} aria-label="Auf Einladung antworten">
        <button disabled={saving} onClick={() => void respond("accepted")} type="button">Ich bin dabei</button>
        <button className={styles.decline} disabled={saving} onClick={() => void respond("declined")} type="button">Ich kann leider nicht</button>
      </div> : <div className={styles.confirmation} role="status">
        <strong>{invitation.currentStatus === "accepted" ? "Zusage gespeichert ✓" : "Absage gespeichert"}</strong>
        <p>Du kannst deine Antwort hier jederzeit ändern.</p>
        <button disabled={saving} onClick={() => void respond(invitation.currentStatus === "accepted" ? "declined" : "accepted")} type="button">Antwort ändern</button>
      </div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  </main>;
}

function formatInvitationDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
