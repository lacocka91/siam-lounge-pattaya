# Siam Lounge Pattaya

Statische, dreisprachige Website für **Siam Lounge Central**, **Siam Lounge Pratumnak** und die **Unterkunft in Pratumnak**. Die bestehende Website wurde weiterentwickelt; HTML5, CSS3 und Vanilla JavaScript bleiben die Grundlage. Kein Build, Framework, kostenpflichtiger Dienst oder Backend ist für die Website nötig.

**Wichtig:** Die Formulare erstellen ausschließlich Anfragen. Sie prüfen keine Tisch- oder Zimmerverfügbarkeit, senden nichts automatisch und bestätigen keine Reservierung. Bestätigte Geschäftsdaten müssen vom Betreiber ergänzt werden.

## Lokal ansehen – auch nach einem PC-Neustart

Die zuverlässige Vorschau verwendet **Port 4173**. Node.js ist auf dem aktuellen Rechner vorhanden; Projektpakete müssen nicht installiert werden.

Nach jedem PC-Neustart PowerShell oder das Terminal im Editor öffnen und ausführen:

```powershell
Set-Location -LiteralPath 'C:\Users\domin\Documents\GitHub\siam-lounge-pattaya'
node scripts/preview.cjs
```

Danach **http://127.0.0.1:4173/** im Browser öffnen. Das Terminal geöffnet lassen. **Strg+C** beendet den Server. Bei späterem Start im bereits geöffneten Repository genügt:

```powershell
node scripts/preview.cjs
```

Der Server verwendet den Repository-Pfad relativ zu seiner eigenen Datei und funktioniert auch nach Verschieben des Projekts. Er bindet ausschließlich an `127.0.0.1`, nicht an das öffentliche Netzwerk. Es ist kein Git-Befehl beteiligt.

- Bei „Port 4173 is already in use“ zuerst die Vorschau-URL prüfen. Läuft sie bereits, muss kein zweiter Server gestartet werden. Einen alten Server gegebenenfalls in dessen Terminal mit Strg+C beenden.
- Nach Codeänderungen die Browserseite neu laden; ein Serverneustart ist normalerweise nicht nötig.
- Zum Prüfen eines GitHub-Pages-Projektpfads ist außerdem **http://127.0.0.1:4173/siam-lounge-pattaya/** verfügbar.
- Alternativ `index.html` per Doppelklick öffnen. Auch `file://` unterstützt die klassischen Skripte und Formulare. Sprache speichern oder automatisch kopieren kann dort durch Browserregeln eingeschränkt sein; eine manuelle Kopiermöglichkeit bleibt vorhanden.
- Auf einem anderen Rechner braucht nur die optionale lokale Servervorschau Node.js. Die veröffentlichte Website und das direkte Öffnen der HTML-Datei benötigen es nicht.

## Projektstruktur

```text
siam-lounge-pattaya/
├── index.html                # Englische Grundversion, Abschnitte und native Dialoge
├── css/
│   ├── styles.css            # Markenfarben, vorhandenes Layout, Platzhalter, Responsivität
│   └── features.css          # Standortdesign, Formulare, Events, Galerie, mobile Leiste
├── js/
│   ├── translations.js       # EN, DE und Thai einschließlich Fehlern und Statusmeldungen
│   ├── config.js             # Bestätigte Kontakte, Buchungslinks und optionales Original-Logo
│   ├── data.js               # Events, Speisekarte und Galeriebilder
│   ├── ui.js                 # Dialoge, Fokus, Übersetzungshilfen, Datums-/URL-Helfer
│   ├── main.js               # Sprache, Navigation, Kategorien und Scroll Reveal
│   ├── content.js            # Darstellung der zentralen Daten und Kontaktlinks
│   └── requests.js           # Validierung, Zusammenfassungen, Kopieren, Nachrichtenentwürfe
├── assets/
│   ├── favicon.svg           # Neutraler Tab-Platzhalter; kein nachgezeichnetes Logo
│   └── images/
│       └── .gitkeep          # Verzeichnis für freigegebene eigene Bilder
├── scripts/
│   ├── preview.cjs           # Optionaler lokaler Server auf Port 4173
│   └── check.cjs             # Strukturelle Prüfungen ohne Zusatzpakete
├── tests/
│   └── browser.cjs           # Optionale Browser-Regressionstests
├── .nojekyll                 # Statische Auslieferung über GitHub Pages
├── .gitattributes
└── README.md
```

