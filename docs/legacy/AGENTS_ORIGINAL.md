# Projectcontext: SaaS Platform met AI-assistent

Dit project is een SaaS-platform waarbij onderscheid wordt gemaakt tussen twee soorten dashboards. Het is cruciaal dat de AI dit onderscheid begrijpt voor het genereren van correcte en veilige code, met name met betrekking tot toegangscontrole (Role-Based Access Control - RBAC).

## 1. Klant Dashboard (SaaS Gebruiker)
* **Doelgroep:** Eindgebruikers die een account hebben aangemaakt en een abonnement hebben.
* **Functionaliteit:** Toegang tot de voor hen geactiveerde modules (zoals Deals, Facturen, Projecten), gebruik van de AI-assistent, en beheer van hun eigen profiel en abonnement. Dit is het dashboard dat zichtbaar is in de screenshot 'ArchonPro'.

## 2. CEO / Super Admin Dashboard
* **Doelgroep:** Uitsluitend de CEO/eigenaar en systeembeheerders. Dit dashboard is STRIKT GESCHEIDEN van en NIET toegankelijk voor gewone klanten.
* **Doel:** Volledig beheer en configuratie van het SaaS-platform.

### Vereiste Functionaliteiten voor het CEO/Super Admin Dashboard:

**A. Modules en Prijzen Beheer:**
* **Modules:** CRUD (Create, Read, Update, Delete) functionaliteit voor alle platformmodules. Mogelijkheid om modules te activeren/deactiveren en hun eigenschappen (naam, beschrijving, icoon) aan te passen.
* **Prijzen & Abonnementen:** Het definiëren en beheren van verschillende prijsplannen (bijv. Basis, Pro, Enterprise). Per plan instellen welke modules zijn inbegrepen, wat de limieten zijn, en wat de prijsstelling is.

**B. AI Tokens Beheer:**
* **Configuratie:** Het instellen van tokenlimieten per abonnement en eventuele kosten voor extra tokens.
* **Overzicht:** Dashboard met totaal tokenverbruik en verbruik per gebruiker/abonnement.
* **Acties:** De mogelijkheid om handmatig tokens toe te voegen aan of in te trekken van een specifieke gebruiker.

**C. Gebruikersbeheer:**
* **Overzicht:** Een lijst van alle geregistreerde gebruikers met hun status en abonnementsinformatie.
* **Acties:** Het kunnen **blokkeren en deblokkeren** van gebruikersaccounts. De mogelijkheid om een abonnement van een gebruiker handmatig te wijzigen.

**D. Aanvullende Admin-functies (Te implementeren):**
* **Analytics:** Dashboard met KPI's zoals omzet (MRR), gebruikersgroei en churn.
* **Systeemlogs:** Toegang tot foutlogs en audit logs voor monitoring en beveiliging.
* **Communicatie:** De mogelijkheid om systeembrede meldingen naar alle gebruikers te sturen.
* **Instellingen:** Beheer van algemene platforminstellingen en externe integraties.

**Instructie voor de AI:** Houd bij alle code-generatie en advies rekening met deze strikte scheiding tussen het klant- en het admin-gedeelte. Zorg ervoor dat admin-functionaliteiten nooit toegankelijk zijn voor gebruikers zonder de juiste 'admin' rol of rechten. Implementeer robuuste authenticatie en autorisatiechecks.

## Belangrijke Regels

**NIETS VERWIJDEREN ZONDER TOESTEMMING:**
* De AI mag **NOOIT** bestanden, code, database records, of enige andere data verwijderen zonder expliciete toestemming van de gebruiker.
* Bij onzekerheid over wijzigingen of verwijderingen: **ALTIJD eerst vragen aan de gebruiker**.
* Deze regel geldt voor alle acties: bestanden verwijderen, code regels weghalen, database migraties met DROP/DELETE, etc.
