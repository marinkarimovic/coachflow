# CoachFlow – Trainingszentrale (Prototyp v1.1)

Mobiloptimierte PWA zur Fußballtrainingsplanung. Enthält ausschließlich Demo-Kinderdaten und anonymisierte Trainerbezeichnungen; kein Backend und keine Konten.

## Funktionen
- 16 Beispielübungen plus eigene Einträge, Filter, Favoriten und Trainingsstatistik.
- Eigene schematische Spielfeldgrafiken pro Übung, Bild-URLs, YouTube-Einbettung **erst nach Klick** und Links zu Instagram-Reels.
- Trainingsplaner mit zeitlichem Ablauf, veränderbaren Übungen, Trainern, Gruppen und automatischer Rotation.
- 24 Demokinder in vier Stammgruppen. Anwesenheit und Tagesumbesetzungen sind von Stammgruppen getrennt.
- Live-Training mit Countdown und Bestätigung wirklich durchgeführter Übungen.
- Fünf historische Beispiel-Trainingsvorbereitungen vom September/Oktober 2026.
- **A4-PDF-Export ohne window.print()**: Trainingsplan direkt im Browser erzeugen; „PDF ansehen“, „Auf iPhone teilen“, „PDF herunterladen“.
- Links zu DFB Training Online (Bambini/F-Jugend), FIFA Training Centre und UEFA Grassroots. Externe Übungen und Medien werden nicht kopiert.
- JSON-Backup und lokaler Speicher.

## Auf dem iPhone installieren
GitHub → Repository → **Settings → Pages** → Deploy from a branch → `main` → `/(root)`. 
Öffne die veröffentlichte Website in Safari → Teilen → **Zum Home-Bildschirm**.

### Update vorhandener Home-Screen-Installationen
Home-Screen-App schließen und wieder öffnen. Wenn noch die alte Ansicht geladen wird, einmal in Safari öffnen und aktualisieren. Die Service-Worker-Version `coachflow-static-v3` verwendet für die HTML-Seite nun network-first und lässt den lokalen Datenspeicher unverändert.

## Hinweise
- **Keine automatisierte KI und kein automatischer Import fremder Videoinhalte**: Vorschläge sind regelbasiert. Diagramme sind ausdrücklich schematische Beispieldarstellungen und bilden nicht notwendigerweise den Originalübungsaufbau ab.
- Keine Synchronisierung zwischen Geräten; alle eingegebenen Kinder- und Trainingsinformationen liegen im `localStorage` des jeweiligen Browsers. Keine echten personenbezogenen Daten in diesem öffentlichen Repository ablegen.
- Externe Bild-URLs laden Bilder vom jeweiligen Anbieter; YouTube wird erst nach aktivem Klick eingebettet. Geeignete Bildrechte und Datenschutz beachten.
- Vor einem Zurücksetzen oder Browserwechsel ein Backup unter ⋯ → Datenexport erstellen.
- PDF-Teilen nutzt die vom Gerät unterstützte Web-Share-Funktion und kann je nach Safari/iOS-Konfiguration variieren. Die Funktionen „PDF ansehen“ und „Herunterladen“ stehen als Alternativen bereit.
- PDF, Layout und Medien wurden in einem mobilen Chromium-Browser getestet; ein iOS-Safari-Realgerätetest steht noch aus.

Diese App dient zunächst als Prototyp. Für produktiven Vereinseinsatz sind Authentifizierung, Rollen, Einwilligungen/Rechtsgrundlagen und ein Datenschutzkonzept notwendig.

## FUNiño Challenge – gezielte Integration (v1.2)

