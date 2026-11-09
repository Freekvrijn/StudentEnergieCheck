# Controleverslag fase 1

Gecontroleerd op 9 november 2026. Dit is een technische controle van het prototype, nog geen gebruikersonderzoek met studenten.

## Automatische controle

`npm test`: **14 tests geslaagd**. De tests controleren de score, nul versus ontbrekende antwoorden, lokale datum en dagdelen, vragen per moment, grenzen voor slaapuren, optionele context, opslagcontrole, aanpassen zonder duplicaten, volgorde van checks, tipregels en onafhankelijke voorbeeldgegevens.

`node --check app.js`: geslaagd.

## In Chrome gecontroleerd

| Scenario | Waargenomen resultaat |
| --- | --- |
| Eerste bezoek zonder gegevens | Lege scores, 0 van 3 checks, uitnodiging voor eerste check |
| Doorgaan zonder energie in te vullen | Veldmeldingen en focus op het eerste ontbrekende antwoord |
| Ochtendcheck volledig invullen | Slaapuren, slaapkwaliteit en verwachte belasting gevraagd |
| Mentaal 6, lichamelijk 8 | Deelscores 60 en 80; totaal 70 |
| Pagina verversen na opslaan | Eigen ochtendcheck blijft op het dashboard bewaard |
| Voorbeeldmodus aanzetten | Twee fictieve checks en een expliciete voorbeeldmelding |
| Terug naar eigen gegevens | Eigen ochtendcheck is intact, geen fictieve middagcheck toegevoegd |
| Bestaande voorbeeldmiddagcheck aanpassen | Antwoorden vooraf ingevuld; 7 en 8 leveren 75; aantal checks blijft 2 |
| Nieuwe voorbeeldavondcheck | Vragen over middag/avond, beweging, herstel, eten/drinken en stress |
| Avond met 5 en 4 en een terugblik | Totaal 45, terugblik zichtbaar en tip voor afronden van de dag |
| Gegevensbeheer | Verwijderen vraagt eerst een bevestiging |
| Zelf aangemaakte eigen testcheck verwijderen | Eigen omgeving keert terug naar 0 checks; demogegevens blijven apart |
| Mobiele weergave | Dashboard visueel gecontroleerd in Chrome-apparaatweergave op 393 × 852 |

De browserconsole liet tijdens de controle geen fout van de app zien. Er was een 404 van een bestaande Trustpilot-browserextensie; deze hoort niet bij het project.

## Grenzen van deze controle

- De volledige invulroutes zijn op desktop doorlopen; op mobiel is de vormgeving bekeken.
- Nog geen tests op een fysiek mobiel apparaat, met een schermlezer of in alle browsers.
- Opslagproblemen en ongeldige opslag worden in de code afgehandeld. De pure gegevenscontrole is automatisch getest; volle/geblokkeerde browseropslag is niet in de browser nagebootst.
- De vragen en tips zijn ontwerpkeuzes en nog niet gevalideerd in onderzoek met de doelgroep.

De zelf aangemaakte eigen browserinvoer is na de test verwijderd. Er zijn geen persoonlijke antwoorden opgenomen in de repository.

## Aanvullende bewijs- en verbetersessie

Bij een nieuwe testsessie op 9 november is ontdekt dat opgeloste veldmeldingen bleven staan totdat de gebruiker opnieuw op Volgende klikte. Dit is aangepast: na geldige invoer verdwijnt de betreffende melding direct, zonder verlies van focus. Dezelfde test is vóór en na de wijziging vastgelegd in [het bewijslastdossier](bewijslast/week-1/README.md). Ook is de volledige ochtendroute opnieuw doorlopen en slagen de veertien bestaande tests. Dit is technische controle, geen gebruikersonderzoek.
