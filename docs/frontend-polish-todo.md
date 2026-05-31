# Frontend Polish Todo

## Goal

Bring the whole Angular frontend onto the quieter PixelGram visual direction while keeping the new repo rules:

- Tailwind/DaisyUI classes only for redesign styling.
- Lucide Angular for UI icons.
- No inline `style` attributes.
- No custom component SCSS/CSS.
- Keep SOLID, DRY, and KISS in mind when touching code.

## Todo

1. Audit current screens in light and dark mode. **Not started**
   - Check `/login`, `/signup`, `/feed`, `/upload`, `/settings`, profile, edit profile, change password, and not-found.
   - Capture desktop and mobile screenshots.
   - Note spacing, contrast, target size, and inconsistent components.

2. Normalize non-auth surfaces. **First pass done**
   - Bring feed cards, upload cards, settings cards, profile header, and not-found into the same quiet surface language.
   - Prefer explicit `slate`/`white` contrast classes where DaisyUI theme tokens produce weak contrast.
   - Keep cards restrained: readable borders, subtle shadows, no oversized glass effects.

3. Normalize form controls. **First pass done**
   - Use consistent input height, radius, padding, label weight, placeholder contrast, and focus states across auth, upload, settings, edit profile, and change password.
   - Keep touch targets around `h-11` or `h-12`.
   - Avoid oversized controls unless the screen genuinely needs them.

4. Add practical validation states. **First pass done**
   - Show concise validation feedback for required/invalid auth fields.
   - Keep disabled submit states legible in light and dark mode.
   - Reuse the same validation pattern across login/signup first, then settings forms.

5. Refactor repeated auth/form markup. **Done**
   - Look for repeated long class strings in login/signup and settings forms.
   - Prefer small presentational Angular components only if they make templates simpler.
   - Do not introduce custom SCSS just to reduce class length.

6. Improve mobile navigation. **First pass done**
   - Test 360px, 390px, 430px, tablet, and desktop widths.
   - Ensure brand, auth action, and theme toggle fit without crowding.
   - Keep one auth action visible on logged-out auth pages.

7. Consider a 3-state theme control. **Done**
   - Current behavior is system default until user toggles, then persisted light/dark.
   - Decide whether the app needs explicit `System`, `Light`, and `Dark`.
   - If implemented, keep the UI compact and accessible.

8. Clean up build warnings if desired. **Done**
   - Address the Angular TypeScript target warning in `tsconfig`.
   - Decide whether to configure or replace `quartzite` to remove the CommonJS warning.

9. Final verification. **Partially done**
   - Run `npm run build`.
   - Run `npm run lint`.
   - Search for disallowed patterns:
     - `style="`
     - `styleUrls`
     - `<svg xmlns`
     - `fonts.googleapis`
     - `@import url`
   - Recheck core screens in light and dark mode.

## Progress

- 2026-05-31: Normalized feed, upload, settings, profile, and not-found surfaces away from glass/gradient styling into restrained slate/white cards.
- 2026-05-31: Added inline validation and page-level error messages for login, signup, edit profile, and change password.
- 2026-05-31: Tightened mobile navbar spacing by using a compact logo on small widths and keeping the auth action/theme toggle visible.
- 2026-05-31: Removed `quartzite` from the relative date pipe and set the frontend TypeScript target to `ES2022`; `npm run lint` and `npm run build` pass without the previous build warnings.
- 2026-05-31: Disallowed-pattern search passes for `style="`, `styleUrls`, `<svg xmlns`, `fonts.googleapis`, `@import url`, `card glass`, `bg-gradient-to-r`, and `text-transparent`.
- 2026-05-31: Added shared form-control styling directives for repeated input, textarea, and primary action utility classes.
- 2026-05-31: Replaced the two-state theme toggle with compact `System`, `Light`, and `Dark` theme choices.
- 2026-05-31: Screenshot audit is still open because the workspace has no Playwright, Puppeteer, or Chromium available; Safari is installed but not wired to repo automation.
