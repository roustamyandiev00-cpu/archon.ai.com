# Email Verificatie Setup - ArchonPro

> Dit document beschrijft hoe je email verificatie met ArchonPro styling configureert in Supabase.

## Wat is er al gedaan?

✅ HTML email templates gemaakt in ArchonPro stijl  
✅ Edge Function `send-email` deployed naar Supabase  
✅ App heeft al email verification flow ingebouwd  

## Wat moet je nog doen?

### Stap 1: Ga naar Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Selecteer je project (ref: `hqeozmmlddvempancnao`)
3. Ga naar **Authentication** → **Email Templates**

### Stap 2: Vervang de Email Templates

Kopieer de HTML uit de template bestanden en plak deze in het Supabase dashboard:

#### Confirmation Template (`Confirm signup`)
- **Subject:** `Bevestig je registratie - ArchonPro`
- **Template:** Kopieer inhoud van `/supabase/templates/confirmation.html`
- **Belangrijke variabelen die Supabase vervangt:**
  - `{{ .ConfirmationURL }}` - De bevestigingslink

#### Recovery Template (`Reset password`)
- **Subject:** `Wachtwoord resetten - ArchonPro`
- **Template:** Kopieer inhoud van `/supabase/templates/recovery.html`
- **Belangrijke variabelen:**
  - `{{ .ConfirmationURL }}` - De reset link
  - `{{ .Email }}` - Gebruikers email

#### Invite Template (`Invite user`)
- **Subject:** `Je bent uitgenodigd voor ArchonPro`
- **Template:** (optioneel, zelfde stijl als confirmation)

### Stap 3: Schakel Email Confirmatie In

Ga naar **Authentication** → **Providers** → **Email**:

- ✅ **Confirm email** - AANVINKEN
- ✅ **Secure email change** - AANVINKEN
- ✅ **Secure password change** - AANVINKEN

### Stap 4: Configureer de Send Email Hook (Optioneel maar Aanbevolen)

Voor betrouwbare email aflevering met de ArchonPro templates via Resend:

#### 4a. Maak een Resend account
1. Ga naar https://resend.com
2. Registreer en verifieer je domein (bijv. `archonpro.nl`)
3. Genereer een API key

#### 4b. Voeg Secrets toe aan Supabase

Ga naar **Project Settings** → **Secrets**:

| Secret | Waarde |
|--------|--------|
| `RESEND_API_KEY` | Je Resend API key |
| `FROM_EMAIL` | `noreply@archonpro.nl` (of je verifieerde domein) |

#### 4c. Configureer de Send Email Hook

Ga naar **Authentication** → **Hooks** → **Send Email Hook**:

- **URL:** `https://hqeozmmlddvempancnao.supabase.co/functions/v1/send-email`
- **Secret:** Genereer een willekeurige string en sla deze op als `SEND_EMAIL_HOOK_SECRET`
- **Enabled:** ✅

### Stap 5: Test de Flow

1. Ga naar je registratiepagina (`/register`)
2. Maak een test account aan
3. Controleer of je een mooie ArchonPro email ontvangt
4. Klik op de bevestigingslink
5. Je zou nu ingelogd moeten zijn

## Template Locaties

De template bestanden staan in je project:

```
/supabase/templates/
├── confirmation.html    # Registratie bevestiging
├── recovery.html        # Wachtwoord reset
└── invite.html          # Uitnodigingen (optioneel)
```

## Problemen?

**Emails komen niet aan?**
- Check spam/junk folders
- Verifieer dat email confirmatie AAN staat in Supabase Auth settings
- Test met Resend voor betrouwbaardere aflevering

**Templates zien er niet goed uit?**
- Email clients ondersteunen beperkte CSS
- De templates gebruiken inline styles voor maximale compatibiliteit
- Test in verschillende email clients (Gmail, Outlook, Apple Mail)

**Hook werkt niet?**
- Controleer dat de Edge Function URL correct is
- Verifieer dat de secrets correct zijn ingesteld
- Check de Edge Function logs in Supabase dashboard

## Edge Function Details

- **Naam:** `send-email`
- **URL:** `https://hqeozmmlddvempancnao.supabase.co/functions/v1/send-email`
- **Status:** Actief
- **Templates:** Bevat ArchonPro styling voor signup, recovery, invite, email_change

## Ondersteunde Email Types

De Edge Function ondersteunt deze email types:
- `signup` - Registratie bevestiging
- `recovery` - Wachtwoord reset
- `invite` - Gebruiker uitnodigen
- `email_change` - Email adres wijzigen

Alle templates zijn in het Nederlands en gebruiken het ArchonPro kleurenschema (paars `#6861f2`).
