# Document d'exigences

## 1. Aperçu de l'application

### 1.1 Nom de l'application
Site web SCA (Société du Courant Alternatif)

### 1.2 Description
Plateforme e-commerce et gestion de services électriques pour SCA, entreprise spécialisée en électricité générale, solutions solaires et matériel électrique basée à Haut-Katanga, RDC.

**Slogan** : Électricité générale • Solutions solaires • Matériel électrique

**Devise** : Votre partenaire en électricité et solutions solaires. Disponibilité • Qualité • Accessibilité

**Logo** : https://miaoda-conversation-file.s3cdn.medo.dev/user-ehup8m9cd98g/app-ehusx188iha9/20260918/logo.jpeg

**Coordonnées** :
- Téléphones : 085 865 74 75 / 097 528 31 55
- Localisation : Haut-Katanga, RDC
- WhatsApp, Email professionnel

## 2. Utilisateurs et scénarios d'utilisation

### 2.1 Utilisateurs cibles
- **Clients particuliers** : achat de matériel électrique et solaire, demande de services
- **Clients professionnels** : commandes en volume, demandes de devis
- **Administrateurs SCA** : gestion des produits, commandes, stock, devis

### 2.2 Scénarios principaux
- Achat de matériel électrique ou solaire en ligne
- Demande de services d'installation ou dépannage
- Demande de devis pour projets spécifiques
- Gestion administrative des ventes et du stock

## 3. Structure des pages et fonctionnalités

### 3.1 Arborescence des pages

```
├── Page d'accueil
├── Catalogue des matériels (Boutique)
│   ├── Catégories Électricité
│   └── Catégories Solaire
├── Fiche produit
├── Panier
├── Commande
├── Nos services
├── Demande de devis
├── Contact et localisation
├── Conseil/Étude
└── Espace administrateur
    ├── Dashboard
    ├── Gestion des produits
    ├── Gestion du stock
    ├── Liste des commandes
    ├── Liste des devis
    ├── Liste des clients
    └── Statistiques
```

### 3.2 Page d'accueil

**Éléments principaux** :
- Hero section avec slogan « Votre partenaire en électricité et solutions solaires. Disponibilité • Qualité • Accessibilité »
- Deux boutons CTA : « Voir nos produits » et « Demander un service »
- Section témoignages/avis clients avec notation par étoiles
- Section contact avec WhatsApp, téléphone, email, adresse

**Fonctionnalités** :
- Affichage du logo SCA
- Navigation vers le catalogue ou la page de demande de service
- Affichage des avis clients
- Accès rapide aux coordonnées

### 3.3 Catalogue des matériels (Boutique)

**Catégories Électricité** :
- Câbles
- Disjoncteurs
- Interrupteurs
- Prises
- Ampoules
- Tableaux électriques
- Contacteurs
- Relais
- Gaines
- Connecteurs

**Catégories Solaire** :
- Panneaux
- Batteries
- Onduleurs
- MPPT
- Câbles solaires
- Protections DC/AC
- Connecteurs MC4
- Structures de panneaux

**Fonctionnalités** :
- Affichage des produits par catégorie
- Filtrage par catégorie
- Accès à la fiche produit

### 3.4 Fiche produit

**Informations affichées** :
- Photo du produit
- Nom du produit
- Prix en dollars ($)
- État du stock : disponible / faible / rupture
- Référence produit (ex: SCA-DIS20)
- Bouton « Ajouter au panier »

**Fonctionnalités** :
- Ajout du produit au panier
- Sélection de la quantité

### 3.5 Panier

**Informations affichées** :
- Liste des articles sélectionnés avec quantités
- Calcul automatique : sous-total, frais de livraison, total
- Choix entre livraison ou retrait en magasin
- Bouton « Commander »

**Fonctionnalités** :
- Modification des quantités
- Suppression d'articles
- Sélection du mode de récupération
- Validation de la commande

### 3.6 Commande

**Informations requises** :
- Nom du client
- Téléphone
- Adresse (si livraison)
- Mode de récupération (livraison/retrait)

**Fonctionnalités** :
- Enregistrement de la commande
- Génération automatique de facture PDF
- Décrément automatique du stock

### 3.7 Facturation PDF

**Contenu de la facture** :
- Numéro de facture (ex: FAC-2026-001)
- Date d'émission
- Informations client
- Tableau des produits : nom, quantité, prix unitaire, total
- Sous-total, livraison, total général

**Fonctionnalités** :
- Génération automatique au moment de la commande
- Téléchargement PDF
- Impression

### 3.8 Nos services

**Services électriques** :
- Installation
- Dépannage
- Branchement
- Rénovation
- Recherche de panne
- Maintenance
- Tableau électrique
- Éclairage

**Solutions solaires** :
- Étude
- Dimensionnement
- Installation
- Maintenance
- Dépannage
- Panneaux
- Batteries
- Onduleurs

**Fonctionnalités** :
- Présentation des services
- Bouton de demande de service

### 3.9 Demande de devis

**Formulaire** :
- Nom
- Téléphone
- Type de projet
- Description du projet
- Adresse/zone
- Photos du projet (upload)

**Fonctionnalités** :
- Envoi de la demande à SCA
- Stockage de la demande en base de données

### 3.10 Contact et localisation

