# Supabase Email Verificatie Setup

## Stap 1: Supabase Dashboard Configuratie

1. Ga naar je Supabase project dashboard
2. Navigeer naar **Authentication** > **Settings**
3. Scroll naar **Email Auth**

### Email Confirmatie Inschakelen:
- Zet **Enable email confirmations** op **ON**
- Zet **Confirm email** op **ON**

### Email Templates Configureren:
1. Ga naar **Authentication** > **Email Templates**
2. Selecteer **Confirm signup**
3. Pas de template aan:

```html
<h2>Welkom bij ArchonPro!</h2>
<p>Bedankt voor je registratie. Klik op de onderstaande link om je email te verifiëren:</p>
<p><a href="{{ .ConfirmationURL }}">Verifieer je email</a></p>
<p>Deze link is 24 uur geldig.</p>
<p>Als je dit account niet hebt aangemaakt, kun je deze email negeren.</p>
```

## Stap 2: Database Migratie Uitvoeren

Voer de database migratie uit om de email_verified kolom toe te voegen:

```bash
# Als je Supabase CLI gebruikt:
supabase db push

# Of voer handmatig uit in de SQL Editor:
```

```sql
-- Add email verification column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to be verified (for backwards compatibility)
UPDATE users 
SET email_verified = TRUE 
WHERE email_verified IS NULL;

-- Add index for email verification queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
```

## Stap 3: SMTP Configuratie (Optioneel)

Voor productie is het aan te raden om je eigen SMTP server te configureren:

1. Ga naar **Settings** > **Auth**
2. Scroll naar **SMTP Settings**
3. Configureer je SMTP provider (Gmail, SendGrid, etc.)

### Gmail SMTP Voorbeeld:
- **Host**: smtp.gmail.com
- **Port**: 587
- **Username**: jouw-email@gmail.com
- **Password**: App-specific password

## Stap 4: Redirect URLs Configureren

1. Ga naar **Authentication** > **URL Configuration**
2. Voeg toe aan **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://jouw-domain.com/auth/callback` (production)

## Stap 5: Testing

1. Registreer een nieuw account
2. Controleer of je een verificatie email ontvangt
3. Klik op de verificatielink
4. Controleer of je wordt doorgestuurd naar `/auth/email-verified`
5. Probeer in te loggen zonder verificatie (moet worden geblokkeerd)

## Troubleshooting

### Email wordt niet verstuurd:
- Controleer SMTP configuratie
- Check spam folder
- Verificeer redirect URLs
- Controleer Supabase logs

### Verificatielink werkt niet:
- Controleer of de link niet verlopen is (24u)
- Verificeer redirect URL configuratie
- Check browser console voor errors

### Gebruiker kan niet inloggen na verificatie:
- Controleer of `email_confirmed_at` is ingesteld in auth.users
- Verificeer database migratie is uitgevoerd
- Check middleware configuratie

## Productie Overwegingen

1. **Custom Email Templates**: Maak professionele email templates met je branding
2. **SMTP Provider**: Gebruik een betrouwbare SMTP service (SendGrid, Mailgun)
3. **Rate Limiting**: Configureer rate limiting voor email verzending
4. **Monitoring**: Monitor email delivery rates en bounces
5. **Backup Verificatie**: Implementeer alternatieve verificatie methoden

## Security Best Practices

1. **Token Expiry**: Houd verificatie tokens kort geldig (24u)
2. **Rate Limiting**: Beperk aantal verificatie emails per gebruiker
3. **Logging**: Log alle verificatie pogingen
4. **Cleanup**: Verwijder ongecontroleerde accounts na X dagen