# SpielfeldIQ · Coaching Companion (Prototyp v2.3, GitHub-Projekt: CoachFlow)

Mobiloptimierte, lokal-first PWA zur Fußballtrainingsplanung und Trainingsdurchführung. Die öffentliche GitHub-Codebasis enthält ausschließlich Demokinder und anonymisierte Trainerbezeichnungen. Die Haupt-App startet mit Supabase-Anmeldung, benutzerbezogenem Dashboard und automatischer Speicherung; gemeinsame Vereinsfreigaben sind noch nicht enthalten.

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
Home-Screen-App schließen und wieder öffnen. Wenn noch die alte Ansicht geladen wird, einmal in Safari öffnen und aktualisieren. Die Service-Worker-Version `coachflow-static-v20` verwendet für die HTML-Seite nun network-first und lässt den lokalen Datenspeicher unverändert.

## Hinweise
- **Keine automatisierte KI und kein automatischer Import fremder Videoinhalte**: Vorschläge sind regelbasiert. Diagramme sind ausdrücklich schematische Beispieldarstellungen und bilden nicht notwendigerweise den Originalübungsaufbau ab.
- Lokale Daten liegen im `localStorage` des jeweiligen Browsers. Optionale private Sicherung und Geräteübertragung über Supabase erfolgt nur manuell, nicht fortlaufend. Keine echten personenbezogenen Daten in diesem öffentlichen Repository ablegen.
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
- Offline cache version: `coachflow-static-v20`.


## Supabase – optionale persönliche Cloud-Sicherung

Im Supabase-Projekt `gzrstopdqsjdrrrzzhix` wurde die Migration `create_coachflow_personal_state` erfolgreich ausgeführt. Das geschützte `coachflow_state` ist über die PWA unter **⋯ → Einstellungen & Daten → Cloud-Synchronisierung** erreichbar. Anmeldung per E-Mail + Passwort, alternativ Magic Link oder Einmalcode; bereits angemeldete Magic-Link-Nutzer können ein Passwort für dasselbe Konto festlegen. Cloud-Sicherung und Laden werden weiterhin ausdrücklich ausgelöst. Die vollständige Anleitung einschließlich der **noch manuell einzurichtenden Auth-URL und E-Mail-Template** liegt unter [docs/database-setup.md](docs/database-setup.md). Die lokale Speicherung bleibt bestehen; eine echte gemeinsame Teamdatenbank ist dies noch nicht.


## Cloud v1.5 · Passwort-Login

- E-Mail + Passwort anmelden (`auth.signInWithPassword`), neues Konto registrieren (`auth.signUp`) oder für das bestehende Magic-Link-Konto ein Passwort festlegen (`auth.updateUser`).
- Der Magic Link und der sechsstellige Code bleiben als Alternativen erhalten.
- **Nicht neu registrieren, wenn bereits ein Magic-Link-Konto besteht:** im gleichen Konto anmelden und dort ein Passwort setzen.
- Der Standard-E-Mail-Versand von Supabase ist nur für autorisierte Projektteam-Adressen und Testzwecke verfügbar; die erstmalige Bestätigung kann E-Mail erfordern. Für echte Vereinsnutzung mit weiteren Trainern einen eigenen SMTP-Anbieter konfigurieren. Keine Deaktivierung der E-Mail-Bestätigung nur zum Umgehen dieser Beschränkung.
- Keine automatische Cloud-Überschreibung oder Speicherung von Passwörtern in CoachFlow-JSON-Backups. Siehe [Datenbankanleitung](docs/database-setup.md).

## CoachFlow v1.8 · Anwesenheit, Entwicklung und Turnierteams

**Status:** Im bestehenden GitHub-Pages-Prototyp integriert. Das Script `coachflow-features.js` wird zusammen mit der App offline zwischengespeichert; PWA-Cache: `coachflow-static-v20`. Die Oberfläche enthält drei zusätzliche Schaltflächen: **Monatsanwesenheit**, **Entwicklung** und **Teamgenerator**. Sie stehen auf den Hauptseiten der App zur Verfügung.

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

## Vorläufiges Branding & iPhone-Fenster (v1.9)

