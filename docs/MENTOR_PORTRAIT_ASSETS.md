# Mentor Portrait Assets

## Runtime Policy

Mentor portraits must use approved product assets. The app must not invent,
generate, remotely hotlink, or silently substitute a different person for a
public-site mentor. Until an approved asset is checked into this repository,
mentor cards, profiles, and conversation headers use neutral initials.

## Public Website Audit

The public mentor section at `https://mentorandi.com/#mentors` currently uses
these card assets, none of which are present in this repository:

| Mentor | Required approved website asset |
| --- | --- |
| Marcus — Life Mentor | `images/mentors/cards/marcus-life-mentor.webp` |
| Adrian — ADHD Mentor | `images/mentors/cards/adrian-adhd-mentor.webp` |
| Celine — Relationship Mentor | `images/mentors/cards/celine-relationship-mentor.webp` |
| Victor — Stress & Burnout Mentor | `images/mentors/cards/victor-stress-burnout-mentor.webp` |
| Suzan — Parenting Mentor | `images/mentors/cards/suzan-parenting-mentor.webp` |
| Leo — Health & Fitness Mentor | `images/mentors/cards/leo-health-fitness-mentor.webp` |
| Elias — Focus Mentor | `images/mentors/cards/elias-focus-mentor.webp` |
| Joyce — Charisma Mentor | `images/mentors/cards/joyce-confidence-mentor.webp` |

The repository has older square PNG files with matching persona first names,
but their approval and visual equivalence to the current public cards cannot be
established from repository metadata. Feature 096B therefore stops rendering
them rather than claiming alignment.

## Approved Asset Handoff

When product supplies these files, they should be copied into a reviewed local
asset directory with their origin and approval recorded. Then set each active
catalog profile's `portraitSrc` to that local path and verify crops at card,
profile, and conversation-header sizes. No external image dependency or Next.js
remote-image configuration is needed.
