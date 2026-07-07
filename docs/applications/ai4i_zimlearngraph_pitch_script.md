# Pitch Script: ZimLearnGraph

> **AI4I Data Track — Oral Presentation Script (5–7 Minutes)**

**Presenter:** [Your Name]  
**Track:** Data Track  
**Time:** 5–7 minutes

---

## Slide 1: Title (30 seconds)

**Visual:** ZimLearnGraph logo + tagline "Assessment Data → Learning Evidence"

> "Good morning. I'm here to talk about ZimLearnGraph — turning school assessment records into AI-ready learning evidence.
>
> We're applying to the **Data Track**, because our core innovation is not an AI model or a dashboard. It's the structured data pipeline that makes both of those possible. This is a data infrastructure project for Zimbabwean education."

---

## Slide 2: The Problem (60 seconds)

**Visual:** Split image — paper mark book on left, teacher stacking exam papers on right

> "Zimbabwe's schools already generate millions of assessment records every term. Tests. Exams. Topic exercises. Every single one contains granular data about what a learner knows and where they're struggling.
>
> **This data is trapped.**
>
> In paper mark books. In teacher notebooks. In isolated spreadsheets that disappear when a teacher transfers schools. In end-of-term reports that aggregate everything into a single subject score — destroying every topic-level signal in the process.
>
> The consequence: teachers make intervention decisions from memory. School leaders allocate resources blind. Researchers have no longitudinal dataset. And AI developers can't build education AI because the foundational training data doesn't exist in structured form.
>
> **This is not a technology gap. It's a data infrastructure gap.** And it's the fundamental barrier to AI impact in Zimbabwean education."

---

## Slide 3: The Solution (60 seconds)

**Visual:** Data flow diagram — School → Class → Learner Code → Assessment → Question → Mark → Signal → Intervention → Follow-up

> "ZimLearnGraph is a structured data pipeline that converts existing teacher-marked assessments into a privacy-preserving, topic-linked, AI-ready dataset.
>
> Here's how it works:
>
> A school registers its classes and teachers. We generate anonymous learner codes — no names ever enter the system. The teacher enters assessment metadata and maps each question to a curriculum topic from the ZIMSEC syllabus. They record marks via web form or CSV upload. Our analytics pipeline derives topic-level performance per learner and generates weakness signals for topics below proficiency threshold.
>
> The teacher logs any intervention they take — re-teaching, extra exercises, peer tutoring. And when they do a follow-up assessment, the system measures pre/post change and shows whether the intervention worked.
>
> **This is the complete data chain. And it's already designed, documented, and ready to deploy."**

---

## Slide 4: Innovation — Structural, Not Algorithmic (45 seconds)

**Visual:** Side-by-side comparison table — Current Practice vs ZimLearnGraph

> "I want to be very clear about what our innovation is — and what it isn't.
>
> Our innovation is **structural, not algorithmic**. We are not applying AI to existing data. We are building the data layer that makes AI possible in the first place.
>
> The innovation is:
> - A privacy architecture where learner codes replace names from day one
> - A collection protocol designed for Zimbabwe's classroom — paper assessments, teacher marking, low connectivity
> - A quality framework with 10 measurable, automated metrics
> - A governance model where the school controls the data
>
> The dashboard is a proof layer. The AI summaries are advisory. The core innovation is the **structured dataset pipeline**."

---

## Slide 5: What Exists Today (45 seconds)

**Visual:** Screenshot of landing page + collage of data documents

> "We are not starting from scratch. An MVP exists today demonstrating the complete data flow with seeded data.
>
> The Data Track has **seven comprehensive documents**: a dataset card, a data dictionary with 14 entities, a step-by-step collection protocol, a quality framework with 10 metrics, privacy governance, a formal SQL schema with 29 foreign key constraints, and an AI4I strategy document.
>
> The Design Track has a live landing page showing what the data looks like when it's visualised.
>
> **Everything is documented. Everything is specified. What's missing is real data from real schools — and that's what this funding would provide."**

---

## Slide 6: Pilot Plan (45 seconds)

**Visual:** Timeline graphic — 24 weeks, 4 phases