Alle Produktionsdateien verwenden relative Ressourcenpfade. Die Skripte werden bewusst nicht als ES-Module geladen, damit direktes Öffnen der HTML-Datei möglich bleibt. Die Website verwendet keine externen Fonts, Fotos, Tracker oder eingebetteten Karten.

## Marke und Design

Die wichtigen Markenfarben stehen am Anfang von `css/styles.css`:

| Variable | Farbe | Verwendung |
| --- | --- | --- |
| `--dark` | `#0B0B0B` | Header, Hero, Central, Events, Footer |
| `--surface-dark` | `#151515` | Dunkle Karten und Flächen |
| `--gold` | `#C9A86C` | Warme Goldakzente auf dunklen Flächen |
| `--gold-dark` | `#7B592B` | Gut lesbare Goldtöne auf hellen Flächen |
| `--cream` | `#F7F4ED` | Stay, helle Grundfläche, Text auf Schwarz |
| `--white` | `#FFFFFF` | Pratumnak und helle Karten |
| `--ink` | `#151515` | Dunkler Text auf hellen Flächen |

Central und Events sind dunkel mit Goldakzenten; Pratumnak ist weiß und Stay cremefarben. Gemeinsame Typografie, Abstände und Buttons verbinden die Bereiche. Die zuvor grünen Hauptflächen wurden entfernt.

Die CSS-Bildflächen sind abstrakte, neutrale Platzhalter und keine Darstellung tatsächlicher Räumlichkeiten. Es wurden keine fremden Bilder heruntergeladen und kein Firmenlogo nachgezeichnet.

## Original-Logo einsetzen

Solange kein Original vorliegt, wird **SIAM LOUNGE / PATTAYA** als Textlogo angezeigt.

1. Die freigegebene Originaldatei nach `assets/images/logo-siam-lounge.svg` oder `assets/images/logo-siam-lounge.png` kopieren.
2. In `js/config.js` den Wert `logo` von `''` auf den relativen Dateipfad setzen.
3. Die Darstellung im Header und Footer prüfen. `.original-logo` in `css/features.css` definiert die Größe.

Ein leerer Wert löst keinen Dateiaufruf aus. Falls eine konfigurierte Bilddatei nicht geladen werden kann, bleibt das Textlogo sichtbar. Das neutrale Favicon erst durch ein freigegebenes Original ersetzen.

## Kontaktdaten zentral eintragen

`js/config.js` ist die zentrale Quelle:

- `locations.central` und `locations.pratumnak`: `phone`, `whatsapp`, `email`, `maps`, `line`, `facebook`, `address`, `hours`.
- `stay.booking`: bereits mit dem offiziellen Booking.com-Link gefüllt.
- `stay.agoda`: derzeit leer.
- `logo`: derzeit leer.

Für WhatsApp und E-Mail sind oben in derselben Datei die vier ausdrücklich benannten Variablen vorbereitet:

```javascript
const centralWhatsApp = '';
const pratumnakWhatsApp = '';
const centralEmail = '';
const pratumnakEmail = '';
```

Nur den entsprechenden Wert ändern; Kontaktfelder und Nachrichtenentwürfe beziehen sich automatisch darauf. Es muss keine Nachrichtenvorlage an mehreren Stellen bearbeitet werden.

### WhatsApp

Eine vom Betreiber bestätigte internationale Nummer inklusive Landesvorwahl, **nur Ziffern, ohne Pluszeichen, Leerzeichen oder Satzzeichen**, eintragen. Leere oder ungültige Nummern aktivieren keinen WhatsApp-Link. Nach einer gültigen Anfrage wird „WhatsApp öffnen“ verfügbar. Der Link öffnet `wa.me` mit der vorbereiteten Nachricht. Erst der Besucher sendet sie in WhatsApp ab.

### Telefon und E-Mail

