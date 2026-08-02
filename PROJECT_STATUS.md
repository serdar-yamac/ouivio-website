# Ouivio – Projektstatus

Stand: 2. August 2026

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
- Im mobilen Hero erscheint die Ouivio-Vorschau vor dem Text; die Verfügbarkeits-Kalenderkarte bleibt auch im Hochformat sichtbar und passt vollständig in die Bildschirmbreite.
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
- Die Anmeldung für bereits freigeschaltete Kunden- und Partnerkonten steht unter `/login` bereit; die öffentliche Registrierung ist während der Entwicklungsphase in der Oberfläche deaktiviert.
- Nicht angemeldete Dashboard-Aufrufe werden zur Anmeldung weitergeleitet; Sitzungen werden automatisch gespeichert und erneuert.
- Nach der ersten bestätigten Anmeldung wird automatisch ein persönlicher Hochzeitsbereich mit Eigentümer-Mitgliedschaft angelegt.
- Abmeldung ist direkt im Dashboard möglich.
- Registrierung unterscheidet Kunden- und Partnerkonten und leitet nach der Anmeldung in den passenden Bereich weiter.
- Partner besitzen unter `/partner` ein eigenständiges responsives Dashboard mit Kennzahlen, Monatskalender und Tagesagenda.
- Für die Entwicklung steht unter `/partner?demo=1` ein klar gekennzeichneter Partner-Demomodus ohne Anmeldung bereit. Er ist auf localhost und den festen Feature-Preview-Host begrenzt, verwendet ausschließlich lokale Beispieldaten und kann keine produktiven Supabase-Daten lesen oder verändern.
- Partnertermine werden als Anfrage, Option, Buchung, Termin oder Sperrzeit im persönlichen Supabase-Partnerbereich gespeichert.
- Partnertermine können nachträglich bearbeitet und mit Status, Ort sowie internen Notizen gepflegt werden.
- Der Kalender erkennt zeitliche Überschneidungen mit aktiven Einträgen und warnt vor dem Speichern, ohne begründete Paralleltermine mehrerer Teams zu blockieren.
- Ausgewählte Kalendertage lassen sich über eine Schnellaktion als Sperrzeit vorbereiten; Tagesagenda und Termine zeigen Status sowie Ouivio-/Importquelle.
- Ein Integrationszentrum für Google Calendar, Outlook/Microsoft 365 und Apple Calendar/iCalendar ist vorbereitet; die produktiven Verbindungen benötigen noch die jeweiligen Anbieter-Zugangsdaten.
- Partnerprofile unterscheiden zunächst Location, Fotografie und Catering; das Dashboard kann dadurch spezialisierte Funktionsbereiche anzeigen.
- Fotografen besitzen im Bereich „Leistungen“ eine Portfolioverwaltung für JPG-, PNG- und WebP-Bilder bis 10 MB mit Titel und Bildstil.
- Portfolio-Dateien liegen in einem privaten Supabase-Storage-Bucket. Metadaten sind per RLS geschützt; Partner können ausschließlich Dateien im eigenen Partnerordner lesen, hochladen, ändern oder löschen.
- Partner verwalten im Bereich „Leistungen“ echte buchbare Pakete mit Preis, Währung, Dauer, Vor-/Nachbereitungszeit, Ressource, Beschreibung und enthaltenen Leistungen. Pakete können als Entwurf gespeichert, bearbeitet, veröffentlicht oder gelöscht werden.
- Jedes Partnerpaket ist einem konkreten Leistungsbereich (Location, Catering oder Fotografie) zugeordnet. Bei mehreren aktiven Bereichen wählen Partner den Bereich pro Paket; damit können spätere Kundenkombinationen und Verfügbarkeitsprüfungen getrennt erfolgen.
- Der Partner-Demomodus enthält drei Fotografie-Pakete einschließlich veröffentlichtem und unveröffentlichtem Zustand; Teständerungen bleiben wie alle Demo-Daten lokal im Browser.
- Die Kundendemo führt vom ausgewählten Luma-Paket über eine Verfügbarkeitsbestätigung in einen eigenen Warenkorb unter `/discover/cart`. Termin, Paket, Dauer und Gesamtpreis werden dort nachvollziehbar zusammengefasst; der Checkout-Schritt erklärt die vorgesehene 15-minütige Reservierung und grenzt die Demo klar von einer Zahlung ab.
- Im Fotografenprofil ist der Warenkorb dauerhaft sichtbar; nach der Verfügbarkeitsprüfung übernimmt er das aktuell gewählte Paket und den Termin.
- Auch die Kunden-Anbieterübersicht besitzt oben rechts einen permanent erreichbaren Warenkorb-Einstieg.
- Die öffentliche Kundenansicht unter `/discover` bietet eine Suchgrundlage mit Hochzeitstermin, Wochentag, Ort, Umkreis sowie wählbaren Leistungen (Location, Catering, Fotografie oder Komplettpaket). Ergebnisse werden aktuell anhand klar gekennzeichneter Entwicklungsanbieter gefiltert; Merken und Warenkorb verlangen erst danach ein Konto.
- Kunden können in der öffentlichen Suche mehrere Demo-Anbieter zunächst unverbindlich in einer gemeinsamen Auswahl zusammenstellen. Erst das Übernehmen dieser Auswahl in den Warenkorb oder das Merken eines Profils fordert eine Anmeldung an; die Auswahl selbst ist bewusst nur lokal und nicht persistent.
- Im Feature-Preview und auf localhost können Kunden ein eigenes E-Mail-/Passwortkonto anlegen. Die Anmeldung danach erzeugt wie bestehende Kundenkonten einen persönlichen Hochzeitsbereich; Partnerregistrierungen bleiben geschlossen.
- Das Partnerprofil bietet eine professionelle Mehrbereichs-Konfiguration: eigenständige Karten für Location, Catering und Fotografie mit Aktiv-Status, Buchungsmodell, Externanbieter-Regel und speicherbarem Kundenhinweis.
- Die Datenbankgrundlage für Direktbuchungen ist aktiv: Kundenbuchungen erzeugen ein 15-minütiges Zahlungsfenster, übernehmen Paketpreis und Dauer serverseitig und erscheinen automatisch als vorläufiger Eintrag im vorhandenen Partnerkalender.
- Die Datenbankgrundlage enthält pro Paket einen `service_type`-Wert mit zulässigen Bereichen Location, Catering oder Fotografie; der bestehende Ressourcen-, RLS- und Doppelbuchungsschutz bleibt unverändert.
- Die Verfügbarkeitsprüfung berücksichtigt Ressourcen, Pufferzeiten, bestehende Kalendertermine und aktive Buchungen. Eine PostgreSQL-Ausschlussregel sowie transaktionale Ressourcensperren verhindern konkurrierende Doppelbuchungen auf Datenbankebene.

