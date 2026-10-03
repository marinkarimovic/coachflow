# CoachFlow · Cloud-Datenbank vorbereiten

## Status
**Nur vorbereitet.** Diese Dateien wurden in GitHub versioniert, aber die Supabase-Datenbank wurde noch **nicht** angelegt und die laufende PWA noch **nicht** mit ihr verbunden. Vorhandene lokale Trainingsdaten bleiben unverändert.

## 1. Supabase-Projekt anlegen
1. Im Supabase Dashboard ein eigenes Projekt `coachflow` anlegen (EU-Region auswählen, sofern passend).
2. Unter **SQL Editor** die Datei `supabase/migrations/20261003_000001_create_coachflow_state.sql` **nur in diesem Projekt** ausführen. Keine anderen Projekte anfassen.
3. Unter Authentication -> URL Configuration die veröffentlichte PWA als Site URL sowie die entsprechenden Redirect-URLs konfigurieren:
   - `https://marinkarimovic.github.io/coachflow/`
   - `https://marinkarimovic.github.io/coachflow/index.html`
4. In Settings -> API Keys die **Project URL** und den **publishable key** für die App ermitteln. Diese zwei Werte dürfen in Browser-JavaScript stehen; **niemals** `service_role`, `sb_secret_...`, Datenbankkennwörter oder JWT-Secrets dort eintragen.
5. E-Mail-Login via Supabase Auth verwenden (Magic Link oder OTP; Login nicht durch versteckte/harte Passwörter ersetzen).

## 2. Sicherheitsprüfung nach dem Ausführen
In SQL Editor:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'coachflow_state';

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'coachflow_state'
order by policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name='coachflow_state'
  and grantee in ('anon','authenticated')
order by grantee, privilege_type;
```

Erwartet: `rowsecurity=true`, je eine SELECT/INSERT/UPDATE/DELETE Policy nur für `authenticated`, keine `anon`-Berechtigungen. Zusätzlich mit **zwei verschiedenen Testbenutzern** prüfen: Benutzer A darf ausschließlich seinen Datensatz lesen/schreiben; Benutzer B darf A nicht sehen. Die Migration wurde noch nicht gegen ein echtes Projekt getestet.

## 3. Anbindung an die vorhandene PWA
- Bestehender `localStorage`-Schlüssel ist `coachflow-prototype-v1`. Nicht umbenennen oder bei Login löschen.
- Vor dem ersten Cloud-Sync expliziten Dialog anbieten: **„Lokale Daten übernehmen“**, **„Cloud-Daten laden“** oder **„Abbrechen“**; keine automatische Überschreibung.
- Daten aus `localStorage` nach JSON prüfen und als `state` unter `user_id = auth.uid()` schreiben; niemals Benutzerdaten von einer E-Mail-Adresse ableiten.
- Bei späteren Updates `revision` und `updated_at` behandeln und vor Konflikten warnen. Phase 1 hat **keine echte Mehrbenutzer-Konfliktauflösung**.
- Bei fehlender Internetverbindung lokal weiterarbeiten; Sync-Status sichtbar anzeigen.
- JSON-Backup vor dem ersten Sync exportieren. Die 2-MB-Grenze kann für große Bibliotheken später angehoben werden.

## 4. Nächste Phase
Nach erfolgreichem Einzelbenutzer-Sync normalisieren:
`cf_club`, `cf_team`, `cf_team_member`, `cf_player`, `cf_group`, `cf_exercise`, `cf_training`, `cf_training_attendance`, `cf_training_group`, `cf_training_station`, `cf_training_rotation`, `cf_training_feedback`.
Damit Stammgruppen von tagesbezogenen Umbesetzungen getrennt und echte gemeinsame Trainerpläne möglich werden. RLS muss Teamzugehörigkeit und Rolle für **jede Tabelle** berücksichtigen; Phase-1-Policies nicht blind auf geteilte Tabellen übernehmen.

## Datenschutz
Nur Demo- bzw. künstliche Kinderdaten für Entwicklung verwenden. Vor dem produktiven Einsatz mit echten Kindern: Authentifizierung, rollenbasierte Zugriffsprüfung, Zweckbindung, Verarbeitungsgrundlage, Löschkonzept und geeignete organisatorische Vereinbarungen prüfen. Projekt und Browserdaten werden nicht automatisch durch GitHub gesichert.

Offizielle Informationen:
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/auth-email-passwordless
