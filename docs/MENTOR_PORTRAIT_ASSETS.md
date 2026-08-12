# Mentor Portrait Assets

## Runtime Policy

Mentor portraits must use approved product assets. The app must not invent,
generate, remotely hotlink, or silently substitute a different person for a
public-site mentor. Neutral initials remain the component fallback only when a
catalog profile has no approved local asset.

## Approved Runtime Assets

The approved source portraits live in `public/images/mentors/`. They were added
together in repository commit `b9791cc` for mentor portraits and profile pages.
Next.js serves these local public assets in development and includes them in the
production/Docker output without remote-image configuration.

| Mentor | Runtime asset |
| --- | --- |
| Marcus — Life Mentor | `/images/mentors/marcus.png` |
| Adrian — ADHD Mentor | `/images/mentors/adrian.png` |
| Celine — Relationship Mentor | `/images/mentors/celine.png` |
| Victor — Stress & Burnout Mentor | `/images/mentors/victor.png` |
| Suzan — Parenting Mentor | `/images/mentors/suzan.png` |
| Leo — Health & Fitness Mentor | `/images/mentors/leo.png` |
| Elias — Focus Mentor | `/images/mentors/elias.png` |
| Joyce — Charisma Mentor | `/images/mentors/joyce.png` |

The public website currently uses Joyce's previously named Confidence portrait
for Charisma, so the same approved Joyce asset is used by the runtime Charisma
profile. No approved mentor portrait is missing.

## Pricing CTA Handoff

Designer and developer pricing actions should target these application routes:

- Free Trial: `/signup?plan=free`
- Single Mentor: `/signup?plan=single`
- Mentor Plus: `/signup?plan=plus`
- Premium: `/signup?plan=premium`
- Company Stress Mentor: `/company-stress-mentor`
- Extra mentor credits: `/billing/credits`

These targets document navigation only. They do not enable payments, alter
pricing, or change current billing behavior.
