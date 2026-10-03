# CoachFlow – Supabase ist angebunden (Phase 1)

**Projekt:** `gzrstopdqsjdrrrzzhix` · EU Central · `https://gzrstopdqsjdrrrzzhix.supabase.co`

**Datenbankstatus:** Die Migration `create_coachflow_personal_state` ist in diesem Projekt erfolgreich ausgeführt. `public.coachflow_state` hat RLS und vier Eigentümer-Policies. Zum Zeitpunkt der Einrichtung waren 0 Datensätze vorhanden. Andere Projekte blieben unverändert.

**App-Status:** Die öffentliche GitHub-Pages-App enthält ein optionales Cloud-Panel in `⋯ → Einstellungen & Daten → Cloud-Synchronisierung`: Anmeldung mit E-Mail + Passwort, Magic Link, Einmalcode, Neuregistrierung sowie das Festlegen eines Passworts für einen bereits angemeldeten Magic-Link-Account. `cloud-sync.js` enthält ausschließlich die projektbezogene URL und einen öffentlichen `sb_publishable_...` Key. Die App lädt Supabase JS nur, wenn die Cloud-Funktion genutzt wird. Der bisherige `localStorage`-Schlüssel bleibt `coachflow-prototype-v1`.

## Einmalig: Anmeldung im Supabase-Dashboard freigeben

Öffne in **diesem** Supabase-Projekt **Authentication → URL Configuration**:

- **Site URL:** `https://marinkarimovic.github.io/coachflow/`
- **Redirect URLs:** `https://marinkarimovic.github.io/coachflow/` und optional `https://marinkarimovic.github.io/coachflow/index.html` (exakte URLs; kein pauschales `**` nötig).

Unter **Authentication → Email Templates → Magic Link** den sechsstelligen Code zusätzlich in die Vorlage aufnehmen, z. B. `<p>Dein CoachFlow-Code: <strong>{{ .Token }}</strong></p><p><a href="{{ .ConfirmationURL }}">Alternativ direkt anmelden</a></p>`. **Keine der Vorlagen einfach blind überschreiben; den bestehenden Bestätigungslink beibehalten.** Die iPhone-Homescreen-PWA kann dann mit dem Code aus der E-Mail direkt angemeldet werden, selbst wenn ein Magic Link in Safari statt innerhalb der PWA geöffnet wird.

Falls die App ausschließlich über einen Link verwendet wird, genügt die freigegebene Redirect-URL. Supabase Auth sendet standardmäßig einen Magic Link bei `signInWithOtp`. Pro Mailanforderung gelten Rate-Limits.

