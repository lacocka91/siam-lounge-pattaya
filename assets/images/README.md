# Verwendete Originalbilder

Quelle: die vom Betreiber bereitgestellte `Siam Lounge.zip`. Verwendet werden **17 unterschiedliche Originalfotos**, alle in der Galerie; acht davon stehen zusätzlich einmal in einem der großen Bildfelder. Ein Original wird nicht in mehreren großen Bildfeldern wiederholt.

Zusätzlich steht das ausdrücklich ausgewählte Original-Markenbild vollständig im Hero.

## Zuordnung

Alle folgenden Dateien liegen in `assets/images/`. Die Nummer im neuen Dateinamen bezeichnet die maximale Kantenlänge, nicht eine Bildnummer.

| Originaldatei in der ZIP | Web-Dateien | Verwendung |
| --- | --- | --- |
| `476361896_8400298233404978_6082872404815159922_n.jpg` | `siam-lounge-brand.jpg` | Hero; unverändertes Original, 1640 × 662 px |
| `682645997_1492044518924659_33245594063865609_n.jpg` | `central-food-presentation-{640,960,1600}.webp` | Central-Hauptbereich; Galerie (food) |
| `508419567_122120706686855362_6880964901028639095_n.jpg` | `pratumnak-dining-bar-{640,960,1600}.webp` | Pratumnak-Hauptbereich; Galerie (pratumnak) |
| `585720624_122159751332855362_8912321289492350535_n.jpg` | `stay-room-garden-view-{640,960,1600}.webp` | Unterkunft: Zimmerblick; Galerie (stay) |
| `710756008_1521457442650033_3614403522750592165_n.jpg` | `central-team-{640,960,1600}.webp` | Entdecken: Central; Galerie (central) |
| `538002191_122141107364855362_4129767670075666258_n.jpg` | `pratumnak-exterior-night-{640,960,1600}.webp` | Entdecken: Pratumnak; Galerie (pratumnak) |
| `585900792_122159750234855362_4154240762212150057_n.jpg` | `stay-living-area-{640,960,1600}.webp` | Unterkunft: Wohnbereich; Galerie (stay) |
| `533671544_1288541295941650_3741726529062987623_n.jpg` | `central-gathering-{640,960,1600}.webp` | Galerie (events) |
| `496946855_1217325376396576_1336596014063228049_n.jpg` | `pratumnak-terrace-tables-{640,960,1600}.webp` | Galerie (pratumnak) |
| `585383189_122159751440855362_7168622648143244493_n.jpg` | `stay-bathroom-{640,960,1600}.webp` | Unterkunft: Badezimmer; Galerie (stay) |
| `558696913_122150971250855362_3854214772635520515_n.jpg` | `pratumnak-pool-table-{640,960,1600}.webp` | Galerie (pratumnak) |
| `586252328_122159750228855362_3255003130855897768_n.jpg` | `stay-window-detail-{640,960,1600}.webp` | Galerie (stay) |
| `556882751_122150414978855362_2355177145950919316_n.jpg` | `pratumnak-guests-terrace-{640,960,1600}.webp` | Galerie (events) |
| `585898601_122159751452855362_6723013554608298943_n.jpg` | `stay-courtyard-{640,960,1600}.webp` | Entdecken: Übernachten; Galerie (stay) |
| `506796627_122120707040855362_8282799732458617347_n.jpg` | `pratumnak-table-setting-{640,960,1600}.webp` | Galerie (pratumnak) |
| `585886575_122159751284855362_236128605701771017_n.jpg` | `stay-bed-detail-{640,960,1600}.webp` | Galerie (stay) |
| `584575912_122159750174855362_7624221216844308563_n.jpg` | `stay-room-amenities-{640,960,1600}.webp` | Galerie (stay) |
| `506675243_122120706710855362_8860957388607888142_n.jpg` | `pratumnak-evening-dining-{640,960,1600}.webp` | Galerie (pratumnak) |

