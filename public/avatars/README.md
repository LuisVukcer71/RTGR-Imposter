# Avatar-Platzhalter

Hier wird **ein** Bild pro Person abgelegt (kein separates Set mehr für klein/
groß). Es wird für beide Zwecke verwendet:

- klein als Kreis-Avatar in Listen/Setup-Grid (`object-fit: cover`)
- groß als Charakterbild in Reveal-Momenten - HandoffCard, RoleCard,
  ResolutionView (`object-fit: contain`)

Bis eine Datei fehlt/nicht lädt, zeigt die App automatisch einen
Initialen-Kreis in der jeweiligen Identitätsfarbe aus `src/data/players.ts` -
sie ist also auch mit teilweise fehlenden Dateien voll funktionsfähig.

Erwartete Dateinamen (exakt, kleingeschrieben, wie in `src/data/players.ts`
referenziert):

- luis.png
- philipp.png
- ilker.png
- resul.png
- amar.png
- marcel.png
- jovan.png
- hakob.png

**Format:** Brustbild/Halbkörper, Gesicht mittig, mind. 1000px auf der langen
Seite (wird sowohl klein als Kreis als auch groß als Portrait genutzt, daher
höher aufgelöst als ein reiner Listen-Avatar). Transparenter Hintergrund ist
ideal, funktioniert aber auch mit durchgehendem (z.B. schwarzem)
Hintergrund - die große Darstellung blendet die untere Kante automatisch
weich aus. `.webp` funktioniert genauso wie `.png` - dann in
`src/data/players.ts` den jeweiligen `avatarSrc`-Pfad anpassen.