> "With funding, we deploy a 24-week pilot across 5 to 10 Zimbabwean schools, covering 3 subjects and approximately 500 to 1,000 learners.
>
> Weeks 1 to 4: School onboarding and teacher training.
> Weeks 5 to 16: Real data collection — all teacher-marked assessments in English, Mathematics, and Science.
> Weeks 10 to 20: Intervention cycle — teachers log interventions, administer follow-up assessments.
> Weeks 20 to 24: Full data export, impact analysis, and pilot report.
>
> The output is a validated, quality-scored, structured dataset — plus a proven protocol ready for national scaling."

---

## Slide 7: Impact & Metrics (45 seconds)

**Visual:** Dashboard mockup showing key metrics

> "We measure what matters. Every metric is defined, formula-based, and automatically collected.
>
> By the end of the pilot:
> - Data quality scores of 90% or above across all metrics
> - 80% or more of enrolled teachers actively submitting data
> - 70% or more of weakness signals linked to a recorded intervention
> - 60% or more of follow-up assessments showing meaningful improvement
> - Teacher satisfaction of 3.5 out of 5 or higher
>
> Every number is verifiable. Every metric is transparent. No self-report bias for the core indicators."

---

## Slide 8: Privacy & Responsible AI (45 seconds)

**Visual:** Privacy icon set — learner code, no PII, teacher check mark, advisory label

> "Let me speak directly to privacy, because it's the foundation of everything we do.
>
> **No learner name ever touches the dataset.** The school generates anonymous learner codes at onboarding. The school holds the name-to-code mapping locally. The system has no PII fields — there is nowhere to put a name.
>
> **AI is advisory only.** Every AI-generated summary is labelled: 'This is AI-generated and advisory. Always verify against the underlying data.' The deterministic analytics — topic performance, weakness signals, pre/post comparison — are computed algorithmically, not by AI.
>
> **No high-stakes decisions are automated.** The system does not pass, fail, promote, or label learners. It provides evidence for teacher judgement.
>
> This is not privacy as a compliance checkbox. This is privacy as an architectural principle."

---

## Slide 9: Why Data Track (30 seconds)

**Visual:** "Data Track" highlighted; "Design Track" dimmed

> "We are applying to the Data Track because the dataset is the product. The data pipeline — its architecture, its privacy design, its quality controls — is the structural innovation.
>
> The Design Track would focus on the dashboard UI. But a dashboard without data is an empty interface. The data pipeline without a dashboard is still a functioning, impact-generating dataset.
>
> **Data Track is primary. Design Track is complementary. The dataset is the innovation."**

---

## Slide 10: The Ask (15 seconds)

**Visual:** $75,000 callout + breakdown icons

> "We are requesting [$X] to deploy this pilot — funding for school onboarding, teacher training, data quality management, infrastructure, and impact evaluation. The detailed budget breaks down exactly where every dollar goes.
>
> Full details are in the budget document."

---

## Slide 11: Closing (15 seconds)

**Visual:** ZimLearnGraph logo + "Data infrastructure first. AI next. Impact always."

> "ZimLearnGraph is ready. The pipeline is specified. The MVP is live. What we need is the opportunity to prove it works in real Zimbabwean classrooms.
>
> Thank you. I'm happy to take questions."

---

## Slide 12: Backup — Risk Mitigation (If Asked)

> "If they ask about risks:
>
> **'What if teachers don't enter data?'** — We over-recruit schools, provide CSV templates they fill during class time, and have school champions who support adoption.
>
> **'What about internet?'** — CSV upload works offline. They fill it in class, upload when connected.
>
> **'How do you ensure quality?'** — 10 automated metrics checked per submission. Weekly human review. Remediation protocol with 7-day warning window.
>
> **'What prevents this from becoming a surveillance tool?'** — Schema-enforced privacy. School-controlled participation. Published governance framework. Annual transparency report."

---

## Notes for Presenter

- **Tone:** Confident about what exists; honest about what needs building; passionate about the mission
- **Pacing:** Don't rush the problem slide — judges need to feel why this matters
- **Key phrase:** "This is not an AI project that happens to need data. This is a data infrastructure project that enables AI."
- **Avoid:** "Disrupting education" — use "building foundational infrastructure"
- **When asked about competition:** "We are not competing with EdTech platforms. We complement them by capturing the 90%+ of Zimbabwean assessments that happen on paper."
- **References to the live app:** Frame as "proof that the data layer works" not as "the product"

---

*This script is designed for a 5–7 minute oral presentation. Adjust timing based on the actual AI4I pitch format. The key message throughout: the data layer is the core innovation, and it is ready.*
