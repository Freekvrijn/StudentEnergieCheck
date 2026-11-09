# Student Energy Check

Een werkend schoolprototype voor studenten van **18 jaar en ouder**. Drie korte checkmomenten helpen studenten stilstaan bij hun mentale en lichamelijke energie. Het dashboard toont scores en persoonlijke, haalbare tips.

## Starten

Vereist: **Node.js 20 of nieuwer**. Geen installatie van pakketten nodig.

```sh
npm run dev
```

Open vervolgens **http://127.0.0.1:8080**. Houd de terminal open zolang je de app gebruikt. Stop met `Ctrl+C`.

Is poort 8080 bezet? Gebruik op macOS/Linux `PORT=8081 npm run dev`.

Als alternatief met Python 3: `python3 -m http.server 8080 --bind 127.0.0.1`.

## Demonstreren

1. Open het dashboard. Zonder eigen checks zie je een lege, herkenbare beginstand.
2. Klik op **Voorbeeld bekijken** om een dashboard met fictieve ochtend- en middaggegevens te tonen.
3. Vul bijvoorbeeld een avondcheck in. De drie stappen zijn energie, balans en context.
4. Bekijk de totaalscore, de twee deelscores en drie passende tips.
5. Ga terug naar het dashboard. Klik op **Terug naar mijn gegevens** om je eigen omgeving te zien.

Voorbeeldgegevens staan alleen in het werkgeheugen en zijn strikt gescheiden van je eigen checks. Bij opnieuw openen van de voorbeeldmodus wordt de voorbeeldset hersteld.

## Fase 1: gerealiseerd

- Dashboard met laatste check van vandaag, deelscores en een eenvoudige grafiek van de dagdelen.
- Ochtend-, middag- en avondcheck, met vragen die passen bij de betreffende periode.
- Drie stappen met invoercontrole en behoud van antwoorden bij teruggaan binnen de check.
- Resultaatscherm met transparante scoreberekening en drie tips.
- Eén eigen check per datum en dagdeel; opnieuw invullen past de bestaande check aan.
- Lokale opslag, gescheiden demomodus en verwijderfunctie met bevestiging.
- Uitleg over score, doel en gegevensgebruik.
- Responsive vormgeving, toetsenbordbediening, focusstijlen en Nederlandstalige labels.

De app suggereert een dagdeel op basis van je lokale tijd: ochtend vóór 12:00, middag van 12:00 tot 18:00, avond vanaf 18:00. Je kunt elk dagdeel zelf openen. Bij verversen wordt een nog niet afgeronde vragenlijst opnieuw gestart; alleen afgeronde checks worden bewaard.

## Scoreberekening

- Mentale energie: eigen antwoord van 0–10 × 10.
- Lichamelijke energie: eigen antwoord van 0–10 × 10.
- Totale energie: het gemiddelde van de twee deelscores.
- Voorbeeld: mentaal 6 en lichamelijk 8 → `(60 + 80) / 2 = 70`.
- Ontbrekende antwoorden of gemiste checks zijn nooit nul.

De teksten ‘weinig energie’ (0–39), ‘wisselende energie’ (40–69) en ‘veel energie’ (70–100) zijn **ontwerpkeuzes**, geen klinische grenzen. Dit is zelfrapportage, geen wetenschappelijk gevalideerde of objectieve gezondheidsmeting.

Slaap, stress, belasting, beweging en herstel veranderen de score niet. Deze antwoorden bepalen de tips. Tips werken met vaste, uitlegbare regels in `logic.mjs`: bijvoorbeeld ruimte voor rust bij ziek zijn, één kleine taak bij veel spanning, of een pauze bij weinig herstel. Er is geen AI-koppeling. De app doet geen diagnoses en kan oorzaken van vermoeidheid niet vaststellen.

## Gegevens en privacy

Eigen afgeronde checks worden opgeslagen in `localStorage` onder `student-energy-check.v1`. Dit is **geen versleutelde opslag**. Iedereen met toegang tot dezelfde browser kan de gegevens bekijken. Vul op gedeelde apparaten geen gevoelige details in en verwijder je gegevens na gebruik.

Er zijn geen accounts, analytics, externe lettertypen, externe scripts of API-verzoeken. Antwoorden worden niet verstuurd naar de lokale webserver, GitHub of je school. Alleen bronbestanden worden gepubliceerd in de repository. Wis alles via **Mijn gegevens → Verwijder eigen gegevens**. Browsergegevens wissen verwijdert ook de opgeslagen checks. Een andere browser, een ander apparaat of een ander serveradres heeft een eigen opslag.

Bij geblokkeerde of volle opslag meldt de app dat antwoorden alleen tijdens de huidige sessie beschikbaar zijn. Beschadigde opslag wordt niet stilzwijgend overschreven: verwijder die via de gegevensknop om opnieuw te beginnen.

## Controles

```sh
npm test
```

Gerichte tests controleren onder andere ontbrekende versus nul-antwoorden, dagdelen, invoergrenzen, de berekening, aanpassen zonder duplicaten, geldige opslag en de prioriteit van tips.

Handmatige browsercontrole: eigen check invullen, resultaat beoordelen, verversen, antwoorden aanpassen, voorbeeldmodus in- en uitschakelen, gegevens verwijderen en mobiele weergave controleren.

## Projectstructuur

| Bestand | Doel |
| --- | --- |
| `AGENTS.md` | Projectafspraken en scope |
| `index.html` | Toegankelijke basis van de pagina |
| `styles.css` | Responsive vormgeving |
| `app.js` | Interface, navigatie en browseropslag |
| `logic.mjs` | Vragen, scores, tips en gegevenscontrole |
| `server.mjs` | Lokale ontwikkelserver zonder afhankelijkheden |
| `tests/logic.test.mjs` | Tests voor de kernlogica |

## Volgende fases

Vervolgonderzoek, gebruikerstests met studenten en verbeteringen op basis van hun feedback volgen na deze bouwfase. Een weekgeschiedenis, persoonlijke doelen, accounts en synchronisatie zijn nog geen onderdeel van dit prototype.
