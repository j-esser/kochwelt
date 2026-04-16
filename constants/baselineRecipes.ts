import type { Recipe } from "../services/recipeStore";

// Kuratierte Unsplash-Fotos passend zum jeweiligen Rezept (verifizierte IDs)
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// Nur verifiziert funktionierende Unsplash-IDs
const FOOD: Record<string, string> = {
  quiche:        U('1571091718767-18b5b1457add'), // Quiche/Tart
  gemuese:       U('1540420773420-3366772f4999'), // Geröstetes Gemüse
  gruen:         U('1512621776951-a57df7302669'), // Grünes Gemüse
  stew:          U('1547592180-85f173990554'),    // Eintopf/Suppe
  grainBowl:     U('1546069901-ba9599a7e63c'),   // Gemüse-Bowl
  asianFood:     U('1455619452474-d2be8b1e70cd'), // Asia-Pfanne
  burger:        U('1568901346375-23c9450c58cd'), // Burger
  tomateSauce:   U('1621996346565-e3dbc646d9a9'), // Tomaten-Sauce
  buntesGemuese: U('1490645935967-10de6ba17061'), // Buntes Gemüse
  pasta:         U('1551183053-bf91798d047f'),    // Pasta
  spaghetti:     U('1563379926898-05f4575a45d8'), // Spaghetti
  cremePasta:    U('1555949258-eb67b1ef0ceb'),    // Cremige Pasta
  pesto:         U('1473093226555-0d10be9010e3'), // Pasta/Pesto
  lasagne:       U('1574071318508-1cdbab80d002'), // Lasagne
  indischCurry:  U('1565557623262-b51c2513a641'), // Indisches Curry
  linsencurry:   U('1546069901-ba9599a7e63c'),   // Linsen-Curry
  risotto:       U('1476124369491-e7addf5db371'), // Risotto
  kurbis:        U('1499636673687-f90e5f61e54c'), // Kürbis/Warm
  roast:         U('1544025162-d76538b2a49e'),    // Braten
  lamb:          U('1540420773420-3366772f4999'), // Lamm (warm, rustikal)
  chicken:       U('1512621776951-a57df7302669'), // Hähnchen
  pizza:         U('1565299624946-b28f40a0ae38'), // Pizza
  gnocchi:       U('1476224203421-9ac39bcb3327'), // Gnocchi/Pasta
  spicedOrange:  U('1490645935967-10de6ba17061'), // Würzig-Orange
};

export const BASELINE_PHOTO_MAP: Record<string, string> = {
  // Vegetarisch
  'r_1772621457909_vw1wd': FOOD.quiche,        // Porreetorte
  'r_1772621457909_10dkb': FOOD.indischCurry,  // Gemüse Tikka Masala
  'r_1772621457909_v0c00': FOOD.gruen,         // Grünkohl
  'r_1772621457909_l6suy': FOOD.gemuese,       // Backofengemüse Feta
  'r_1772621457909_p0c3n': FOOD.stew,          // Shepherd's Pie
  'r_1772621457909_p246b': FOOD.grainBowl,     // Bulgur-Pfanne
  'r_1772621457910_bng9k': FOOD.asianFood,     // Erdnuss-Soße
  'r_1772621457910_k8hdn': FOOD.burger,        // Süßkartoffel-Burger
  'r_1772621457910_ba1or': FOOD.gratin,        // Kartoffel-Möhren-Gratin
  'r_1772621457910_lf1sn': FOOD.tomateSauce,   // Süßkartoffeln Tomaten
  'r_1772621457910_q3b1q': FOOD.spicedOrange,  // Chaat-Masala
  'r_1772621457910_qhwg7': FOOD.buntesGemuese, // Paprika/Polenta
  'r_1772621457910_5fpa1': FOOD.gruen,         // Rosenkohl
  'r_1772621457911_85x10': FOOD.asianFood,     // Asia-Gemüse
  // Pasta
  'r_1772621484425_93bk9': FOOD.spaghetti,     // Pasta al Cavolfiore
  'r_1772621484425_t5ehd': FOOD.cremePasta,    // Spaghetti Lachs
  'r_1772621484425_nfvrd': FOOD.gnocchi,       // Gnocchi
  'r_1772621484426_9bl1s': FOOD.pesto,         // Spaghetti Pesto
  'r_1772621484426_r5l1f': FOOD.pasta,         // Tagliatelle Emiliana
  'r_1772621484426_anj69': FOOD.tomateSauce,   // Spaghetti Tomaten
  'r_1772621484426_tm4ai': FOOD.cremePasta,    // Safran-Spaghetti
  'r_1772621484427_1gbkr': FOOD.lasagne,       // Spinat-Lasagne
  'r_1772621484427_4iv09': FOOD.spaghetti,     // Rigatoni al tonno
  'r_1772621484427_tvchp': FOOD.pasta,         // Tagliatelle Ricotta
  'r_1772621484427_13dle': FOOD.lasagne,       // Rote-Linsen-Lasagne
  // Curry
  'r_1772621503978_gmsyu': FOOD.linsencurry,   // Rote-Linsen-Curry
  'r_1772621503979_o0jig': FOOD.indischCurry,  // Kartoffel-Curry
  'r_1772621503979_e0rjf': FOOD.linsencurry,   // Belugalinsen-Curry
  'r_1772621503980_6q2kw': FOOD.spicedOrange,  // Süßkartoffel-Lauch-Curry
  'r_1772621503980_mvo04': FOOD.indischCurry,  // Berliner Gemüse-Curry
  'r_1772621503981_nt2e0': FOOD.grainBowl,     // Kichererbsen-Spinat-Curry
  'r_1772621503981_kg4ow': FOOD.stew,          // Kreolisches Chili
  // Reis
  'r_1772621546615_jvlnt': FOOD.risotto,       // Risotto
  'r_1772621546616_zxw5g': FOOD.kurbis,        // Kürbisrisotto
  // Fleisch
  'r_1772621584220_k2hwg': FOOD.roast,         // Lammbraten
  'r_1772621584220_f4177': FOOD.lamb,          // Lammkeule
  'r_1772621584221_ei7uu': FOOD.lamb,          // Kebap
  'r_1772621584221_150me': FOOD.stew,          // Rote-Bete-Topf
  'r_1772621584222_z971c': FOOD.chicken,       // Hähnchenbrust
  // Sonstiges
  'r_1773152841812_qwn49': FOOD.pizza,         // Pizza
};