Die öffentlich sichtbare App heißt vorläufig **SpielfeldIQ**. Der Projektname, die GitHub-URL, die Supabase-Projektkennung, die interne JavaScript-API und der bestehende localStorage-Schlüssel `coachflow-prototype-v1` bleiben aus Gründen der Datenkompatibilität unverändert. Der Name ist **nicht markenrechtlich freigegeben**; vor kommerzieller Verwendung sind Domain-, App-Store- und Markenregisterrecherche (AT/EU) erforderlich.

Anpassungen der seit v1.8 ergänzten Dialoge: iPhone-Safe-Area, vollständig sichtbare und beim Scrollen fixierte Überschrift, gleichmäßig breite Tabs, einspaltige Felder auf kleinen Mobilgeräten, lesbare Datumsauswahl und Trainingschips ohne Überlappung. Die individuellen Trainingspläne und Spielerbewertungen werden nicht automatisch verändert. Die PWA verwendet `coachflow-static-v20`; bei bestehender Home-Screen-Installation kann das unter iOS gespeicherte Icon-Label weiterhin „CoachFlow“ lauten. **Nicht deinstallieren**, solange lokale Daten nicht gesichert sind.

Der endgültige Markenname wird vor der Vermarktung festgelegt; intern kann das Repository weiterhin `coachflow` heißen.

## Prototyp v2.0 – Field-first Coaching (Oktober 2026)

**Kernziel:** Vorbereitung → Live-Training → bestätigte Anwesenheit → Auswertung. Die folgenden Funktionen sind im aktuellen Prototyp integriert und funktionieren mit dem bestehenden `coachflow-prototype-v1`-Speicherschlüssel.

### Fokussierter Live-Trainingsmodus
- Direktstart von der Übersicht über **Live starten**, alternativ Planer → Live-Training → **Fokusmodus öffnen**.
- Große Start-/Pause- und Reset-Buttons, gut lesbarer Countdown, aktuelle Stationen/Trainer/Gruppen sowie Vorschau der nächsten Rotation.
- Spontan **Tagesgruppen ausgleichen** bzw. Anwesenheit bearbeiten.
- Ein manueller Rundenwechsel bleibt erforderlich; ein Timer-Ende wechselt die Teams nicht automatisch.
- Der Timerzustand liegt lokal unter `coachflow-live-timer-v1` und nutzt verstrichene Uhrzeit für die Wiederaufnahme nach kurzen App-Wechseln bzw. erneutem Öffnen. iOS kann im Hintergrund laufende Skripte anhalten: **keine garantierten Hintergrundalarme**.

### Anwesenheit als bestätigter Nachweis
- Die bereits bestehende Vorauswahl „alle anwesend“ ist weiterhin **nur eine Planung**.
- Im Team-Tab muss der Trainer die tatsächliche Liste über **Anwesenheit bestätigen** ausdrücklich freigeben, bevor er das Training abschließen kann.
- Die Bestätigung ist an das konkrete Datum, den Kader und den An-/Abwesenheitsstand gebunden und wird bei Änderungen ungültig.
- Abgeschlossene Trainingseinheiten archivieren nur den explizit bestätigten Stand. Die nächste Planung benötigt wieder eine separate Bestätigung.
- Bestehende historische Vorbereitungen werden dadurch nicht nachträglich zu besuchten Trainings umklassifiziert.

### Letzten lokalen Stand wiederherstellen und beschädigte Daten schützen
- Vor jeder Änderung wird, soweit genügend Speicher verfügbar ist, der letzte gültige `coachflow-prototype-v1`-Datensatz in `coachflow-recovery-v1` gespeichert.
- Unter **Einstellungen & Daten → Vorherigen lokalen Speicherstand wiederherstellen** kann der unmittelbar vorherige Stand nach ausdrücklicher Bestätigung geladen werden.
- Wird beim Start ein vorhandener, aber ungültiger Primärdatensatz erkannt, bleibt dieser unverändert und lokale Änderungen/Cloud-Uploads werden bis zur Wiederherstellung blockiert. Die App zeigt einen Warnhinweis und ermöglicht den Download des ursprünglichen beschädigten Inhalts.
- Ein Wiederherstellungspunkt ist **keine versionierte Datensicherung** und ersetzt kein regelmäßig heruntergeladenes JSON-Backup. Die Sicherung kann insbesondere bei erschöpftem Browserspeicher fehlschlagen.
- Browser-/Geräteübergreifende automatische Synchronisierung, gemeinsame Trainerkonten, Elternkommunikation und direkter Matchday-Datenaustausch sind weiterhin **nicht** enthalten.