Quellen: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [E-Mail-Passwortlose Anmeldung](https://supabase.com/docs/guides/auth/auth-email-passwordless), [E-Mail-Templates](https://supabase.com/docs/guides/auth/auth-email-templates).

## E-Mail & Passwort auf dem iPhone verwenden

**Option A: Du hast bereits ein per Magic Link bestätigtes Supabase-Konto.** Melde dich zuerst mit dem bisherigen Magic Link oder Einmalcode an. Gib unter **Neues Konto / Passwort festlegen** ein neues Passwort (mindestens zwölf Zeichen) zweimal ein und wähle **„Passwort für mein angemeldetes Konto festlegen“**. Das Passwort wird per `auth.updateUser` auf **demselben** Supabase-Konto gesetzt; das Cloud-Backup bleibt dessen Nutzer-ID zugeordnet. Beim nächsten Öffnen über **„Mit Passwort anmelden“** einloggen. **Nicht erneut registrieren**, sonst kann ein anderes Konto entstehen.

**Option B: Es gibt noch keinen bestätigten Supabase-Login.** Mit E-Mail und Passwort ein neues Konto registrieren. Bei standardmäßig aktivierter E-Mail-Bestätigung muss der Link aus Supabase bestätigt werden, bevor die Anmeldung funktioniert. Der kostenlose Standardversand von Supabase versendet nur an vorab autorisierte Mitglieder der Supabase-Organisation und ist stark begrenzt. Andere E-Mail-Adressen benötigen einen eigenen SMTP-Dienst. Wenn die Registrierung keine Sitzung zurückgibt, ist die Anmeldung noch nicht abgeschlossen.

**Wichtig:** Die Einstellung „E-Mail bestätigen“ nicht nur zum Umgehen der SMTP-Beschränkungen deaktivieren. Für den späteren produktiven Betrieb und andere Trainer einen SMTP-Anbieter mit eigener Domain konfigurieren. Die Anpassung der E-Mail-Vorlagen für OTP ist in deinem Dashboard ohne Custom SMTP nicht freigeschaltet; Passwort-Login bei einem bereits bestätigten Konto braucht beim normalen Einloggen dagegen keine erneute E-Mail.

Passwörter werden **nicht** in den CoachFlow-Trainingsdaten, `localStorage`-Backups oder im GitHub-Repository gespeichert; die Supabase-Authentifizierung verwaltet sie. Es verbleibt ausschließlich die übliche Supabase-Session im Browser. Passwörter werden nach einer Aktion aus den sichtbaren Eingabefeldern entfernt.

## Erste Cloud-Sicherung (ohne lokalen Datenverlust)

1. CoachFlow auf dem iPhone öffnen. Unter `⋯ → Einstellungen & Daten` zuerst ein **JSON-Backup exportieren** und sicher aufbewahren.
2. `Cloud-Synchronisierung` öffnen und deine E-Mail-Adresse eingeben. Mit **Passwort anmelden**, sofern das Konto bereits ein Passwort besitzt; anderenfalls **Magic Link / Einmalcode** verwenden und danach über **„Passwort für mein angemeldetes Konto festlegen“** ein Passwort ergänzen.
3. Bei installiertem Homescreen-Modus am einfachsten den **sechsstelligen Code** aus der E-Mail in der App eingeben (sofern das Template entsprechend angepasst wurde). Alternativ Anmeldelink im Browser öffnen.
4. `Lokale Daten in Cloud sichern` klicken und bestätigen.
5. Auf einem weiteren Gerät mit **demselben Supabase-Benutzerkonto** anmelden. Dort erst `Cloud-Daten auf dieses Gerät laden` drücken und den Warnhinweis bestätigen.
6. Jede weitere Sicherung erfolgt **manuell**, nicht automatisch. Ein Versionscheck verhindert stilles Überschreiben neuerer Cloud-Daten; bei Konflikt JSON-Backups beider Geräte vergleichen.

**Datenschutz:** In einem öffentlichen GitHub-Repository liegen weder Login-Passwörter noch Spielerlisten. In Supabase gespeicherte Datensätze sind durch Auth + RLS auf die zugehörige Nutzer-ID beschränkt. Für produktiven Betrieb mit echten Kinderdaten sind eine dokumentierte Rechtsgrundlage und Rollen-/Vereinszugriffsregeln erforderlich. Die Phase-1-Struktur ist noch **nicht** für Teamfreigaben geeignet.

## Sicherheitsprüfung

```sql
select schemaname,tablename,rowsecurity
from pg_tables
where schemaname='public' and tablename='coachflow_state';

select policyname,cmd,roles,qual,with_check
from pg_policies
where schemaname='public' and tablename='coachflow_state'
order by policyname;

select has_table_privilege('anon','public.coachflow_state','SELECT') as anon_select,
       has_table_privilege('anon','public.coachflow_state','INSERT') as anon_insert,
       has_table_privilege('authenticated','public.coachflow_state','SELECT') as authenticated_select;
```

**Wichtig:** Ein browserseitiger Publishable Key ist kein Geheimnis und darf den Quellcode begleiten; `service_role`, `sb_secret_...` und Datenbankkennwörter dürfen **niemals** in HTML/JavaScript oder GitHub veröffentlicht werden.
