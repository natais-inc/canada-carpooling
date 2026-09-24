/**
 * CarpoolWork — legal texts (privacy policy, terms of use), FR/EN.
 * Plain data rendered by src/app/[locale]/confidentialite and /conditions.
 * Keep CURRENT_PRIVACY_POLICY_VERSION / CURRENT_TERMS_VERSION in src/lib/consent.ts in sync with `updated`.
 */

export type LegalSection = { title: string; paragraphs: string[]; bullets?: string[] };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };

const ENTITY = 'North American Technologies and AI Solutions Inc.';
const ADDR_FR = '151 Alma Street, Oshawa (Ontario) L1G 2C3, Canada';
const ADDR_EN = '151 Alma Street, Oshawa, Ontario L1G 2C3, Canada';
const EMAIL = 'support@carpoolwork.ca';

export const PRIVACY: Record<'fr' | 'en', LegalDoc> = {
  fr: {
    title: 'Politique de confidentialité',
    updated: 'Dernière mise à jour : 23 septembre 2026',
    intro: `CarpoolWork est un service exploité par ${ENTITY} (« nous »), dont le siège social est situé au ${ADDR_FR}. Cette politique explique quels renseignements personnels nous recueillons, pourquoi, où ils sont hébergés, et quels sont vos droits. Elle est rédigée pour respecter la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE) et, à titre volontaire, la Loi 25 du Québec.`,
    sections: [
      { title: '1. Responsable de la protection des renseignements personnels', paragraphs: [
        `Magloire Pondi Simb, président de ${ENTITY}. Pour toute question ou demande : ${EMAIL}.`,
      ]},
      { title: '2. Ce que nous recueillons', paragraphs: ['Nous ne recueillons que ce qui est nécessaire au service :'], bullets: [
        'Compte : nom, adresse courriel, langue préférée, mot de passe (haché), numéro de téléphone si vous choisissez de le fournir.',
        'Rattachement à un employeur : employeur, site de travail, statut d\'adhésion, code, lien ou code QR utilisé.',
        'Profil de trajet (facultatif, saisi par vous) : région postale du domicile (3 premiers caractères du code postal), position approximative du domicile, heures habituelles d\'arrivée et de départ, jours de trajet, préférence conducteur ou passager.',
        'Activité de covoiturage : groupes de covoiturage, trajets enregistrés (date, groupe, distance estimée).',
        'Données techniques : adresse IP au moment du consentement, témoin de session, journaux de sécurité.',
        'Employeurs : coordonnées du gestionnaire, nom et région de l\'organisation, factures.',
      ]},
      { title: '3. Pourquoi nous les utilisons', paragraphs: [], bullets: [
        'Créer et sécuriser votre compte et vous relier au programme de votre employeur.',
        'Vous suggérer des collègues qui habitent à proximité et arrivent à la même heure. Votre position exacte n\'est jamais montrée aux autres : seuls une distance approximative et la région postale sont affichés.',
        'Mesurer la participation. Votre employeur voit des chiffres agrégés (participants actifs, covoiturages, kilomètres et CO₂ évités) et la liste des membres de son programme avec leur statut ; il ne voit ni votre adresse, ni vos coordonnées de domicile.',
        'Facturer l\'employeur sur le nombre de participants actifs du mois. Aucune donnée de paiement n\'est recueillie auprès des employés.',
        'Vous envoyer les courriels nécessaires au service (confirmation d\'adresse, invitation, rappel hebdomadaire). Vous pouvez demander l\'arrêt des rappels à tout moment.',
        'Prévenir les abus et respecter nos obligations légales.',
      ]},
      { title: '4. Ce que nous ne faisons pas', paragraphs: [], bullets: [
        'Nous ne vendons ni ne louons vos renseignements.',
        'Nous n\'utilisons aucun témoin publicitaire ni outil de suivi tiers ; seuls des témoins essentiels (session, sécurité, langue) sont utilisés.',
        'Nous ne vérifions pas l\'identité, le permis de conduire ni l\'assurance des membres, et nous ne conservons aucune pièce d\'identité.',
        'Nous ne suivons pas votre position en temps réel pendant les trajets.',
        'Aucun paiement ne transite par la plateforme entre collègues.',
      ]},
      { title: '5. Où vos données sont hébergées', paragraphs: [
        'Nous faisons appel à des fournisseurs d\'infrastructure dont les serveurs sont situés aux États-Unis : Vercel (hébergement de l\'application), Neon (base de données, région AWS des États-Unis) et Resend (envoi de courriels). Vos renseignements sont donc conservés et traités hors du Canada et peuvent être soumis aux lois de ce pays. Nous tenons un registre de ces transferts et n\'utilisons ces fournisseurs que pour l\'exploitation du service, sous contrat.',
      ]},
      { title: '6. Conservation', paragraphs: [
        'Vos données sont conservées tant que votre compte existe. Sur demande de suppression, votre compte est fermé immédiatement et vos renseignements personnels sont anonymisés dans les 30 jours : nom, courriel et téléphone remplacés par des valeurs anonymes, profil de trajet et coordonnées de domicile effacés, appartenance aux groupes retirée. Les statistiques agrégées de participation (sans nom) et les registres de consentement sont conservés pour la reddition de comptes. Les factures des employeurs sont conservées selon les obligations fiscales.',
      ]},
      { title: '7. Vos droits', paragraphs: [
        `Vous pouvez à tout moment accéder à vos renseignements, en obtenir une copie, les corriger, retirer votre consentement ou demander la suppression de votre compte. Écrivez à ${EMAIL} depuis l'adresse de votre compte ; nous répondons dans un délai de 30 jours. Vous pouvez aussi déposer une plainte auprès du Commissariat à la protection de la vie privée du Canada.`,
      ]},
      { title: '8. Sécurité', paragraphs: [
        'Connexions chiffrées (HTTPS), mots de passe hachés, verrouillage après tentatives répétées, accès administratif restreint et journalisé. Aucun système n\'est infaillible : signalez tout incident à l\'adresse ci-dessus.',
      ]},
      { title: '9. Modifications', paragraphs: [
        'Toute modification importante est annoncée sur le site et, si nécessaire, par courriel. La date en tête de page indique la version en vigueur.',
      ]},
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: September 23, 2026',
    intro: `CarpoolWork is a service operated by ${ENTITY} ("we"), headquartered at ${ADDR_EN}. This policy explains what personal information we collect, why, where it is hosted, and what your rights are. It is written to comply with the Personal Information Protection and Electronic Documents Act (PIPEDA) and, voluntarily, Quebec's Law 25.`,
    sections: [
      { title: '1. Privacy officer', paragraphs: [
        `Magloire Pondi Simb, President of ${ENTITY}. For any question or request: ${EMAIL}.`,
      ]},
      { title: '2. What we collect', paragraphs: ['We only collect what the service needs:'], bullets: [
        'Account: name, email address, preferred language, password (hashed), phone number if you choose to provide it.',
        'Employer membership: employer, work site, membership status, code, link or QR code used.',
        'Commute profile (optional, entered by you): home postal area (first 3 characters of the postal code), approximate home location, usual arrival and departure times, commute days, driver or passenger preference.',
        'Carpool activity: carpool groups, trips logged (date, group, estimated distance).',
        'Technical data: IP address at consent, session cookie, security logs.',
        'Employers: manager contact details, organization name and region, invoices.',
      ]},
      { title: '3. Why we use it', paragraphs: [], bullets: [
        'To create and secure your account and link you to your employer\'s program.',
        'To suggest colleagues who live nearby and arrive at the same time. Your exact location is never shown to others: only an approximate distance band and postal area are displayed.',
        'To measure participation. Your employer sees aggregate figures (active participants, carpools, kilometres and CO₂ avoided) and the list of members of its program with their status; it does not see your address or home coordinates.',
        'To invoice the employer on the number of active participants in the month. No payment data is collected from employees.',
        'To send you the emails the service needs (address confirmation, invitation, weekly reminder). You can ask to stop reminders at any time.',
        'To prevent abuse and meet our legal obligations.',
      ]},
      { title: '4. What we do not do', paragraphs: [], bullets: [
        'We do not sell or rent your information.',
        'We use no advertising cookies or third-party trackers; only essential cookies (session, security, language).',
        'We do not verify members\' identity, driver\'s licence or insurance, and we keep no identity documents.',
        'We do not track your location in real time during trips.',
        'No payment goes through the platform between coworkers.',
      ]},
      { title: '5. Where your data is hosted', paragraphs: [
        'We rely on infrastructure providers whose servers are located in the United States: Vercel (application hosting), Neon (database, AWS US region) and Resend (email delivery). Your information is therefore stored and processed outside Canada and may be subject to the laws of that country. We keep a register of these transfers and use these providers only to operate the service, under contract.',
      ]},
      { title: '6. Retention', paragraphs: [
        'Your data is kept as long as your account exists. On a deletion request, your account is closed immediately and your personal information is anonymized within 30 days: name, email and phone replaced by anonymous values, commute profile and home coordinates erased, group memberships removed. Aggregate participation statistics (without names) and consent records are kept for accountability. Employer invoices are kept as required by tax law.',
      ]},
      { title: '7. Your rights', paragraphs: [
        `You may at any time access your information, obtain a copy, correct it, withdraw consent or request deletion of your account. Write to ${EMAIL} from your account's email address; we reply within 30 days. You may also file a complaint with the Office of the Privacy Commissioner of Canada.`,
      ]},
      { title: '8. Security', paragraphs: [
        'Encrypted connections (HTTPS), hashed passwords, lockout after repeated attempts, restricted and logged administrative access. No system is infallible: report any incident to the address above.',
      ]},
      { title: '9. Changes', paragraphs: [
        'Material changes are announced on the site and, where needed, by email. The date at the top of the page indicates the version in force.',
      ]},
    ],
  },
};

export const TERMS: Record<'fr' | 'en', LegalDoc> = {
  fr: {
    title: 'Conditions d\'utilisation',
    updated: 'Dernière mise à jour : 23 septembre 2026',
    intro: `Les présentes conditions régissent l'utilisation de CarpoolWork (carpoolwork.ca), un service de ${ENTITY}, ${ADDR_FR} (« CarpoolWork », « nous »). En créant un compte, vous les acceptez.`,
    sections: [
      { title: '1. Le service', paragraphs: [
        'CarpoolWork est une plateforme de covoiturage domicile-travail organisée et payée par l\'employeur. Elle met en relation des collègues d\'un même site, leur permet de former des groupes de 2 à 4 personnes, d\'enregistrer leurs covoiturages et de mesurer la participation. CarpoolWork ne transporte personne, ne possède aucun véhicule, ne perçoit aucun paiement entre collègues et n\'est pas un service de transport.',
      ]},
      { title: '2. Comptes', paragraphs: [
        'Le service s\'adresse aux personnes majeures employées par une organisation participante, ainsi qu\'aux gestionnaires de ces organisations. Vous devez fournir des renseignements exacts et garder votre mot de passe confidentiel. Un rattachement à un employeur peut être soumis à l\'approbation de celui-ci.',
      ]},
      { title: '3. Covoiturage et partage des frais', paragraphs: [
        'Le covoiturage se fait entre collègues, dans les véhicules personnels des membres, sous leur seule responsabilité. Les membres d\'un groupe peuvent partager les frais réels du trajet (carburant, stationnement) ; le conducteur ne doit tirer aucun profit du trajet. Aucun paiement ne transite par CarpoolWork.',
      ]},
      { title: '4. Responsabilités du conducteur', paragraphs: [
        'Chaque conducteur déclare et garantit détenir un permis de conduire valide, une assurance automobile en vigueur couvrant les passagers et un véhicule en état de circuler, et respecter le Code de la route. CarpoolWork ne vérifie ni l\'identité, ni le permis, ni l\'assurance des membres : le statut de conducteur repose sur la déclaration de chacun. Il appartient à chaque conducteur de confirmer auprès de son assureur que le covoiturage à frais partagés est couvert par sa police.',
      ]},
      { title: '5. Employeurs : abonnement et facturation', paragraphs: [], bullets: [
        'Tarif : 25 $ CAD par participant actif et par mois, avec un minimum de 500 $ CAD par site et par mois, appliqué uniquement les mois où au moins un covoiturage est enregistré sur le site. Un participant actif est un employé ayant enregistré au moins un covoiturage dans le mois.',
        'Essai : les 30 premiers jours suivant la création de l\'espace employeur sont gratuits. Le pilote initial dure 10 semaines sur un site, sans engagement au-delà.',
        'Facturation : mensuelle, à terme échu, par facture payable dans les 30 jours par virement bancaire, Interac ou chèque. Les taxes applicables sont ajoutées lorsque nous y sommes tenus.',
        'Résiliation : à tout moment, par courriel, avec un préavis de 30 jours. Le mois en cours est facturé sur les participants réellement actifs ; aucun remboursement rétroactif.',
        'Ajustement des prix : tout changement de tarif est annoncé au moins 30 jours à l\'avance et ne s\'applique pas aux périodes déjà facturées.',
      ]},
      { title: '6. Utilisation acceptable', paragraphs: [
        'Il est interdit d\'utiliser le service à des fins de transport commercial, de harceler ou de mettre en danger d\'autres membres, d\'enregistrer des covoiturages fictifs, d\'accéder aux données d\'autrui ou de perturber le fonctionnement de la plateforme. Nous pouvons suspendre ou fermer un compte en cas de manquement.',
      ]},
      { title: '7. Limitation de responsabilité', paragraphs: [
        'CarpoolWork fournit un outil de mise en relation et de mesure, sans garantie de résultat (formation de groupes, taux de participation, économies). Dans la mesure permise par la loi, nous ne sommes pas responsables des dommages découlant des trajets eux-mêmes, du comportement des membres, de l\'état des véhicules ou de la couverture d\'assurance de chacun, ni des dommages indirects. Envers un employeur, notre responsabilité totale est limitée aux sommes qu\'il nous a versées au cours des douze mois précédant l\'événement. Rien dans les présentes ne limite une responsabilité qui ne peut l\'être en droit ontarien.',
      ]},
      { title: '8. Propriété intellectuelle et données', paragraphs: [
        'La plateforme, son code et ses contenus appartiennent à CarpoolWork. Les données de participation agrégées peuvent être utilisées sous forme anonyme pour améliorer le service. Le traitement des renseignements personnels est décrit dans la Politique de confidentialité.',
      ]},
      { title: '9. Modifications, droit applicable', paragraphs: [
        'Nous pouvons modifier ces conditions ; les modifications importantes sont annoncées 30 jours à l\'avance. Les présentes sont régies par les lois de l\'Ontario et les lois fédérales du Canada applicables ; les tribunaux de l\'Ontario sont compétents.',
      ]},
      { title: '10. Contact', paragraphs: [`${ENTITY} — ${ADDR_FR} — ${EMAIL}`]},
    ],
  },
  en: {
    title: 'Terms of Use',
    updated: 'Last updated: September 23, 2026',
    intro: `These terms govern the use of CarpoolWork (carpoolwork.ca), a service of ${ENTITY}, ${ADDR_EN} ("CarpoolWork", "we"). By creating an account, you accept them.`,
    sections: [
      { title: '1. The service', paragraphs: [
        'CarpoolWork is an employer-organized, employer-paid home-to-work carpooling platform. It connects coworkers at the same site, lets them form groups of 2 to 4, log their carpools and measure participation. CarpoolWork transports no one, owns no vehicles, collects no payment between coworkers and is not a transportation service.',
      ]},
      { title: '2. Accounts', paragraphs: [
        'The service is intended for adults employed by a participating organization, and for managers of those organizations. You must provide accurate information and keep your password confidential. Linking to an employer may be subject to the employer\'s approval.',
      ]},
      { title: '3. Carpooling and cost-sharing', paragraphs: [
        'Carpooling happens between coworkers, in members\' personal vehicles, under their sole responsibility. Group members may share the actual costs of the trip (fuel, parking); the driver must make no profit from the trip. No payment goes through CarpoolWork.',
      ]},
      { title: '4. Driver responsibilities', paragraphs: [
        'Each driver represents and warrants that they hold a valid driver\'s licence, current auto insurance covering passengers and a roadworthy vehicle, and that they comply with traffic laws. CarpoolWork does not verify members\' identity, licence or insurance: driver status relies on each member\'s declaration. Each driver is responsible for confirming with their insurer that cost-sharing carpooling is covered by their policy.',
      ]},
      { title: '5. Employers: subscription and billing', paragraphs: [], bullets: [
        'Price: CAD $25 per active participant per month, with a minimum of CAD $500 per site per month, applied only in months where at least one carpool is logged at the site. An active participant is an employee who logged at least one carpool in the month.',
        'Trial: the first 30 days after the employer workspace is created are free. The initial pilot runs 10 weeks at one site, with no commitment beyond.',
        'Billing: monthly, in arrears, by invoice payable within 30 days by bank transfer, Interac or cheque. Applicable taxes are added where we are required to charge them.',
        'Cancellation: at any time, by email, with 30 days\' notice. The current month is billed on participants who were actually active; no retroactive refunds.',
        'Price changes: any change is announced at least 30 days in advance and does not apply to periods already billed.',
      ]},
      { title: '6. Acceptable use', paragraphs: [
        'You may not use the service for commercial transportation, harass or endanger other members, log fictitious carpools, access other people\'s data or disrupt the platform. We may suspend or close an account in case of breach.',
      ]},
      { title: '7. Limitation of liability', paragraphs: [
        'CarpoolWork provides a matching and measurement tool, with no guarantee of results (group formation, participation rate, savings). To the extent permitted by law, we are not liable for damages arising from the trips themselves, members\' conduct, vehicle condition or anyone\'s insurance coverage, nor for indirect damages. Toward an employer, our total liability is limited to the amounts it paid us in the twelve months preceding the event. Nothing herein limits liability that cannot be limited under Ontario law.',
      ]},
      { title: '8. Intellectual property and data', paragraphs: [
        'The platform, its code and content belong to CarpoolWork. Aggregate participation data may be used in anonymous form to improve the service. Processing of personal information is described in the Privacy Policy.',
      ]},
      { title: '9. Changes, governing law', paragraphs: [
        'We may change these terms; material changes are announced 30 days in advance. These terms are governed by the laws of Ontario and the applicable federal laws of Canada; the courts of Ontario have jurisdiction.',
      ]},
      { title: '10. Contact', paragraphs: [`${ENTITY} — ${ADDR_EN} — ${EMAIL}`]},
    ],
  },
};