**Informations affichées** :
- Adresse : Haut-Katanga, RDC
- Téléphones : 085 865 74 75 / 097 528 31 55
- WhatsApp
- Email professionnel
- Section carte/localisation

**Fonctionnalités** :
- Affichage des coordonnées
- Liens directs WhatsApp, téléphone, email

### 3.11 Conseil/Étude

**Fonctionnalités** :
- Option « Je ne sais pas quoi acheter »
- Formulaire pour décrire le besoin (ex: « Je veux alimenter une pompe de 1,5 HP avec du solaire »)
- Envoi de la demande d'étude à SCA

### 3.12 Espace administrateur

**Authentification** :
- Connexion par email et mot de passe

#### 3.12.1 Dashboard

**Statistiques affichées** :
- Ventes du jour
- État du stock
- Nombre de factures
- Nombre de devis
- Nombre de clients
- Nombre de commandes
- Nombre d'interventions

**Fonctionnalités** :
- Affichage des statistiques en temps réel
- Visualisations graphiques

#### 3.12.2 Gestion des produits

**Fonctionnalités** :
- Ajout de produit (nom, catégorie, prix, stock, référence, photo)
- Modification de produit
- Suppression de produit
- Liste de tous les produits

#### 3.12.3 Gestion du stock

**Indicateurs** :
- Produits total
- En stock (vert)
- Stock faible (orange)
- Rupture (rouge)

**Fonctionnalités** :
- Affichage de l'état du stock par produit
- Alertes pour stock faible ou rupture
- Décrément automatique lors d'un achat

#### 3.12.4 Liste des commandes

**Informations affichées** :
- Numéro de commande
- Date
- Client
- Montant total
- Statut

**Fonctionnalités** :
- Consultation des détails de commande
- Modification du statut

#### 3.12.5 Liste des devis

**Informations affichées** :
- Numéro de devis
- Date
- Client
- Type de projet
- Statut

**Fonctionnalités** :
- Consultation des détails de devis
- Modification du statut

#### 3.12.6 Liste des clients

**Informations affichées** :
- Nom
- Téléphone
- Email
- Nombre de commandes

**Fonctionnalités** :
- Consultation des informations client
- Historique des commandes

#### 3.12.7 Statistiques

**Fonctionnalités** :
- Visualisations graphiques des ventes
- Statistiques par période
- Produits les plus vendus

### 3.13 PWA (Progressive Web App)

**Fonctionnalités** :
- Installation sur mobile comme application native
- Manifest.json avec icône SCA
- Service Worker pour fonctionnement hors-ligne partiel

## 4. Règles métier et logique

### 4.1 Gestion du stock
- Le stock est décrémenté automatiquement lors de la validation d'une commande
- Les états du stock sont définis selon les seuils :
  - En stock : quantité > seuil défini
  - Stock faible : quantité ≤ seuil et > 0
  - Rupture : quantité = 0

### 4.2 Calcul du total de commande
- Sous-total = somme (prix unitaire × quantité) pour tous les articles
- Total = sous-total + frais de livraison
- Frais de livraison = 0 si retrait en magasin

### 4.3 Génération de facture
- Numéro de facture généré automatiquement au format FAC-YYYY-NNN (ex: FAC-2026-001)
- La facture est créée immédiatement après validation de la commande

### 4.4 Authentification administrateur
- Accès à l'espace administrateur protégé par email et mot de passe
- Seuls les administrateurs authentifiés peuvent accéder au dashboard et aux fonctions de gestion

### 4.5 Stockage des données
- Toutes les commandes, devis, demandes de conseil sont stockés en base de données
- Les photos uploadées dans les formulaires sont stockées

## 5. Exceptions et cas limites

| Situation | Comportement attendu |
|-----------|---------------------|
| Produit en rupture de stock | Bouton « Ajouter au panier » désactivé, affichage « Rupture » |
| Stock insuffisant pour la quantité demandée | Message d'erreur, limitation à la quantité disponible |
| Panier vide lors de la commande | Bouton « Commander » désactivé |
| Formulaire incomplet | Message d'erreur, champs obligatoires indiqués |
| Échec d'upload de photo | Message d'erreur, possibilité de réessayer |
| Connexion administrateur échouée | Message d'erreur, possibilité de réessayer |
| Génération de facture échouée | Message d'erreur, possibilité de régénérer |

## 6. Critères d'acceptation

1. L'utilisateur accède à la page d'accueil et clique sur « Voir nos produits »
2. L'utilisateur parcourt le catalogue, sélectionne un produit et l'ajoute au panier
3. L'utilisateur accède au panier, vérifie les articles et clique sur « Commander »
4. L'utilisateur remplit les informations de commande et valide
5. Le système génère automatiquement une facture PDF téléchargeable
6. Le stock du produit commandé est automatiquement décrémenté
7. L'administrateur se connecte à l'espace admin et consulte la nouvelle commande dans le dashboard

## 7. Fonctionnalités non implémentées dans cette version

- Paiement en ligne intégré
- Suivi de livraison en temps réel
- Programme de fidélité
- Système de notation des services
- Chat en direct avec support client
- Application mobile native iOS/Android
- Gestion multi-devises
- Système de promotions et codes promo
- Historique des commandes pour clients non authentifiés
- Notifications push
- Système de réservation de produits
- Comparateur de produits
- Liste de souhaits
- Système de parrainage