# Project-Document Integratie

## Overzicht

Het systeem maakt automatisch een document map aan wanneer een nieuw project wordt gecreëerd. Dit zorgt voor een georganiseerde structuur waarbij elk project zijn eigen document ruimte heeft.

## Hoe het werkt

### 1. Automatische Map Aanmaak
- Wanneer een nieuw project wordt aangemaakt via de API (`POST /api/projecten`), wordt automatisch een document map gecreëerd
- De map wordt aangemaakt in Supabase Storage onder het pad: `projects/{projectId}/`
- Er wordt een `README.md` bestand toegevoegd met project informatie

### 2. Document Upload
- Gebruikers kunnen documenten uploaden via de documenten pagina
- Als een specifiek project is geselecteerd, worden documenten automatisch in de juiste project map opgeslagen
- Pad structuur: `{userId}/projects/{projectId}/{bestandsnaam}`

### 3. Document Organisatie
- **Algemene documenten**: `{userId}/` - Voor documenten niet gekoppeld aan een project
- **Project documenten**: `{userId}/projects/{projectId}/` - Voor project-specifieke documenten

### 4. Automatische Opruiming
- Wanneer een project wordt verwijderd (`DELETE /api/projecten/{id}`), wordt de bijbehorende document map automatisch opgeruimd
- Alle bestanden in de project map worden verwijderd

## Technische Implementatie

### Nieuwe Bestanden
- `src/lib/project-utils.ts` - Utility functies voor project-document integratie
  - `createProjectDocumentFolder()` - Maakt project map aan
  - `projectDocumentFolderExists()` - Controleert of map bestaat
  - `deleteProjectDocumentFolder()` - Verwijdert project map

### Aangepaste Bestanden
- `src/app/api/projecten/route.ts` - POST methode uitgebreid met automatische map aanmaak
- `src/app/api/projecten/[id]/route.ts` - DELETE methode uitgebreid met map opruiming
- `src/app/api/upload/route.ts` - Ondersteunt project-specifieke upload paden
- `src/app/(dashboard)/documenten/page.tsx` - Project filter en organisatie

## Gebruikerservaring

### Voor Gebruikers
1. Maak een nieuw project aan
2. Ga naar de documenten pagina
3. Selecteer het project in de dropdown
4. Upload documenten - deze worden automatisch in de juiste map opgeslagen
5. Alle project documenten zijn georganiseerd en gemakkelijk te vinden

### Voordelen
- **Automatische organisatie**: Geen handmatige map aanmaak nodig
- **Consistente structuur**: Elk project heeft dezelfde document organisatie
- **Gemakkelijke navigatie**: Project filter in documenten pagina
- **Automatische opruiming**: Geen zwevende bestanden bij project verwijdering

## Foutafhandeling

Het systeem is robuust ontworpen:
- Als map aanmaak faalt, wordt het project nog steeds aangemaakt (met waarschuwing in logs)
- Als map verwijdering faalt, wordt het project nog steeds verwijderd (met waarschuwing in logs)
- Upload API detecteert automatisch de juiste map structuur

## Toekomstige Uitbreidingen

Mogelijke verbeteringen:
- Bulk document upload voor projecten
- Document templates per project type
- Automatische document categorisatie
- Project document statistieken
- Document versioning binnen projecten