- Bei der Übung **3 gegen 3 – Raus aus der Druckzone** gibt es einen Startknopf zur eigenständigen [FUNiño Challenge](https://marinkarimovic.github.io/funino-challenge/).
- Das Werkzeug kann in **Medien & Tools** an passende weitere Übungen gebunden oder entfernt werden.
- Die Schaltfläche steht bei verknüpften Übungen in den Details, in der Stationsplanung sowie im Live-Training bereit.
- Die Challenge öffnet sich mit 45 Sekunden als Startwert und einem verifizierten Rücklink zu CoachFlow.
- Bestehende gespeicherte Trainingsdaten werden nicht ersetzt; lediglich die neue Übung wird einmalig ergänzt.
- Die beiden Apps synchronisieren derzeit **keine Ergebnisse, Punktestände oder Timer**. Bei laufendem CoachFlow-Timer bitte diesen vor dem Wechsel pausieren.
- Auf dem iPhone kann der Wechsel in Safari stattfinden und nicht zwingend innerhalb der installierten Homescreen-App.


## Mobile UI v1.3

- Consistent responsive layouts at 320, 375, 390, 414 and 430 CSS pixels.
- Date and time are stacked to prevent native iOS inputs from colliding; other training controls use compact, safe columns.
- Team roster group selectors are aligned; three team/history stats use a compact mobile grid.
- History notes, training frequency, modal headings and navigation use responsive wrapping and safe areas.
- The localStorage key remains `coachflow-prototype-v1`; existing locally saved data is not reset.
- Offline cache version: `coachflow-static-v11`.


## Supabase – optionale persönliche Cloud-Sicherung

Im Supabase-Projekt `gzrstopdqsjdrrrzzhix` wurde die Migration `create_coachflow_personal_state` erfolgreich ausgeführt. Das geschützte `coachflow_state` ist über die PWA unter **⋯ → Einstellungen & Daten → Cloud-Synchronisierung** erreichbar. Anmeldung per E-Mail + Passwort, alternativ Magic Link oder Einmalcode; bereits angemeldete Magic-Link-Nutzer können ein Passwort für dasselbe Konto festlegen. Cloud-Sicherung und Laden werden weiterhin ausdrücklich ausgelöst. Die vollständige Anleitung einschließlich der **noch manuell einzurichtenden Auth-URL und E-Mail-Template** liegt unter [docs/database-setup.md](docs/database-setup.md). Die lokale Speicherung bleibt bestehen; eine echte gemeinsame Teamdatenbank ist dies noch nicht.


## Cloud v1.5 · Passwort-Login

- E-Mail + Passwort anmelden (`auth.signInWithPassword`), neues Konto registrieren (`auth.signUp`) oder für das bestehende Magic-Link-Konto ein Passwort festlegen (`auth.updateUser`).
- Der Magic Link und der sechsstellige Code bleiben als Alternativen erhalten.
- **Nicht neu registrieren, wenn bereits ein Magic-Link-Konto besteht:** im gleichen Konto anmelden und dort ein Passwort setzen.
- Der Standard-E-Mail-Versand von Supabase ist nur für autorisierte Projektteam-Adressen und Testzwecke verfügbar; die erstmalige Bestätigung kann E-Mail erfordern. Für echte Vereinsnutzung mit weiteren Trainern einen eigenen SMTP-Anbieter konfigurieren. Keine Deaktivierung der E-Mail-Bestätigung nur zum Umgehen dieser Beschränkung.
- Keine automatische Cloud-Überschreibung oder Speicherung von Passwörtern in CoachFlow-JSON-Backups. Siehe [Datenbankanleitung](docs/database-setup.md).

## CoachFlow v1.8 · Anwesenheit, Entwicklung und Turnierteams

**Status:** Im bestehenden GitHub-Pages-Prototyp integriert. Das Script `coachflow-features.js` wird zusammen mit der App offline zwischengespeichert; PWA-Cache: `coachflow-static-v11`. Die Oberfläche enthält drei zusätzliche Schaltflächen: **Monatsanwesenheit**, **Entwicklung** und **Teamgenerator**. Sie stehen auf den Hauptseiten der App zur Verfügung.

### v1.6 – Historische Anwesenheit

- Monat auswählen, dokumentierte Termine aufrufen oder weitere Trainingstage per Datum erfassen.
- Jedes Kind kann als **anwesend**, **entschuldigt**, **abwesend** oder **nicht erfasst** markiert werden.
- Einträge müssen ausdrücklich bestätigt werden. Historische, lediglich geplante Trainings werden **nicht** als besucht gezählt.
- Monatsübersicht mit Anwesenheitsquote pro Kind und Auszeichnung „bei allen erfassten Trainingsterminen dabei“ (nur wenn für das Kind jeder bestätigte Termin ausdrücklich als `present` dokumentiert ist).
- Wird ein Training aus dem Live-Planer abgeschlossen, fordert die App vorher zur Überprüfung der tatsächlichen Anwesenheit auf und speichert nach Bestätigung einen Anwesenheits-Snapshot zusammen mit dem Trainingsarchiv. Ein unmarkiertes Kind wird dabei gemäß dem vorherigen Häkchenstand als anwesend betrachtet: **vor dem Abschluss unbedingt prüfen**.
- Frühere Screenshots liefern keinen Nachweis individueller tatsächlicher Anwesenheit; es gibt daher keine erfundenen Rückwirkungsdaten.

### v1.7 – Entwicklungsstufen

- Unabhängige, vertrauliche Einschätzung je Kind: **A** (weit entwickelt), **B** (fortgeschritten), **C** (in Entwicklung), **D** (mehr Begleitung), oder **offen**.
- Die Einstufung kann jederzeit geändert oder entfernt werden; der Änderungszeitpunkt wird gespeichert.
- Die bestehende `baseGroup` und die Trainings-`overrides` werden dabei **nicht** verändert. Der Standardwert ist `offen`.
- Kein öffentliches Ranking; die Bewertungen dürfen nur in einem geschützten Trainerbereich verwendet werden und sollten regelmäßig fachlich überprüft werden.

### v1.8 – Teamgenerator

- Erzeugt Mannschaften aus dem gesamten Kader oder nur aus den für das nächste Training als anwesend markierten Kindern. Anschließend lassen sich die Turnierteilnehmer **einzeln ab- und anwählen**, ohne die Trainingsanwesenheit zu verändern.
- Modus **fair durchmischen**, **ähnliches Entwicklungsniveau** oder **zufällig durchmischen**; Kinder ohne Einschätzung werden neutral gewichtet.
- Automatische, möglichst gleich große Mannschaften und eine einfache Verteilung der Stammgruppen. Das Ergebnis ist ein Vorschlag, kein Leistungsurteil oder mathematisch garantierter Fairness-Nachweis.
- Jeder Spieler kann manuell einer anderen Mannschaft zugeteilt werden, danach Aufstellung speichern.
- Gespeicherte Aufstellungen können wieder geöffnet oder als **CSV** exportiert werden.
- Link zu FUNiño Matchday. **Noch keine direkte Übertragung oder automatische Mannschaftsübernahme durch FUNiño Matchday**; der CSV-Export ist eine allgemeine Teamliste.

### Speicherung und Sicherheit

- Kein neues Konto und keine neue Datenbankmigration nötig: Die Erweiterung speichert ihre Datensätze ausschließlich unter `extensionsV18` im **bestehenden** `coachflow-prototype-v1`-JSON-Snapshot.
- Offline-/lokal nutzbar. Der vorhandene Supabase-Sync arbeitet weiterhin **manuell** und speichert den vollständigen Snapshot erst, wenn du eine Cloud-Sicherung auslöst.
- Die öffentliche GitHub-Codebasis enthält ausschließlich die allgemeine Implementierung und Demokinder. **Bitte keine echten Spielerlisten, Entwicklungseinschätzungen oder Anwesenheitsdaten in GitHub committen.**
- Zugriff auf echte Kinderdaten muss vor produktivem Mehrtrainerbetrieb rollenbasiert mit angemessenen Datenschutz- und Löschregelungen abgesichert werden.
- Vor Updates und dem Laden fremder Cloud-Snapshots bitte ein lokales JSON-Backup erstellen.

### Nächster Ausbau

Eine echte Vereinsplattform mit Team-Logins, Einladungen, nutzerspezifischen Freigaben und Zahlungsmodell ist **nicht Teil von v1.8**. Die aktuelle Cloud-Sicherung ist weiterhin eine private Benutzersicherung, keine gemeinsame Vereinsdatenbank.