### Validierung und Grenzen
- JavaScript-Syntax, Renderlogik des Fokusscreens sowie isolierte Tests der Abschlussprüfung, des beschädigten Speichers und der Wiederaufnahme des Timers wurden geprüft.
- Eine vollständige echte iPhone-/Safari-End-to-End-Prüfung bleibt offen. Bitte bestehende Home-Screen-Installationen **nicht** löschen; vor dem ersten produktiven Einsatz ein JSON-Backup erstellen.

## Version 2.1: SpielfeldIQ ↔ FUNiño Matchday (lokaler, privater Dateiaustausch)

1. In SpielfeldIQ: **Teamgenerator** → Aufstellung erstellen oder gespeicherte Aufstellung laden → **Matchday-Datei**. Das JSON-Dokument `sport-coach-bridge-v1` enthält ausschließlich Spieltag, Teamnamen und die stabile, einmalig gespeicherte Kader-ID sowie die `id`/`name`-Werte der ausgewählten Spieler. Keine Leistungsstufen, Geburtsdaten oder komplette Vereinsdaten werden exportiert. Bei echten Kinderdaten Datei privat aufbewahren und nach Bedarf löschen.
2. In FUNiño Matchday unter **SpielfeldIQ ↔ Matchday**: Datei auswählen → Mannschaft auswählen → ausdrücklich importieren. Ein bereits laufendes Turnier kann dadurch nicht überschrieben werden; die Matchday-App erstellt zusätzlich eine letzte Vorher-Kopie im lokalen Speicher. Safari und iOS-Homescreen-PWA können verschiedene lokale Speicherbereiche haben, deshalb wird kein automatischer browserübergreifender Zugriff behauptet.
3. In Matchday nach dem Abschließen eines Spiels die **tatsächlich gespielten Minuten** einzelner Kinder angeben (leer: unbekannt, 0: ausdrücklich keine Einsatzzeit) und bestätigen. Die Spielminuten gelten pro Spiel; die App schätzt keine Zeiten aus Toren oder dem Mannschaftskader.
4. Über **Nach SpielfeldIQ exportieren** die private JSON-Datei `sport-coach-matchday-results-v1` erstellen. In SpielfeldIQ unter **Teamgenerator → Spielzeit & faire Teams** importieren. Kader-ID und Spieler-IDs ordnen die Zeitwerte zu; Berichte fremder Kader werden abgewiesen und unbekannte Spieler-IDs ignoriert. Erneuter Import desselben Spieltags ersetzt erst nach erneuter Bestätigung den entsprechenden Bericht.
5. Bereits gespeicherte Teamkonstellationen gehen im Modus **Fair durchmischen** als sanfte Wiederholungsstrafe in die Verteilung ein. Der Vorschlag ist weiterhin jederzeit manuell änderbar und kann bei kleinen oder eingeschränkten Teilnehmergruppen Wiederholungen nicht vollständig vermeiden.

**Einschränkungen:** Die direkte Übernahme betrifft vorerst den Modus **FUNiño**. Der Hallenturnier-Modus verfügt noch nicht über denselben Importdialog. Keine automatische Cloud-, Live- oder Vereins-Synchronisierung; keine verlässlich vollständige Spielzeitstatistik ohne Eingabe. Bestehende JSON-Backup-, PDF-, Trainings- und Supabase-Funktionen unverändert. Der Datenspeicherschlüssel `coachflow-prototype-v1` bleibt erhalten; Service-Worker-Cache `coachflow-static-v20`.

## v2.3 – Benutzerkonten und automatische Speicherung (Oktober 2026)

**Wichtig:** Die PWA verwendet ab diesem Stand das bestehende Supabase-Projekt `gzrstopdqsjdrrrzzhix` und dessen Tabelle `public.coachflow_state`. Das ist die Datenbank, die bisher die manuelle CoachFlow-Cloud-Sicherung enthielt. Im selben Supabase-Account existiert außerdem ein separates, leeres Projekt `axvcoxhjxdyvktqbjznp`; dieses wird für die aktive App **nicht** verwendet.

