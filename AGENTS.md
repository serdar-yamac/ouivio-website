# Ouivio – dauerhafte Projektregeln

Diese Datei und `PROJECT_STATUS.md` müssen vor jeder Änderung am Projekt vollständig gelesen werden.

## Verbindliche Designvorgaben

- `main` und die dort veröffentlichte Original-HTML-Startseite bleiben unangetastet, bis der Benutzer eine Production-Freigabe erteilt.
- Die rote handschriftliche Ouivio-Wortmarke darf weder ersetzt noch neu gezeichnet, umgefärbt, beschnitten, verzerrt oder typografisch nachgebaut werden.
- Auf `feat/ouivio-core-foundation` darf das gesamte Projekt – einschließlich der Startseite – weiterentwickelt werden. Dabei bleibt die rote handschriftliche Ouivio-Wortmarke unverändert, sofern der Benutzer nichts anderes ausdrücklich anordnet.
- `index.html` und `public/index.html` sind bei Startseitenänderungen synchron zu halten.
- Neue Produktfunktionen können im Dashboard und in der Startseite des Entwicklungsbranchs entwickelt werden; `main` bleibt davon getrennt.

## Arbeitsweise

- Zielbranch für die laufende Entwicklung ist `feat/ouivio-core-foundation`. Vor Änderungen Branch und Arbeitsbaum prüfen.
- Vor jeder Änderung `AGENTS.md` und `PROJECT_STATUS.md` lesen.
- Bestehende Nutzeränderungen und nicht zugehörige Dateien respektieren; keine fremden Änderungen überschreiben.
- Keine Geheimnisse, Tokens oder `.env`-Inhalte committen.
- Demo-Daten klar von persistenten oder produktiven Daten unterscheiden.
- Neue Funktionen responsiv und barrierearm umsetzen und bestehende Dashboard-Navigation nicht unbeabsichtigt brechen.
- Nach Änderungen mindestens die passenden Prüfungen ausführen. Für Codeänderungen sind in der Regel `npm run typecheck` und `npm run build` erforderlich; relevante Nutzerabläufe zusätzlich in der lokalen Vorschau prüfen.
- Jede vom Benutzer beauftragte Ouivio-Entwicklungsänderung umfasst automatisch den vollständigen GitHub-Ablauf: neuesten Stand dieses Branches laden, Regeln lesen, Änderungen umsetzen, `PROJECT_STATUS.md` aktualisieren, angemessen prüfen, nur die zugehörigen Dateien stagen, committen und auf `feat/ouivio-core-foundation` pushen. Diese dauerhafte Freigabe gilt nicht für andere Branches, Repositories, Pull Requests, Merges nach `main`, Production-Deployments oder sonstige externe Änderungen.
- Commits klein, nachvollziehbar und auf die beauftragten Dateien beschränken.
- Bei Konflikten, fehlender Authentifizierung, unerwarteten fremden Änderungen, fehlgeschlagenen Prüfungen oder sicherheitsrelevanten Entscheidungen nicht eigenmächtig fortfahren, sondern den Benutzer informieren und erforderlichenfalls um Freigabe bitten.

## Projektdokumentation

- `PROJECT_STATUS.md` ist nach jedem größeren Arbeitsschritt zu aktualisieren.
- Der Status muss den belegbaren Ist-Zustand wiedergeben: fertige Funktionen, Einschränkungen, offene Aufgaben, wichtige Entscheidungen und letzte Prüfungen.
- Geplante Funktionen dürfen nicht als fertig bezeichnet werden.
- Änderungen an Architektur, Datenhaltung, Integrationen, Deployment oder geschützten Designbereichen sind unter „Wichtige Entscheidungen“ festzuhalten.
