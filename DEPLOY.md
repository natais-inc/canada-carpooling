# Deploiement Canada Carpooling — Vercel + Neon

## Etape 1 : Creer la base de donnees Neon

1. Va sur https://console.neon.tech et cree un compte
2. Cree un nouveau projet : **canada-carpooling**
3. Region : **US East (Ohio)** (proche de Vercel cle1)
4. Copie les 2 connection strings :
   - **Pooled** (pour l'app) → `DATABASE_URL`
   - **Direct** (pour les migrations) → `DIRECT_DATABASE_URL`

## Etape 2 : Pousser le code sur GitHub

```bash
cd canada-carpooling
git init
git add .
git commit -m "Canada Carpooling MVP v1.0"
git branch -M main
git remote add origin https://github.com/TON_USER/canada-carpooling.git
git push -u origin main
```

## Etape 3 : Deployer sur Vercel

1. Va sur https://vercel.com et connecte ton compte GitHub
2. Clique **Add New Project** → importe `canada-carpooling`
3. Framework Preset : **Next.js** (auto-detecte)
4. **Environment Variables** — ajoute toutes les variables de `.env.example` :

| Variable | Ou la trouver |
|----------|---------------|
| `DATABASE_URL` | Neon → Connection Details → Pooled |
| `DIRECT_DATABASE_URL` | Neon → Connection Details → Direct |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks |
| `DATA_ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATA_HASH_SALT` | `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` |
| `CRON_SECRET` | `openssl rand -base64 32` |

5. Clique **Deploy**

## Etape 4 : Initialiser la base de donnees

Apres le premier deploiement, la commande `vercel-build` execute automatiquement :
```
prisma generate && prisma db push && next build
```

Cela cree toutes les tables dans Neon.

## Etape 5 : Configurer les services externes

### Google OAuth
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth Client ID → Web Application
3. Authorized redirect URIs : `https://ton-domaine.vercel.app/api/auth/callback/google`

### Stripe
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint : `https://ton-domaine.vercel.app/api/webhooks/stripe`
3. Events : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### Domaine personnalise (optionnel)
1. Vercel → Project Settings → Domains
2. Ajoute `canadacarpooling.ca`
3. Configure les DNS chez ton registrar

## Commandes utiles

```bash
# Voir les logs en temps reel
vercel logs --follow

# Deployer en preview (sans toucher la production)
vercel

# Deployer en production
vercel --prod

# Executer une commande sur la DB distante
npx prisma studio
```

## Couts estimes

| Service | Free Tier | Pro |
|---------|-----------|-----|
| Vercel | 100 GB bandwidth, 100h compute | 20 $/mois |
| Neon | 0.5 GB storage, 1 compute | 19 $/mois |
| Stripe | 0 $/mois fixe | 2.9% + 0.30 $ par transaction |
| **Total** | **0 $/mois** | **~39 $/mois + frais Stripe** |
