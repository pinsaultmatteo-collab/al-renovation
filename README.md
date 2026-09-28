# AL Rénov — site vitrine d'Antoine Louviot (artisan rénovation, Toulouse)

Site statique one-page, sans framework ni build : `index.html` + `css/styles.css` + `js/main.js`.
Déployable tel quel sur n'importe quel hébergeur statique (OVH mutualisé, Netlify, Vercel, Cloudflare Pages…).

## Structure

```
index.html            page principale (SEO, JSON-LD, sections)
mentions-legales.html mentions légales + RGPD (noindex)
css/styles.css        design system, héros, cartes métiers, réalisations horizontales, frise, avis, responsive, reduced-motion
js/main.js            GSAP + ScrollTrigger + Lenis : intro du héros (plan qui se dessine), avant/après, scroll horizontal des réalisations, frise, carrousel d'avis, formulaire
assets/               logo.svg, favicon.svg, icônes PNG, og-image.jpg
robots.txt, sitemap.xml, site.webmanifest
```

Librairies chargées depuis CDN (defer) : GSAP 3.12.5, ScrollTrigger, Lenis 1.1.18. Polices Google : Anton (titres, capitales) + Barlow (texte).

## À compléter avant mise en ligne (chercher `TODO` ou les valeurs ci-dessous)

| Élément | Où | Valeur actuelle (placeholder) |
|---|---|---|
| Numéro de téléphone | `index.html` (x4), `mentions-legales.html`, JSON-LD `telephone` | `06 00 00 00 00` / `+33600000000` |
| E-mail | `index.html`, `mentions-legales.html`, `js/main.js` (fallback mailto) | `contact@al-renov.fr` |
| Nom de domaine | `canonical`, `og:url`, JSON-LD, `sitemap.xml`, `robots.txt` | `https://www.al-renov.fr/` |
| Backend du formulaire | `<form action="https://formspree.io/f/VOTRE_ID">` | tant que `VOTRE_ID` est présent, le JS bascule sur un `mailto:` pré-rempli |
| Hébergeur | `mentions-legales.html` | à renseigner |
| Photos de chantiers | toutes les `<img>` (Unsplash = temporaire) : fond du héros `.hero__bg`, cartes métiers `.job__media`, réalisations `.work` | remplacer par les vraies photos d'Antoine (idéalement WebP, 1600 px max, `width`/`height` renseignés) |
| Avant / après (héros) | bloc `.ba` : `ba__after` = photo après, `ba__before img` = photo avant | actuellement la même photo filtrée en CSS ; retirer le filtre `.ba__before img` une fois la vraie photo « avant » en place |
| Projets (6 cartes `.work`) | titres, descriptions, tags, photos | exemples génériques à remplacer par de vrais chantiers |
| Avis clients (5 slides `.review`) | section `.reviews` | slide 1 = citation de Mattéo P. à valider ; slides 2 à 5 = gabarits marqués « Avis à insérer », à remplacer par de vrais avis Google mot pour mot (jamais d'avis inventés) |
| Chiffres clés | `.hero__stats` | 2019, 1 interlocuteur, 48 h, 30 km |
| Lien « PMC Marketing » | footer | `href="#"` |

Points à confirmer avec Antoine : engagements affichés (délais tenus, prix ferme, réponse sous 48 h), rayon d'intervention (30 km), liste des communes, assurances (décennale / RC Pro : non mentionnées volontairement tant que ce n'est pas confirmé — à ajouter dans la FAQ et le footer si oui).

## Développement

```
python3 -m http.server 5173
```
puis ouvrir http://localhost:5173/.

## Déploiement

- Hébergé sur Vercel (projet `al-renovation`, compte pinsaultmatteo-collab), connecté au dépôt GitHub `pinsaultmatteo-collab/al-renovation` : chaque push sur `main` redéploie la production automatiquement.
- URL de production : https://al-renovation-delta.vercel.app (le sous-domaine `al-renovation.vercel.app` est déjà pris par une autre société).
- `vercel.json` : URLs propres (`/mentions-legales` sans `.html`), en-têtes de sécurité, cache long sur `css/`, `js/`, `assets/`.
- Protection des déploiements réglée sur « previews uniquement » pour que la production soit publique ; modifiable dans Vercel → Settings → Deployment Protection.
- Quand le domaine définitif est acheté : l'ajouter dans Vercel → Settings → Domains, puis remplacer `https://www.al-renov.fr` dans `index.html` (canonical, Open Graph, JSON-LD), `mentions-legales.html`, `sitemap.xml` et `robots.txt`.

## SEO déjà en place

- Title / meta description optimisés « artisan rénovation Toulouse », canonical, Open Graph, Twitter card, theme-color, manifest.
- JSON-LD : `HomeAndConstructionBusiness` (adresse, SIRET, TVA, zone desservie, catalogue de services), `WebSite`, `WebPage`, `FAQPage`.
- Un seul `h1` (mot-clé + accroche), hiérarchie h2/h3 propre, `alt` sur toutes les images, `loading="lazy"` + dimensions déclarées.
- `robots.txt`, `sitemap.xml`, page mentions légales en `noindex`.
- Mobile : viewport, `100svh`, cibles tactiles ≥ 44 px, pas de défilement horizontal, `prefers-reduced-motion` respecté, curseur custom uniquement sur pointeur fin.
