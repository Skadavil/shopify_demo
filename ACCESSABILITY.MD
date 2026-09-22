# Accessibility audit — product detail page

Audit of the local Shopify theme preview against the principles in
`../ECC/rules/react-native/accessibility.md`, translated to their web
equivalents (accessible names and roles, announced state, target size, text
scaling, reduced motion, WCAG AA contrast, keyboard focus, and modal focus).

**Page:** `/products/demo-citrus-muse-travel-spray`  
**Preview tested:** `http://127.0.0.1:9292`  
**Assessed:** 2026-09-23  
**Target:** WCAG 2.2 Level AA

## Result

The core PDP flow is keyboard-operable and its visible text passes the automated
contrast calculation. The page is **not yet ready to claim WCAG AA conformance**:
four issues remain, and a real screen-reader and enlarged-text pass is still
required.

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| High | Duplicate `contentinfo` landmarks | The rendered page contains two `<footer>` elements: the stock footer and `.bs-footer`. | Render one site footer, or change the non-primary wrapper to a non-landmark element. |
| Medium | Some interactive targets are below the 44 × 44 CSS pixel target used by the project standard | Breadcrumb links measured 30.8 × 16.5 and 83.8 × 16.5; the vendor link 150.4 × 17; quantity input 36 × 24.4; image zoom button 42 × 42. | Add padding or a minimum block/inline size without reducing the visible layout. Increase the zoom button to at least 44 × 44. Keep the quantity control operable as a 44px-high composite control. |
| Medium | Product recommendations skip a heading level | The product title is `<h1>`, while “You may also like” is `<h3>` with no intervening `<h2>` in the main content. | Use `<h2>` for the recommendations heading. |
| Medium | A missing translation key is exposed as a heading | The footer renders `TRANSLATION MISSING: EN.BEAUTY_STORE.PAYMENT`. It originates from `{{ 'beauty_store.payment' | t }}`. | Add `beauty_store.payment` to `locales/en.default.json` and all enabled locale files, or supply an explicit fallback. |

## Checks that passed

| Requirement | Result |
|---|---|
| Page language | `<html lang="en">` is present. |
| Main landmark | One `<main>` is present. |
| Product heading | One PDP `<h1>` is present: “Citrus Muse Travel Spray”. |
| Accessible names | Search, account, cart, quantity controls, add-to-cart, gallery zoom, dialog close, accordions, newsletter email, and newsletter submit have readable accessible names. |
| Product images | Both rendered product images expose the merchant-provided alternative text: “Demo stock photo: clear glass bottle on white table”. |
| State | Native `<details>/<summary>` exposes expanded/collapsed state. The stock availability indicator uses visible text as well as colour. |
| Async feedback | The product form contains an assertive `role="status"` live region for add-to-cart feedback (`blocks/buy-buttons.liquid`). |
| Keyboard accordion | Enter on “Description” opens the disclosure and leaves focus on its summary. |
| Dialog focus | Opening the image viewer moves focus to “Close image preview”. Escape closes it and restores focus to “Open larger product image”. The dialog is named “Product image preview”. |
| Contrast | No visible text within the PDP information region failed the computed 4.5:1 body-text threshold in the tested state. Availability is not communicated by colour alone. |
| Focus order | No positive `tabindex` values were found. The DOM and accessibility-tree order are logical through the PDP. |
| Reduced motion | Theme motion is generally gated with `prefers-reduced-motion`; the PDP gallery adds no scripted animation. |
| Zoom | The page does not disable browser zoom. |

## Scope and method

The audit combined:

- the browser accessibility tree at the desktop preview size;
- keyboard interaction of the gallery dialog and product disclosures;
- rendered DOM inspection for names, landmarks, headings, focus order, image
  alternatives, and target rectangles;
- computed foreground/background contrast for visible PDP text; and
- source inspection for live regions and reduced-motion handling.

Geometry alone was not used to decide whether closed menu content was exposed.
Closed native disclosure content can retain measurable boxes while remaining out
of the accessibility tree and tab order.

## Required manual follow-up

Automated inspection cannot establish full conformance. Before release, perform:

1. A keyboard-only walkthrough of the header menus, PDP, cart drawer, cookie
   controls, and footer at desktop and mobile widths.
2. VoiceOver + Safari and TalkBack + Chrome walkthroughs of selecting a variant,
   changing quantity, adding to cart, opening/closing the image viewer, and
   hearing validation or success feedback.
3. Browser zoom/reflow checks at 200% and 400%, plus the largest platform text
   size, verifying there is no clipped content or two-dimensional scrolling.
4. Contrast checks for hover, focus, disabled, error, and out-of-stock states,
   not only the default in-stock state audited here.
5. A repeat audit using real catalog content, especially every uploaded product
   image's alternative text and merchant-authored rich text.

## Suggested fix order

1. Remove the duplicate footer landmark.
2. Add the missing payment translation.
3. Increase the affected interactive target areas.
4. Correct the recommendations heading to `<h2>`.
5. Complete the manual screen-reader and enlarged-text tests, then rerun the
   browser audit.
