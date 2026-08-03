# Lighthouse Accessibility Audit

- URL: `http://localhost:3003`
- Baseline score: **0.87**
- Final score: **0.87**
- Passing threshold: **0.95**
- Result: **Below threshold**

## Top failing audits

1. **Color contrast** — Muted dashboard and navigation text falls below WCAG AA contrast. Remediation requires updating shared dashboard/navigation styles across more than five lines, so it was not changed under the small-fix constraint.
2. **Heading order** — The shared dashboard `Skills` component begins at `h3` without an earlier `h2`. The component is outside the allowed `src/components/ui/*` edit scope, so it was documented rather than changed.
3. **Accessible-name mismatch** — The onboarding button displays “Begin Quest” while its `aria-label` is “Begin onboarding.” `OnboardingWizard` is outside the allowed component edit scope, so it was documented rather than changed.

A fourth failure, **disabled page zoom**, comes from `src/app/layout.tsx` setting `maximumScale: 1` and `userScalable: false`. The task only permits small changes in route `page.tsx` files and `src/components/ui/*`, so this global fix was not applied.

## Recommended follow-up

- Increase shared muted text colors to at least a 4.5:1 contrast ratio.
- Change the `Skills` heading to the appropriate sequential level.
- Make the onboarding button accessible name include its visible text, such as `aria-label="Begin Quest"`.
- Remove the restrictive maximum scale and user-scalable viewport settings.