## Aufbereitung und Darstellung

- WebP in 640, 960 und 1600 Pixel maximaler Kantenlänge; kein Hochskalieren, kein Beschnitt, keine Retusche oder inhaltliche Änderung.
- WebP-Qualität 84 für kleine und 88 für mittlere/große Varianten. Originaldateien und ZIP bleiben unverändert.
- `srcset`/`sizes` wählen die passende Fotovariante; Lazy Loading außerhalb des Heros. Die Lightbox lädt die große Variante. Das Hero-Markenbild lädt sofort mit hoher Priorität als unverändertes JPG (66.959 Bytes).
- Vollständige Motive mit `object-fit: contain`; besonders Hochformatbilder behalten neutrale Seitenflächen statt abgeschnittener Bildteile. Breite/Höhe und feste Bildrahmen reservieren Platz.
- Die größte Variante aller 17 Bilder zusammen: 4.25 MiB. Alle 51 Varianten auf der Festplatte: 6.88 MiB. Der Browser lädt für jede Platzierung nur die passende Größe.
- EN-, DE- und Thai-Alt-Texte beschreiben sichtbare Motive ohne Personennamen. Die Zimmerkarten zeigen Raumansichten, keine erfundenen Zimmerkategorien.
- Die Galerie-Kategorie Events zeigt Begegnungen und Atmosphäre; daraus werden keine Veranstaltungen oder Termine erstellt. `SIAM_DATA.events` und die digitale Speisekarte bleiben leer.

Originalmaße, Dateigrößen, SHA-256 der verwendeten Originale, Varianten und Übersetzungen stehen maschinenlesbar in [manifest.json](manifest.json).

## Bewusst nicht verwendet

