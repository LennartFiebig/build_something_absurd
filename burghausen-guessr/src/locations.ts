export type Location = {
  id: string
  name: string
  lat: number
  lng: number
}

export const BURGHAUSEN_CENTER: [number, number] = [48.1633, 12.8254]

export const BURGHAUSEN_BOUNDS: [[number, number], [number, number]] = [
  [48.144, 12.795],
  [48.185, 12.870],
]

export const LOCATIONS: Location[] = [
  { id: 'hauptburg', name: 'Hauptburg (Innenhof)', lat: 48.1577, lng: 12.8323 },
  { id: 'georgstor', name: 'Georgstor', lat: 48.1563, lng: 12.8352 },
  { id: 'pulverturm', name: 'Pulverturm', lat: 48.1546, lng: 12.8367 },
  { id: 'stadtplatz_nord', name: 'Stadtplatz (Nord)', lat: 48.1612, lng: 12.8280 },
  { id: 'stadtplatz_sued', name: 'Stadtplatz (Süd)', lat: 48.1590, lng: 12.8288 },
  { id: 'st_jakob', name: 'Pfarrkirche St. Jakob', lat: 48.1604, lng: 12.8290 },
  { id: 'woehrsee', name: 'Wöhrsee Badeplatz', lat: 48.1612, lng: 12.8232 },
  { id: 'woehrsee_steg', name: 'Wöhrsee (Ostufer)', lat: 48.1597, lng: 12.8253 },
  { id: 'salzachbruecke', name: 'Salzachbrücke nach Österreich', lat: 48.1620, lng: 12.8330 },
  { id: 'mautnerschloss', name: 'Mautnerschloss', lat: 48.1652, lng: 12.8260 },
  { id: 'neustadt_marienplatz', name: 'Marienplatz (Neustadt)', lat: 48.1666, lng: 12.8181 },
  { id: 'bahnhof', name: 'Bahnhof Burghausen', lat: 48.1730, lng: 12.8198 },
  { id: 'wackerstadion', name: 'Wacker-Stadion', lat: 48.1712, lng: 12.8083 },
  { id: 'st_konrad', name: 'Kloster St. Konrad', lat: 48.1648, lng: 12.8208 },
  { id: 'eduard_pestl_platz', name: 'Eduard-Pestel-Platz', lat: 48.1683, lng: 12.8160 },
  { id: 'tittmoninger_str', name: 'Tittmoninger Straße', lat: 48.1592, lng: 12.8232 },
  { id: 'in_burg_vorhof2', name: 'Burg – 2. Vorhof', lat: 48.1593, lng: 12.8316 },
  { id: 'in_burg_vorhof4', name: 'Burg – 4. Vorhof', lat: 48.1579, lng: 12.8338 },
  { id: 'aussichtspunkt_eggenberg', name: 'Aussichtspunkt Eggenberg', lat: 48.1601, lng: 12.8385 },
  { id: 'raitenhaslach', name: 'Kloster Raitenhaslach', lat: 48.1296, lng: 12.8542 },
  { id: 'salzachsteg', name: 'Salzach-Uferweg Süd', lat: 48.1550, lng: 12.8298 },
  { id: 'rathaus', name: 'Rathaus Burghausen', lat: 48.1599, lng: 12.8284 },
  { id: 'grueben_unterer', name: 'Grüben (untere Stadt)', lat: 48.1582, lng: 12.8261 },
  { id: 'pestbild', name: 'Pestsäule am Stadtplatz', lat: 48.1606, lng: 12.8285 },
  { id: 'neustadt_friedhof', name: 'Friedhof Neustadt', lat: 48.1697, lng: 12.8147 },
]

export function pickRandomLocation(exclude?: string): Location {
  const pool = exclude ? LOCATIONS.filter(l => l.id !== exclude) : LOCATIONS
  return pool[Math.floor(Math.random() * pool.length)]
}
