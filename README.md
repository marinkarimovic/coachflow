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
