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

const AUTHOR = 'North American Technologies and AI solutions Inc.';

export const articles: BlogArticle[] = [
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
          heading: 'Pourquoi cette dynamique ouvre la voie au covoiturage ’entreprise',
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
