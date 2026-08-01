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
- Die öffentliche Startseite ist zusätzlich für 320–430 Pixel breite Smartphone-Hochformate optimiert: skalierende Überschriften, einspaltige Hauptaktionen, kompakter Showcase sowie überlauffreie Karten und Formulare.
- Rote handschriftliche Ouivio-Wortmarke ist als eingebettetes Original-Asset vorhanden.
- Link zum Dashboard unter `/dashboard` ist integriert.

### Dashboard

- Responsive Dashboard-Grundlayout mit Seitenleiste und Kopfbereich.
- Bereiche Übersicht, Planung, Kalender, Budget, Anbieter und Gäste sind navigierbar.
- Übersicht mit Countdown, Planungsfortschritt, Budget-, Gäste- und Anbieterkennzahlen.
- Aufgaben können als erledigt/offen markiert werden.
- Aufgaben können angelegt, bearbeitet, mit einem Fälligkeitsdatum versehen und gelöscht werden.
- Aufgaben werden benutzerspezifisch im persönlichen Supabase-Hochzeitsbereich gespeichert und durch Row-Level Security geschützt.
- Aufgaben werden nach der Anmeldung aus der Cloud geladen; Anlegen, Bearbeiten, Statuswechsel und Löschen werden geräteübergreifend synchronisiert.
- Kalender zeigt eine statische Terminzeitleiste.
- Das Gesamtbudget kann geändert und sicher im persönlichen Supabase-Hochzeitsbereich gespeichert werden.
- Budgetposten können mit Kategorie, geplantem und bezahltem Betrag sowie Status angelegt, bearbeitet und gelöscht werden.
- Budgetübersicht und Dashboard-Kennzahl berechnen geplante, bezahlte und verfügbare Beträge aus den echten Benutzerdaten.
- Anbieteransicht zeigt Matches; die globale Suche filtert die Anbieter lokal.
- Gäste können mit Gruppe, E-Mail-Adresse, Ernährungswünschen und RSVP-Status angelegt, bearbeitet und gelöscht werden.
- Jeder Gast erhält einen individuellen Einladungslink, der kopiert oder mit vorbereitetem Text über WhatsApp, Instagram oder E-Mail geteilt werden kann.
- WhatsApp öffnet den vorbereiteten Einladungstext direkt. Für Instagram wird der Text samt Link kopiert und anschließend der Nachrichtenbereich geöffnet, da Instagram keine vorausgefüllten Direktnachrichten per Web-Link unterstützt.
- Für Gäste mit hinterlegter E-Mail-Adresse öffnet ein zusätzlicher Versandknopf eine vollständig vorbereitete persönliche Einladungs-E-Mail im Standard-Mailprogramm.
- Die öffentliche Einladungsseite unter `/invite/[token]` ermöglicht Zu- und Absagen ohne Ouivio-Konto; geänderte Antworten werden im geöffneten Dashboard spätestens nach zehn Sekunden und beim Zurückkehren zum Tab automatisch geladen.
- Gästeanzahl, Zusagen und offene Antworten werden aus den echten Supabase-Daten auf der Übersicht berechnet.
- Rücklink vom Dashboard zur Startseite ist vorhanden.
- Das Dashboard ist für schmale Smartphones optimiert: sichere untere Navigation, überlauffreier Kopfbereich, kompaktere Karten und gut erreichbare Sharing-Aktionen mit mindestens 44 Pixel hohen Touch-Zielen.
- Supabase-E-Mail-/Passwort-Registrierung und Anmeldung stehen unter `/login` bereit.
- Nicht angemeldete Dashboard-Aufrufe werden zur Anmeldung weitergeleitet; Sitzungen werden automatisch gespeichert und erneuert.
- Nach der ersten bestätigten Anmeldung wird automatisch ein persönlicher Hochzeitsbereich mit Eigentümer-Mitgliedschaft angelegt.
- Abmeldung ist direkt im Dashboard möglich.

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
- Das Supabase-Datenbankschema ist im Projekt `Ouivio` aktiv, die öffentlichen Anwendungsvariablen sind lokal und für den Feature-Branch in Vercel Preview verbunden.
- Authentifizierung und clientseitiger Routenschutz sind umgesetzt; ein vollständiger Registrierungstest mit echter E-Mail-Bestätigung erfordert noch ein Benutzerkonto.
- Frühere Browser-Demoaufgaben aus `ouivio.tasks.v2` werden bewusst nicht automatisch in einen echten Benutzerbereich übernommen.
- Kalendertermine sind nicht editierbar und nicht mit Google Calendar oder Outlook verbunden.
- Anbieterprofile, Detailansichten, Verfügbarkeit, Anfragen und Buchungen sind noch nicht produktiv umgesetzt.
- Einladungslinks verwenden vor dem Production-Rollout bewusst den stabilen Vercel-Feature-Branch-Alias; die endgültige Ouivio-Domain muss vor dem öffentlichen Start eingesetzt werden.
- Gästelisten-Import, Haushalte, Begleitpersonen und serverseitiger automatischer Versand fehlen noch; persönliche Links können bereits über WhatsApp, Instagram oder das Standard-Mailprogramm geteilt werden.
- Suche wirkt derzeit nur auf die lokale Anbieterliste.
- Benachrichtigungen, Nachrichten und Mehrbenutzer-Zusammenarbeit fehlen.
- Es gibt noch keine automatisierten Tests.
- `npm audit --omit=dev` meldet drei hohe transitive Hinweise über die bestehende Next.js-15-Abhängigkeit (`postcss` und `sharp`); eine separat geprüfte Next.js-Major-Aktualisierung ist offen.

