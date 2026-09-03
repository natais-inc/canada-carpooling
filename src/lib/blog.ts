/**
 * CarpoolWork — blog content.
 * Static, bilingual, editorial content. No database: articles live here so they
 * ship with the build and render server-side. Figures are sourced (see `sources`)
 * and must stay verifiable — do not add a statistic without a citation.
 */

export type BlogSection = { heading?: string; paragraphs: string[] };
export type BlogSource = { label: string; url: string };
export type BlogArticleLocale = {
  title: string;
  excerpt: string;
  intro: string;
  sections: BlogSection[];
  sourcesTitle: string;
  sources: BlogSource[];
};
export type BlogArticle = {
  slug: string;
  date: string; // ISO
  author: string;
  readingMinutes: number;
  fr: BlogArticleLocale;
  en: BlogArticleLocale;
};

const AUTHOR = 'Magloire Pondi Simb, Founder / CEO, North American Technologies and AI solutions Inc.';

export const articles: BlogArticle[] = [
  {
    slug: 'vrai-cout-stationnement-travail',
    date: '2026-09-03',
    author: AUTHOR,
    readingMinutes: 6,
    fr: {
      title: 'Le vrai coût du stationnement au travail — et pourquoi le covoiturage le réduit directement',
      excerpt:
        'Une place de stationnement peut coûter de l’ordre de 25 000 $ à bâtir en structure, et jusqu’à 230 000 $ en souterrain dans les marchés denses — puis des centaines à des milliers de dollars par an à exploiter. Pour un employeur, chaque place évitée est une économie, et le covoiturage domicile-travail en supprime directement.',
      intro:
        'Le stationnement paraît gratuit parce qu’on ne le paie presque jamais à l’usage. Pour l’employeur qui le fournit, il ne l’est pas du tout : c’est un actif coûteux à construire, à louer et à entretenir, dont le nombre de places découle directement de la façon dont les employés viennent travailler. Quand la grande majorité arrive seule en voiture, on finit par bâtir et payer une place par personne — pour des véhicules souvent à moitié vides.',
      sections: [
        {
          heading: 'Une place de stationnement : bien plus qu’une ligne peinte',
          paragraphs: [
            'Le coût dépend du type. Une place en surface est peu coûteuse à bâtir, mais très gourmande en terrain : en comptant les voies d’accès, elle occupe de 25 à 35 m², soit environ 85 à 175 places par acre. Une place en stationnement structuré (en étages) coûte de l’ordre de 25 000 $ à construire. En souterrain, la facture grimpe : de 20 000 $ à 35 000 $ par place dans bien des cas, et jusqu’à 230 000 $ par place dans la région métropolitaine de Vancouver, selon une analyse de Metro Vancouver (2024).',
            'À cela s’ajoute l’exploitation : entretien, déneigement, éclairage, assurance, réfection du revêtement. Les estimations situent le coût annualisé entre environ 600 $ par place (surface en banlieue) et plus de 4 000 $ par place (stationnement structuré au centre-ville) — chaque année, pour chaque place.',
          ],
        },
        {
          heading: 'Un coût que les employeurs rattachent rarement à la navette',
          paragraphs: [
            'Dans les livres, le stationnement se cache dans l’immobilier et les charges d’exploitation, pas dans un poste « mobilité ». Pourtant il est la conséquence directe des choix de déplacement du personnel : plus il y a de conducteurs seuls, plus il faut de places.',
            'L’ampleur du gaspillage est documentée. Toujours selon Metro Vancouver, exiger environ 1,2 place par logement ajoute en moyenne 35 000 $ au revenu annuel nécessaire pour se qualifier à l’hypothèque, et les bâtiments affichent une suroffre de stationnement de 47 % (copropriétés) et 35 % (immeubles locatifs). Autrement dit, on construit — et on paie — beaucoup trop de places. La logique vaut pour un employeur : des places bâties, louées et entretenues pour une demande gonflée par l’autosolo.',
          ],
        },
        {
          heading: 'Le maillon manquant : conduire seul',
          paragraphs: [
            'C’est ici que le lien se fait. Dans la région métropolitaine de Toronto, près de 85 % des automobilistes se rendaient au travail seuls au volant (Recensement de 2021, Statistique Canada — voir notre premier article sur la dynamique des navettes du Grand Toronto). En pratique, un conducteur seul correspond à une place occupée à l’heure de pointe.',
            'Le coût ne pèse pas que sur l’employeur. Posséder et faire rouler une voiture se chiffre en milliers de dollars par an : le calculateur des coûts d’utilisation de la CAA estime, par exemple, une Nissan Sentra 2025 en Ontario à environ 4 550 $ par an (carburant et frais d’exploitation) — sans même compter le stationnement. Réduire l’autosolo allège donc les deux côtés de l’équation.',
          ],
        },
        {
          heading: 'Ce que le covoiturage change, concrètement',
          paragraphs: [
            'Regrouper 2 à 4 collègues dans une même voiture réduit le nombre de véhicules à l’heure de pointe — donc le nombre de places nécessaires au pic. Transformer ne serait-ce qu’une fraction des sièges vides en places partagées, c’est des dizaines de places en moins à fournir : du capital évité (de l’ordre de 25 000 $ par place en structure), de l’exploitation évitée (des centaines à des milliers de dollars par place et par an) et de l’emprise foncière libérée pour un autre usage.',
            'C’est exactement le levier de CarpoolWork : un programme payé par l’employeur, facturé uniquement sur les participants réellement actifs, qui organise le covoiturage entre collègues. Une place de stationnement réservée aux covoitureurs devient au passage un incitatif à faible coût — elle réoriente une place qui existe déjà, au lieu d’en construire une nouvelle.',
            'Soyons honnêtes sur les chiffres : ces économies dépendent du taux d’adoption et du fait que la réduction du stationnement soit réellement actée — places non construites, baux réduits, espace requalifié. Le covoiturage crée la marge de manœuvre ; c’est à l’employeur de la capter en ajustant son offre de stationnement.',
          ],
        },
      ],
      sourcesTitle: 'Sources',
      sources: [
        { label: 'Victoria Transport Policy Institute — Parking Costs (Transportation Cost and Benefit Analysis)', url: 'https://www.vtpi.org/tca/tca0504.pdf' },
        { label: 'Metro Vancouver — coût de construction jusqu’à 230 000 $ par place (rapport 2024, rapporté par Vancouver Is Awesome)', url: 'https://www.vancouverisawesome.com/highlights/cost-to-build-metro-vancouver-parking-stall-reaches-230000-finds-report-10025743' },
        { label: 'CAA — Calculateur des coûts d’utilisation d’une automobile', url: 'https://carcosts.caa.ca/' },
        { label: 'Statistique Canada — « RGT : s’y rendre en automobile » (Recensement de 2021)', url: 'https://www.statcan.gc.ca/o1/en/plus/2697-gta-getting-there-automobile' },
      ],
    },
    en: {
      title: 'The real cost of workplace parking — and why carpooling cuts it directly',
      excerpt:
        'A single parking space can cost around $25,000 to build in a structure, and up to $230,000 underground in dense markets — then hundreds to thousands of dollars a year to operate. For an employer, every space avoided is money saved, and workplace carpooling removes them directly.',
      intro:
        'Parking feels free because you almost never pay for it by the hour. For the employer who provides it, it is anything but: it is a costly asset to build, lease and maintain, and the number of spaces follows directly from how employees get to work. When the vast majority arrive alone by car, you end up building and paying for one space per person — for vehicles that are often half empty.',
      sections: [
        {
          heading: 'A parking space is far more than a painted line',
          paragraphs: [
            'The cost depends on the type. A surface space is cheap to build but very land-hungry: counting access lanes, it takes up 25 to 35 m², or roughly 85 to 175 spaces per acre. A space in a structured (above-ground) garage costs on the order of $25,000 to build. Underground, the bill climbs: often $20,000 to $35,000 per space, and up to $230,000 per space in Metro Vancouver, according to a 2024 Metro Vancouver analysis.',
            'On top of that comes operation: maintenance, snow clearing, lighting, insurance, resurfacing. Estimates put the annualized cost between about $600 per space (suburban surface lot) and more than $4,000 per space (downtown structured parking) — every year, for every space.',
          ],
        },
        {
          heading: 'A cost employers rarely tie back to the commute',
          paragraphs: [
            'On the books, parking hides inside real estate and operating expenses, not a “mobility” line. Yet it is a direct consequence of how staff travel: the more solo drivers, the more spaces you need.',
            'The scale of the waste is documented. Again per Metro Vancouver, requiring about 1.2 spaces per home adds on average $35,000 to the household income needed to qualify for the mortgage, and buildings show a parking oversupply of 47% (strata) and 35% (rental). In short, far too many spaces are built — and paid for. The same logic applies to an employer: spaces built, leased and maintained for demand inflated by solo driving.',
          ],
        },
        {
          heading: 'The missing link: driving alone',
          paragraphs: [
            'This is where it connects. In the Toronto metropolitan area, nearly 85% of car commuters drove to work alone (2021 Census, Statistics Canada — see our first article on Greater Toronto commuting dynamics). In practice, one solo driver equals one space occupied at peak.',
            'The cost is not only the employer’s. Owning and operating a car runs into thousands of dollars a year: the CAA Driving Costs Calculator estimates, for example, a 2025 Nissan Sentra in Ontario at about $4,550 per year (fuel and operating costs) — before parking is even counted. Cutting solo driving therefore eases both sides of the equation.',
          ],
        },
        {
          heading: 'What carpooling changes, concretely',
          paragraphs: [
            'Putting 2 to 4 coworkers in one car reduces the number of vehicles at peak — and therefore the number of spaces needed at peak. Turning even a fraction of those empty seats into shared rides means dozens fewer spaces to provide: capital avoided (on the order of $25,000 per structured space), operation avoided (hundreds to thousands of dollars per space per year) and land freed for another use.',
            'This is exactly the lever CarpoolWork provides: an employer-paid program, billed only on participants who are actually active, that organizes carpooling among coworkers. A parking space reserved for carpoolers also becomes a low-cost incentive — it repurposes a space that already exists instead of building a new one.',
            'Let’s be honest about the numbers: these savings depend on adoption and on the parking reduction actually being realized — spaces not built, leases trimmed, space repurposed. Carpooling creates the room to manoeuvre; it is up to the employer to capture it by adjusting the parking supply.',
          ],
        },
      ],
      sourcesTitle: 'Sources',
      sources: [
        { label: 'Victoria Transport Policy Institute — Parking Costs (Transportation Cost and Benefit Analysis)', url: 'https://www.vtpi.org/tca/tca0504.pdf' },
        { label: 'Metro Vancouver — construction cost up to $230,000 per stall (2024 report, as reported by Vancouver Is Awesome)', url: 'https://www.vancouverisawesome.com/highlights/cost-to-build-metro-vancouver-parking-stall-reaches-230000-finds-report-10025743' },
        { label: 'CAA — Driving Costs Calculator', url: 'https://carcosts.caa.ca/' },
        { label: 'Statistics Canada — “GTA: getting there by automobile” (2021 Census)', url: 'https://www.statcan.gc.ca/o1/en/plus/2697-gta-getting-there-automobile' },
      ],
    },
  },
  {
    slug: 'dynamique-navettes-grand-toronto',
    date: '2026-09-02',
    author: AUTHOR,
    readingMinutes: 7,
    fr: {
      title: 'La dynamique quotidienne des navettes dans le Grand Toronto : une occasion pour le covoiturage d’entreprise',
      excerpt:
        'Dans la région du Grand Toronto, l’immense majorité des trajets domicile-travail se fait en voiture, le plus souvent seul au volant. Les chiffres de Statistique Canada, municipalité par municipalité, montrent pourquoi le covoiturage organisé par l’employeur a une vraie place.',
      intro:
        'Chaque matin de semaine, des centaines de milliers de personnes de la région du Grand Toronto (RGT) prennent le chemin du travail. Comment se déplacent-elles réellement? Les données du Recensement de 2021 et de l’Enquête sur la population active de Statistique Canada donnent une image nette — et étonnamment homogène d’une municipalité à l’autre : la voiture domine, et le plus souvent avec une seule personne à bord.',
      sections: [
        {
          heading: 'La voiture, reine de la navette torontoise',
          paragraphs: [
            'Selon le Recensement de 2021, environ 73,8 % des quelque 1,5 million de travailleurs dont le domicile et le lieu de travail se trouvaient tous deux dans la région métropolitaine de recensement (RMR) de Toronto se rendaient au travail en voiture, camion ou fourgonnette.',
            'Le point le plus révélateur pour le covoiturage : près de 85 % de ces automobilistes conduisaient seuls. Autrement dit, la grande majorité des sièges disponibles sur le trajet domicile-travail restent vides chaque jour.',
            'Le trajet n’est pas anodin non plus. En 2021, la RMR de Toronto affichait la durée de navette moyenne la plus longue parmi les trois plus grandes régions du pays, à 29,8 minutes — en baisse par rapport à 34 minutes en 2016, mais toujours en tête. En mai 2025, Toronto conservait la navette moyenne la plus longue au Canada, à 34,9 minutes.',
          ],
        },
        {
          heading: 'Municipalité par municipalité : le même réflexe automobile',
          paragraphs: [
            'À Mississauga, en 2021, 74,3 % des travailleurs conduisaient seuls pour aller au travail et 8,4 % voyageaient comme passagers — alors que la part du transport en commun tombait de 18,1 % (2016) à 11,4 % (2021).',
            'À Brampton, la dépendance à l’automobile est encore plus marquée : 77,0 % de conducteurs seuls et 8,9 % de passagers en 2021, pendant que le transport en commun reculait de 14,0 % à 10,3 %.',
            'Le phénomène s’amplifie pour les navetteurs qui entrent dans Toronto depuis les couronnes : la part de l’automobile atteignait 90,8 % depuis Oshawa, 93 % depuis Hamilton, 96,0 % depuis Guelph, 93,3 % depuis Kitchener–Cambridge–Waterloo et jusqu’à 97,0 % depuis Barrie.',
          ],
        },
        {
          heading: 'Après la pandémie : moins de transport en commun, plus de voitures',
          paragraphs: [
            'Entre 2016 et 2021, la tendance est claire dans toute la RGT : la part du transport en commun a chuté et celle de la voiture individuelle a progressé. À Mississauga comme à Brampton, la conduite en solo a gagné du terrain tandis que le transport collectif en perdait.',
            'La part des passagers (le covoiturage) reste modeste, mais elle a augmenté dans la région de Peel entre 2016 et 2021 — un signal que, lorsque l’option existe et qu’elle est simple, des gens la choisissent. À l’échelle du Canada, en mai 2025, 80,9 % des navetteurs se déplaçaient en voiture, dont 75,1 % seuls au volant et seulement 5,8 % comme passagers.',
          ],
        },
        {
          heading: 'Pourquoi cette dynamique ouvre la voie au covoiturage d’entreprise',
          paragraphs: [
            'Quand 3 travailleurs sur 4 conduisent seuls vers le même quartier d’affaires, le même hôpital, la même usine ou le même centre de distribution, la conséquence est directe : des stationnements saturés, des coûts d’aménagement élevés pour l’employeur et des émissions évitables.',
            'C’est exactement l’espace que CarpoolWork occupe. Plutôt que de laisser chacun organiser son propre trajet, l’employeur met en place un programme : des collègues qui habitent à proximité forment des groupes de 2 à 4 personnes et s’alternent comme chauffeurs. Le chauffeur du jour confirme le covoiturage en un seul geste, et le trajet est enregistré automatiquement pour tout le groupe.',
            'Le modèle est payé par l’employeur (gratuit pour les employés), facturé uniquement sur les participants réellement actifs, et pensé pour la navette récurrente — pas pour le transport à la demande ni les longues distances. Sur un territoire où la voiture solo est la norme quasi universelle, transformer ne serait-ce qu’une fraction de ces sièges vides en places partagées représente des dizaines de véhicules en moins sur le stationnement chaque jour.',
          ],
        },
      ],
      sourcesTitle: 'Sources',
      sources: [
        { label: 'Statistique Canada — « RGT : s’y rendre en automobile » (Recensement de 2021)', url: 'https://www.statcan.gc.ca/o1/en/plus/2697-gta-getting-there-automobile' },
        { label: 'Statistique Canada — Temps de navettage, 2011 à 2022', url: 'https://www150.statcan.gc.ca/n1/pub/14-28-0001/2023001/article/00003-eng.htm' },
        { label: 'Statistique Canada — Le Quotidien, 26 août 2025 (navettage)', url: 'https://www150.statcan.gc.ca/n1/daily-quotidien/250826/dq250826a-eng.htm' },
        { label: 'Statistique Canada — Mode de transport, Mississauga (2016 à 2021)', url: 'https://www12.statcan.gc.ca/census-recensement/2021/as-sa/fogs-spg/alternative.cfm?topic=13&lang=e&dguid=2021A00053521005&objectId=2_4' },
        { label: 'Statistique Canada — Mode de transport, Brampton (2016 à 2021)', url: 'https://www12.statcan.gc.ca/census-recensement/2021/as-sa/fogs-spg/alternative.cfm?topic=13&lang=e&dguid=2021A00053521010&objectId=2_4' },
      ],
    },
    en: {
      title: 'The daily commuting dynamics of the Greater Toronto Area: an opening for workplace carpooling',
      excerpt:
        'Across the Greater Toronto Area, the vast majority of home-to-work trips are made by car — usually with a single person aboard. Statistics Canada figures, municipality by municipality, show why employer-organized carpooling has a real role to play.',
      intro:
        'Every weekday morning, hundreds of thousands of people across the Greater Toronto Area (GTA) head to work. How do they actually travel? Data from the 2021 Census and Statistics Canada’s Labour Force Survey paint a clear — and strikingly consistent — picture from one municipality to the next: the car dominates, most often with just one person inside.',
      sections: [
        {
          heading: 'The car rules the Toronto commute',
          paragraphs: [
            'According to the 2021 Census, roughly 73.8% of the nearly 1.5 million workers whose home and workplace were both inside the Toronto census metropolitan area (CMA) commuted by car, truck or van.',
            'The most telling number for carpooling: nearly 85% of those car commuters were driving alone. In other words, the large majority of available seats on the daily commute sit empty.',
            'The trip is not trivial either. In 2021, the Toronto CMA had the longest average commute among Canada’s three largest regions at 29.8 minutes — down from 34 minutes in 2016, but still the highest. By May 2025, Toronto still had the country’s longest average commute at 34.9 minutes.',
          ],
        },
        {
          heading: 'Municipality by municipality: the same driving reflex',
          paragraphs: [
            'In Mississauga in 2021, 74.3% of workers drove alone to work and 8.4% travelled as passengers — while public-transit’s share fell from 18.1% (2016) to 11.4% (2021).',
            'In Brampton, car dependence is even higher: 77.0% solo drivers and 8.9% passengers in 2021, as public transit slipped from 14.0% to 10.3%.',
            'The pattern intensifies for commuters entering Toronto from the outer rings: the automobile share reached 90.8% from Oshawa, 93% from Hamilton, 96.0% from Guelph, 93.3% from Kitchener–Cambridge–Waterloo, and as high as 97.0% from Barrie.',
          ],
        },
        {
          heading: 'After the pandemic: less transit, more cars',
          paragraphs: [
            'Between 2016 and 2021, the trend is clear across the GTA: public transit’s share dropped and solo driving rose. In both Mississauga and Brampton, driving alone gained ground while transit lost it.',
            'The passenger (carpool) share remains modest, but it grew in the Peel region between 2016 and 2021 — a signal that when a simple option exists, people take it. Nationally, in May 2025, 80.9% of commuters travelled by car, with 75.1% driving alone and only 5.8% riding as passengers.',
          ],
        },
        {
          heading: 'Why this dynamic opens the door to workplace carpooling',
          paragraphs: [
            'When 3 in 4 workers drive alone to the same business park, hospital, plant or distribution centre, the consequences are direct: crowded parking, high build-out costs for the employer, and avoidable emissions.',
            'This is exactly the space CarpoolWork occupies. Instead of leaving everyone to sort out their own trip, the employer runs a program: coworkers who live nearby form groups of 2 to 4 and take turns driving. The driver of the day confirms the carpool in a single tap, and the trip is logged automatically for the whole group.',
            'The model is employer-paid (free for employees), billed only on participants who are actually active, and built for the recurring commute — not ride-hailing or long distances. In a region where solo driving is the near-universal norm, turning even a fraction of those empty seats into shared rides means dozens fewer vehicles in the lot each day.',
          ],
        },
      ],
      sourcesTitle: 'Sources',
      sources: [
        { label: 'Statistics Canada — “GTA: getting there by automobile” (2021 Census)', url: 'https://www.statcan.gc.ca/o1/en/plus/2697-gta-getting-there-automobile' },
        { label: 'Statistics Canada — Commuting time, 2011 to 2022', url: 'https://www150.statcan.gc.ca/n1/pub/14-28-0001/2023001/article/00003-eng.htm' },
        { label: 'Statistics Canada — The Daily, August 26, 2025 (commuting)', url: 'https://www150.statcan.gc.ca/n1/daily-quotidien/250826/dq250826a-eng.htm' },
        { label: 'Statistics Canada — Main mode of commuting, Mississauga (2016 to 2021)', url: 'https://www12.statcan.gc.ca/census-recensement/2021/as-sa/fogs-spg/alternative.cfm?topic=13&lang=e&dguid=2021A00053521005&objectId=2_4' },
        { label: 'Statistics Canada — Main mode of commuting, Brampton (2016 to 2021)', url: 'https://www12.statcan.gc.ca/census-recensement/2021/as-sa/fogs-spg/alternative.cfm?topic=13&lang=e&dguid=2021A00053521010&objectId=2_4' },
      ],
    },
  },
];

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function articleLocale(a: BlogArticle, locale: string): BlogArticleLocale {
  return locale === 'en' ? a.en : a.fr;
}