### Login-first und Datenhoheit
- Vor dem Dashboard erscheint eine Authentifizierungsseite. Mit gültiger Supabase-Sitzung wird die private Benutzerzeile geladen.
- E-Mail-/Passwortregistrierung und Login sind implementiert. Ob eine Bestätigungs-E-Mail versendet wird, richtet sich nach den Supabase-Auth-Einstellungen; ohne externen E-Mail-Versand kann die Registrierung für beliebige Benutzer eingeschränkt sein.
- Buttons für **Google** (`provider: google`) und **Microsoft** (`provider: azure`, `scopes: email`) sind vorbereitet, funktionieren aber erst nach Anlegen und Freischalten der jeweiligen OAuth-App mitsamt Secret in Supabase.
- Callback für Anbieter: `https://gzrstopdqsjdrrrzzhix.supabase.co/auth/v1/callback`. Die App-URL `https://marinkarimovic.github.io/coachflow/` muss unter Supabase Authentication → URL Configuration → Redirect URLs zugelassen sein.
- Die öffentliche App besitzt nur den Supabase-*Publishable Key*, niemals einen Service-Role-Key. Alle Datenbankabfragen verwenden das authentifizierte Benutzerkonto und zusätzlich den Filter `user_id = user.id`.
- RLS ist für `coachflow_state` aktiviert; vier vorhandene Policies erlauben SELECT/INSERT/UPDATE/DELETE nur für `auth.uid() = user_id`.
- Neue Konten starten mit einem eigenen leeren Team. Alte ungebundene `coachflow-prototype-v1`-Datensätze werden nicht automatisch übernommen. Der frühere Prototypenspeicher bleibt unangetastet.

### Automatische Speichersynchronisierung
- Lokaler Entwurf pro Account unter `coachflow-account-v2-<auth-user-id>`; Nutzerwechsel mischt die lokalen Daten nicht.
- Nach einer Änderung erfolgt ein entprellter Cloud-Speichervorgang in `coachflow_state`, inklusive optimistischem `revision`-Vergleich. Ein abweichender Cloud-Stand führt zum Stoppen des Schreibens und zu einer sichtbaren Konfliktmeldung.
- `coachflow-pending-v2-<auth-user-id>` merkt nicht abgeschlossene Cloud-Updates lokal vor und erkennt sie beim erneuten Öffnen. Beim erneuten Login wird diese lokale Version nicht kommentarlos von einem älteren Cloud-Datensatz ersetzt.
- Bei fehlendem Netz sind bereits gestartete Bearbeitungsvorgänge lokal nutzbar; ein *kalter Start* ohne abrufbare Supabase-Sitzung/Bibliothek kann jedoch noch kein vollwertiges Offline-Login garantieren.
- In den Kontoeinstellungen: Sync-Status, „Jetzt synchronisieren“, bewusstes Laden des Cloud-Standes und Abmeldung. Beim Abmelden wird die accountbezogene lokale Kopie vom Gerät entfernt. Bei ausstehenden Änderungen warnt die App davor.
- **Noch keine automatische Dreiwege-Zusammenführung** bei Änderungen auf mehreren Geräten; Cloud-Laden verwirft ausdrücklich lokale Änderungen, nur nach Bestätigung.

### Security/Launch-Checkliste
- Supabase Security Advisor meldet `auth_leaked_password_protection`: **Leaked Password Protection Disabled**. Vor Veröffentlichung [Schutz gegen geleakte Passwörter einschalten](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Für Google: OAuth-App anlegen, Supabase Auth → Providers → Google aktivieren und Client ID/Secret hinterlegen; gleiche Redirect URLs freischalten.
- Für Microsoft: Microsoft Entra App Registration, Callback bei Entra hinterlegen, Azure-Provider in Supabase mit Client ID/Secret konfigurieren; für Microsoft den `email`-Scope verwenden.
- Einen SMTP-Mailanbieter für Registrierung und Passwortreset konfigurieren, E-Mail-Bestätigungen testen.
- Auth und RLS mit mehreren getrennten Testbenutzern, einem zweiten Gerät und Netzwerkunterbrechungen end-to-end testen.
- Die Zusammenführung mit FUNiño/Hallenturnier in **derselben PWA und demselben User-Datenmodell** ist der nächste eigenständige Integrationsschritt; bisher sind es noch getrennte Repositories bzw. JSON-Transfers.