## Offene Aufgaben

Priorität 1 – Produktgrundlage:

1. Registrierung und E-Mail-Bestätigung mit einem echten Benutzerkonto Ende-zu-Ende prüfen.
2. Demo-Daten schrittweise durch echte, benutzerspezifische Daten ersetzen.

Priorität 2 – Kernfunktionen:

1. Aufgaben mehreren Mitgliedern zuweisen und die gemeinsame Bearbeitung ausbauen.
2. Kalender mit editierbaren Terminen sowie später Google-/Outlook-Synchronisation ausbauen.
3. Budget um Beleg-Uploads, Fälligkeiten und detaillierte Kategorienauswertungen erweitern.
4. Gästeliste um Import, Haushalte, Begleitpersonen und E-Mail-Einladungsversand erweitern.
5. Anbieterprofile, Filter, Favoriten, Anfragen, Verfügbarkeit und Buchungsablauf entwickeln.

Priorität 3 – Qualität und Betrieb:

1. Komponenten und Datenzugriff aus der großen Dashboard-Seite modularisieren.
2. Automatisierte Unit-, Integrations- und End-to-End-Tests ergänzen.
3. Barrierefreiheit, mobile Abläufe, Ladezustände und Fehlermeldungen systematisch prüfen.
4. Logging, Monitoring, Analytics sowie Datenschutz- und Einwilligungsanforderungen definieren.
5. Preview- und Production-Deploymentprozess dokumentieren und absichern.

## Wichtige Entscheidungen

