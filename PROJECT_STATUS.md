# Ouivio – Projektstatus

Stand: 1. August 2026

Branch: `feat/ouivio-core-foundation`

Ausgangs-Commit der Bestandsaufnahme: `3585c2a` (`Serve approved Ouivio landing page design`)

## Aktueller Entwicklungsstand

Ouivio besteht aus einer geschützten statischen HTML-Startseite und einem separaten interaktiven Next.js-Dashboard. Die Root-Route `/` leitet auf `/index.html` um; von dort führt „Dashboard öffnen“ zu `/dashboard`.

Technische Grundlage:

- Next.js 15.5 mit App Router
- React 19 und TypeScript
- Statische Startseite in `public/index.html`
- Dashboard in `app/dashboard/page.tsx`
- Zentrale Styles in `app/globals.css`
- GitHub-Repository `serdar-yamac/ouivio-website`
- Vercel-Projekt `ouivio-website`, mit GitHub verbunden
- Produktionsdomains `ouivio.com`, `www.ouivio.com` und `ouivio-website.vercel.app`
- Eigenständiges Supabase-Projekt `Ouivio` in der Region Frankfurt (`eu-central-1`)

## Fertige bzw. funktionsfähige Bestandteile

### Startseite

- Original-HTML-Startseite wird unter `/index.html` ausgeliefert.
- Responsive Landingpage mit Navigation, Vorteilen, Ablauf, FAQ und Handlungsaufrufen.
- Rote handschriftliche Ouivio-Wortmarke ist als eingebettetes Original-Asset vorhanden.
- Link zum Dashboard unter `/dashboard` ist integriert.

### Dashboard

- Responsive Dashboard-Grundlayout mit Seitenleiste und Kopfbereich.
- Bereiche Übersicht, Planung, Kalender, Budget, Anbieter und Gäste sind navigierbar.
- Übersicht mit Countdown, Planungsfortschritt, Budget-, Gäste- und Anbieterkennzahlen.
- Aufgaben können als erledigt/offen markiert werden.
- Aufgaben können angelegt, bearbeitet, mit einem Fälligkeitsdatum versehen und gelöscht werden.
- Aufgabenstatus und Aufgabendaten werden im Browser über das versionierte Schema `ouivio.tasks.v2` gespeichert.
- Kalender zeigt eine statische Terminzeitleiste.
- Budget zeigt Gesamtbudget und statische Kategorien.
- Anbieteransicht zeigt Matches; die globale Suche filtert die Anbieter lokal.
- Gästeliste zeigt Namen, Gruppen und RSVP-Status.
- Rücklink vom Dashboard zur Startseite ist vorhanden.

### Deployment

- Vercel-Projekt und GitHub-Repository sind verbunden.
- Production-Deployment für `main` ist erreichbar und im Zustand `READY`.
- Für `feat/ouivio-core-foundation` existieren erfolgreiche Preview-Deployments.
- Frühere fehlgeschlagene Preview-Builds wurden durch spätere erfolgreiche Builds abgelöst.

### Datenbankgrundlage

- Die Migration `supabase/migrations/001_initial_schema.sql` ist im eigenständigen Supabase-Projekt `Ouivio` ausgeführt.
- Acht Tabellen für Hochzeiten, Mitglieder, Aufgaben, Termine, Budget, Gäste, Anbieter und Favoriten sind angelegt.
- Row-Level Security ist auf allen acht Tabellen aktiv; elf Richtlinien begrenzen den Zugriff auf authentifizierte Mitglieder beziehungsweise Eigentümer.
- Die interne Mitgliedschaftsprüfung liegt im nicht exponierten `private`-Schema und kann nicht von anonymen Nutzern ausgeführt werden.
- Der Supabase Security Advisor meldet nach der Migration keine Fehler, Warnungen oder weiteren Hinweise.
- Die lokalen Entwicklungsvariablen verweisen auf das eigenständige EU-Projekt; `.env.local` bleibt über `.gitignore` vom Repository ausgeschlossen.
- Vercel Preview besitzt branch-spezifische öffentliche Verbindungswerte für `feat/ouivio-core-foundation`. Die bestehenden Production- und Marketplace-Variablen wurden nicht verändert.

## Bekannte Einschränkungen

- Das Dashboard verwendet überwiegend fest codierte Demo-Daten.
- Das Supabase-Datenbankschema ist im Projekt `Ouivio` aktiv, die öffentlichen Anwendungsvariablen sind lokal und für den Feature-Branch in Vercel Preview verbunden, und eine typisierte REST-Datenzugriffsschicht ist vorbereitet; Authentifizierung ist noch nicht umgesetzt.
- Es gibt keine Benutzerkonten, Anmeldung oder Autorisierung.
- Aufgaben werden bis zur Aktivierung von Supabase Auth weiterhin nur lokal im jeweiligen Browser gespeichert und nicht zwischen Geräten synchronisiert.
- Kalendertermine sind nicht editierbar und nicht mit Google Calendar oder Outlook verbunden.
- Budgetposten können nicht angelegt, geändert oder bezahlt markiert werden.
- Anbieterprofile, Detailansichten, Verfügbarkeit, Anfragen und Buchungen sind noch nicht produktiv umgesetzt.
- Gästedaten können nicht hinzugefügt, importiert, bearbeitet oder eingeladen werden.
- Suche wirkt derzeit nur auf die lokale Anbieterliste.
- Benachrichtigungen, Nachrichten und Mehrbenutzer-Zusammenarbeit fehlen.
- Es gibt noch keine automatisierten Tests.

