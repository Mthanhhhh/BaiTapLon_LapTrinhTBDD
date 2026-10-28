# E-Shop frontend preview

## Current revision: user's video and shopping reference

The user supplied a 12.47-second MP4 and a shopping-app screenshot. Six frames were extracted at two-second intervals and inspected. The video shows a smoothly moving, softly blended cyan/mint/pink/lilac color field, not distinct SVG wave contours. The backdrop now follows that interpretation on both web (translated gradient field and breathing color overlay) and native (Expo LinearGradient with native-driver transforms). These are approximate colors from a filmed screen, not a calibrated color match.

Categories are now 52px circular icon controls with the text below, retaining their existing category IDs and navigation. Selecting a category clears the previous search keyword. Merchandising uses the existing real data: raspberry price emphasis, readable discount badges, calculated money saved, and actual sold counts on the featured product. The price-highlights entry uses the existing backend discount sort. No fake countdown, scarcity, livestream or campaign promise was introduced.

Validation: TypeScript and production web export passed. Source visual lint passes with two documented inline exceptions for the exact gradient requested by the user. Production inspection at 1440/768/390 reports 0 failures with allowances for the requested gradients, icon circles, palette and card elevation, plus Expo font-weight naming. Screenshots and measurements: `.taste-skill/video-reference/`. Browser checks confirm category navigation, displayed saving amounts and the price-highlights action. Both gradient animations were observed running; the older SVG wave elements are absent. No native device run was performed.

Visual self-assessment: design 7.8, usability 7.9, creativity 7.2, content 7.5; weighted 7.7/10. The first phone screen prioritizes the featured product and category discovery; the product feed continues below. Metadata remains compact. Historical directions and measurements below describe earlier revisions.

## Previous revision: pastel cards and continuous waves

The user requested restoring a dominant pastel color, visible borders and elevation on cards, and continuous background waves. These explicit preferences supersede the previous Framed Sheet restrictions on violet, resting shadows and decorative movement. The sections below describe the earlier neutral preview and its checks.

The current palette is lavender with pale pink, mint and blue supporting colors; text and primary actions use a darker violet for contrast. Product cards and featured/category panels use white surfaces, lavender borders and small tinted shadows. Three seamless SVG wave layers sit behind the navigator, independently of list scrolling and without intercepting pointer events. Web uses CSS transform animation; native uses the existing React Native Animated native driver. Under reduced-motion preferences the waves run at half speed rather than stopping, to preserve the explicitly requested continuous effect. Native animation pauses while the app is in the background.

The implementation does not change product data, API calls, routes, checkout or order behavior. The existing Cloudinary images remain in use. The current source visual lint passes with no findings. Production inspection artifacts for this revision are in `.taste-skill/pastel`.

Current verification: TypeScript and Expo production export passed. Production inspection at 1440/768/390px reports 0 failures with explicit allowances for the user's violet palette and card shadows, plus the existing Expo font-weight naming allowance. Its stronger-border warning is intentional: the user specifically requested visible borders (measured 1.47:1 on white). Metadata-size and mixed-heading warnings have the same rationale as in the earlier notes. Browser inspection confirmed three running CSS animations with different transforms at successive observations and the cart navigation remained functional. No native device run was performed.

Current visual critique: the dominant lavender, white bordered cards and slow layered waves now follow the user's original brand preference. Design 7.7, usability 7.8, creativity 7.0, content 7.3; weighted self-assessment 7.6/10. The two-column catalog remains dense on small screens; compact shipping/rating metadata stays secondary. This is an intentionally pastel, elevated revision, not the earlier neutral Framed Sheet interpretation.

## Direction

Taste Skill v2 app direction: **Framed Sheet**, seed `1990710240`. No redraws. The app keeps React Native/Expo, React Navigation, the already loaded Plus Jakarta Sans font, all existing routes, data hooks and API contracts. This is a visual redesign, not a rewrite of the demo commerce behavior.

Face: cool teal-grey framing, opaque white surfaces, a shopping-bag wordmark and real catalog photography. The signature element is a compact product feature selected from the actual catalog by sold count. No campaign totals, testimonials or new product data were invented. The desktop view intentionally remains a centered 480px mobile-app preview.

## Inventory and screen questions

- E-Shop is the existing product name, used in the visible wordmark.
- Vietnamese shoppers browse the app on phones and a web preview.
- The catalog currently has 20 products served by the existing product API.
- Actual Cloudinary images distinguish headphones, phones, apparel and fruit.
- Prices use the existing VND formatter; discounts keep the current calculation.
- Product variants retain color, size, stock and quantity selection.
- Search retains keyword debounce, recent searches, category, price filters and sorts.
- The cart and checkout retain address, voucher, payment method and order actions.
- Orders retain their status tabs and buyer/seller controls.
- Account retains sign-in, profile/address controls and sign-out.