`phone` mit bestätigter internationaler Telefonnummer füllen. Die Anzeige behält die eingegebene Formatierung; der `tel:`-Link in den Kontaktbereichen wird bereinigt.

Die bestätigten E-Mail-Adressen in den vier oben genannten Variablen eintragen. „E-Mail-Entwurf öffnen“ verwendet `mailto:` mit Betreff und Anfrage. Eine konfigurierte E-Mail-Anwendung ist dafür nötig. Es gibt keinen serverseitigen Versand.

### Google Maps, LINE, Öffnungszeiten und Adresse

- Die vollständige bestätigte HTTPS-Maps-URL in `maps` eintragen. „Anfahrt“ führt zur Standortauswahl; dort wird der individuelle Maps-Link verfügbar.
- Einen offiziellen HTTPS-Link für LINE in `line` ergänzen.
- `hours` und `address` jeweils vollständig als `{ en: '', de: '', th: '' }` ausfüllen.
- Solange Werte fehlen, bleibt „Coming soon“ bzw. die Übersetzung sichtbar.
- Für Maps, Facebook, LINE, Booking und Agoda werden nur HTTPS-Adressen akzeptiert.

Die offiziellen Facebook- und Booking.com-Links bleiben zusätzlich im englischen HTML als Fallback ohne JavaScript vorhanden. Falls diese drei offiziellen Zieladressen selbst geändert werden, auch die entsprechenden HTML-Fallbacks aktualisieren.

### Agoda

Die offizielle HTTPS-Adresse in `stay.agoda` eintragen. Der Hinweis „Agoda · Link coming soon“ wird automatisch zum aktiven Link. Es ist keine Änderung am Layout erforderlich.

## Tischreservierungsanfrage

„Reserve a table“ im Hero und in der mobilen Aktionsleiste öffnet den Dialog. Jede neue Tischanfrage beginnt mit „Standort wählen“, auch über Standort- oder Eventbuttons. Der Besucher muss Central oder Pratumnak selbst auswählen; beim Bearbeiten einer Zusammenfassung bleibt seine Auswahl erhalten.

1. Standort, Datum, Uhrzeit, Gästezahl, Name und Telefon/WhatsApp/LINE eingeben. Das Kontaktfeld akzeptiert auch LINE-IDs. E-Mail und besondere Wünsche sind optional.
2. Bestätigen, dass nur eine Anfrage erstellt wird.
3. „Anfrage vorbereiten“ prüft Pflichtfelder, Datum, Uhrzeit, ganze Gästezahl, Namen, Kontaktangabe und optionale E-Mail-Adresse. Vergangene Tage sind gesperrt. Ohne bestätigte Öffnungszeiten gibt es keine Einschränkung der wählbaren Uhrzeit.
4. Eine lesbare Zusammenfassung wird angezeigt. **Es wurde noch nichts gesendet.**
5. Die Zusammenfassung kopieren und über einen bestätigten Kontaktweg weitergeben. Bis Kontaktdaten hinterlegt sind, bleiben WhatsApp/E-Mail deaktiviert; die offizielle Facebook-Seite des ausgewählten Standorts ist verlinkt.
6. Nach Eintragen der Kontaktdaten kann alternativ ein vorbereiteter WhatsApp- oder E-Mail-Entwurf geöffnet werden. Der Besucher prüft und versendet ihn selbst.

Es gibt keine behauptete Tischverfügbarkeit, Bestätigungsnummer oder automatische Reservierungsbestätigung. Die Eingabegrenze 1–99 Gäste ist eine technische Formularregel und **keine Kapazitätsangabe**. Gruppen müssen separat bestätigt werden.

In beiden Anfragedialogen bleibt die Hauptaktion unten sichtbar: zuerst „Anfrage vorbereiten“, danach die Kopierfunktion samt Statusmeldung. Der Formularinhalt scrollt in einem eigenen Bereich oberhalb dieses Footers, ohne verdeckt zu werden. Tastaturbedienung, Focus Trap und Escape bleiben verfügbar.

## Unterkunftsanfrage

„Book your stay“ im Hero und in der mobilen Aktionsleiste öffnet die **Accommodation Request** für Pratumnak.

