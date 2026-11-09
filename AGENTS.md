# Student Energy Check — projectafspraken

## Doel en doelgroep
- Bouw een goed uitgewerkt schoolproduct voor alle studenten van 18 jaar en ouder.
- Help studenten hun energie te herkennen, patronen te bekijken en een haalbare actie te kiezen.
- Alle productteksten zijn in duidelijk, vriendelijk Nederlands.

## Fase 1: werkende lokale demo
- Lever eerst een volledige gebruikersroute: dashboard → ochtend-, middag- of avondcheck → resultaat → persoonlijke tips.
- Iedere check vraagt mentale en lichamelijke energie (0–10), plus momentafhankelijke vragen over slaap, stress, belasting, beweging en herstel.
- Mentale en lichamelijke scores zijn de eigen antwoorden × 10. Totaal = gemiddelde van beide. Ontbrekende antwoorden zijn nooit nul.
- Slaap, stress en gewoonten geven context aan tips; gebruik geen verzonnen medische wegingen of diagnoses.
- Toon het moment en de datum bij resultaten. Noem een score geen objectieve of gevalideerde gezondheidsmeting.
- Bewaar eigen checks lokaal in de browser, maximaal één per datum en dagdeel. Bestaande checks mogen worden aangepast.
- Houd demogegevens strikt gescheiden van eigen invoer; een demo mag eigen gegevens nooit overschrijven.
- Ondersteun lege toestanden, invoercontrole, opslagproblemen en het verwijderen van eigen gegevens.
- Maak de app bruikbaar op mobiel en desktop met labels, zichtbare focus en toetsenbordbediening.

## Technische keuzes
- Fase 1 is een lokale statische HTML/CSS/JavaScript-app zonder externe afhankelijkheden, accounts of backend.
- Gebruik ES-modules en houd score-, tip- en gegevenslogica gescheiden van de weergave.
- Geen externe analytics, lettertypen of dataverzoeken nodig voor het product.
- Start lokaal via `npm run dev` of `python3 -m http.server 8080`.
- De gebruiker heeft publicatie van de broncode naar `https://github.com/Freekvrijn/StudentEnergieCheck.git` geautoriseerd. Push de gecontroleerde fase 1 naar deze repository.
- Hosting van een publieke website, accounts, AI-integraties en verdere fases vallen buiten de huidige opdracht.

## Werkwijze en oplevering
- Houd de scope bij de afgesproken fase; werk zelfstandig aan routinekeuzes.
- Voeg geen subagents toe zonder expliciete opdracht van de gebruiker.
- Documenteer starten, scoreberekening, opslag, demomodus en beperkingen in README.md.
- Controleer de kernberekening, momentafhankelijke vragen, tips en gegevensscheiding met gerichte tests.
- Controleer de volledige route in de browser waar mogelijk, ook op een mobiel formaat.
- Meld uitgevoerde controles en eventuele verificatiebeperkingen bij oplevering.