### Deployment

- Vercel-Projekt und GitHub-Repository sind verbunden.
- Production-Deployment für `main` ist erreichbar und im Zustand `READY`.
- Für `feat/ouivio-core-foundation` existieren erfolgreiche Preview-Deployments.
- Frühere fehlgeschlagene Preview-Builds wurden durch spätere erfolgreiche Builds abgelöst.
- Pre-Launch-Trennung: `main` dient ausschließlich der kontrollierten öffentlichen Produktion; neue Funktionen werden auf `feat/ouivio-core-foundation` entwickelt und erst nach ausdrücklicher Freigabe nach `main` übernommen.

### Datenbankgrundlage

- Die Migration `supabase/migrations/001_initial_schema.sql` ist im eigenständigen Supabase-Projekt `Ouivio` ausgeführt.
- Zwölf öffentliche Tabellen sind angelegt. Kontoprofile, Partnerprofile, Partnerkalendertermine und Kalenderverbindungen ergänzen die acht Tabellen der Kundenplanung.
- Geheimnisse externer Kalenderverbindungen liegen im nicht exponierten `private`-Schema und sind für Browserrollen vollständig gesperrt.
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
- Externe Kalender sind noch nicht produktiv mit Google Calendar oder Outlook verbunden.
- Die Partner-Kalenderoberfläche und das Sync-Datenmodell sind fertig; echte Zwei-Wege-Synchronisation ist bis zur Einrichtung von Google-/Microsoft-OAuth und Apple iCalendar/CalDAV noch nicht aktiv.
- Anbieterprofile, Detailansichten, Live-Verfügbarkeit und direkte Buchungen sind noch nicht produktiv umgesetzt. Partner-Leistungspakete können jedoch bereits sicher gepflegt und veröffentlicht werden.
- Das Direktbuchungsschema und die atomare Belegungsprüfung sind aktiv; ein bedienbarer Warenkorb-/Checkout-Demoablauf ist vorhanden. Zahlungsbestätigung, automatische Ablaufverarbeitung der 15-minütigen Reservierung und die produktive UI-Anbindung fehlen noch.
- Einladungslinks verwenden vor dem Production-Rollout bewusst den stabilen Vercel-Feature-Branch-Alias; die endgültige Ouivio-Domain muss vor dem öffentlichen Start eingesetzt werden.
- Gästelisten-Import, Haushalte, Begleitpersonen und serverseitiger automatischer Versand fehlen noch; persönliche Links können bereits über WhatsApp, Instagram oder das Standard-Mailprogramm geteilt werden.
- Suche wirkt derzeit nur auf die lokale Anbieterliste.
- Benachrichtigungen, Nachrichten und Mehrbenutzer-Zusammenarbeit fehlen.
- Es gibt noch keine automatisierten Tests.
- Die Registrierungsoberfläche ist im Pre-Launch-Modus entfernt. Die Deaktivierung der Supabase-Selbstregistrierung auf Projektebene muss separat in den Auth-Einstellungen verifiziert werden.
- Änderungen im Partner-Demomodus sind absichtlich flüchtig und gehen beim Neuladen verloren.
- Der sichere Demo-Modus zeigt die Fotografie-Spezialisierung, führt jedoch bewusst keine echten Portfolio-Uploads aus.
- `npm audit --omit=dev` meldet drei hohe transitive Hinweise über die bestehende Next.js-15-Abhängigkeit (`postcss` und `sharp`); eine separat geprüfte Next.js-Major-Aktualisierung ist offen.