- Pflichtfelder: Check-in, Check-out, Gästezahl, Name, Telefon/WhatsApp/LINE und E-Mail.
- Besondere Wünsche sind optional.
- Check-in darf nicht vor dem aktuellen Tag in Pattaya liegen; Check-out muss nach Check-in liegen. Das früheste Abreisedatum wird bei Änderungen der Anreise sofort aktualisiert. Bereits gewählte Daten werden nicht stillschweigend verschoben; ungültige Kombinationen verhindern die Zusammenfassung. Beim Öffnen und Fokussieren der Formulare werden die Datumsgrenzen erneut aktualisiert.
- Die Anfrage verwendet ausschließlich die Kontakte von Pratumnak.
- Kopieren, Bearbeiten und spätere Nachrichtenentwürfe funktionieren wie bei Tischanfragen.
- Booking.com bleibt als separate, deutlich sichtbare Buchungsmöglichkeit vorhanden.
- Es gibt keine Live-Verfügbarkeitsprüfung, garantierte Zimmerverfügbarkeit, feste Zimmeranzahl oder automatische Direktbuchung.

Datumsvalidierung und Event-Zuordnung verwenden `Asia/Bangkok`. Zusammenfassungen enthalten zusätzlich ein eindeutiges ISO-Datum. Die thailändische Anzeige darf dem lokalen Kalenderformat folgen.

### Datenschutz und Kopierfunktion

Formulardaten werden nur im Arbeitsspeicher der geöffneten Seite gehalten, nicht in Local Storage gespeichert und nicht an einen Server gesendet. Die Sprachwahl ist die einzige von der Website gespeicherte Präferenz. „Formular leeren“ entfernt die eingegebenen Daten; Neuladen verwirft sie ebenfalls. Beim Kopieren oder bewussten Öffnen eines Nachrichtenentwurfs werden die Daten durch den Besucher weitergegeben.

Wenn die Clipboard-API blockiert ist, versucht die Website die browserseitige Kopierfunktion. Falls auch diese nicht verfügbar ist, bleibt die Zusammenfassung zum manuellen Markieren und Kopieren erreichbar.

## Events und Archiv pflegen

Events stehen zentral in `SIAM_DATA.events` in `js/data.js`. Die Liste ist absichtlich leer. Öffentlich steht deshalb „New events will be announced here soon.“ Es werden keine erfundenen Termine oder leeren Filter gezeigt.

Zum Ergänzen einen Eintrag nach diesem Schema vollständig mit **bestätigten** Daten ausfüllen. Die leeren Zeichenketten im Beispiel sind Platzhalter, kein veröffentlichbares Event:

```javascript
{
  id: 'eindeutige-event-id',
  title: { en: '', de: '', th: '' },
  date: '',                       // bestätigtes Datum: YYYY-MM-DD
  time: '',                       // bestätigte Ortszeit: HH:mm; leer = Uhrzeit folgt
  location: 'central',             // 'central' oder 'pratumnak'
  category: 'special',
  description: { en: '', de: '', th: '' },
  image: '',                      // optional: assets/images/dateiname.webp
  alt: { en: '', de: '', th: '' }, // erforderlich, wenn ein echtes Bild angezeigt wird
  reservationEnabled: true
}
```

- `id`: eindeutige Kleinbuchstaben, Ziffern und Bindestriche.
- Titel und Beschreibung müssen in allen drei Sprachen ausgefüllt sein. Unvollständige oder ungültige Einträge werden nicht veröffentlicht.
- Kategorien: `food`, `liveMusic`, `pool`, `special`, `community`, `party`, `holiday`, `sports`.
- Kommende Events erscheinen nach Datum/Uhrzeit sortiert. Ohne bestätigte Uhrzeit wird ein übersetzter Hinweis gezeigt.
- `reservationEnabled: true` ergänzt „Reserve for event“. Der Button übernimmt Datum und gegebenenfalls Uhrzeit in die Tischanfrage; der Standort muss bewusst ausgewählt werden. Der Anlass steht separat sichtbar im Formular und in der Zusammenfassung und wird beim Sprachwechsel mitübersetzt.
- Wählt der Besucher einen abweichenden Standort oder ändert Eventdatum bzw. eine vorgegebene Eventuhrzeit, wird die Eventzuordnung entfernt.
- Ein Event mit einem Datum **vor dem heutigen Tag in Pattaya** erscheint automatisch unter „Past events“. Ein Event vom heutigen Tag bleibt bis zum Folgetag im kommenden Bereich, da keine Endzeiten vorliegen.
- Vergangene Events haben keinen Reservierungsbutton. Ihre Bilder lassen sich über die Lightbox betrachten.
- Solange kein vergangenes Event existiert, bleibt das vorbereitete Archiv vollständig ausgeblendet.

