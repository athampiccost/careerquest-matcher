# CareerQuest Proposal Deck

Theme direction: **Arctic**. Use a clean white canvas, glacier-blue and translucent teal planes, coral highlights, confident heavy sans-serif headlines, and isometric analytical motifs. Maintain generous whitespace, crisp data cards, and a premium product-proposal tone.

## Cover

CareerQuest

Turn Every Resume into a Clear Next Move

Product Proposal | Career Intelligence & Skills Alignment

## Slide 1

# From resume upload to career direction

- CareerQuest turns a candidate’s resume into ranked role matches, visible evidence, and an actionable path forward.
- It combines backend-managed job intelligence, experience-aware matching, and optional AI guidance in one focused experience.
- The proposal creates a scalable foundation for candidates, career services, and talent ecosystems.

## Slide 2

# The career-search gap is an interpretation problem

- Candidates can list skills but often cannot translate them into the right roles, gaps, and next actions.
- Job descriptions are dense, inconsistent, and difficult to compare manually across a changing market.
- CareerQuest makes the relationship between resume evidence and job requirements visible, explainable, and usable.

## Slide 3

# CareerQuest creates a guided matching loop

- **Analyze:** extract resume evidence and normalize skills, domains, and experience.
- **Focus:** rank roles, surface missing capabilities, and prioritize the most meaningful gaps.
- **Advance:** create an AI-guided certification, resume, and 90-day skill-improvement plan.

## Slide 4

# A candidate-first product experience

- Candidates upload only a resume PDF; the curated job catalogue remains securely managed in the backend.
- The experience opens with a clear upload prompt, ranked-role leaderboard, evidence chips, and growth signals.
- Responsive isometric design makes complex career data feel structured, modern, and approachable.

## Slide 5

# Resume intake works across real-world devices

- Browser-side PDF extraction provides a fast first path for searchable resume files.
- A transient server-side parser is used when mobile browsers cannot complete local extraction.
- An iPhone-safe paste-text recovery route keeps the experience usable in restrictive in-app browsers.

## Slide 6

# Matching considers skills and relevant experience

- Skill extraction maps resume text and job descriptions to a common, normalized skill library.
- Role affinity recognizes evidence across platform engineering, full-stack, data and AI, and quality engineering domains.
- Experience fit compares detected years and domain relevance against stated role expectations.

## Slide 7

# Twenty-five ranked opportunities, not a black box

- CareerQuest ranks the top 25 roles from the active backend catalogue.
- Every role explains its score with matched skills, missing skills, experience-fit language, and a job-detail link.
- Job cards show up to 10 supporting skills and 10 growth-edge skills for transparent comparison.

## Slide 8

# Skill gaps become practical priorities

- Aggregated gap analysis identifies capabilities repeatedly requested by strong-matching roles.
- High, medium, and low indicators make the improvement order immediately clear.
- Readiness views connect market alignment, skill coverage, career momentum, and experience alignment.

## Slide 9

# AI turns signals into a next-step plan

- AI guidance is optional and activates only when the candidate selects **Generate AI insight**.
- The request uses the strongest six matches, recurring gaps, and derived resume evidence—not the original PDF.
- Outputs include learning priorities, resume improvements, recommended certifications, and a three-stage 90-day action plan.

## Slide 10

# Privacy is designed into the default flow

- Resume files and extracted text are processed transiently and are not stored as candidate history by default.
- Match results live in the active browser session rather than a persistent resume database.
- The OpenAI API key stays server-side; no AI call occurs without explicit candidate action.

## Slide 11

# A focused, extensible product architecture

- **React + TypeScript:** responsive candidate dashboard and component-driven interface.
- **tRPC server:** typed career-analysis procedures, temporary PDF compatibility parsing, and secure AI orchestration.
- **Server JSON catalogue:** validated job records supply the matching engine without exposing a public jobs upload route.

## Slide 12

# Job intelligence is operationally manageable

- The active catalogue contains 312 validated, approved job records from the latest uploaded dataset.
- Validation checks record shape, unique IDs, and the availability of an approved subset before use.
- A future administrative workspace can support controlled catalogue updates, review, expiry rules, and source governance.

## Slide 13

# Roadmap: evolve from matching to career intelligence

- **Now:** resume analysis, mobile recovery, 25 ranked matches, skill gaps, experience scoring, and AI action plans.
- **Next 90 days:** DOCX support, OCR-assisted scan handling, role filters, and official certification links.
- **Next 6–12 months:** consent-based history, richer personalization, employer insights, and catalogue automation.

## Slide 14

# Future improvement: broader, smarter intake

- Add DOCX and image-resume support with reliable extraction and guided quality feedback.
- Detect resume sections, projects, qualifications, and achievements for richer evidence scoring.
- Provide candidate prompts that improve parsing quality before the role match begins.

## Slide 15

# Future improvement: deeper personalization

- Let candidates define target locations, role families, seniority, salary preferences, and work mode.
- Allow users to select which leading roles should inform the AI career plan.
- Offer consent-based saved analyses so candidates can track readiness improvement over time.

## Slide 16

# Future improvement: trusted operating intelligence

- Build an administrator console for job imports, validation exceptions, catalogue review, and expiry management.
- Add explainability views that separate skill, experience, role-affinity, and certification contributions to each score.
- Create privacy controls, retention settings, and reporting suitable for institutional career-service deployments.

## Slide 17

# Delivery plan and success measures

- **Phase 1 — Launch:** deploy the current matching and insight experience with a governed job catalogue.
- **Phase 2 — Learn:** measure resume completion, match exploration, AI-plan generation, and identified gap themes.
- **Phase 3 — Scale:** prioritize integrations and personalization using observed candidate and catalogue patterns.

## Slide 18

# The decision

Give candidates clarity. Give career teams an explainable intelligence layer.

CareerQuest is ready to become the guided pathway from resume evidence to career action.