| Originaldatei | Grund |
| --- | --- |
| `321989254_529337922485154_5246296334855059974_n.jpg` | JPG mit festem Hintergrund, Rand oder Kleinschrift; Textlogo bis zum transparenten Original behalten. |
| `496946585_1217325426396571_2016823574452449093_n.jpg` | Redundante Raumansicht oder weniger geeignetes Billardmotiv. |
| `498574655_1217325409729906_7207276338157065555_n.jpg` | Redundante Raumansicht oder weniger geeignetes Billardmotiv. |
| `499623697_122112538178855362_9089055845248978403_n.jpg` | JPG mit festem Hintergrund, Rand oder Kleinschrift; Textlogo bis zum transparenten Original behalten. |
| `534413722_1288540889275024_8535241013177897366_n.jpg` | Ähnliches Gruppenmotiv oder engerer/ungünstigerer Bildausschnitt. |
| `555964081_1323798115749301_3936299276578213715_n.jpg` | JPG mit festem Hintergrund, Rand oder Kleinschrift; Textlogo bis zum transparenten Original behalten. |
| `557622650_122150414738855362_2390219152236732849_n.jpg` | Redundante Raumansicht oder weniger geeignetes Billardmotiv. |
| `583319008_122159750846855362_1103379561286774752_n.jpg` | Ähnliche Detailansicht oder schrägerer Ausschnitt; repräsentative Alternativen ausgewählt. |
| `585903952_122159751296855362_8133653397822699279_n.jpg` | Ähnliche Detailansicht oder schrägerer Ausschnitt; repräsentative Alternativen ausgewählt. |
| `586301583_122159751338855362_6936301178119675473_n.jpg` | Ähnliche Detailansicht oder schrägerer Ausschnitt; repräsentative Alternativen ausgewählt. |
| `587008515_122159750204855362_6131141444078838913_n.jpg` | Ähnliche Detailansicht oder schrägerer Ausschnitt; repräsentative Alternativen ausgewählt. |
| `607195741_1399127848216327_1605488142472999885_n.jpg` | Ähnliches Gruppenmotiv oder engerer/ungünstigerer Bildausschnitt. |
| `608206196_1399127898216322_5608044747446432116_n.jpg` | Ähnliches Gruppenmotiv oder engerer/ungünstigerer Bildausschnitt. |
| `712358598_1521457499316694_3122335944279736143_n.jpg` | Ähnliches Gruppenmotiv oder engerer/ungünstigerer Bildausschnitt. |
| `715279439_1521457389316705_6267027555083186228_n.jpg` | Ähnliches Gruppenmotiv oder engerer/ungünstigerer Bildausschnitt. |
| `735608468_122189077418855362_9215823673316369024_n.jpg` | JPG mit festem Hintergrund, Rand oder Kleinschrift; Textlogo bis zum transparenten Original behalten. |
| `739313673_122189379344855362_3875525858376866688_n.jpg` | JPG mit festem Hintergrund, Rand oder Kleinschrift; Textlogo bis zum transparenten Original behalten. |
| `793091395_122196338012855362_7713687327928860968_n.jpg` | Turnierwerbung; Termine bzw. Wiederholungen nicht als aktuell bestätigt. |
| `826047741_2173002113623911_2563879053537429041_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `828834195_1633678978345167_4767340546220732124_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `830197908_968567055603791_9108583880890483680_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `830633034_2026036368060062_3209565153860366988_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `831646152_2299509950835541_6556347823604854170_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `832557669_1809135830398741_7989689867260975164_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `833363974_1640130884570930_372424079658399004_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `833977712_1405734831744765_1756635406023040453_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `834200478_122199960956855362_6374452993122934635_n.jpg` | Turnierwerbung; Termine bzw. Wiederholungen nicht als aktuell bestätigt. |
| `835749582_1101707325595088_1761616658541832766_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `836118412_1248867050758094_3544537940299694891_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `836459721_1321317826646859_1845502250668624225_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `839664161_1224935613309520_4295141096259687966_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `840349041_939333892240181_541019742658177447_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `840900833_1784572322751241_3507462479962416290_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `841208990_29131580839864048_9160734426727750421_n.jpg` | Werbegrafik mit Preisen, Aktions- oder Verfügbarkeitsangaben; kein reines Food-Foto. |
| `539458325_1299879248141188_2022572338547533262_n.jpg` | T-Shirt-/Merchandise-Mockup, ausdrücklich ausgeschlossen. |
| `540509308_1299879228141190_252678533691807866_n.jpg` | T-Shirt-/Merchandise-Mockup, ausdrücklich ausgeschlossen. |

Die weißen Speisekarten-Dateien mit den im Auftrag genannten Präfixen bleiben vollständig in der ZIP für eine spätere separate Auswertung. Auch alle nicht ausdrücklich freigegebenen Originale wurden nicht übernommen. Preise, Öffnungszeiten, Lieferangebote und Eventserien aus Werbegrafiken wurden nicht in Geschäftsdaten übertragen.

## Hero und Logo

Das ausgewählte Markenbild ersetzt das abstrakte Hero-Motiv. Es wird ohne Beschnitt, Verzerrung, Retusche oder Hochskalierung auf schwarzem Hintergrund dargestellt, mit maximal 800 CSS-Pixeln Breite und proportionaler Höhe. Texte und beide Reservierungsbuttons stehen darunter; ein Overlay ist deshalb nicht nötig. Der Alt-Text ist in EN, DE und Thai hinterlegt. Das Textlogo in der Navigation bleibt erhalten.

## Für eine spätere Bildrunde

- Transparente Original-Logos als SVG oder hochauflösende PNG für Central und Pratumnak.
- Ein ruhiges, hochauflösendes Hero-Querformat mit freier Fläche für Überschrift und Buttons.
- Reine Fotos angerichteter Speisen ohne Werbung, Preise oder Aktionstext.
- Helle Tageslichtaufnahmen beider Standorte und eine klare Außenansicht von Central.
- Weitere gerade fotografierte Zimmer-/Badansichten mit bestätigter Zuordnung und Ausstattung.