export const BASELINE_RECIPES: Recipe[] = [
  {
    "id": "r_1772621457909_vw1wd",
    "title": "Porreetorte nach Wolfram Siebeck (45 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Backofen auf 200 Grad vorheizen. Mehl, Butter, Eigelb und Salz verkneten. Wasser löffelweise dazu geben, bis ein geschmeidiger, buttriger Teig entstanden ist. Teig in einer Springform (26cm) ausrollen, dabei einen Rand hochziehen. Den Porree schneiden, in Butter angehen lassen, salzen, pfeffern und mit ein wenig Weißwein etwa zehn Minuten andünsten. In einem Haarsieb abtropfen und abkühlen lassen. Ei, Eigelb, Sahne und creme fraiche mit Salz und Pfeffer verquirlen, gut abschmecken. Den Porree auf dem Mürbeteig verteilen, die Sahnesoße darüber gießen. Springform in den Ofen schieben, Temperatur auf 150 Grad herunter schalten. 30 bis 35 Minuten auf dem Boden des Backofens backen.",
    "ingredients": [
      {
        "name": "Porree",
        "amount": "750 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Butter",
        "amount": "90 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "crème fraiche",
        "amount": "2 Esslöffel",
        "shopCategory": "Mopro"
      },
      {
        "name": "Eier",
        "amount": "3",
        "shopCategory": "Mopro"
      },
      {
        "name": "Sahne",
        "amount": "125 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Weizenmehl",
        "amount": "180 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Weißwein",
        "amount": "",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 45,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 620,
      "protein": 16,
      "fat": 42,
      "carbs": 42
    }
  },
  {
    "id": "r_1772621457909_10dkb",
    "title": "Gemüse Tikka Masala für zwei Personen (45 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Den Reis mit 1,5 Tassen Wasser und einem Teelöffel Salz aufsetzen, zum Kochen bringen und auf niedrigster Stufe 40 Minuten köcheln lassen. Gemüse schälen und kleinschneiden. Ein Stück Butter und einen Schuss Erdnussöl in eine Pfanne geben und das Gemüse darin andünsten. Die Gewürze zugeben, salzen und pfeffern, Tomatenstücke und Kokosmilch unterrühren. Einmal aufkochen, danach auf kleiner Flamme etwa zehn Minuten köcheln lassen. Noch einmal mit Salz und Pfeffer abschmecken. Zitrone heiß abwaschen und in Achtel schneiden, in einem Schälchen anrichten. Joghurt ebenfalls in ein Schälchen geben. Mandelblättchen in einer Pfanne trocken anrösten und in das dritte Schälchen geben.",
    "ingredients": [
      {
        "name": "Broccoli",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Champignons",
        "amount": "5",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Chinakohl",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "getrocknete Chilischoten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Ingwer",
        "amount": "2 cm",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Koriander",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhre",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "1 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zitrone",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Naturjoghurt",
        "amount": "",
        "shopCategory": "Mopro"
      },
      {
        "name": "Basmatireis",
        "amount": "1 Tasse",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Erdnussöl",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "gemahlene Mandeln",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosmilch",
        "amount": "400 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Meersalz",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Paprikapulver",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Garam Masala",
        "amount": "1 Esslöffel",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "Kokosraspel",
        "amount": "1 Esslöffel",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "Mandelblättchen",
        "amount": "1 Esslöffel",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 45,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 680,
      "protein": 14,
      "fat": 28,
      "carbs": 90
    }
  },
  {
    "id": "r_1772621457909_v0c00",
    "title": "Grünkohl mit karamellisierten Kartoffeln für zwei Personen (45 Minuten plus 60 Minuten am Vorabend)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Die Grünkohlblätter vom Strunk ziehen und klein schneiden, danach gründlich waschen und abtropfen lassen. Die Zwiebel würfeln. Zwiebelschmelz in einem großen Topf auslassen, die Zwiebelwürfel darin andünsten. Grünkohl nach und nach dazugeben und portionsweise zusammen fallen lassen. Etwas Wasser und die Gemüsebrühe dazugeben. Eine Stunde auf kleiner Flamme köcheln. Abkühlen lassen und über Nacht in den Kühlschrank stellen. Am nächsten Tag Grünkohl mit dem Senf würzen und eine halbe Stunde köcheln lassen. Kartoffeln 20 Minuten kochen und abgießen. Im Kartoffeltopf etwas Butter zerlassen, Zucker dazu geben und karamellisieren. Kartoffeln klein schneiden, in der Karamellbutter schwenken und zum Grünkohl geben. Grünkohl mit Salz und Pfeffer abschmecken.",
    "ingredients": [
      {
        "name": "Grünkohl",
        "amount": "500 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "1 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Zwiebelschmelz",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "scharfer Senf",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kartoffeln",
        "amount": "6",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 45,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 380,
      "protein": 9,
      "fat": 8,
      "carbs": 65
    }
  },
  {
    "id": "r_1772621457909_l6suy",
    "title": "Backofengemüse mit Feta und Fladenbrot für zwei Personen (30 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Backofen auf 200 Grad vorheizen. Gemüse waschen und schneiden. Feta mit einer Gabel zerdrücken. Alle Zutaten in einer Auflaufform mit einander vermengen und zwanzig Minuten im Backofen backen. Das Fladenbrot einige Minuten mitbacken.",
    "ingredients": [
      {
        "name": "Basilikum",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Cocktailtomaten",
        "amount": "600 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "gelbe Paprikaschote",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "rote Zwiebeln",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Fetakäse",
        "amount": "150 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Olivenöl",
        "amount": "4 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Oregano",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Thymian",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Fladenbrot",
        "amount": "1",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 520,
      "protein": 16,
      "fat": 30,
      "carbs": 46
    }
  },
  {
    "id": "r_1772621457909_p0c3n",
    "title": "Sheperd`s Pie für zwei Personen (70 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Backofen auf 200 Grad vorheizen.\n\nKartoffeln kochen, mit Salz, Mich, 10g Butter und Muskat zu Pürree verarbeiten. Käse reiben, Champignons und Zwiebeln kleinschneiden. Zwiebeln in 1 Esslöffel Ghee dünsten, Champignons dazugeben, kräftig anbraten, salzen und pfeffern. 1 Esslöffel Tomatenmark und Kapern dazugeben, kurz rösten, danach den Rotwein angießen. Mit Petersilie und Gewürzen abschmecken. Den Käse unter die die Gemüsesoße mischen und die Mischung in eine Auflaufform füllen. In der Mitte des Ofens ca. 40 Minuten backen.",
    "ingredients": [
      {
        "name": "Champignons",
        "amount": "375 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kartoffeln",
        "amount": "375 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Petersilie",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Butter",
        "amount": "20 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Emmentaler oder Cheddar",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Milch",
        "amount": "100 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Rotwein",
        "amount": "50 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Kapern",
        "amount": "15 g",
        "shopCategory": "Trockensortiment"
      }
    ],
    "cookTime": 70,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 420,
      "protein": 18,
      "fat": 14,
      "carbs": 52
    }
  },
  {
    "id": "r_1772621457909_p246b",
    "title": "Orientalisch angehauchte Gemüse-Bulgur-Pfanne für zwei Personen (40 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Gemüse vorbereiten, Knoblauchzehe, Chilischote und Petersilie hacken. In einem kleinen Topf etwas Olivenöl erhitzen und den Bulgur einstreuen. Gut umrühren und dabei etwas anschwitzen. Mit dem Wasser ablöschen, evtl. ein Schuss Weißwein dazu, gehackte Chilischote und Tomatenmark dazugeben. Bei geringer Hitze köcheln lassen, immer mal wieder umrühren bis das Wasser aufgesogen ist. Flamme ausstellen und ziehen lassen. In einer Pfanne Olivenöl erhitzen und das Gemüse (bis auf die Tomaten) andünsten. Kurz bevor das Gemüse gar ist, Tomaten und Petersilie dazugeben. Nun mit den Gewürzen abschmecken und mit etwas Zitronensaft abschmecken. Danach den Bulgur mit dem Gemüse mischen. Dazu Fladenbrot und einen Klecks Joghurt reichen",
    "ingredients": [
      {
        "name": "Champignons",
        "amount": "100 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhre",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Petersilie",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "0.5 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zitrone",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zucchini",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Bulgur",
        "amount": "100 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "getrocknete Chilischote",
        "amount": "1",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "getrocknete Minze",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Koriander, gemahlen",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kreuzkümmel, gemahlen",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kräuter der Provence",
        "amount": "",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 390,
      "protein": 11,
      "fat": 10,
      "carbs": 62
    }
  },
  {
    "id": "r_1772621457910_bng9k",
    "title": "Allerlei Gemüse mit süßer Erdnuss-Soße für zwei Personen (40 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Eine Tasse Basmatireis (ungeschält) mit zwei Tassen Wasser und einem Teelöffel Meersalz zum Kochen bringen. 40 Minuten auf niedrigster Stufe leise köcheln lassen. Gemüse in mundgerechte Stücke schneiden und in Kokosöl anbraten Die übrigen Zutaten von Kokosmilch bis Kaffirlimettenblätter einrühren und alles etwa zehn Minuten köcheln lassen. Blättchen vom Thai-Basilikum zupfen und über das Gericht streuen.",
    "ingredients": [
      {
        "name": "Champignons",
        "amount": "200 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Chinakohl",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kaffirlimettenblätter",
        "amount": "10",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhren",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Paprika",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Spitzkohl",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Thai-Basilikum",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Fischsauce",
        "amount": "3 Esslöffel",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "brauner Zucker",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosmilch",
        "amount": "400 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosöl",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Meersalz",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "rote Currypaste",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Nussmus",
        "amount": "3 Esslöffel",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 650,
      "protein": 12,
      "fat": 32,
      "carbs": 80
    }
  },
  {
    "id": "r_1772621457910_k8hdn",
    "title": "Süßkartoffel-Burger mit Tomaten-Mayo und Avocado für zwei Personen (40 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Backofen auf 220 Grad vorheizen. Süßkartoffel waschen und in 4 gleich große Scheiben schneiden. Mit etwas Olivenöl bepinseln und mit Salz und Pfeffer würzen. Auf ein Backblech legen, Zeituhr auf 10 Minuten stellen. Wenn die Uhr klingelt, Kartoffeln wenden und nochmals 10 Minuten backen. Währenddessen Zwiebel in Halbringe schneiden, Limette halbieren und Saft auspressen, Salat waschen und schleudern, Knoblauchzehe hacken und Tomaten in Scheiben schneiden. Zwiebeln, Limettensaft, 1 Teelöffel Zucker und Salz in einer Schüssel mischen. Salat waschen und schleudern. Die Mayonnaise mit den getrockneten Tomaten und dem Knoblauch im Mixer pürieren, mit Salz und Pfeffer abschmecken. Die veganen Burger in einer Pfanne anbraten. Den Käse auf die Burger legen, Pfanne mit einem Deckel verschließen und weiterbraten, bis der Käse geschmolzen ist. Avocado halbieren, und in Scheiben schneiden. Die Süßkartoffelscheiben mit der Mayonnaise bestreichen. Eine Süßkartoffelscheibe mit Salat, veganem Burger, Tomate, Avocado und Zwiebeln belegen. Die zweite Süßkartoffelscheibe auf den Burger legen. Fertig!",
    "ingredients": [
      {
        "name": "Avocado",
        "amount": "0.5",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Blattsalat",
        "amount": "20 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "frische Tomaten",
        "amount": "30 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "getrocknete Tomaten",
        "amount": "20 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "0.5",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Limette",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Süßkartoffel, möglichst breit",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "0.5",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Käse",
        "amount": "30 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Burger Patties",
        "amount": "160 g",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "Mayonnaise",
        "amount": "30 g",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 480,
      "protein": 14,
      "fat": 28,
      "carbs": 42
    }
  },
  {
    "id": "r_1772621457910_ba1or",
    "title": "Kartoffel-Möhren-Gratin für zwei Personen (60 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Ofen auf 200 Grad vorheizen. Knoblauchzehe schälen, halbieren und eine Auflaufform damit ausreiben. Kartoffeln und Möhren schälen und klein schneiden und zusammen mit den Kürbiskernen in die Form geben. Mit Pfeffer, Salz und den Rosmarinnadeln würzen. Hafermilch, Sahne und Creme fraiche verquirlen und über das Gemüse gießen. Gratin in den Ofen stellen, den Timer auf 20 Minuten stellen. Form aus dem Ofen holen, alles vermischen und den geriebenen Gouda darüber streuen. Weitere 20 Minuten backen.",
    "ingredients": [
      {
        "name": "Kartoffeln",
        "amount": "300 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhren",
        "amount": "300 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Creme fraiche",
        "amount": "100 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "mittelalter Gouda, gerieben",
        "amount": "20 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Schlagsahne",
        "amount": "100 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Hafermilch",
        "amount": "100 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kürbiskerne",
        "amount": "3 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Rosmarinnadeln",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 60,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 540,
      "protein": 10,
      "fat": 34,
      "carbs": 48
    }
  },
  {
    "id": "r_1772621457910_lf1sn",
    "title": "Süßkartoffeln in Tomatensauce für zwei Personen (40 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Den Backofen auf 200 Grad vorheizen. 1 Tasse Parboiled Reis mit 2 Tassen Wasser und einem Teelöffel Salz aufsetzen. Die Süßkartoffeln ungeschält in Scheiben schneiden und mit 1 Esslöffel Olivenöl, 1 Esslöffel Ahornsirup, je einer Messerspitze Kreuzkümmel und Kardamom, Salz und Pfeffer vermengen. Auf einem mit Backpapier bedeckten Blech verteilen und im Ofen 25 Minuten backen, bis sie durchgegart und von unten appetitlich braun sind. Während der Backzeit 3 Knoblauchzehen, 1 Zwiebel und 1 Chilischote klein schneiden. 1 Teelöffel Limettenschale abreiben, 1 Teelöffel Saft auspressen, die restliche Limette in Spalten schneiden. Dill hacken. 40ml Olivenöl mit Knoblauch, Chilischote und einer Prise Salz in der Pfanne vermengen und den Knoblauch bei mittlerer Hitze sanft anschwitzen. Die Hälfte der Mischung in eine kleine Schüssel füllen und mit dem Limettensaft und dem Dill verrühren. Die gehackte Zwiebel in dem Öl in der Pfanne fünf Minuten unter häufigem Rühren anschwitzen. 200g Tomatenstücke, 1 Esslöffel Tomatenmark, 1 Teelöffel Zucker, je einen Teelöffel Kreuzkümmel und Kardamom, Limettenschale und 1 Teelöffel Salz hinzufügen und fünf Minuten erhitzen. Hin und wieder umrühren. 125ml Wasser dazugeben und die Sauce weitere fünf Minuten köcheln lassen. Die Süßkartoffeln mit der gebräunten Seite nach oben in die Sauce legen. Bei schwacher Hitze zugedeckt noch einmal zehn Minuten durchziehen lassen. das Chili-Knoblauch-Öl über die Süßkartoffeln träufeln, mit Reis und Limettenspalten servieren.",
    "ingredients": [
      {
        "name": "Chilischote",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Dill",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehen",
        "amount": "6",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Limette",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Süßkartoffeln",
        "amount": "500 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "1 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Ahornsirup",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kardamom",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kreuzkümmel",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Olivenöl",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 560,
      "protein": 8,
      "fat": 18,
      "carbs": 88
    }
  },
  {
    "id": "r_1772621457910_q3b1q",
    "title": "Chaat-Masala-Kartoffeln mit Joghurt und Tamarinde für zwei Personen (40 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Den Backofen auf 200 Grad vorheizen. Die Kartoffeln ungeschält längs in 1cm dicke Scheiben schneiden. Mit Wasser und 1 Teelöffel Salz ca. 6 Minuten köcheln lassen. Abgießen, trocken tupfen, auf einem mit Backpapier ausgelegten Blech verteilen und mit Öl, Chaat masala, Kurkuma, Salz und einer kräftigen Prise Pfeffer mischen. 35 Minuten rösten, bis die Kartoffeln kräftig gebräunt sind.Während der Backzeit das Korianderchutney zubereiten. Dafür Koriander, 1/2 Chilischote, 30ml Öl und 1/2 Esslöffel Limettensaft pürrieren. Die Zwiebel in feine Scheiben schneiden. Die Chilischote halbieren und die eine Hälfte in feine Ringe schneiden. Für das Tamarindendressing 1 Esslöffel Tamarindenpaste, 1 Teelöffel Zucker und 1 Prise Chaat masala mit 1 Teelöffel Wasser verrühren. Den Joghurt auf einer großen runden Servierplatte verstreichen. Das Korianderchutney daraufgeben und spiralförmig unterziehen. Die Hälfte des Tamarindendressings daraufträufeln, dann Kartoffeln, Zwiebelscheiben und Chilischotenringe daraufgeben. Mit dem restlichen Dressing beträufeln, mit gemahlenem Koriander und Schwarzkümmel bestreuen und servieren.",
    "ingredients": [
      {
        "name": "grüne Chilischote",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kartoffeln",
        "amount": "400 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Koriander",
        "amount": "15 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Limette",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "rote Zwiebeln",
        "amount": "20 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "griechischer Joghurt",
        "amount": "125 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Tamarindenpaste",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Zucker",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Chaat masala",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kurkuma",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Olivenöl",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "schwarzer Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Schwarzkümmel",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 360,
      "protein": 10,
      "fat": 14,
      "carbs": 48
    }
  },
  {
    "id": "r_1772621457910_qhwg7",
    "title": "Geröstete Paprika und frische Maispolenta für zwei Personen (60 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Den Backofen auf 200 Grad vorheizen. Die Paprikaschoten auf einem mit Backpapier bedeckten Blech verteilen. Die Knoblauchknolle halbieren, das obere Fünftel der abschneiden, danach die halbe Knolle in Alufolie wickeln und ebenfalls auf das Blech legen. Für 20 Minuten in den Ofen schieben. Dann die Paprikaschoten vorsichtig drehen und mit der Knoblauchknolle weitere 10 Minuten rösten, bis sie durchgegart und stellenweise geschwärzt sind. Mais in kochendem Wasser garen, danach im Mixer fein zerkleinern. Die Zitrone halbieren, einen halben Teelöffel Schale abreiben, die restliche Schale in fünf dünnen Streifen abschneiden. 0 g Parmesan reiben. In der großen Auflaufform die Paprikaschoten, den zerdrückten Knoblauch, Olivenöl, Ahornsirup, Balsamico-Essig, 5 Zweige Thymian, Zitronenschalenstreifen, Salz und Pfeffer vermengen und mindestens 1 Stunde oder über Nacht marinieren. Für die Polenta den Maisbrei in eine große Pfanne geben. Butter, Joghurt,\n\nParmesan, 1 Teelöffel Salz undWasser hinzufügen und bei mittlerer Hitze 7 Minuten köcheln lassen. Die Hitze auf niedrigste Hitze herunterstellen, 50g Instant-Polenta dazugeben und dabei beständig rühren, damit sich keine Klümpchen bilden. Weitere\n\n5 Minuten garen. Die Polenta auf zwei Teller verteilen, die Paprikaschoten darauf anrichten und mit etwas Marinade überziehen, die Aromate (Zitrone und Thymian) weglassen. Mit einem Schuss Öl, der abgeriebenen Zitronenschale, dem restlichen Parmesan, Salz und Pfeffer abrunden.",
    "ingredients": [
      {
        "name": "Knoblauchknolle",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Spitzpaprika",
        "amount": "4",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zitrone",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Butter",
        "amount": "20 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "griechischer Joghurt",
        "amount": "100 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Parmesan",
        "amount": "40 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Ahornsirup",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Instant-Polenta",
        "amount": "60 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tiefkühlmais (300g)",
        "amount": "1 Paket",
        "shopCategory": "Tiefkühl"
      },
      {
        "name": "Balsamico-Essig",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Olivenöl",
        "amount": "30 ml",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Thymian",
        "amount": "1 Bund",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Wasser",
        "amount": "300 ml",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 60,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 520,
      "protein": 14,
      "fat": 22,
      "carbs": 62
    }
  },
  {
    "id": "r_1772621457910_5fpa1",
    "title": "Rosenkohl aus dem Ofen für zwei Personen (30 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Backofen auf 180 Grad (Umluft) vorheizen und ein Backblech mit Backpapier auslegen.\n\nRosenkohl waschen, putzen, halbieren und in eine Schüssel geben. Die Zutaten für die Marinade dazugeben und alles mischen. Rosenkohlköpfe nebeneinander auf dem Backblech verteilen, Backblech in den Ofen schieben. Aus den angegebenen Zutaten das Dressing zusammenrühren. Nach 30 Minuten Rosenkohl aus dem Ofen holen und mit dem Dressing übergießen.",
    "ingredients": [
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Rosenkohl",
        "amount": "750 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Ahornsirup",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Sojasauce",
        "amount": "4 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Chiliflocken",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "geröstetes Sesamöl",
        "amount": "3 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Tahin",
        "amount": "2 Esslöffel",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "ungeschälter Sesam",
        "amount": "2 Esslöffel",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 420,
      "protein": 12,
      "fat": 22,
      "carbs": 44
    }
  },
  {
    "id": "r_1772621457911_85x10",
    "title": "Asia-Gemüse mit Ingwer-Pfiff für zwei Personen (35 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Den Ofen auf 180°C Umluft vorheizen. Die Butter rechtzeitig aus dem Kühlschrank nehmen, sodass sie nicht zu fest ist. Mit zwei Eiern schaumig schlagen, die gemahlenen Mandeln, das Mandelmehl, die Leinsamen und das Salz unterrühren. Eine Springform einfetten und den Teig am Boden gut andrücken. Am Rand etwas hochziehen und im Ofen für ca. 10 Minuten vorbacken. Das Gemüse waschen und gegebenenfalls schälen. Mit einem Sparschäler die Möhren zu Streifen verarbeiten. Die Blätter des Chicorée vorsichtig einzeln entfernen. Die Zuccini in dünne Scheiben schneiden. Die Möhrenstreifen und die Chicorée-Blätter kurz blanchieren. Den Käse ebenfalls in Scheiben schneiden. Nun das Gemüse und den Schafskäse abwechselnd kreisförmig in die Form schichten. Das dritte Ei und die Sahne verrühren, mit Salz und Pfeffer abschmecken und über die Quiche gießen. Alles bei 180 °C für 20 Minuten backen.",
    "ingredients": [
      {
        "name": "Champignons",
        "amount": "125 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Ingwer",
        "amount": "1.5 cm",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhren",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Spitzpaprika",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Parboiled-Reis",
        "amount": "180 g",
        "shopCategory": "Trockensortiment"
      }
    ],
    "cookTime": 35,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 580,
      "protein": 22,
      "fat": 38,
      "carbs": 28
    }
  },
  {
    "id": "r_1772621484425_93bk9",
    "title": "Pasta al Cavolfiore für zwei Personen (30 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Den Blumenkohl waschen, halbieren, den Strunk entfernen, und die Röschen in kleine Stücke schneiden. Knoblauchzehe schälen und klein hacken. In einer Pfanne reichlich Olivenöl erhitzen, Knoblauch, Basilikum und Lorbeerblatt bei mittlerer Hitze eine Minute andünsten, dann den Blumenkohl einige Minuten mitdünsten. Tomatenmark, Brühe und etwas Wasser dazugeben, salzen und viel frischen Pfeffer darüber mahlen. Nun ca. zehn Minuten auf kleiner Stufe köcheln lassen. In der Zwischenzeit im größten Topf fünf Liter Wasser erhitzen, einen Teelöffel Salz dazugeben. Wenn das Wasser kocht, Spaghetti hineingeben und nach Packungsanweisung al dente kochen, abgießen und wieder in den Kochtopf geben. Parmesan fein reiben und mit der Butter zu den Spaghetti geben. Kräftig umrühren, eine Minute im geschlossenen Topf stehen lassen, servieren.",
    "ingredients": [
      {
        "name": "Blumenkohl",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Butter",
        "amount": "2 Esslöffel",
        "shopCategory": "Mopro"
      },
      {
        "name": "Parmesan",
        "amount": "100 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "1 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "getrocknetes Basilikum",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Spaghetti",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "1 Tube",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Lorbeerblatt",
        "amount": "1",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Olivenöl",
        "amount": "3 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 680,
      "protein": 28,
      "fat": 26,
      "carbs": 80
    }
  },
  {
    "id": "r_1772621484425_t5ehd",
    "title": "Spaghetti mit Lachs-Sahne-Soße für zwei Personen (20 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Spaghetti nach Packungsanweisung kochen. Lachsfilet klein schneiden, Parmesan fein reiben. In einer Pfanne Bratöl erhitzen und die Fischstücke darin knusprig anbraten. Sahne dazugeben und das Ganze bei kleiner Hitze etwas einkochen. Parmesan einstreuen, die Soße mit den Nudeln mischen, servieren.",
    "ingredients": [
      {
        "name": "Lachsfilet",
        "amount": "250 g",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "Parmesan",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Sahne",
        "amount": "100 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Spaghetti",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      }
    ],
    "cookTime": 20,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 720,
      "protein": 38,
      "fat": 30,
      "carbs": 68
    }
  },
  {
    "id": "r_1772621484425_nfvrd",
    "title": "Gnocchis mit oranger Sauce für zwei Personen (20 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Gnocchis in einer Pfanne mit Butter anbraten. In einem Topf etwas Butter zerlassen und die kleingehackte Knoblauchzehe darin auf kleiner Stufe andünsten. Tomatenmark, etwas Wasser und die Sahne dazugeben bis die Soße orange ist, mit Salz, Pfeffer, einer Prise Zimt und etwas Zucker abschmecken. Die Gnocchis auf Tellern anrichten, die Soße darüber gießen, mit Basilikum garnieren.",
    "ingredients": [
      {
        "name": "Basilikum",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Sahne",
        "amount": "100 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Gnocchis",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "0.3 Tube",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Zucker",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Zimt",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 20,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 480,
      "protein": 10,
      "fat": 20,
      "carbs": 62
    }
  },
  {
    "id": "r_1772621484426_9bl1s",
    "title": "Spaghetti mit Pesto für zwei Personen(30 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Spaghetti nach Packungsanweisung kochen.(Wichtig: Vor dem Abgießen der Nudeln zwei Schöpfkellen mit Kochwasser in eine Tasse füllen. Pinienkerne in einer Pfanne auf kleiner Stufe anrösten. Küchenmaschine aufstellen. Nach und nach Basilikumblätter, Pinienkerne, Knoblauch, Parmesan und Olivenöl in der Küchenmaschine zu einem Brei verrühren. Diesen Brei mit den Nudeln mischen, bei Bedarf das zurückgehaltene Kochwasser dazugeben, bis alles schön sämig ist.",
    "ingredients": [
      {
        "name": "Basilikum",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Parmesan",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Pinienkerne (Bioqualität)",
        "amount": "0.3 Tüte",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Spaghetti",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Olivenöl",
        "amount": "3 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 640,
      "protein": 22,
      "fat": 28,
      "carbs": 76
    }
  },
  {
    "id": "r_1772621484426_r5l1f",
    "title": "Tagliatelle Emiliana für zwei Personen (30 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Nudeln nach Anleitung kochen. Zwiebel und Schinken in Würfel schneiden, Parmesan fein reiben. Etwas Butter in einer Pfanne erhitzen und die Zwiebelwürfel darin andünsten. Sahne dazu geben und etwas einköcheln lassen. Gekochten Schinken, Erbsen und 2/3 des Parmesans zur Sahnesoße geben. Mit Salz, Pfeffer und Zucker abschmecken. Nudeln abgießen, in den Topf zurückgeben, die Sahnesoße dazu gießen, kräftig umrühren, fertig. Mit dem restlichen Parmesan bestreut servieren.",
    "ingredients": [
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "gekochter Schinken",
        "amount": "150 g",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "Parmesan",
        "amount": "100 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Sahne",
        "amount": "250 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Dinkel-Spaghetti von Naturata",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Zucker",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tiefkühl-Erbsen (0.5 Paket)",
        "amount": "225 g",
        "shopCategory": "Tiefkühl"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 760,
      "protein": 32,
      "fat": 34,
      "carbs": 78
    }
  },
  {
    "id": "r_1772621484426_anj69",
    "title": "Spaghetti mit Tomaten und Zwiebeln für zwei Personen (20 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Spaghetti nach Anleitung kochen. Tomaten, Zwiebel und Knoblauchzehe klein schneiden. Parmesan fein reiben. In einer Pfanne reichlich Olivenöl erhitzen und das Gemüse darin auf mittlerer Stufe andünsten. Salzen und pfeffern. Die Nudeln abgießen und in den Topf zurückgeben. Die Tomatensauce dazu gießen, alles gut umrühren. Geriebenen Parmesan dazu reichen.",
    "ingredients": [
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "0.5 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Parmesan",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Spaghetti",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 20,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 560,
      "protein": 22,
      "fat": 18,
      "carbs": 76
    }
  },
  {
    "id": "r_1772621484426_tm4ai",
    "title": "Safran-Spaghetti mit Pilzen für zwei Personen (30 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Die Spaghetti in 2 Liter Wasser mit einem Schuss Olivenöl und etwas Safran kochen. In eine Tasse einen Teelöffel Gemüsebrühe geben, mit 100 ml kochendem Wasser aufgießen. Die Zwiebel, Knoblauchzehe und Petersilie hacken, Pilze und Tomaten klein schneiden. In einer Pfanne Olivenöl erhitzen, Zwiebel und Knoblauch darin andünsten, danach die Pilze und Tomaten dazu geben. Gemüsebrühe und Weißwein angießen, mit Sojasauce, Safran, Salz, Pfeffer und Cayennepfeffer abschmecken und die Soße mit 1 Teelöffel Pfeilwurzelstärke binden.. 5 Minuten köcheln lassen. Die Spaghetti unterheben, noch einmal zusammen erhitzen. Auf Tellern anrichten und mit Parmesan und gehackter Petersilie bestreut servieren.",
    "ingredients": [
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "kleine Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Petersilie",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Pilze",
        "amount": "150 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Parmesankäse",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "1 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "getrocknete Tomaten",
        "amount": "100 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Sojasauce",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Soßenbinder (z. B. Pfeilwurzelstärke)",
        "amount": "1 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Spaghetti",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Cayennepfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Olivenöl",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Safran",
        "amount": "",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "Weißwein",
        "amount": "50 ml",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 620,
      "protein": 20,
      "fat": 18,
      "carbs": 88
    }
  },
  {
    "id": "r_1772621484427_1gbkr",
    "title": "Spinat-Lasagne für zwei Personen (50 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Ofen auf 180 Grad vorheizen. Käse fein reiben, Knoblauchzehe hacken. In einem Topf einen Esslöffel Butter erhitzen, Knoblauch dazu geben und kurz andünsten, dann den Spinat dazu geben und auf kleiner Flamme auftauen lassen. Salzen und pfeffern. In einem zweiten Topf auf kleiner Flamme einen Esslöffel Butter schmelzen, einen Esslöffel Mehl dazugeben. Mit dem Tellerquirl unter ständigem Rühren mischen, mit Sahne und Milch aufgießen. Zum Kochen bringen, dann die Tiefkühlkräuter dazu geben, mit Salz, Pfeffer und Muskat abschmecken.\n\nEine viereckige Auflaufform wie folgt auslegen: Spinat, 1 Lage Lasagneplatten, Passata (gesalzen und gepfeffert), 1 Lage Lasagneplatten, Sahnesoße darüber gießen. Mit dem geriebenen Käse bestreuen. Ca. 35 Minuten im Ofen backen, bis der Käse schön gebräunt ist.",
    "ingredients": [
      {
        "name": "Blattspinat",
        "amount": "1 Paket",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Emmentaler oder Gruyère",
        "amount": "100 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Milch",
        "amount": "200 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Sahne",
        "amount": "200 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Passata",
        "amount": "1 Flasche",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Salat- oder italienische Kräuter (tiefgefroren)",
        "amount": "1 Paket",
        "shopCategory": "Tiefkühl"
      },
      {
        "name": "Lasagne-Platten",
        "amount": "10",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 50,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 680,
      "protein": 24,
      "fat": 30,
      "carbs": 72
    }
  },
  {
    "id": "r_1772621484427_4iv09",
    "title": "Mezzi rigatoni al tonno für zwei Personen (20 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Rigatoni in 2l Wasser al dente kochen. Olivenöl in eine Pfanne geben und Zwiebel und Knoblauch fünf Minuten bei mittlerer Hitze darin anschwitzen. Tomaten und die Hälfte der Basilikumblättchen dazugeben, mit Pfeffer und Salz würzen. Alles zusammen gut zehn Minuten köcheln lassen. Evtl. eine Kelle Pastawasser zur Soße hinzufügen.\n\nRigatoni mit der Soße mischen, evtl. nachwürzen. Mit dem restlichen Basilikum bestreuen.\n\nDas fertige Gericht mit etwas Olivenöl beträufeln. Dieses Verfahren wird liebevoll als „apulischer Segen“ bezeichnet.",
    "ingredients": [
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Basilikum",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Thunfisch aus der Dose",
        "amount": "150 g",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "Kapern",
        "amount": "1 Handvoll",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Rigatoni, ersatzweise Spirellí",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "schwarze Oliven",
        "amount": "1 Handvoll",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenstücke",
        "amount": "0.5 Dose",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Olivenöl",
        "amount": "20 ml",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 20,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 580,
      "protein": 28,
      "fat": 12,
      "carbs": 84
    }
  },
  {
    "id": "r_1772621484427_tvchp",
    "title": "Tagliatelle mit Ricotta und knusprigen Schalotten (50 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Die Safranfäden in eine Tasse geben und in 2 ½ Esslöffeln kochendem Wasser einweichen.\n\nSchalotten in feine Scheiben und grüne Chilischote in feine Ringe schneiden, Knoblauchzehen, Petersilie und getrocknete Chilischote hacken. Die grünen Chilis in einer kleinen Schüssel mit dem Essig, dem Zucker und einer Prise Salz verrühren. In einer großen Pfanne Olivenöl erhitzen. Die Schalotten mit Ahornsirup, Chilischote, Koriander und Kreuzkümmel 7 Minuten braten, bis die Schalotten karamellisiert und goldbraun sind. Auf einen mit Küchenpapier bedeckten verteilen.\n\nIn der Pfanne neues Olivenöl erhitzen. Den Knoblauch darin mit einer Prise Salz 2 Minuten braten.\n\n2 Liter Wasser mit Salz zum Kochen bringen, Nudeln darin al dente kochen, abgießen, dabei 70ml des Kochwassers auffangen.\n\nDie Pasta in die Pfanne mit dem Knoblauch geben, auf mittlerer Hitze das Pastawasser, den Safran, die Hälfte der Petersilie und reichlich Pfeffer hinzufügen und alles durchheben. Danach den Parmesan löffelweise mit der Pasta vermischen.\n\nDie Pasta auf zwei Teller geben und den Ricotta darauf verteilen. Die Schalotten, die Chilis mit ½ Esslöffel der Einlegeflüssigkeit, die restliche Petersilie und eine kräftige Prise Pfeffer hinzufügen.",
    "ingredients": [
      {
        "name": "große grüne Chilischote",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehen",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Petersilie",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Schalotten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Parmesan",
        "amount": "30 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Ricotta",
        "amount": "60 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Ahornsirup",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "getrocknete Chilischote",
        "amount": "1",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tagliatelle",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Safranfäden",
        "amount": "0.5 Teel.",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 50,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 560,
      "protein": 18,
      "fat": 18,
      "carbs": 76
    }
  },
  {
    "id": "r_1772621484427_13dle",
    "title": "Rote-Linsen-Lasagne für 2 Personen (50 Minuten)",
    "categories": [
      "Pasta"
    ],
    "description": "Gemüsebrühe zubereiten. Paprika und Zwiebel würfeln und in Olivenöl anbraten. Nach ca. 5 Minuten mit Gemüsebrühe und Hafermilch ablöschen. Linsen, Tomatenstück, Tomatenmark und Kräuter hinzufügen und alles ca. 20 Minuten köcheln lassen. Parmesan reiben.\n\nIn der Zwischenzeit Backofen auf 180 Grad vorheizen.\n\nDie Hälfte der Linsensauce in die Auflaufform füllen, darauf die Lasagne-Platten legen und mit der zweiten Hälfte der Linsensauce bedecken. Mit dem Parmesan bestreuen und ca.\n\n35 Minuten backen.",
    "ingredients": [
      {
        "name": "Paprikaschoten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Milch oder Haferdrink",
        "amount": "75 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Parmesan",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Dinkel-Lasagne-Platten",
        "amount": "5",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "1 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "rote Linsen",
        "amount": "65 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenstücke",
        "amount": "1 Dose",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "2 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "italienische Kräuter (getrocknet oder tiefgefroren)",
        "amount": "1 Esslöffel",
        "shopCategory": "Tiefkühl"
      }
    ],
    "cookTime": 50,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 520,
      "protein": 22,
      "fat": 12,
      "carbs": 78
    }
  },
  {
    "id": "r_1772621503978_gmsyu",
    "title": "Rote-Linsen-Curry mit Basmatireis für zwei Personen (40 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Den Reis mit dem Wasser und einem Teelöffel Salz aufsetzen, kurz aufkochen und danach auf niedrigster Flamme ca. 20 Minuten köcheln. Die Linsen mit dem Wasser und der Gemüsebrühe aufsetzen, kurz aufkochen und danach auf kleiner Flamme ca. 15 Minuten köcheln lassen, bis die Linsen zerfallen und der größte Teil des Wassers aufgesogen ist. Zwiebel, Chilischote und Koriander hacken, den Ingwer fein reiben. In einer Pfanne das Kokosöl erhitzen, Zwiebel und Kreuzkümmel darin andünsten. Den Ingwer und die Kokosraspel dazugeben und etwa eine Minute weiterbraten, dabei mit einem Holzlöffel ständig rühren. Die Tomaten hinzufügen und bei geschlossenem Pfannendeckel etwas fünf Minuten auf kleiner Flamme köcheln lassen. Alle Gewürze von Garam Masala bis Chilischote, die Sahne und die Linsen samt restlicher Kochflüssigkeit einrühren und weitere zehn Minuten köcheln lassen.\n\nReis auf zwei Tellern verteilen, das Curry darüber geben, mit dem gehackten Koriander bestreuen.",
    "ingredients": [
      {
        "name": "Ingwer",
        "amount": "1 cm",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Koriander",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "kleine Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "0.5 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Sahne",
        "amount": "30 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "1 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "getrocknete Chilischote",
        "amount": "1",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Parboiled Reis",
        "amount": "100 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "rote Linsen",
        "amount": "100 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosöl",
        "amount": "2 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kreuzkümmel",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kurkuma",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Garam Masala",
        "amount": "1 Teelöffel",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "Kokosraspel",
        "amount": "2 Esslöffel",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 560,
      "protein": 18,
      "fat": 14,
      "carbs": 88
    }
  },
  {
    "id": "r_1772621503979_o0jig",
    "title": "Kartoffel-Curry mit Tomaten und Erbsen für zwei Personen (30 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Kartoffeln, Zwiebeln, Knoblauchzehe und Chilischote klein schneiden. Einen Topf erhitzen und Olivenöl hineingeben. Alle Gewürze eine Minute darin anschwitzen, dabei ständig rühren. Das kleingeschnittene Gemüse dazugeben und ebenfalls eine Minute unter Rühren andünsten. Mit 200 ml Wasser ablöschen, 1 Teelöffel Gemüsebrühe dazugeben. Nun die Tomaten und Erbsen dazugeben. Die Hitze reduzieren und mit Salz abschmecken. Zugedeckt etwa 15 Minuten köcheln lassen, bis die Kartoffeln gar sind. Petersilie waschen und hacken. Die Sahne zum Curry geben und erhitzen. Abschmecken, ggf. nachwürzen und mit der Petersilie bestreut servieren.",
    "ingredients": [
      {
        "name": "Chilischote",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kartoffeln",
        "amount": "400 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehen",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Petersilie",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Sahne",
        "amount": "70 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenstücke",
        "amount": "1 Dose",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Erbsen",
        "amount": "225 g",
        "shopCategory": "Tiefkühl"
      },
      {
        "name": "Koriander",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kreuzkümmel",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kurkuma",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Zimt",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 480,
      "protein": 14,
      "fat": 12,
      "carbs": 78
    }
  },
  {
    "id": "r_1772621503979_e0rjf",
    "title": "Belugalinsen-Curry für zwei Personen (40 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Zutaten von Zwiebel bis Koriander putzen und kleinschneiden. Kokosöl oder Olivenöl in einem Topf erhitzen und Zwiebel, Knoblauch und Ingwer 1-2 Minuten andünsten. Currypaste dazugeben, kurz anschwitzen, dann die Linsen zugeben. Mit Tomaten, Kokosmilch und der Brühe ablöschen. Aufkochen und 10 Minuten köcheln lassen. Jetzt die Süßkartoffel- und die Möhrenstücke dazugeben. Weitere 20 Minuten köcheln lassen.  Curry mit Limettensaft, Salz und Pfeffer würzen und mit Koriander bestreuen.",
    "ingredients": [
      {
        "name": "Ingwer",
        "amount": "1 cm",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Koriander",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Limettensaft",
        "amount": "1 Esslöffel",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhre",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Süßkartoffel",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "0.5 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Belugalinsen",
        "amount": "150 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "250 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosmilch",
        "amount": "200 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "rote Currypaste",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 520,
      "protein": 18,
      "fat": 16,
      "carbs": 72
    }
  },
  {
    "id": "r_1772621503980_6q2kw",
    "title": "Süßkartoffel-Lauch-Curry mit Fladenbrot für zwei Personen (40 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Süßkartoffeln schälen und klein würfeln. Lauch putzen, längs halbieren, waschen und in feine Ringe schneiden. Chilischote klein schneiden. In einem großen Topf Kokosöl erhitzen (mittlere Stufe), Süßkartoffeln, Lauch und Chili ca. fünf Minuten darin anbraten. Currypulver und Tomatenmark unterrühren und mit 75 ml Wasser ablöschen. Kokosmilch zugeben und ca. zwölf Minuten bei mittlerer Hitze im geschlossenen Topf garen. Gelegentlich umrühren. Inzwischen Koriander kalt abbrausen, trocken schütteln und Blättchen abzupfen. Banane pürieren und zum Curry geben. Den Mais abtropfen lassen und ebenfalls dazu geben. Mit Salz, Pfeffer und Zitronensaft abschmecken. Mit Koriander bestreut anrichten und mit Fladenbrot servieren.",
    "ingredients": [
      {
        "name": "Koriander (ersatzweise glatte Petersilie)",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Lauch",
        "amount": "150 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "reife Banane",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Süßkartoffeln",
        "amount": "400 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zitronensaft",
        "amount": "1 Esslöffel",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "getrocknete Chilischote",
        "amount": "1",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosmilch",
        "amount": "200 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "50 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Zuckermais (140g)",
        "amount": "1 Dose",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Currypulver",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Kokosöl",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Fladenbrot",
        "amount": "1",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 580,
      "protein": 8,
      "fat": 18,
      "carbs": 96
    }
  },
  {
    "id": "r_1772621503980_mvo04",
    "title": "Berliner Gemüse-Curry mit Ananas für zwei Personen (40 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Den Reis mit Salz und 320 ml Wasser aufsetzen und nach Anleitung garen. Gemüse putzen und in mundgerechte Stücke schneiden. Im Wok das Kokosöl erhitzen und das Gemüse kurz darin andünsten. Die Kokosmilch mit der Currypaste und dem Ananassaft verquirlen und zum Gemüse geben. Ca. 15 Minuten köcheln  Ananas und Koriander erst zum Ende der Garzeit dazu geben.",
    "ingredients": [
      {
        "name": "Broccoli",
        "amount": "100 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kaiserschoten",
        "amount": "100 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Koriander",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Möhren",
        "amount": "100 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Pilze",
        "amount": "100 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Spitzkohl",
        "amount": "200 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Ananasstücke",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosmilch",
        "amount": "400 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Reis",
        "amount": "160 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosöl",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "rote Currypaste",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 620,
      "protein": 10,
      "fat": 26,
      "carbs": 86
    }
  },
  {
    "id": "r_1772621503981_nt2e0",
    "title": "Veganes Kichererbsen-Spinat-Curry für zwei Personen (30 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Den Blattspinat dünsten bzw. auftauen. Zwiebel und Knoblauch hacken, Ingwer reiben. In einer Pfanne das Kokosöl erhitzen. Zwiebel, Knoblauch und Ingwer hineingeben und glasig dünsten. Spinat, Tomaten und Kokosmilch dazugeben, die Gewürze einrühren, einmal gut umrühren und abdecken. 10 Minuten auf schwacher Hitze köcheln. Zum Schluss die Kichererbsen dazugeben und kurz mitziehen lassen.",
    "ingredients": [
      {
        "name": "Blattspinat, frisch oder gefroren",
        "amount": "200 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Ingwer",
        "amount": "1 cm",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Koriander",
        "amount": "",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Paprika edelsüß",
        "amount": "",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomatenstücke",
        "amount": "0.5 Dose",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kichererbsen aus der Dose",
        "amount": "200 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosmilch",
        "amount": "200 ml",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kokosöl",
        "amount": "1 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Curcuma",
        "amount": "",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 30,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 440,
      "protein": 14,
      "fat": 22,
      "carbs": 44
    }
  },
  {
    "id": "r_1772621503981_kg4ow",
    "title": "Kreolisches Chili mit schwarzen Bohnen für zwei Personen (60 Minuten)",
    "categories": [
      "Curry"
    ],
    "description": "Wichtig: Die Bohnen am Vorabend in Wasser einweichen\n\n100g schwarze Bohnen\n\n250ml Wasser\n\n1 Zwiebel\n\n1 Knoblauchzehe\n\n1 Paprikaschote\n\n2 Stängel Koriandergrün\n\n1 Dose Tomatenstück\n\n50g Tomatenmark\n\nSalz, Pfeffer, 1 Gewürznelke, Kreuzkümmel, Zimt, Cayennepfeffer, Zucker\n\nBohnen in dem Einweichwasser mit einem Teelöffel Gemüsebrühe 40 Minuten kochen. Gemüse klein schneiden und in Olivenöl andünsten. Das Gemüse und die Tomatenstücke zur Bohnensuppe geben und alles aufkochen. 20 Minuten köcheln lassen, danach mit dem Tomatenmark andicken und mit Koriandergrün bestreuen. Dazu Reis, Fladenbrot oder Tortillas reichen.",
    "ingredients": [
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Paprika",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Strauchtomaten",
        "amount": "3",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Gemüsebrühe",
        "amount": "2 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "schwarze Bohnen",
        "amount": "1 Dose",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenstücke",
        "amount": "1 Dose",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "50 g",
        "shopCategory": "Trockensortiment"
      }
    ],
    "cookTime": 60,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 460,
      "protein": 18,
      "fat": 8,
      "carbs": 76
    }
  },
  {
    "id": "r_1772621546615_jvlnt",
    "title": "Risotto für 2 Personen (40 Minuten)",
    "categories": [
      "Reis"
    ],
    "description": "Das Wasser im Wasserkessel aufkochen. Die Hühnerbrühe in die Saftkanne geben und mit dem kochenden Wasser aufgießen. Zwiebel und Knoblauchzehe würfeln. Parmesan reiben. Olivenöl in einen mittelgroßen Topf geben, Zwiebel, Knoblauch und Thymian darin etwa vier Minuten anschwitzen. Den Reis dazugeben, die Flamme hoch drehen und unter ständigem Rühren etwa eine Minute anbraten, bis der Reis glasig ist. Mit Weißwein ablöschen, einen Teelöffel Meersalz dazugeben. Wenn sich die Weinschwaden verzogen haben, einen Schuss Hühnerbrühe dazu geben. Der Reis sollte gerade eben mit Flüssigkeit bedeckt sein. Ab jetzt spätestens alle fünf Minuten mit einem Holzlöffel das Risotto gründlich durchrühren und immer wieder Hühnerbrühe dazu gießen. Während der Reis köchelt, Champignons putzen, klein schneiden und in etwas Öl anbraten. Nach etwa 20 Minuten sollte die Hühnerbrühe vom Reis vollständig aufgesogen und das Risotto gar sein. Flamme ausstellen, den Parmesankäse in das Risotto rühren, zwei Minuten mit geschlossenem Topfdeckel ruhen lassen. Fertig!",
    "ingredients": [
      {
        "name": "Blättchen Zitronen-Thymian",
        "amount": "20",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Champignons",
        "amount": "200 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Schalotten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Parmesankäse",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Carnaroli-Reis",
        "amount": "180 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Hühnerbrühe",
        "amount": "2 Teelöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Wasser",
        "amount": "400 ml",
        "shopCategory": "Sonstiges"
      },
      {
        "name": "Weißwein",
        "amount": "100 ml",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 520,
      "protein": 18,
      "fat": 12,
      "carbs": 78
    }
  },
  {
    "id": "r_1772621546616_zxw5g",
    "title": "Kürbisrisotto für 2 Personen (40 Minuten)",
    "categories": [
      "Reis"
    ],
    "description": "Das Wasser im Wasserkessel aufkochen. Die Hühnerbrühe in eine Saftkanne gießen und mit dem kochenden Wasser aufgießen. Kürbisfleisch, Schalotten und Knoblauchzehe klein schneiden. In einem Topf je einen Esslöffel Olivenöl und Butter erhitzen und das Gemüse darin anbraten. Den Reis einstreuen und ebenfalls kurz dünsten, mit dem Weißwein ablöschen. Nun etwas Hühnerbrühe dazugeben. Der Reis sollte gerade eben mit Flüssigkeit bedeckt sein. Ab jetzt spätestens alle fünf Minuten das Risotto gründlich durchrühren und immer wieder Hühnerbrühe nachgießen. Frühlingszwiebeln putzen, waschen und in Ringe schneiden. 5 Minuten vor Ende der Garzeit zum Risotto geben. Creme fraiche und Parmesan unterheben, mit Pfeffer würzen. Kresse abschneiden und aufstreuen.",
    "ingredients": [
      {
        "name": "Frühlingszwiebeln",
        "amount": "1 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kresse",
        "amount": "0.5 Kästchen",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Kürbisfleisch",
        "amount": "250 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Schalotten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "crème fraiche",
        "amount": "3 Esslöffel",
        "shopCategory": "Mopro"
      },
      {
        "name": "Parmesankäse",
        "amount": "50 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Weißwein",
        "amount": "100 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Carnaroli-Reis",
        "amount": "180 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Hühnerbrühe",
        "amount": "2 Teelöffel",
        "shopCategory": "Trockensortiment"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 560,
      "protein": 16,
      "fat": 18,
      "carbs": 80
    }
  },
  {
    "id": "r_1772621584220_k2hwg",
    "title": "Mürber Lammbraten nach Wolfram Siebeck (Garzeit: drei Stunden)",
    "categories": [
      "Fleisch"
    ],
    "description": "Backofen auf 250 Grad vorheizen. Die Lammkeule in einem großen Bratentopf in Olivenöl vorsichtig, aber gründlich anbraten. Danach großzügig mit Rosmarinpulver, Thymian und schwarzem Pfeffer einreiben. Bratentopf ohne Deckel in den Backofen schieben, Zeituhr auf 30 Minuten stellen. Jetzt das Gemüse waschen und klein scheiden. Wenn die Uhr klingelt, Backofentemperatur auf 180 Grad herunterschalten. Den Bratentopf aus dem Ofen nehmen. Das Gemüse und die Lorbeerblätter in den Topf geben, alles gründlich salzen. Topf wieder ohne Deckel in den Ofen schieben und weitere 30 Minuten schmoren. Jetzt den Deckel auflegen und 90 Minuten weiter garen. Deckel wieder abnehmen, Rotwein angießen und ca. 30 Minuten schmoren lassen.\n\nGlacierte Möhren\n\n1 kg Möhren\n\nPetersilie\n\nSalz und Zucker\n\nPetersilie hacken. Karotten schälen, halbieren und in dünne Scheiben schneiden. In reichlich Butter andünsten, salzen, eine gute Prise Zucker dazu und zur Hälfte mit Wasser auffüllen. Bei geschlossenem Deckel 10-12 Minuten köcheln lassen. Deckel abnehmen und Flüssigkeit verkochen lassen, dabei dürfen die Karotten aber nicht zu weich werden, evtl. überschüssige Flüssigkeit abschütten. Mit gehackter Petersilie bestreuen.",
    "ingredients": [
      {
        "name": "dicke Möhren",
        "amount": "3",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehen",
        "amount": "3",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomaten",
        "amount": "500 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "500 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Lammkeule",
        "amount": "1.8 kg",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "trockener Rotwein",
        "amount": "",
        "shopCategory": "Mopro"
      },
      {
        "name": "Lorbeerblätter",
        "amount": "3",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Rosmarinpulver, getrockneter Thymian",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 680,
      "protein": 48,
      "fat": 30,
      "carbs": 18
    }
  },
  {
    "id": "r_1772621584220_f4177",
    "title": "Gefüllte Lammkeule nach Wolfram Siebeck (Drei Stunden)",
    "categories": [
      "Fleisch"
    ],
    "description": "Backofen auf 200 Grad vorheizen. Knoblauch fein hacken. Tomaten mit kochendem Wasser übergießen häuten und vierteln. Schalotten schälen, aber ganz lassen. Schafkäse mit Knoblauch und viel Rosmarinpulver vermengen. Die Lammkeule auseinanderklappen und dort, wo der Knochen gesessen hat, mit weiterem Rosmarin und Cayennepfeffer einreiben. Die Käsemischen einfüllen, Keule zusammenklappen und mit einem langen Bindfaden zu einem festen Päckchen verschnüren. In einem Bratentopf in heißem Olivenöl von allen Seiten anbraten, danach salzen. Die Tomaten und Schalotten zur Keule legen. Eine halbe Tasse Brühe dazugeben, Topfdeckel auflegen und im vorgeheizten Backofen zwei Stunden lang schmoren. Ab und zu weitere Brühe angießen, aber nur so viel, dass das Verbrennen des Fleischsaftes verhindert wird. Nach Ende der Garzeit die herausgelaufene Käsesoße einkochen, Sahne angießen. Mit Klößen und Spitzkohl servieren.\n\nSpitzkohl mit Zitrone und Koriander\n\n1 Spitzkohl\n\n1 Zwiebel\n\nButter, Sahne, Zitronensaft\n\nKoriander, Salz\n\nZwiebel hacken, Spitzkohl putzen, Strunk entfernen und Blätter in feine Streifen schneiden. Butter in einer Pfanne zerlassen, Zwiebel darin andünsten, dann den Spitzkohl dazugeben. Mit Sahne aufgießen, ca. 10 Minuten köcheln lassen, mit Koriander, einem Spritzer Zitronensaft und Salz würzen.",
    "ingredients": [
      {
        "name": "Knoblauchzehen",
        "amount": "6",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Schalotten",
        "amount": "12",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Tomaten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Lammkeule",
        "amount": "1.8 kg",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "Sahne",
        "amount": "250 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "Schafkäse",
        "amount": "300 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Brühe",
        "amount": "1 Tasse",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Cayennepfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Rosmarinpulver",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 720,
      "protein": 52,
      "fat": 38,
      "carbs": 12
    }
  },
  {
    "id": "r_1772621584221_ei7uu",
    "title": "Kebap für zwei Personen (40 Minuten)",
    "categories": [
      "Fleisch"
    ],
    "description": "Ofen auf 200 Grad vorheizen. Zwiebel schälen. Die ein Hälfte in Ringe schneiden, die andere fein hacken. Knoblauchzehe fein hacken. Tomaten und Limette waschen und achteln. Das Fleisch mit der gehackten Zwiebel, dem Knoblauch, den Gewürzen und dem Wasser mischen. In ca. 5 cm große Bällchen teilen, zu Würstchen formen und diese etwas platt drücken. Das Butterschmalz leicht erwärmen, damit es flüssig wird. Die Würstchen auf Spieße stecken, mit dem Butterschmalz einpinseln. Die Spieße auf ein mit Backpapier ausgelegtes Backblech legen und unter dem Grill rundherum grillen, bis sie gebräunt sind. Eine Platte mit den Tomaten- und Limettenachteln und den Zwiebelringen belegen und die Kebaps dazwischen legen.",
    "ingredients": [
      {
        "name": "gemahlener Koriander",
        "amount": "1 Esslöffel",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Knoblauchzehe",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Limette",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Strauchtomaten",
        "amount": "3",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Lammgehacktes",
        "amount": "250 g",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "Butterschmalz",
        "amount": "1 Esslöffel",
        "shopCategory": "Mopro"
      },
      {
        "name": "heißes Wasser",
        "amount": "1 Esslöffel",
        "shopCategory": "Mopro"
      },
      {
        "name": "Kreuzkümmel",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Safranpulver",
        "amount": "0.25 Teelöffel",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 460,
      "protein": 28,
      "fat": 24,
      "carbs": 8
    }
  },
  {
    "id": "r_1772621584221_150me",
    "title": "Rote-Bete-Topf für zwei Personen (35 Minuten)",
    "categories": [
      "Fleisch"
    ],
    "description": "Kartoffeln schälen und in Salzwasser zwanzig Minuten kochen. 250ml Wasser zum Kochen bringen, in eine Kanne mit 1 Teelöffel Gemüsebrühe gießen. Zwiebeln fein würfeln, Schnittlauch hacken. Einmal-Handschuhe anziehen, Rote Bete in Würfel schneiden. Hackfleisch und Zwiebeln in Bratöl andünsten, Kapern zugeben, mit Salz und Pfeffer würzen. Dann Rote Bete und Schnittlauch zugeben. Butter in einem kleinen Topf zerlassen, Mehl anschwitzen, mit der Brühe aufgießen. Hackfleischmischung und Mehlschwitze zehn Minuten köcheln lassen. Mit Meerrettich, Salz, Pfeffer, Zitronensaft, Creme fraiche und einer Prise Zucker abschmecken. Sauce mit der Hackfleischmischung vermengen.",
    "ingredients": [
      {
        "name": "Kartoffeln",
        "amount": "250 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "rote Bete (vorgekocht)",
        "amount": "250 g",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Schnittlauch",
        "amount": "0.5 Bund",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zitrone",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "1",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Butter",
        "amount": "15 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Creme fraiche",
        "amount": "2 Esslöffel",
        "shopCategory": "Mopro"
      },
      {
        "name": "Sahnemeerrettich",
        "amount": "15 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Kapern",
        "amount": "25 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Mehl",
        "amount": "15 g",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Gehacktes halb und halb",
        "amount": "250 g",
        "shopCategory": "Fleisch & Fisch"
      }
    ],
    "cookTime": 35,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 520,
      "protein": 28,
      "fat": 22,
      "carbs": 42
    }
  },
  {
    "id": "r_1772621584222_z971c",
    "title": "Hähnchenbrustfilet mit Bananen für zwei Personen (40 Minuten)",
    "categories": [
      "Fleisch"
    ],
    "description": "Ofen auf 200 Grad vorheizen. Eine Tasse Reis mit zwei Tassen Wasser und einem Teelöffel Meersalz zum Kochen bringen und ca. 40 Minuten auf niedrigster Stufe leise köcheln lassen. Fleisch und Bananen in mundgerechte Stücke schneiden. Aus der Sahne, dem Ketchup, dem Tomatenmark und den Gewürzen eine Marinade anrühren. Fleisch in Bratöl knusprig anbraten, in eine Auflaufform geben, salzen und pfeffern. Bananen und Marinade dazugeben, alles gut mischen. Den Emmentaler reiben und darüber streuen. Ca. 20 Minuten im Backofen garen.",
    "ingredients": [
      {
        "name": "Bananen",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Hähnchenbrustfilet",
        "amount": "300 g",
        "shopCategory": "Fleisch & Fisch"
      },
      {
        "name": "Emmentaler",
        "amount": "80 g",
        "shopCategory": "Mopro"
      },
      {
        "name": "Sahne",
        "amount": "100 ml",
        "shopCategory": "Mopro"
      },
      {
        "name": "getrocknetes Basilikum",
        "amount": "",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Tomatenmark",
        "amount": "1 Esslöffel",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Curry",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Curry-Ketchup",
        "amount": "2 Esslöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "",
        "shopCategory": "Vorrat"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 580,
      "protein": 36,
      "fat": 22,
      "carbs": 54
    }
  },
  {
    "id": "r_1773152841812_qwn49",
    "title": "Pizza mit Gemüse (40 Minuten)",
    "categories": [
      "Vegetarisch"
    ],
    "description": "Backofen auf 200 Grad vorheizen. Mehl, Salz und Hefe in eine Schüssel geben. Nach und nach lauwarmes Wasser dazu geben und mit dem Mixer (Knethaken) verrühren, bis sich ein geschmeidiger Teig gebildet hat. Aus der Schüssel nehmen und mit den Händen gründlich kneten. 30 bis 60 Minuten mit einem Tuch abgedeckt an einem warmen Ort ruhen lassen. Gemüse waschen, klein schneiden und in Olivenöl anbraten. Mozzarella in kleine Würfel schneiden. Backblech fetten, Hefeteig darauf ausrollen. Mit Tomatenmark bestreichen, mit den Gewürzen bestreuen. Den Teig mit dem Gemüse belegen, zum Schluss den Mozzarella darüber streuen. Ca. 10-15 Minuten backen, bis der Mozzarella geschmolzen und leicht gebräunt ist.",
    "ingredients": [
      {
        "name": "Champignons",
        "amount": "8",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Paprikaschoten",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Zwiebeln",
        "amount": "2",
        "shopCategory": "Gemüse & Obst"
      },
      {
        "name": "Hefe",
        "amount": "1 Würfel",
        "shopCategory": "Mopro"
      },
      {
        "name": "Mozzarella",
        "amount": "2 Pakete",
        "shopCategory": "Mopro"
      },
      {
        "name": "Tomatenmark",
        "amount": "0.5 Tube",
        "shopCategory": "Trockensortiment"
      },
      {
        "name": "Kräuter de Provence",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Mehl",
        "amount": "300 g",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Pfeffer",
        "amount": "1 Prise",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Salz",
        "amount": "1 Teelöffel",
        "shopCategory": "Vorrat"
      },
      {
        "name": "Wasser",
        "amount": "100 ml",
        "shopCategory": "Sonstiges"
      }
    ],
    "cookTime": 40,
    "portions": 2,
    "reference": "",
    "nutrition": {
      "kcal": 620,
      "protein": 26,
      "fat": 20,
      "carbs": 84
    }
  }
];