## Speisekarte pflegen

`SIAM_DATA.menu` in `js/data.js` ist ebenfalls leer. Alle fünf Kategorien zeigen derzeit „Menu coming soon“.

Schema für später bestätigte Gerichte:

```javascript
{
  id: 'eindeutige-gericht-id',
  name: { en: '', de: '', th: '' },
  description: { en: '', de: '', th: '' },
  price: null,                  // erst durch einen bestätigten Zahlenwert ersetzen
  currency: '',                 // bestätigter ISO-Währungscode
  category: 'thai',
  image: '',
  alt: { en: '', de: '', th: '' },
  popular: false,
  spicy: false,
  vegetarian: false
}
```

Kategorien: `breakfast`, `thai`, `german`, `european`, `drinks`. Namen und Beschreibungen in allen drei Sprachen ergänzen. Nur bestätigte Kennzeichnungen aktivieren. Ohne gültigen Preis und Währung zeigt die Karte „Price to be confirmed“. Eine leere Kategorie behält den „Coming soon“-Hinweis. Es werden keine Demopreise ausgegeben.

Die aktuelle Speisekarte ist gemeinsam. Vor Veröffentlichung klären, welche Gerichte und Preise an beiden Standorten gelten. Bei unterschiedlichen Angeboten die Datenstruktur um standortspezifische Angebote erweitern.

## Bilder, Galerie und Lightbox

Alle Originalbilder gehören unter `assets/images/`. Unterstützt sind lokale SVG-, WebP-, AVIF-, PNG- und JPEG-Dateien; keine fremden Bild-URLs werden benötigt.

### Galerie

Die 17 kuratierten Originalfotos in `SIAM_DATA.gallery` decken `food`, `central`, `pratumnak`, `stay` und `events` ab. Acht davon ersetzen außerdem die Bildplatzhalter in Entdecken, Central, Pratumnak und den Unterkunftskarten. Vollständige Originaldateien-Zuordnung, Ausschlüsse und Aufbereitung: [Bilddokumentation](assets/images/README.md), technische Daten: [Bildmanifest](assets/images/manifest.json).

Die Galerie zeigt ein großes, unbeschnittenes Hauptbild mit Links-/Rechts-Pfeilen und einer horizontalen Vorschauleiste. Die aktive Vorschau ist markiert. Wischen am Hauptbild wechselt auf Touch-Geräten das Foto; vertikales Scrollen und Zoomen bleiben möglich. Pfeiltasten sowie Pos1/Ende wechseln die Auswahl, Enter/Leertaste auf dem Hauptbild öffnen die bestehende Lightbox. Kategorien begrenzen die Auswahl; bei nur einem Foto sind die Pfeile deaktiviert. Der Sprachwechsel erhält die Auswahl. Ohne JavaScript bleibt das ursprüngliche Fotoraster sichtbar.

1. Bei einem Eintrag `image` mit dem tatsächlichen relativen Bildpfad füllen.
2. `alt` mit aussagekräftigen Beschreibungen in EN, DE und Thai ausfüllen.
3. Bei Bedarf weitere Einträge mit eindeutiger `id` und passender `category` hinzufügen. Für responsive Bilder `thumbnail`, `width`, `height` und `sources: [{ image, width }]` ergänzen; `image` ist die große Lightbox-Version.

Die Galerie nimmt nur Einträge mit lokalem Bildpfad und vollständigen Beschreibungen in allen drei Sprachen auf. Kategorien ohne solche Einträge werden ausgeblendet. Bei einem Ladefehler erscheint ein Hinweis statt eines kaputten Bildsymbols; Pfeile und Vorschauen bleiben bedienbar.