## Offene Aufgaben

Priorität 1 – Produktgrundlage:

1. Registrierung und E-Mail-Bestätigung mit einem echten Benutzerkonto Ende-zu-Ende prüfen.
2. Demo-Daten schrittweise durch echte, benutzerspezifische Daten ersetzen.

Priorität 2 – Kernfunktionen:

1. Aufgaben mehreren Mitgliedern zuweisen und die gemeinsame Bearbeitung ausbauen.
2. Kalender mit editierbaren Terminen sowie später Google-/Outlook-Synchronisation ausbauen.
3. Google Calendar und Microsoft Graph per OAuth anbinden, Webhook-/Delta-Synchronisation ergänzen und Apple/iCalendar serverseitig bereitstellen.
3. Budget um Beleg-Uploads, Fälligkeiten und detaillierte Kategorienauswertungen erweitern.
4. Gästeliste um Import, Haushalte, Begleitpersonen und E-Mail-Einladungsversand erweitern.
5. Anbieterprofile, Filter, Favoriten, Live-Verfügbarkeit, Checkout und direkten Buchungsablauf entwickeln.

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
- Während der Pre-Launch-Phase bleibt nur die Startseite allgemein öffentlich sichtbar. Der Dashboard-Link führt zur Anmeldung; neue Kunden- und Partnerkonten können über die Ouivio-Oberfläche nicht angelegt werden.
- Der anonyme Partner-Demomodus ist ausschließlich für localhost und den festen Entwicklungsbranch-Preview zugelassen. Er nutzt keine Supabase-Abfragen; Production und echte Partnerdaten bleiben weiterhin authentifizierungspflichtig.
- Produktionsveröffentlichungen erfolgen ausschließlich nach ausdrücklicher Freigabe. Ein Push auf den Entwicklungsbranch ist keine Freigabe für `main` oder `www.ouivio.com`.
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
- Die Kontoart wird nach der Registrierungswahl in einem RLS-geschützten Kontoprofil festgeschrieben. Partnerzugänge erzeugen keinen Hochzeitsbereich.
- Ouivio ist die führende Kalenderdatenquelle; externe Kalender werden providerneutral über Quellen, externe Ereignis-IDs und Sync-Cursor abgeglichen.
- Kalenderkonflikte werden zunächst als Warnung behandelt. Eine harte Sperre bleibt eine spätere, partnerabhängige Einstellung, weil Anbieter mehrere parallel verfügbare Teams oder Ressourcen besitzen können.
- Anbieterarten teilen sich eine gemeinsame Partnergrundlage; kategoriespezifische Daten und Oberflächen werden modular ergänzt. Portfolio-Originale bleiben privat, bis eine kontrollierte Veröffentlichung für Kunden umgesetzt ist.
- Ouivio wird als direkt buchbarer Marketplace entwickelt: Kunden prüfen einen Termin gegen die echte Anbieterverfügbarkeit und buchen verfügbare Leistungen anschließend unmittelbar. Ein manueller Anfrageprozess ist nicht Teil des vorgesehenen Kernablaufs.
- Buchbare Kapazität wird über partnerbezogene `resource_key`-Werte modelliert. Dadurch können einzelne Fotografen ein Hauptteam und größere Anbieter später mehrere unabhängig buchbare Teams, Räume oder Ressourcen anbieten.
- Paketdaten und Preise werden beim Einfügen einer Buchung serverseitig aus dem veröffentlichten Paket übernommen. Browserwerte sind nicht vertrauenswürdig und können weder Preis, Dauer noch Partnerressource einer Buchung bestimmen.
- Die Partner-Paketverwaltung verwendet ausschließlich die vorhandenen eigentümergebundenen RLS-Richtlinien. Der Rolle `authenticated` wurden gezielt nur die für diese Richtlinien benötigten Schreibrechte auf `partner_packages` erteilt; anonyme Nutzer erhalten keine Tabellenrechte.
- Anbieter entscheiden je Leistungsbereich autonom zwischen Einzelbuchung, Add-on, Bundle und Komplettpaket sowie über die Zulässigkeit externer Ergänzungen. So können Kunden einzelne Leistungen kombinieren, während Anbieter ihre Angebotsgrenzen verbindlich festlegen.
- Buchbare Pakete werden unabhängig von der ursprünglichen Hauptkategorie eines Partnerkontos pro Leistungsbereich geführt. Dadurch kann ein Mehrbereichsanbieter ein Location-Paket und ergänzende Catering- oder Fotografie-Pakete getrennt veröffentlichen und verwalten.
- Öffentliche Suche und Zusammenstellung bleiben ohne Konto möglich, damit Paare den Marketplace ohne Hürde erkunden können. Persönliche, geräteübergreifende Funktionen (Merkliste und persistenter Warenkorb) bleiben hinter der Anmeldung; die unverbindliche Vorauswahl wird nicht als Buchung oder Reservierung behandelt.
- Die Kundenregistrierung wird nur auf localhost und dem festen `feat/ouivio-core-foundation`-Preview angezeigt. Die produktive Oberfläche bleibt im Pre-Launch-Zustand ohne Registrierungsoption; das bestehende Supabase-Projekt und dessen globale Auth-Einstellungen werden dafür nicht verändert.

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
- Partner-Kalendergrundlage in Supabase angewendet und geprüft: vier neue öffentliche Tabellen mit aktiver RLS sowie ein privater, für Browserrollen gesperrter Secret-Speicher.
- TypeScript-Prüfung und optimierter Production-Build einschließlich der neuen Route `/partner` erfolgreich.
- TypeScript-Prüfung und optimierter Production-Build nach Ergänzung von Terminbearbeitung, Status-/Notizpflege, Sperrzeit-Schnellaktion und Überschneidungswarnung erfolgreich; geschützte Startseitenkopien weiterhin bytegleich.
- Partner-Demomodus ohne Anmeldung ergänzt; TypeScript-Prüfung und optimierter Production-Build erfolgreich, geschützte Startseitenkopien weiterhin bytegleich.
- Lokale Browserprüfung unter `/partner?demo=1` erfolgreich: Partner-Dashboard, Monatskalender, Beispieldaten und Demo-Hinweis laden ohne Anmeldung und ohne Next.js-Fehleroverlay.
- Migration für Anbieterkategorien und Fotografen-Portfolios im Supabase-Projekt ausgeführt und geprüft: private Storage-Ablage, eine RLS-geschützte Metadatentabelle sowie vier eigentümergebundene Storage-Richtlinien sind aktiv.
- TypeScript-Prüfung und optimierter Production-Build nach Einführung der Anbieter-Spezialisierung und Portfolioverwaltung erfolgreich; geschützte Startseitenkopien weiterhin bytegleich.
- Lokale Browserprüfung erfolgreich: Profil zeigt Location, Fotografie und Catering getrennt; der Fotografie-Leistungsbereich zeigt das geschützte Portfolioformular mit Dateiauswahl, Titel und Bildstil ohne Fehleroverlay.
- Eine parallele Kundendemo unter `/discover?demo=1` zeigt Anbieterprofile aus Kundensicht. Erste vollständig fiktive Profile für Location und Catering enthalten eigens erzeugte Demo-Fotos, Leistungsmerkmale, Preise und Beispielgerichte; aus der Partner-Demo kann direkt zur Kundensicht gewechselt werden.
- Die Kundendemo enthält zusätzlich das fiktive Profil „Luma Fotografie“ mit eigens erzeugter Portfolioaufnahme, dokumentarischem Bildstil, drei Paketen, Preisrahmen, Begleitdauer und Lieferzeit.
- Das fiktive Profil „Luma Fotografie“ besitzt unter `/discover/luma?demo=1` eine ausführliche, wiederverwendbare Fotografenprofil-Vorlage: mehrteilige Portfolio-Reportage, Stilmerkmale, Persönlichkeit, Erfahrung, Pakete, Lieferzeiten, Bewertung, Merken-Aktion, Hochzeitstermin und einen klar als Demo gekennzeichneten direkten Buchungseinstieg.
- Drei zusätzliche eigens erzeugte, fiktive Portfolioaufnahmen zeigen Trauung, Dinner und Tanzfläche. Zusammen mit dem Paarportrait vermitteln sie den fotografischen Stil über einen ganzen beispielhaften Hochzeitstag statt nur über ein Titelbild.
- Browserprüfung des Fotografenprofils erfolgreich: Karte und Bild laden, die Detailansicht zeigt alle drei Pakete, Vorschauzeit und Galerielieferzeit ohne Fehleroverlay.
- Lokale Browserprüfung der Kundendemo erfolgreich: beide Anbieterbilder laden, Location- und Cateringkarten sind bedienbar und die Catering-Detailansicht zeigt Beispielgerichte, Kapazität und Anfrageaktion ohne Fehleroverlay.
- TypeScript-Prüfung und optimierter Next.js-Production-Build nach Einführung der ausführlichen Fotografenprofil-Vorlage erfolgreich; `/discover/luma` wird als statische Route erzeugt und die geschützten Startseitenkopien bleiben bytegleich.
- Browserprüfung der ausführlichen Luma-Seite erfolgreich: Portfolio, Profiltext, drei Pakete, Bewertung und Buchungskarte rendern ohne Fehleroverlay oder Konsolenfehler. Alle im sichtbaren Bereich benötigten Bilder laden; Merken- und Demo-Buchungseinstieg funktionieren.
- Responsive Browserprüfung bei 390 × 844 Pixel erfolgreich: Überschrift und Anfrageaktion sind bedienbar, die Seite verursacht kein horizontales Überlaufen.
- Fotografenprofil auf das Direktbuchungsprinzip umgestellt: Der Hochzeitstermin wird sofort geprüft, ein freier Termin wird bestätigt und führt ohne manuellen Anfrageprozess unmittelbar zum Buchungsschritt. TypeScript-Prüfung, Production-Build und Browserprüfung des vollständigen Ablaufs erfolgreich; keine Konsolenfehler, kein Fehleroverlay und kein horizontales Überlaufen.
- Supabase-Migrationen `20260802131755_direct_booking_foundation.sql` und `20260802132322_optimize_direct_booking_policies.sql` im EU-Projekt angewendet. Tabellen `partner_packages` und `partner_bookings`, Ressourcenbezug im Partnerkalender, RLS, explizite Grants, Verfügbarkeits-RPC, Kalendersynchronisation und Doppelbuchungsschutz sind aktiv.
- Transaktionaler Direktbuchungstest erfolgreich und vollständig zurückgerollt: freier Termin `true`, belegter Termin `false`, genau eine Buchung und ein synchroner Kalendereintrag; eine zweite überlappende Buchung wurde verhindert. Nach dem Rollback enthalten beide neuen Tabellen weiterhin 0 Datensätze.
- Sicherheitsprüfung bestätigt: RLS ist auf beiden neuen Tabellen aktiv, `anon` darf die Verfügbarkeitsfunktion nicht ausführen, `authenticated` darf ausschließlich den vorgesehenen booleschen RPC nutzen. Der Security Advisor dokumentiert diesen bewusst privilegierten RPC sowie die bereits bekannten RSVP- und Passwortschutz-Hinweise.
- Performance-Advisor nach Optimierung erneut geprüft: keine neuen fehlenden Fremdschlüsselindizes und keine mehrfachen permissiven Richtlinien im Direktbuchungsbereich; Hinweise auf unbenutzte neue Indizes sind bei noch leeren Tabellen erwartbar.
- Migration `20260802140000_grant_partner_package_management.sql` im EU-Projekt ausgeführt und geprüft: authentifizierte Nutzer besitzen für die RLS-geschützte Paketverwaltung `SELECT`, `INSERT`, `UPDATE` und `DELETE`; anonymen Nutzern wurden keine Rechte erteilt.
- TypeScript-Prüfung und optimierter Production-Build nach Ergänzung der Paketverwaltung erfolgreich; geschützte Startseitenkopien besitzen weiterhin den unveränderten SHA-256-Hash `72d42a351c4e435dcf6cd90efa37fb3e1291ae7979e01a78d03e8c31ff505288`.
- Lokale Browserprüfung unter `/partner?demo=1` erfolgreich: drei Foto-Pakete, Entwurfs-/Veröffentlichungsstatus, Preis, Ressource und Puffer erscheinen korrekt; ein neues Demo-Paket lässt sich anlegen und bleibt erwartungsgemäß nur im Browserfenster gespeichert.
- Supabase Security Advisor nach der gezielten Rechteergänzung geprüft: keine neue Warnung. Die weiterhin sechs Hinweise betreffen ausschließlich die bereits dokumentierten RSVP-/Verfügbarkeits-RPCs und den noch deaktivierten Schutz vor kompromittierten Passwörtern.
- TypeScript-Prüfung und optimierter Production-Build nach Ergänzung von Warenkorb und Checkout-Demo erfolgreich; die neue Route `/discover/cart` wird statisch erzeugt und die geschützten Startseitenkopien bleiben bytegleich.
- Migration `20260802153000_link_packages_to_service_areas.sql` im Supabase-Projekt ausgeführt und geprüft: `partner_packages.service_type` ist nicht nullable, auf die drei vorgesehenen Bereiche begrenzt und für Mehrbereichsabfragen indiziert.
- TypeScript-Prüfung und optimierter Production-Build nach der Paketzuordnung zu Leistungsbereichen erfolgreich; `index.html` und `public/index.html` behalten beide den SHA-256-Hash `72d42a351c4e435dcf6cd90efa37fb3e1291ae7979e01a78d03e8c31ff505288`.
- TypeScript-Prüfung und optimierter Production-Build nach Einführung der öffentlichen Mehranbieter-Auswahl erfolgreich; die geschützten Startseiten behalten beide den SHA-256-Hash `72d42a351c4e435dcf6cd90efa37fb3e1291ae7979e01a78d03e8c31ff505288`.
- Browserprüfung im Feature-Preview erfolgreich: Anbieter lässt sich ohne Konto zur Auswahl hinzufügen, die Auswahl zeigt Anzahl und Leistung, und erst „In den Warenkorb übernehmen“ öffnet die Anmeldegrenze ohne Fehleroverlay.
- TypeScript-Prüfung und optimierter Production-Build nach Ergänzung der preview-beschränkten Kundenregistrierung erfolgreich; die geschützten Startseiten behalten beide den SHA-256-Hash `72d42a351c4e435dcf6cd90efa37fb3e1291ae7979e01a78d03e8c31ff505288`.
- Feature-Preview-Deployment zur Kundenregistrierung ist `READY`; eine vorhandene Sitzung wird auf der Preview weiterhin ohne Fehler in den persönlichen Kundenbereich geleitet. Für einen echten Registrierungstest muss bewusst eine E-Mail-Adresse eingegeben und deren Bestätigungslink geöffnet werden.
- Supabase Security Advisor nach der Migration geprüft: keine neue Warnung; die weiterhin bekannten Hinweise betreffen ausschließlich die absichtlich begrenzten RSVP-/Verfügbarkeitsfunktionen und den noch deaktivierten Schutz vor kompromittierten Passwörtern.
