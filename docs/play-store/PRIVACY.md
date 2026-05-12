# Datenschutzerklärung

**App:** Kochwelt
**Stand:** 7. Mai 2026
**Verantwortlich:** Jürgen Esser · juergen.esser.95@gmail.com

---

## Kurzfassung

Kochwelt ist eine reine **Offline-App**. Alle Daten (Rezepte, Wochenplan, Fotos, Einkaufslisten, Einstellungen) werden ausschließlich **lokal auf deinem Gerät** gespeichert. Es gibt **keine Benutzerkonten, keine Cloud-Synchronisierung, kein Tracking und keine Werbung**.

Die App stellt nur dann eine Internetverbindung her, wenn du selbst eine Aktion auslöst (z.B. Import aus einer Rezept-Webseite) oder wenn beim App-Start die zentrale Zutaten-Datenbank im Hintergrund aktualisiert wird — dabei werden **keine personenbezogenen Daten übertragen**.

---

## 1. Welche Daten werden gespeichert?

Alle Daten bleiben auf deinem Gerät (lokale Speicherung über `AsyncStorage` und das interne Dateisystem):

- Deine Rezepte (Titel, Zutaten, Mengen, Nährwerte, Beschreibung, Notizen, Bewertung)
- Selbst aufgenommene oder ausgewählte **Rezept-Fotos**
- Dein **Wochenplan** (welche Rezepte an welchen Tagen)
- Deine **Einkaufslisten-Markierungen**
- Eigene Zutaten, die du beim Speichern eines Rezepts ergänzt hast
- Persönliche Einstellungen (z.B. Standard-Portionen, Erinnerungs-Zeitpunkte, Nährwert-Ziele)

Diese Daten werden **nicht an einen Server übermittelt** und sind auch nicht für andere Nutzer einsehbar.

---

## 2. Wann verbindet sich die App mit dem Internet?

### Beim App-Start (automatisch, im Hintergrund)

Höchstens einmal alle sechs Stunden lädt die App eine kuratierte Zutaten-Liste und ggf. ein „Geschenk-Rezept" als JSON-Dateien herunter:

- **Zutaten-Datenbank**: [gist.github.com/j-esser/1f71eb989c5e7d2c189cf6bdb8255583](https://gist.github.com/j-esser/1f71eb989c5e7d2c189cf6bdb8255583)
- **Geschenk-Rezepte**: [gist.github.com/j-esser/5f7d11565cf87fba40812b5a789288fe](https://gist.github.com/j-esser/5f7d11565cf87fba40812b5a789288fe)

Beide Quellen sind öffentlich zugänglich und **schreibgeschützt**. Es werden keinerlei Daten von deinem Gerät an diese Quellen oder an mich gesendet. GitHub (Betreiber der Gists) kann die IP-Adresse deines Geräts beim Download protokollieren — siehe [docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

Die automatische Aktualisierung der Zutaten-Datenbank kann **deaktiviert werden** in *Einstellungen → Zutaten-Datenbank*, das Empfangen von Geschenk-Rezepten in *Einstellungen → Geschenk-Rezepte*.

### Wenn du selbst eine Aktion auslöst

- **Import aus einer Rezept-Webseite**: Wenn du eine URL eingibst oder aus der Zwischenablage übernimmst, lädt die App den HTML-Inhalt dieser Seite herunter, um das Rezept zu extrahieren. Der jeweilige Webseitenbetreiber sieht den Aufruf. Dabei werden **keine Daten deinerseits übertragen** — nur ein normaler Webseitenabruf.
- **Rezept-Vorschlag einsenden**: Wenn du auf „Eigenes Rezept einsenden" tippst, öffnet sich deine Mail-App mit einer vorbefüllten E-Mail an `kochwelt.lens838@passinbox.com`. Du musst die Mail aktiv versenden — es wird nichts ohne dein Zutun verschickt. Der Inhalt wird ausschließlich für die Kuratierung der Geschenk-Rezept-Sammlung verwendet.
- **Bilder von externen Quellen**: Die mitgelieferten Basis-Rezepte verwenden Bilder von [Unsplash](https://unsplash.com). Beim Anzeigen werden diese Bilder von Unsplash-Servern geladen.

---

## 3. Berechtigungen (Android)

Die App fragt nur Berechtigungen an, wenn sie für eine konkrete Aktion benötigt werden:

- **Kamera** — nur wenn du ein Rezept-Foto direkt aufnehmen möchtest. Fotos werden lokal gespeichert.
- **Fotos & Medien** — nur wenn du ein bestehendes Foto aus deiner Galerie auswählen möchtest.
- **Mitteilungen** — nur wenn du Erinnerungen aktivierst. Die Mitteilungen werden **lokal vom Gerät** ausgelöst (keine Push-Benachrichtigungen über externe Server).
- **Internetzugriff** — siehe Abschnitt 2.

---

## 4. Drittanbieter

- **GitHub (Microsoft Corporation)** — hostet die öffentlichen Zutaten- und Geschenke-Listen. Beim Abruf wird die IP-Adresse deines Geräts an GitHub übertragen.
- **Unsplash, Inc.** — liefert die Beispiel-Bilder der Basis-Rezepte aus. Beim Anzeigen wird die IP-Adresse deines Geräts an Unsplash übertragen.
- **Google Play Services (durch das Betriebssystem)** — die App selbst nutzt keine Google-Analytics, kein Firebase und keine Werbe-IDs.

Die App enthält **keine** Tracking-Bibliotheken, **keine** Werbenetzwerke und **keine** Analyse-Tools.

---

## 5. Speicherdauer

Solange die App auf deinem Gerät installiert ist, bleiben die lokalen Daten erhalten. Wird die App deinstalliert, werden alle lokalen Daten von deinem Gerät entfernt (Standard-Verhalten des Betriebssystems).

---

## 6. Deine Rechte

Weil keinerlei personenbezogene Daten an mich oder Dritte übermittelt werden, gibt es nichts, was ich auf Anfrage löschen, korrigieren oder herausgeben könnte. Du hast jederzeit volle Kontrolle:

- Daten ansehen: Alle Daten sind in der App direkt sichtbar.
- Daten löschen: Über die App-Funktionen (z.B. einzelne Rezepte löschen) oder durch Deinstallation der App.

---

## 7. Änderungen dieser Erklärung

Bei wesentlichen Änderungen wird das Datum oben aktualisiert. Die jeweils aktuelle Fassung ist über die im Play-Store-Eintrag verlinkte Adresse abrufbar.

---

## 8. Kontakt

Bei Fragen zum Datenschutz:

**Jürgen Esser**
E-Mail: [juergen.esser.95@gmail.com](mailto:juergen.esser.95@gmail.com)
