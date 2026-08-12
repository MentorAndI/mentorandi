# Mentor Portrait Assets

## Runtime Policy

Mentor portraits must use approved product assets. The app must not invent,
generate, remotely hotlink, or silently substitute a different person for a
public-site mentor. Neutral initials remain the component fallback only when a
catalog profile has no approved local asset.

## Approved Runtime Assets

The canonical portraits come from the `main` branch of
`MentorAndI/mentorandi-website`, specifically `images/mentors/cards/` and
`images/mentors/profiles/`. Feature 096E copies those exact WebPs into this app:

- `public/images/mentors/cards/` for mentor pickers, lists, chat avatars, and
  other compact card surfaces.
- `public/images/mentors/profiles/` for mentor profile/detail and other large
  portrait surfaces.

The browser uses only these local copies. Source PNG masters and OG images are
not used in runtime UI, and production does not hotlink the website repository.
Next.js serves the files from `public/`; the Docker image copies that directory
into the production runner.

| Mentor | Card and compact UI | Profile and large UI |
| --- | --- | --- |
| Marcus — Life Mentor | `/images/mentors/cards/marcus-life-mentor.webp` | `/images/mentors/profiles/marcus-life-mentor.webp` |
| Adrian — ADHD Mentor | `/images/mentors/cards/adrian-adhd-mentor.webp` | `/images/mentors/profiles/adrian-adhd-mentor.webp` |
| Celine — Relationship Mentor | `/images/mentors/cards/celine-relationship-mentor.webp` | `/images/mentors/profiles/celine-relationship-mentor.webp` |
| Victor — Stress & Burnout Mentor | `/images/mentors/cards/victor-stress-burnout-mentor.webp` | `/images/mentors/profiles/victor-stress-burnout-mentor.webp` |
| Suzan — Parenting Mentor | `/images/mentors/cards/suzan-parenting-mentor.webp` | `/images/mentors/profiles/suzan-parenting-mentor.webp` |
| Leo — Health & Fitness Mentor | `/images/mentors/cards/leo-health-fitness-mentor.webp` | `/images/mentors/profiles/leo-health-fitness-mentor.webp` |
| Elias — Focus Mentor | `/images/mentors/cards/elias-focus-mentor.webp` | `/images/mentors/profiles/elias-focus-mentor.webp` |
| Joyce — Charisma Mentor | `/images/mentors/cards/joyce-confidence-mentor.webp` | `/images/mentors/profiles/joyce-confidence-mentor.webp` |

Joyce remains `joyce-confidence-mentor` in both approved filenames while the
runtime display role remains Charisma Mentor. No approved portrait is missing.

## Pricing CTA Handoff

Designer and developer pricing actions should target these application routes:

- Free Trial: `/signup?plan=free`
- Single Mentor: `/signup?plan=single`
- Mentor Plus: `/signup?plan=plus`
- Premium: `/signup?plan=premium`
- Company Stress Mentor: `/company-stress-mentor`
- Extra Credits: `/billing/credits`

These targets document navigation only. They do not enable payments, alter
pricing, or change current billing behavior.