### Hero, Standorte und Zimmerkarten

Die Bildfelder verwenden Originalfotos mit `srcset`, passenden Abmessungen und vollständigem Motiv. Für spätere Ergänzungen beispielsweise:

```html
<img class="content-photo" src="assets/images/central.webp"
     width="1000" height="800" loading="lazy" decoding="async"
     alt="Approved English description"
     data-i18n-alt="photo.centralOriginal">
```

Das Beispiel erst einsetzen, nachdem die Datei existiert. Den neuen Schlüssel `photo.centralOriginal` in allen drei Sprachen ergänzen. Bei einem echten Bild keine alte Platzhalterbeschreibung übernehmen. Der Hero verwendet das unveränderte Markenbild `476361896_8400298233404978_6082872404815159922_n.jpg` als `assets/images/siam-lounge-brand.jpg`: vollständig, im Original-Seitenverhältnis und auf schwarzem Hintergrund. Texte und Reservierungsbuttons stehen darunter. Das Hero-Bild lädt sofort mit hoher Priorität; Galerie-, Event- und Speisekartenbilder nutzen Lazy Loading.

Die Unterkunftskarten zeigen echte Fotos von Zimmer, Wohnbereich und Badezimmer. Es sind keine Zimmerkategorien oder Angaben zur Zimmeranzahl; Ausstattung und Verfügbarkeit müssen weiterhin bestätigt werden. Das Textlogo in der Navigation bleibt erhalten.

## Sprachen und Bedienung

Englisch ist Standard; die zuletzt gewählte Sprache wird gespeichert, sofern der Browser Local Storage zulässt. Alle neuen Labels, Hinweise, Fehler, Kategorien, Statusmeldungen und Zusammenfassungen sind in EN/DE/Thai hinterlegt. Auch innerhalb der Dialoge gibt es einen Sprachumschalter. Besuchereingaben werden beim Wechsel erhalten und nicht automatisch übersetzt.

- Texte: `js/translations.js`; alle Sprachobjekte müssen dieselben Schlüssel besitzen.
- Englische statische Texte in `index.html` bei Änderungen ebenfalls aktualisieren.
- Text: `data-i18n`; zugängliche Bezeichnung: `data-i18n-aria`; Bildbeschreibung: `data-i18n-alt`.
- Native Formularelemente wie Kalenderdarstellung können der Sprache des Browsers/Betriebssystems folgen. Eigene Labels und Fehlermeldungen folgen der gewählten Webseitensprache.
- Escape schließt Dialoge; Tab bleibt im geöffneten Dialog. Nach dem Schließen kehrt der Fokus zum Auslöser zurück, auch wenn ein Sprachwechsel dynamische Karten ersetzt hat.
- Ab 1024 Pixeln stehen vier Navigationslinks links und vier rechts vom mittigen Logo. Die Sprachwahl bleibt rechts; die Kopfzeile bleibt sticky. Reihenfolge: Start, Central, Pratumnak, Übernachten, Speisekarte, Galerie, Events, Kontakt.
- Unter 1024 Pixeln zeigt das Hamburger-Menü dieselbe Reihenfolge. Die feste untere Leiste enthält zwei gleichwertige Aktionen: „Tisch reservieren“ und „Aufenthalt buchen“. Sie reserviert Platz unter dem Seiteninhalt und berücksichtigt den sicheren Gerätebereich; auch das geöffnete Menü endet oberhalb der Leiste.
- Ohne JavaScript bleiben englische Inhalte, Navigation und offizielle Links erreichbar; Anfragen werden dann über die Kontaktseiten angestoßen.
- Scroll Reveal und Hover bleiben dezent. Reduzierte Bewegung wird berücksichtigt.

## SEO und Veröffentlichung über GitHub Pages

Title, Meta Description, Open Graph und semantische Bereiche für Central, Pratumnak, Unterkunft und Events sind vorbereitet. Keine Bewertungen, Sterne, exakten Adressen, Zimmerzahlen oder Verfügbarkeiten wurden erfunden.

