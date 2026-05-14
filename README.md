# Application tournoi hackathon

[Rapport de documentation complet](./Hackathon_MaximeBourret_AlexandrineDube.pdf)

Application web pour découvrir des tournois, gérer des équipes et des matchs, et traiter les demandes d’adhésion payantes. Les organisateurs créent des tournois et des effectifs ; les joueurs complètent un profil, demandent à rejoindre une équipe et paient les frais d’inscription via Stripe lorsque c’est nécessaire. Les utilisateurs et les rôles sont synchronisés depuis Clerk vers PostgreSQL (Neon) avec Prisma.

## Technologies utilisées

- **Framework :** [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript
- **Authentification :** [Clerk](https://clerk.com/) (`@clerk/nextjs`)
- **Base de données :** [PostgreSQL](https://www.postgresql.org/) sur [Neon](https://neon.tech/) via `@neondatabase/serverless` et `@prisma/adapter-neon`
- **ORM :** [Prisma](https://www.prisma.io/) 7
- **Paiements :** [Stripe](https://stripe.com/) Checkout et webhooks (SDK `stripe`)
- **Validation :** [Zod](https://zod.dev/) 4
- **Interface :** Tailwind CSS 4, Base UI, icônes Lucide

## Prérequis

- **Node.js** version 20 ou supérieure
- Un projet **[Neon](https://neon.tech/)** et l’URL de connexion à la base
- Une application **[Clerk](https://clerk.com/)** : clés API, webhook (voir plus bas), et **personnalisation du jeton de session** pour exposer les métadonnées publiques (`role`) dans les claims (voir [Configuration Clerk](#configuration-clerk)).
- Un compte **[Stripe](https://stripe.com/)** (utiliser le **mode test** en développement local) : clé secrète et secret de signature du webhook

## Installation pas à pas

1. Cloner le dépôt et installer les dépendances :

   ```bash
   npm install
   ```

2. Créer un fichier `.env` à la racine du projet (voir [Variables d’environnement](#variables-denvironnement)).

3. Appliquer les migrations Prisma :

   ```bash
   npx prisma migrate dev
   ```

4. (Facultatif) Charger les données de référence (catalogue des sports) :

   ```bash
   npm run seed
   ```

5. Lancer le serveur de développement :

   ```bash
   npm run dev
   ```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d’environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | Chaîne de connexion PostgreSQL Neon (utilisée par Prisma). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Oui | Clé publique Clerk (navigateur). |
| `CLERK_SECRET_KEY` | Oui | Clé secrète Clerk (serveur). |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Oui pour les webhooks | Secret de signature du webhook Clerk (`verifyWebhook` l’utilise si aucun secret personnalisé n’est fourni). |
| `STRIPE_SECRET_KEY` | Oui pour les frais payants | Clé secrète API Stripe (clé de test en développement). |
| `STRIPE_WEBHOOK_SECRET` | Oui pour finaliser les paiements | Secret de signature des webhooks Stripe (route `checkout`). |
| `NEXT_PUBLIC_APP_URL` | Recommandé | URL publique du site (ex. `http://localhost:3000`). Sert pour les `success_url` / `cancel_url` de Stripe Checkout. |
| `VERCEL_URL` | Facultatif | Sur Vercel, URL de secours si `NEXT_PUBLIC_APP_URL` est absent (voir `src/lib/public-app-url.ts`). |

## Commandes utiles

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` / `npm run start` | Build et serveur de production |
| `npm run lint` | ESLint |
| `npm run seed` | Exécute `prisma/seed.ts` (charge `--env-file=.env`) |
| `npx prisma migrate dev` | Créer / appliquer les migrations en développement |
| `npx prisma migrate deploy` | Appliquer les migrations (CI / production) |
| `npx prisma studio` | Ouvrir Prisma Studio sur la base |
| `npx prisma generate` | Régénérer le client Prisma dans `src/generated/prisma` |

## Configuration Clerk

### Jeton de session `__session` (claims)

Le middleware (`src/proxy.ts`) utilise `sessionClaims.metadata.role` pour savoir si l’utilisateur a déjà choisi un rôle et pour rediriger vers `/role-selection` le cas échéant. Sans cette étape dans Clerk, `metadata` n’apparaît pas dans le jeton et le flux de rôles ne fonctionne pas correctement.

1. Ouvrez le **[tableau de bord Clerk](https://dashboard.clerk.com/)** → votre application → **Configure** → **Sessions** (intitulés pouvant varier légèrement selon la version du tableau de bord).
2. Trouvez la personnalisation du jeton de session dont le **nom** est **`__session`** (jeton de session par défaut).
3. Dans la section **Claims**, ajoutez un JSON qui mappe les métadonnées publiques Clerk vers une claim `metadata` :

   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```

4. Enregistrez la configuration.

Les valeurs définies dans `publicMetadata` côté Clerk (par exemple `role` après `saveRole`) sont alors disponibles dans la session sous `sessionClaims.metadata`. Le typage attendu côté projet est décrit dans `src/types/global.d.ts` (`CustomJwtSessionClaims`).

---

## Server Actions et routes API

Les Server Actions consomment du `FormData` issu de formulaires HTML. En cas de succès, elles utilisent souvent `redirect()` ; en cas d’échec, elles renvoient un **objet d’état** avec `fieldErrors`, `formError`, et parfois `values` pour réafficher le formulaire.

### Server Actions (entrées / sorties)

| Emplacement | Fonction | Auth | Entrée | Sortie / effets |
|-------------|----------|------|--------|------------------|
| `src/server/actions/users.ts` | `saveRole(role)` | Connecté | `role` : `PLAYER` \| `ORGANIZER` \| `ADMIN` | Met à jour `publicMetadata.role` dans Clerk. Lève une erreur si non authentifié. |
| `src/server/actions/users.ts` | `updatePlayerProfile(previousState, formData)` | `PLAYER` (ou `ADMIN`) | Champs : `firstName`, `lastName`, `city`, `favoriteSportId`, `level`, `position` | `UpdatePlayerProfileActionState` : erreurs de validation ou objet vide si succès ; met à jour `User` + `PlayerProfile`. |
| `src/app/dashboard/tournaments/actions.ts` | `createTournament` | Organisateur | `name`, `sport`, `city`, `startDate`, `entryFee`, `currency` | Valide ; crée le tournoi ; redirection vers `/dashboard/tournaments`. |
| `src/app/dashboard/tournaments/actions.ts` | `updateTournament(tournamentId, …)` | Organisateur / admin pour les tournois des autres | Mêmes champs que la création | Valide ; met à jour ; redirection ou état d’erreur d’accès. |
| `src/app/dashboard/tournaments/actions.ts` | `deleteTournament(tournamentId, …)` | Organisateur / admin | Identifiant via route ou formulaire | Supprime ; redirection ou `formError`. |
| `src/app/dashboard/tournaments/[id]/teams/actions.ts` | `createTeam(tournamentId, …)` | Organisateur | `name`, `maxCapacity` | Crée l’équipe ; redirection vers la liste ou erreurs. |
| `src/app/dashboard/tournaments/[id]/teams/actions.ts` | `updateTeam(tournamentId, teamId, …)` | Organisateur | `name`, `maxCapacity` | Valide la capacité par rapport à l’effectif ; redirection ou erreurs. |
| `src/app/dashboard/tournaments/[id]/teams/actions.ts` | `deleteTeam(tournamentId, teamId, …)` | Organisateur | *Sans champ dédié* | Échoue si l’équipe a des membres ; sinon suppression et redirection. |
| `src/app/dashboard/tournaments/[id]/matches/actions.ts` | `createMatch(tournamentId, …)` | Organisateur | `teamAId`, `teamBId`, `date`, `location` | Vérifie que les équipes appartiennent au tournoi ; crée le match ; redirection. |
| `src/app/dashboard/tournaments/[id]/matches/actions.ts` | `updateMatch(tournamentId, matchId, …)` | Organisateur | Idem + `scoreA`, `scoreB` facultatifs | Met à jour le match ; redirection ou erreurs. |
| `src/app/dashboard/tournaments/[id]/matches/actions.ts` | `deleteMatch(tournamentId, matchId, …)` | Organisateur | *Sans champ dédié* | Supprime le match ; redirection ou erreurs. |
| `src/app/dashboard/requests/actions.ts` | `acceptJoinRequest(formData)` | Organisateur | `joinRequestId` | Transaction : accepte une demande en attente, vérifie paiement / capacité ; en échec redirection avec `?error=<code>` (voir ci-dessous). Succès : `?success=accepted`. |
| `src/app/dashboard/requests/actions.ts` | `rejectJoinRequest(formData)` | Organisateur | `joinRequestId` | Passe le statut à `REJECTED` ; redirection avec `success=rejected` ou paramètre d’erreur. |
| `src/app/tournaments/[id]/teams/[teamId]/actions.ts` | `createJoinRequest(tournamentId, teamId, …)` | Connecté | `message` (facultatif après validation) | Crée ou met à jour `JoinRequest` ; tournois gratuits : état de succès ; tournois payants : Stripe Checkout puis `redirect(session.url)`. |
| `src/app/tournaments/[id]/teams/[teamId]/actions.ts` | `cancelJoinRequest(formData)` | Connecté | `joinRequestId` | Supprime la demande en attente de l’utilisateur courant ; redirection vers `/my-requests`. |

### Schémas Zod

Définis dans `src/lib/validations/` :

| Schéma | Fichier | Forme (résumé) |
|--------|---------|----------------|
| `playerProfileUpdateSchema` | `player-profile.ts` | `firstName`, `lastName`, `city` : chaîne trimée 1 à 120 caractères ; `favoriteSportId` : chaîne non vide ; `level` : énumération Prisma `Level` ; `position` : chaîne trimée facultative ≤ 120 caractères. |
| `tournamentCreateSchema` / `tournamentUpdateSchema` | `tournament.ts` | `name`, `sport`, `city` : 1 à 120 caractères ; `startDate` : chaîne date → `Date` (minuit local) ; `entryFee` : entier ≥ 0 ; `currency` : 3 lettres majuscules (défaut `CAD`). |
| `teamCreateSchema` / `teamUpdateSchema` | `team.ts` | `name` : 1 à 120 caractères ; `maxCapacity` : entier de 1 à 200. |
| `joinRequestFormSchema` | `join-request.ts` | `message` : facultatif, trimé, ≤ 500 caractères (chaîne vide → `undefined`). |
| `matchCreateSchema` | `match.ts` | `teamAId`, `teamBId` : non vides et distincts ; `date` : chaîne datetime → `Date` ; `location` : 1 à 200 caractères. |
| `matchUpdateSchema` | `match.ts` | Comme la création plus `scoreA` / `scoreB` facultatifs (vide → `null`, sinon entier ≥ 0). |

### Codes d’erreur et messages

**Flux organisateur** (`acceptJoinRequest`) : en échec, redirection vers `/dashboard/requests?error=<code>` :

| Paramètre `error` | Signification |
|-------------------|---------------|
| `missing_id` | Pas de `joinRequestId` dans le formulaire. |
| `not_found` | Demande d’adhésion inexistante. |
| `forbidden` | L’organisateur ne possède pas ce tournoi (hors admin). |
| `not_pending` | La demande n’est pas `PENDING`. |
| `payment_pending` | Tournoi avec frais mais paiement différent de `PAID`. |
| `team_full` | Équipe au complet (`maxCapacity`). |

**Refus :** `reject_invalid` si la demande ne peut pas être refusée (introuvable / pas en attente / non autorisé).

**Demande joueur, chaînes `formError` (exemples) :** équipe introuvable, déjà dans l’équipe, équipe pleine, demande en double en attente, déjà acceptée, échec du checkout.

**`saveRole` :** lève `Error('Not authenticated')` sans session Clerk.

**Routes HTTP (webhooks) :**

| Route | Statut | Corps / remarques |
|-------|--------|-------------------|
| `POST /api/webhooks/clerk` | `200` | `"Webhook processed"` |
| `POST /api/webhooks/clerk` | `400` | `"Invalid webhook"` si la vérification échoue |
| `POST /api/webhooks/checkout` | `400` | JSON `{ "error": "Missing stripe-signature" }` ou signature invalide |
| `POST /api/webhooks/checkout` | `500` | JSON `{ "error": "Misconfigured server" }` si `STRIPE_WEBHOOK_SECRET` est absent |
| `POST /api/webhooks/checkout` | `200` | JSON `{ "received": true }` pour les événements ignorés ou traités |

### Configuration des webhooks

#### Clerk (`POST /api/webhooks/clerk`)

**En production ou préproduction**, créez un endpoint dont l’URL ressemble à `https://<votre-domaine>/api/webhooks/clerk`, abonnez-vous aux événements **user.created**, **user.updated** et **user.deleted**, puis placez le secret de signature dans `CLERK_WEBHOOK_SIGNING_SECRET`.

**Tester en local avec [ngrok](https://ngrok.com/)**

1. **Installer ngrok** (voir la [documentation officielle](https://ngrok.com/docs/getting-started/)) et, une fois pour toutes, enregistrer votre jeton :  
   `ngrok config add-authtoken <VOTRE_TOKEN>` (compte ngrok gratuit ou payant).

2. **Lancer l’application** sur le port utilisé par Next.js (souvent 3000) :  
   `npm run dev`

3. **Dans un autre terminal**, exposer ce port :  
   `ngrok http http://localhost:3000`  
   ngrok affiche une ligne **Forwarding** du type `https://abcd-12-34-56-78.ngrok-free.app` (le sous-domaine change à chaque session sur l’offre gratuite, sauf si vous utilisez un domaine réservé).

4. **Dans le tableau de bord Clerk** (Developers → Webhooks → Add endpoint), définir l’URL complète du webhook :  
   `https://<sous-domaine-ngrok>/api/webhooks/clerk`  
   Exemple : `https://abcd-12-34-56-78.ngrok-free.app/api/webhooks/clerk`.

5. **S’abonner** au minimum aux événements **user.created**, **user.updated** et **user.deleted**.

6. **Copier le signing secret** affiché par Clerk pour cet endpoint et le mettre dans votre `.env` local :  
   `CLERK_WEBHOOK_SIGNING_SECRET=whsec_...`

7. **Redémarrer** `npm run dev` si le serveur était déjà démarré sans cette variable, puis **déclencher un événement** (création ou mise à jour d’un utilisateur de test) pour vérifier dans les logs Next.js et dans Clerk (onglet des tentatives de livraison du webhook) que les requêtes arrivent bien.

Remarques :

- Tant que ngrok tourne, l’URL HTTPS publique pointe vers votre machine ; si vous arrêtez ngrok ou changez de sous-domaine, mettez à jour l’URL dans Clerk et gardez le bon secret associé à l’endpoint.
- La page d’avertissement « Visit Site » du tunnel gratuit ngrok concerne surtout les navigateurs ; les envois HTTP depuis Clerk vers votre route API passent en général sans cette étape.

Comportement :

- **user.created :** upsert de l’utilisateur applicatif avec `public_metadata.role` facultatif (`PLAYER` \| `ORGANIZER` \| `ADMIN`).
- **user.updated :** upsert et synchro email, nom et rôle lorsqu’ils sont présents.
- **user.deleted :** suppression de la ligne utilisateur (sans erreur si déjà supprimé).

#### Stripe (`POST /api/webhooks/checkout`)

1. Dans le tableau de Stripe (mode test), ajouter une URL d’endpoint : `https://<votre-domaine>/api/webhooks/checkout`.
2. Sélectionner l’événement **checkout.session.completed** (les autres types renvoient `{ received: true }` sans modifier les données).
3. Copier le **secret de signature** de l’endpoint dans `STRIPE_WEBHOOK_SECRET`.

Comportement :

- Vérifie la signature avec le corps brut de la requête.
- Sur `checkout.session.completed`, lit `metadata.joinRequestId`, charge la demande et le tournoi, contrôle montant et devise par rapport aux frais d’inscription ; si le paiement est encore `PENDING`, passe `paymentStatus` à `PAID` et renseigne `paidAt`.
- Revalide les chemins de cache Next.js concernés (tournois, demandes).

**Tests Stripe en local :** utiliser la CLI Stripe pour relayer les événements :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/checkout
```

Utiliser le secret de webhook affiché par la CLI comme `STRIPE_WEBHOOK_SECRET` pendant l’écoute.
