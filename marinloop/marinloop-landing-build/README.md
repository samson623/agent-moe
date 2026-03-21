# MarinLoop Landing Page Redesign — Build Package

## What This Is
Complete replacement for `src/app/LandingScreen.tsx` in the MarinLoop repo.
Designed to match the v2 HTML prototype, built with the real tech stack.

## Tech Stack Match
- React 19 + TypeScript
- Tailwind CSS v4
- MarinLoop CSS custom properties (`--color-*` tokens from `src/styles/index.css`)
- Existing components: `Button` from `@/shared/components/ui`, `IconButton` from `@/shared/components/IconButton`
- Existing stores: `useThemeStore`, `useAuthStore`
- React Router v7: `useNavigate`, `Navigate`

## Files

### `LandingScreen.tsx`
Drop-in replacement for `src/app/LandingScreen.tsx`

### `landing.css`
New CSS file — add to `src/styles/landing.css`
Import it in `src/styles/index.css` at the bottom: `@import "./landing.css";`

## Installation Steps

1. **Backup** the current `src/app/LandingScreen.tsx`
2. **Replace** `src/app/LandingScreen.tsx` with the file from this package
3. **Copy** `landing.css` to `src/styles/landing.css`
4. **Add this import** to the bottom of `src/styles/index.css`:
   ```css
   @import "./landing.css";
   ```
5. **Run** `npm run dev` and visit `/landing` to preview
6. **Run** `npm run build` to verify no type errors

## Route
Already wired: `/landing` → `<LandingScreen />` in `src/app/routes.tsx` (no changes needed)

## Notes
- Uses only existing CSS custom properties — no new design tokens
- All compliance language matches Terms, Privacy, and Trust Center verbatim
- No fake testimonials or stats — only real feature descriptions
- Dark/light mode works via existing `useThemeStore` + `[data-theme="dark"]`
- Scroll animations use IntersectionObserver (no dependencies)
- Interactive product preview with clickable medication cards
- Fully responsive (mobile, tablet, desktop)