- Die Original-HTML-Startseite bleibt die verbindliche öffentliche Designreferenz.
- Mobile Anpassungen an der Startseite beschränken sich auf responsive CSS; Wortmarke, Inhalte, Farben und Desktopgestaltung bleiben unverändert.
- Die rote handschriftliche Ouivio-Wortmarke ist unveränderlich.
- Neue Funktionen entstehen im bestehenden Dashboard; Startseite und Dashboard bleiben technisch und gestalterisch getrennt.
- Laufende Kernentwicklung erfolgt auf `feat/ouivio-core-foundation`.
- `AGENTS.md` und `PROJECT_STATUS.md` sind vor jeder Änderung zu lesen.
- `PROJECT_STATUS.md` wird nach jedem größeren Arbeitsschritt aktualisiert.
- Beauftragte Entwicklungsänderungen werden nach erfolgreicher Prüfung automatisch auf `feat/ouivio-core-foundation` committed und gepusht; diese Freigabe umfasst weder `main` noch Production-Deployments oder andere externe Änderungen.
- Supabase/Postgres ist die persistente Datenbasis. Row-Level Security bleibt verpflichtend; anonyme öffentliche Schreibrechte werden nicht geöffnet.
- Vorhandene lokale Demoaufgaben werden nicht automatisch in neue Benutzerkonten kopiert, damit echte Bereiche sauber beginnen.
- Gesamtbudget und Budgetposten werden wie Aufgaben direkt im persönlichen Supabase-Bereich gespeichert und durch die vorhandene Mitgliedschafts-RLS geschützt.
- Öffentliche RSVP-Links sind zufällige UUID-Bearer-Links. Anonyme Rollen besitzen keine direkten Rechte auf `guests`; zwei bewusst eng begrenzte `SECURITY DEFINER`-RPCs lesen nur minimale Einladungsdaten beziehungsweise ändern ausschließlich auf `accepted` oder `declined`.
- Ein ungültiger Einladungstoken liefert keine Daten. Einladungslinks sind vertraulich zu behandeln und werden beim Löschen des Gastes automatisch ungültig.
- Das Grundschema umfasst Hochzeiten, Mitglieder, Aufgaben, Termine, Budgetposten, Gäste, Anbieter und Favoriten.
- Interne RLS-Hilfsfunktionen liegen im nicht exponierten `private`-Schema; Funktions- und Tabellenrechte sind explizit auf authentifizierte Nutzer begrenzt.
- Supabase Auth verwaltet Browser-Sitzungen; Autorisierung erfolgt ausschließlich über Datenbank-RLS und nicht über bearbeitbare Nutzer-Metadaten.

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
- Supabase Auth Site URL auf den stabilen Feature-Branch-Preview gesetzt; E-Mail-/Passwort-Authentifizierung ist für das Projekt aktiv.
- Auth-Ablauf lokal geprüft: `/dashboard` leitet ohne Sitzung nach `/login`, ein ungültiger Login wird abgewiesen und verständlich angezeigt.
- TypeScript-Prüfung und optimierter Production-Build nach Einführung von Supabase Auth erfolgreich.
- Optimierter Next.js-Production-Build nach Umstellung der Aufgabenverwaltung auf Supabase erfolgreich.
- Integrität der geschützten Startseiten erneut per SHA-256 bestätigt; beide Dateien entsprechen unverändert dem festgelegten Hash.
- TypeScript-Prüfung nach Einführung der editierbaren Supabase-Budgetverwaltung erfolgreich.
- Optimierter Next.js-Production-Build und lokale Browserprüfung nach der Budgetanbindung erfolgreich; der geschützte Dashboard-Aufruf leitet ohne Sitzung fehlerfrei zur Anmeldung.
- Migration `20260801114314_guest_rsvp_links.sql` im Supabase-Projekt ausgeführt: Token-Spalte, eindeutiger Index, Antwortzeitpunkt und zwei RSVP-RPCs sind aktiv.
- Sicherheitsprüfung bestätigt: `anon` kann `guests` weder lesen noch ändern, darf nur die zwei vorgesehenen RPCs ausführen; ungültige Tokens liefern 0 Datensätze.
- Öffentlicher Data-API-Test bestätigt: Einladungs-RPC antwortet auf einen ungültigen Token mit HTTP 200 und leerem Ergebnis, direkter anonymer Gästezugriff wird mit HTTP 401 abgewiesen.
- Supabase Security Advisor nach der RSVP-Migration: 0 Fehler, 5 Warnungen. Vier Warnungen dokumentieren die bewusst öffentlich ausführbaren, tokenbegrenzten `SECURITY DEFINER`-RPCs; eine bestehende Warnung betrifft deaktivierten Schutz vor geleakten Passwörtern.
- TypeScript-Prüfung und optimierter Next.js-Production-Build einschließlich dynamischer Route `/invite/[token]` erfolgreich.
- TypeScript-Prüfung und optimierter Next.js-Production-Build nach Ergänzung des vorbereiteten E-Mail-Versands erfolgreich.
- TypeScript-Prüfung und optimierter Next.js-Production-Build nach Erweiterung um WhatsApp-, Instagram- und E-Mail-Teilen erfolgreich.
- TypeScript-Prüfung und optimierter Next.js-Production-Build nach der Hochformat-Optimierung der öffentlichen Startseite erfolgreich; `public/index.html` und `index.html` sind weiterhin bytegleich.
- Mobile Dashboard-Styles für 320–430 Pixel breite Smartphones geprüft und überarbeitet; Navigation, Kopfbereich, Karten, Gästedaten und Sharing-Aktionen passen sich ohne horizontales Überlaufen an.
- Lokale Browserprüfung der öffentlichen Einladungsroute erfolgreich: ungültiger Token zeigt den sicheren Nicht-gefunden-Zustand ohne Fehler-Overlay oder Konsolenfehler.
- Transaktionaler RSVP-Ende-zu-Ende-Test erfolgreich: Testgast angelegt, Einladung als `anon` gelesen, Zusage als `anon` gespeichert, Antwortzeitpunkt geprüft und sämtliche Testdaten per `ROLLBACK` verworfen.
- Abhängigkeitsprüfung ausgeführt: keine kritischen Hinweise; drei hohe transitive Hinweise der bestehenden Next.js-15-Lieferkette sind dokumentiert und nicht automatisch mit einem riskanten Major-Wechsel behoben worden.
