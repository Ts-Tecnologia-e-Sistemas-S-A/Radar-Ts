---
name: GovTrack Brasil
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#49607c'
  primary: '#001428'
  on-primary: '#ffffff'
  primary-container: '#0f2942'
  on-primary-container: '#7991af'
  inverse-primary: '#b0c9e8'
  secondary: '#006c4e'
  on-secondary: '#ffffff'
  secondary-container: '#97f5cc'
  on-secondary-container: '#007353'
  tertiary: '#001524'
  on-tertiary: '#ffffff'
  tertiary-container: '#002a44'
  on-tertiary-container: '#2e95da'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#b0c9e8'
  on-primary-fixed: '#011d35'
  on-primary-fixed-variant: '#314863'
  secondary-fixed: '#97f5cc'
  secondary-fixed-dim: '#7bd8b1'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  screen-margin-mobile: 1rem
  screen-margin-tablet: 1.5rem
  card-padding: 1rem
  input-height: 3rem
---

## Brand & Style

This design system establishes a high-efficiency, trust-anchored mobile CRM interface engineered for field sales representatives and key account managers navigating Brazilian public sector procurement (B2G). 

The emotional tone balances institutional gravitas with tactical clarity: authoritative, non-distracting, ultra-legible under direct sunlight, and fast to manipulate on-the-go. The aesthetic approach is **Corporate Modern Minimalist**: stark, high-contrast structural hierarchy, deep slate and institutional navy foundations, crisp emerald accents for wins and positive bidding metrics, and clean card containers that segregate dense bureaucratic data into glanceable intelligence.

## Colors

The palette is tuned specifically for high legibility in high-stakes public sector contexts:

- **Primary (`#0F2942`)**: Deep Brazilian institutional navy. Serves as primary headers, active tab indicators, and primary action surfaces. Communicates governance, stability, and protocol.
- **Secondary (`#047857`)**: Emerald green. Reserved exclusively for affirmative state milestones: awarded bids, compliant documentation, winning margins, and primary conversion targets.
- **Tertiary (`#0284C7`)**: Precision cyan-slate. Applied to legal notice updates, secondary action badges, and active filter tags.
- **Neutral (`#64748B`)**: Slate gray. Provides balanced boundaries, subtle structural rules, muted meta-labels, and off-white backdrop layers (`#F8FAFC` base surface, `#FFFFFF` card surface).

## Typography

The typography uses Inter across all roles to achieve maximum neutral legibility across diverse device screens under rapid field conditions. 

- **Display & Headlines:** Tight letter-spacing with strong semi-bold and bold weights to anchor bidding entity names, contract values, and status banners.
- **Data & Numbers:** Numbers in deal sizes (R$) and dates must use tabular numeric rendering (`font-variant-numeric: tabular-nums`) to maintain alignment inside bidding status tables and procurement lists.
- **Labels & Badges:** Monospace-like precision using uppercase or condensed `label-sm` weights for portal identifiers (e.g., ComprasNet, Licitações-e).

## Layout & Spacing

A mobile-first 4-column fluid layout with an 8pt architectural grid ensures thumb-friendly ergonomics for reps entering field notes directly outside government agencies:

- **Mobile Viewports (<640px):** 4 columns, 16px screen margins, 12px horizontal gutters. All interactive touch targets must measure at least 48px in height.
- **Tablet & Split-Screen (640px–1024px):** 8 columns, 24px screen margins, 16px gutters. Allows a persistent master-detail view showing procurement opportunities alongside active tender dossiers.
- **Vertical Rhythm:** 8px base increments. Forms stack single-column to expedite data entry; meta information groups in horizontal rows with 8px gaps.

## Elevation & Depth

This design system uses **flat structural layering paired with micro-borders and soft ambient shadows**, minimizing visual clutter to focus on procurement data:

- **Surface Base:** `#F8FAFC` (Slate 50) canvas providing high-contrast separation for white data containers.
- **Surface Elevation 1 (Cards, List Items):** Pure `#FFFFFF` background with a crisp 1px solid border (`#E2E8F0`) and an ambient shadow (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05)`).
- **Surface Elevation 2 (Sticky Headers, Bottom Sheets, Filter Drawers):** `#FFFFFF` surface with a subtle 1px border (`#CBD5E1`) and a directional lift (`box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.10)`).
- **Surface Elevation 3 (Overlays, Floating Action Buttons):** `#0F2942` fill with high-contrast edge demarcation and directional drop (`box-shadow: 0 12px 32px -6px rgba(15, 41, 66, 0.25)`).

## Shapes

The interface embraces a **Soft (Level 1)** geometric cadence. 

- Form controls, cards, and primary action buttons utilize `0.25rem` (4px) or `0.5rem` (8px) corner radiuses.
- Badges and status pills use a controlled `0.25rem` radius to convey an official, document-like stamp aesthetic rather than consumer-style pill shapes.
- Modals, action sheets, and bottom trays apply `0.75rem` (12px) radiuses exclusively to top corners.

## Components

### Buttons
- **Primary:** Navy (`#0F2942`) background, pure white text, 48px min-height, 8px radius, bold label.
- **Affirmative (Win/Submit Bid):** Emerald (`#047857`) background, white text, 48px height.
- **Secondary / Outline:** 1.5px solid `#CBD5E1`, transparent background, `#0F2942` text.
- **Field Action (Icon + Label):** 44px minimum touch target with 8px horizontal padding.

### Status Badges & Chips
- Crisp, low-height (24px) tags with a 1px border.
- **Positive / Homologado / Venceu:** `#ECFDF5` background, `#047857` text, `#A7F3D0` border.
- **Under Review / Em Análise:** `#FEF3C7` background, `#92400E` text, `#FDE68A` border.
- **Critical / Impugnado:** `#FEF2F2` background, `#991B1B` text, `#FECACA` border.
- **Filter Chips:** `#F1F5F9` background, `#334155` text, shifting to `#0F2942` filled background with `#FFFFFF` text when active.

### Cards & Tender Dossiers
- Background `#FFFFFF`, 1px border `#E2E8F0`, 8px border radius.
- Header row hosts the agency acronym (e.g., "TRF-3", "SEDUC-SP") in bold typography opposite the tender modality badge ("Pregão Eletrônico").
- Body features key values (Estimated Budget, Tender Date, Process Number) formatted with clear muted labels stacked over dark slate values.

### Input Fields & Quick Selectors
- Height 48px, background `#FFFFFF`, border 1px solid `#CBD5E1`, border-radius 6px.
- Focus state: 1.5px border `#0F2942` with 3px `#E2E8F0` outer glow.
- Includes preset quick-fill chips for common Brazilian bidding protocols and document flags directly above the numeric keyboard.

### Lists & Activity Logs
- Dividers: Single continuous `#F1F5F9` border line without inset.
- Row items feature 12px vertical padding with high-contrast text and trailing status icons for document validation (e.g., CND, SICAF status checkmarks).