Sobald die öffentliche Adresse feststeht, `canonical` und `og:url` im Kopf der HTML-Datei ergänzen. Für `og:image` eine freigegebene Bilddatei mit absoluter öffentlicher URL einsetzen. Social-Media-Crawler lesen üblicherweise die ursprüngliche englische Version. Für separat indexierbare Sprachversionen wären später eigenständige statische Sprach-URLs und `hreflang` nötig.

GitHub Pages:

1. Änderungen nach eigener Freigabe committen und pushen.
2. Im Repository **Settings → Pages** öffnen.
3. **Deploy from a branch**, den gewünschten Branch und **/ (root)** wählen.
4. Die von GitHub angezeigte Pages-URL nach Bereitstellung öffnen.
5. Beide Standorte, Sprachwahl und Formulare dort noch einmal kontrollieren.

Kein Build-Befehl, Workflow oder Backend ist nötig. `.nojekyll` bleibt erhalten. Die technische Eignung bedeutet nicht, dass fehlende Geschäftsdaten oder Reservierungsprozesse bereits freigegeben sind. In dieser Bearbeitung wurde nichts committed, gepusht oder veröffentlicht.

## Prüfen

Ohne zusätzliche Pakete:

```powershell
node scripts/check.cjs
```

Prüft Skriptsyntax, gleiche und vollständige Übersetzungsschlüssel, interne Anker, eindeutige IDs, vorhandene Ressourcen, relative Pfade und das Fehlen des erfundenen Monogramms.

Die umfangreichen Browserprüfungen sind optional und brauchen ein separat verfügbares Playwright sowie Chrome:

```powershell
node tests/browser.cjs
node tests/requests.cjs
node tests/navigation.cjs
node tests/languages.cjs
node tests/photos.cjs
```

Der Vorschau-Server muss dabei laufen. Falls Playwright außerhalb dieses Projekts installiert ist, vorab `SIAM_PLAYWRIGHT_MODULE` auf dessen Modulverzeichnis setzen. Für die Website selbst ist Playwright nicht erforderlich; es werden keine Testpakete oder Testbilder mitgeladen.

Geprüft werden:

- EN/DE/Thai bei 320, 360, 390, 430, 768, 1024, 1280, 1440 und 1920 Pixeln.
- Seitenbreite, Formulardialoge, mobile Navigation, Standortwahl, untere Aktionsleiste und Tastaturfokus.
- Pflichtfelder, vergangene Daten, Abreise nach Anreise, Gästezahl und Kontaktdaten.
- Zusammenfassung, Sprachwechsel, Kopieren mit manuellem Fallback und konfigurierte WhatsApp-/E-Mail-Entwürfe.
- Events, Archiv, Eventübernahme, Speisekartendaten, Galeriefilter und Lightbox.
- JavaScript-/Ladefehler, offizielle Linkziele, `file://`, Projekt-Unterpfad und englische Version ohne JavaScript.

Die Testdaten werden ausschließlich im isolierten Testbrowser erzeugt und nicht in `config.js` oder `data.js` geschrieben. Es werden keine Nachrichten versendet, keine externen Reservierungen angelegt und keine Testpreise öffentlich angezeigt.

## Noch vom Betreiber benötigt

- Transparente Original-Logos, ein geeignetes Hero-Querformat und reine Food-Fotos ohne Werbung; ergänzende Tageslicht- und Zimmeransichten (siehe Bilddokumentation).
- Telefonnummern, WhatsApp, E-Mail, LINE, genaue Adressen, Öffnungszeiten und Maps-URLs beider Standorte.
- Offizieller Agoda-Link.
- Bestätigte Zimmerdetails und Ausstattung.
- Tatsächliche Speisekarte, Preise, Währung und Standortzuordnung.
- Tatsächliche Veranstaltungen mit bestätigten Terminen, Beschreibungen und gegebenenfalls Bildern.
- Öffentliche Website-URL und freigegebenes Social-Media-Vorschaubild.

Bis dahin sind fehlende Informationen ausdrücklich als Platzhalter gekennzeichnet oder bleiben ausgeblendet.