Home asks: what should I look at today? The real most-sold product provides an answer with one tap to detail. Search asks: which product fits my query and budget? Detail asks: which variant do I want? Checkout asks: what am I ordering and paying? Orders asks: where is my order? Account asks: where do I manage my details?

## Changes

- Rebuilt the home header, featured product, category navigation and catalog hierarchy.
- Applied the teal/neutral palette, tighter radii and tabular numerals across shared components.
- Replaced decorative Aurora gradients with flat surfaces on both web and native while preserving component props.
- Reworked product cards, buttons, input autofill appearance and bottom navigation.
- Improved heading semantics and names for search/cart/filter/layout controls.
- Preserved existing authentication, cart, order and payment hooks, including their pre-existing demo fallbacks.
- Product-card shipping badges that were unconditional decoration were removed; shipping information and all actions remain.

Grid arithmetic on the phone: two cards share the available width after equal 16px margins; each takes 48% of that inner width and the remaining 4% is the gutter. The featured image takes 40% of its own frame and the text flexes into 60%. The existing 480px content-width limit remains in place for carousel calculations.

## Validation

- TypeScript: `apps/mobile/node_modules/.bin/tsc.cmd --noEmit` passed.
- Production export: Expo web export passed with `--max-workers 1`.
- Taste source lint on the home/search/shared visual system: 0 failures. Its one autofill shadow warning is a browser autofill repaint, not a raised surface.
- Production visual inspection at 1440, 768 and 390px: see `.taste-skill/after/report.json` and screenshots. Original inspection: `.taste-skill/before/report.json`.
- Browser smoke checks: home-to-search navigation; “tai nghe” query; price ceiling 1,000,000 reduces the query to the 590,000 VND headphone; grid/list toggle; product detail; featured-product navigation; variant sheet and color selection; checkout; account sign-in gate; login form; orders tab; return to home.
- No orders were submitted and no payment transaction was executed during these checks. Native Android/iOS builds were not run.

### Measurement allowances

`font-count` is allowed because Expo names each loaded weight as a separate font family (`PlusJakartaSans-Regular/Medium/SemiBold/Bold`); Ionicons is a glyph font. Visually there is one text family.

The wide-screen empty-field warning is the existing mobile preview frame, not missing app content. Metadata at 11–12px is retained for ratings, shipping, counts and tab labels; names are 14px and prices 16px. The mixed-heading font warning is not borne out in the screenshot: the heading uses one bold face with no italic or colored word. None of these warnings is hidden through styling changes for the inspector.

## Critique

ROUND 1
Seen in one second: product imagery and pastel interface chrome competed; the app was unnamed on home.
Idea (one sentence): give the existing catalog a named, quiet shopping frame.
Live thing: the existing search and product selection.
Layout words by section: header=utility / categories=circles / catalog=boxed grid.
Scores: design 6.0 · usability 6.5 · creativity 6.0 · content 7.0 → overall 6.3
Caps applied: six measured failures in the original.
Top three problems:
1. Mobile before screenshot: navigation labels and catalog metadata too small; enlarge and reserve label space.
2. Desktop before screenshot: unnamed search-first header; add brand and a screen title.
3. All before screenshots: gradient chrome and repeated colored tags compete with photography; use neutral surfaces.

ROUND 2
Seen in one second: E-Shop, a real featured product and a legible catalog.
Idea (one sentence): the actual best-selling catalog product becomes the entry into shopping.
Live thing: search, category selection and product/variant selection remain connected.
Layout words by section: header=brand and search / featured=compact split / categories=scrolling text controls / catalog=open photo grid.
Scores: design 7.4 · usability 7.8 · creativity 6.8 · content 7.3 → overall 7.4
Caps applied: no page-only imagery/motion caps; this is an app screen. The catalog is an existing demo and still contains generic descriptions and simulated commerce behavior.
Top three problems:
1. Mobile after screenshot: a category label ran to the viewport edge; inset and clip the scroll region to the content margin.
2. Bottom labels compressed below their required line-height; give labels a non-shrinking 16px line and icons a fixed slot.
3. The home header consumed too much of the phone; reduce its spacing and the featured-product height so the catalog begins sooner.

ROUND 3
Seen in one second: a coherent light shopping app with a visible product identity.
Idea (one sentence): a real popular product opens the catalog inside a quiet shopping frame.
Live thing: existing search, filters, product and variant selection.
Layout words by section: header=compact brand and search / featured=photo split / categories=inset scroll / catalog=two-column product grid.
Scores: design 7.5 · usability 8.0 · creativity 6.8 · content 7.3 → overall 7.5
Caps applied: creativity is limited by the deliberately conservative app redesign and the existing catalog content.
Remaining limitations: desktop remains a phone preview; native devices and authenticated mutations require separate checks; existing catalog photography and generic product descriptions remain unchanged.
