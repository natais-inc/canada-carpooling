# Analyse Concurrentielle - Canada Carpooling

## Synthèse des recherches (Amigo Express vs Poparide)

### FORCES À COMBINER

| Poparide | Amigo Express | Canada Carpooling |
|----------|---------------|-------------------|
| App moderne, UX acceptable | 20 ans d'expérience, marque de confiance | UX moderne + fiabilité éprouvée |
| Vérification biométrique permis | Vérification permis + évaluation membres | Vérification complète (ID + permis + selfie biométrique) |
| Paiement Stripe sécurisé | Frais fixes prévisibles (5.50$) | Paiement Stripe + frais transparents (~15% commission) |
| Système d'avis après trajet | Service client 7j/7 par téléphone | Avis + chat support in-app + téléphone |
| Détection fraude algorithmique | Refus membres sous les standards | IA anti-fraude + politique stricte |

### PROBLÈMES À RÉSOUDRE (plaintes principales)

| Problème | Fréquence | Notre solution |
|----------|-----------|----------------|
| Conducteurs qui annulent à la dernière minute | Très fréquent | Politique d'annulation stricte + pénalités financières |
| Passagers no-show sans compensation | Fréquent | Frais de no-show automatique (50% du prix) |
| Impossible de communiquer avant réservation | Fréquent (Poparide) | Chat disponible AVANT et APRÈS réservation |
| App buggy, crashs fréquents (Amigo) | Très fréquent | Stack moderne Next.js, tests rigoureux |
| Pas de notifications (Amigo) | Fréquent | Push notifications temps réel |
| Remboursements difficiles | Fréquent | Politique de remboursement claire + automatique |
| Conducteurs qui contactent hors-app (arnaques) | Fréquent | Communication uniquement in-app, détection liens suspects |
| Frais trop élevés (20% Poparide) | Modéré | Commission réduite à 15% |
| Conduite dangereuse signalée | Modéré | Bouton SOS + suivi GPS optionnel + signalement rapide |
| Comptes suspendus sans explication | Modéré | Processus d'appel transparent + notifications détaillées |

### DÉSIRS UTILISATEURS (tirés des avis positifs)

1. **Fiabilité** : savoir que le conducteur sera là
2. **Économies** : réduire les coûts de 50%+ vs bus/train
3. **Sécurité** : se sentir en sécurité avec des inconnus
4. **Simplicité** : réserver en 3 clics max
5. **Communication** : pouvoir échanger facilement
6. **Flexibilité** : points de départ/arrivée flexibles
7. **Transparence** : savoir exactement combien on paie/reçoit

## MODÈLE ÉCONOMIQUE

- Commission de 15% sur chaque réservation (payée par le passager)
- Frais de traitement bancaire 3% (prélevé sur le payout conducteur)
- Commission effective totale : ~18% (vs 23% Poparide, vs fixe 5.50$ Amigo)
- Avantage compétitif : moins cher que Poparide, plus flexible qu'Amigo

## STACK TECHNIQUE

- **Frontend**: Next.js 14 + React + Tailwind CSS + next-intl (i18n)
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de données**: PostgreSQL
- **Auth**: NextAuth.js (email + Google + Apple)
- **Paiement**: Stripe Connect (marketplace)
- **Chat**: WebSocket (Socket.io)
- **Notifications**: Push API + email
- **Hébergement**: Vercel + Supabase (PostgreSQL)
- **Maps**: Google Maps / Mapbox