## Offene Aufgaben

Priorität 1 – Produktgrundlage:

1. Authentifizierung, geschützte Dashboard-Routen und Mandantentrennung umsetzen.
2. Dashboard-Aufgaben nach der Anmeldung über die vorbereitete REST-Schicht synchronisieren.
3. Demo-Daten schrittweise durch echte, benutzerspezifische Daten ersetzen.

Priorität 2 – Kernfunktionen:

1. Aufgaben nach Supabase-Aktivierung mehreren Mitgliedern zuweisen und geräteübergreifend synchronisieren.
2. Kalender mit editierbaren Terminen sowie später Google-/Outlook-Synchronisation ausbauen.
3. Budgetkategorien, Ausgaben, Zahlungsstatus und Belege verwalten.
4. Gästeliste mit Import, Haushalten, RSVP, Ernährungswünschen und Einladungsstatus erweitern.
5. Anbieterprofile, Filter, Favoriten, Anfragen, Verfügbarkeit und Buchungsablauf entwickeln.

Priorität 3 – Qualität und Betrieb:

1. Komponenten und Datenzugriff aus der großen Dashboard-Seite modularisieren.
2. Automatisierte Unit-, Integrations- und End-to-End-Tests ergänzen.
3. Barrierefreiheit, mobile Abläufe, Ladezustände und Fehlermeldungen systematisch prüfen.
4. Logging, Monitoring, Analytics sowie Datenschutz- und Einwilligungsanforderungen definieren.
5. Preview- und Production-Deploymentprozess dokumentieren und absichern.

## Wichtige Entscheidungen

- Die Original-HTML-Startseite bleibt die verbindliche öffentliche Designreferenz.
- Die rote handschriftliche Ouivio-Wortmarke ist unveränderlich.
- Neue Funktionen entstehen im bestehenden Dashboard; Startseite und Dashboard bleiben technisch und gestalterisch getrennt.
- Laufende Kernentwicklung erfolgt auf `feat/ouivio-core-foundation`.
- `AGENTS.md` und `PROJECT_STATUS.md` sind vor jeder Änderung zu lesen.
- `PROJECT_STATUS.md` wird nach jedem größeren Arbeitsschritt aktualisiert.
- Beauftragte Entwicklungsänderungen werden nach erfolgreicher Prüfung automatisch auf `feat/ouivio-core-foundation` committed und gepusht; diese Freigabe umfasst weder `main` noch Production-Deployments oder andere externe Änderungen.
- Der derzeitige `localStorage`-Ansatz ist nur eine Prototyp-Lösung und keine langfristige Datenarchitektur.
- Supabase/Postgres ist als persistente Datenbasis vorbereitet. Row-Level Security bleibt verpflichtend; anonyme öffentliche Schreibrechte werden nicht geöffnet.
- Das Grundschema umfasst Hochzeiten, Mitglieder, Aufgaben, Termine, Budgetposten, Gäste, Anbieter und Favoriten.
- Interne RLS-Hilfsfunktionen liegen im nicht exponierten `private`-Schema; Funktions- und Tabellenrechte sind explizit auf authentifizierte Nutzer begrenzt.

## Letzte Prüfung

- Branch und Remote-Synchronität geprüft: sauber, vor dieser Dokumentationsänderung identisch mit `origin/feat/ouivio-core-foundation`.
- Projektstruktur, Commit-Historie, Startseiten-Routing und Dashboard-Code geprüft.
- Lokale Vorschau aus demselben Branch zuvor erfolgreich unter `/index.html` mit HTTP 200 aufgerufen.
- Diese Statusdatei beschreibt den belegbaren Stand; es wurden keine unfertigen Integrationen als produktiv markiert.
- Dauerhaften automatischen Synchronisations-, Dokumentations-, Commit- und Push-Ablauf für künftige Entwicklungsänderungen festgehalten.
- TypeScript-Prüfung und optimierter Next.js-Production-Build nach Einführung der Supabase-Grundlage und Aufgabenverwaltung erfolgreich.
- Browserprüfung erfolgreich: Dashboard lädt ohne Fehler-Overlay oder Konsolenfehler; Aufgabe konnte angelegt und wieder gelöscht werden.
- Supabase-Migration im eigenständigen EU-Projekt erfolgreich ausgeführt und geprüft: 8 Tabellen, 8 Tabellen mit RLS und 11 Richtlinien.
- Berechtigungsprüfung erfolgreich: `authenticated` darf die interne Mitgliedschaftsfunktion ausführen, `anon` nicht.
- Supabase Security Advisor geprüft: 0 Fehler, 0 Warnungen und 0 Hinweise.
- Lokale Verbindung geprüft: Supabase Auth-Einstellungen antworten mit HTTP 200; anonyme Anbieterabfrage liefert wegen RLS keine Datensätze.
- Vercel-Konfiguration geprüft: `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` sind ausschließlich für Preview und den Branch `feat/ouivio-core-foundation` hinterlegt; Production blieb unverändert.
