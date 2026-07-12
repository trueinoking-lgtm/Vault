/* ============================================================
   Impact Intelligence Landing Page - Copy Constants
   All text content centralized here for easy review & editing.
   ============================================================ */

export const SITE = {
  title: 'ZimLearnGraph Impact',
  altTitle: 'Impact Intelligence',
  url: '/impact-intelligence',
} as const;

export const HERO = {
  headline: 'Turn marked tests into learning intelligence.',
  subheadline:
    'ZimLearnGraph Impact transforms teacher-marked assessments into weak-topic analysis, learner support signals, and school-level evidence.',
  ctaPrimary: { label: 'View live demo', href: '/impact' },
  ctaSecondary: { label: 'Request a pilot', href: '#pilot' },
  trustStrip: [
    'Assessment-driven',
    'Teacher-first',
    'School-ready',
    'Privacy-conscious',
    'Evidence-focused',
  ] as readonly string[],
} as const;

export const PROBLEM = {
  heading: 'The signal is already there. It just needs to be read.',
  body: [
    'Every marked test contains useful learning signals: which questions may indicate misconceptions, which topics may need reteaching, and which learners may benefit from support. Teacher verification remains essential, but much of this evidence otherwise stays trapped inside paper mark books and static spreadsheets.',
    'Impact Intelligence extracts those signals and surfaces them as actionable evidence for teachers, school leaders, and educational stakeholders.',
  ],
} as const;

export const HOW_IT_WORKS = {
  heading: 'From marks to measurable insight.',
  steps: [
    { number: '01', title: 'Record marks', description: 'Teachers enter or upload raw assessment scores. No complex setup.' },
    { number: '02', title: 'Map to topics', description: 'Questions are linked to curriculum topics. The structure mirrors what was taught.' },
    { number: '03', title: 'Detect weaknesses', description: 'The system identifies topic-level gaps across the class and flags systemic issues.' },
    { number: '04', title: 'Surface support signals', description: 'Learners who may benefit from targeted support are surfaced for teacher verification.' },
    { number: '05', title: 'Recommend interventions', description: 'Actionable remediation plans are generated for each identified weakness.' },
    { number: '06', title: 'Prepare follow-up evidence', description: 'The pilot is designed to compare future follow-up assessments. Any recovery signal requires teacher verification and longitudinal evidence.' },
  ],
} as const;

export const LAYERS = {
  heading: 'Intelligence at every level.',
  subheading: 'One assessment pipeline, three stakeholder views.',
  layers: [
    {
      title: 'Teacher layer',
      description: 'See weak topics, question-by-question performance, and which learners need support from marks you already entered.',
      accent: 'from-cyan-500 to-blue-600',
      details: [
        'Topic-level class performance',
        'Question difficulty heatmaps',
        'Learner support lists',
      ],
    },
    {
      title: 'School layer',
      description: 'Compare class performance, spot subject-level trends, and track intervention effectiveness across your school.',
      accent: 'from-amber-400 to-orange-600',
      details: [
        'Cross-class comparisons',
        'Subject trend analysis',
        'Intervention outcome tracking',
      ],
    },
    {
      title: 'Stakeholder layer',
      description: 'Aggregate learning evidence across classes and grades without exposing individual learner identities.',
      accent: 'from-emerald-400 to-teal-600',
      details: [
        'Anonymized aggregate views',
        'Curriculum coverage indices',
        'Longitudinal performance trends',
      ],
    },
  ],
} as const;

export const METRICS = {
  heading: 'Anchored in structured assessment data.',
  subheading: 'The demo is seeded with structured, multi-school assessment data across Mathematics, English, and Combined Science.',
  items: [
    { value: '180', label: 'Learners assessed', color: 'text-violet-400' },
    { value: '39', label: 'Questions analysed', color: 'text-blue-400' },
    { value: '57%', label: 'Average school pass rate', color: 'text-emerald-400' },
    { value: '5', label: 'Weak topics identified', color: 'text-amber-400' },
    { value: '39', label: 'Learner support signals', color: 'text-red-400' },
    { value: '1,166', label: 'Marked data points processed', color: 'text-cyan-400' },
  ],
} as const;

export const INTERVENTION = {
  heading: 'From dashboards to action.',
  subheading: 'Impact Intelligence does not stop at reporting. It leads to measurable teaching interventions.',
  example: {
    topic: 'Ratios & Proportional Reasoning',
    score: '32%',
    status: 'Critical weakness',
    actions: [
      'Re-teach ratio simplification using concrete visual models',
      'Deploy targeted practice set RM-302',
      'Schedule 10-minute check assessment within 7 days',
    ],
  },
} as const;

export const PILOT = {
  heading: 'Start with one controlled pilot.',
  subheading: 'A contained assessment cycle designed to prove value before a school commits to wider rollout.',
  scope: [
    { item: '1 school', desc: 'Chosen pilot site' },
    { item: '1 class', desc: 'Representative learner group' },
    { item: '1 subject', desc: 'Mathematics or equivalent' },
    { item: '1 assessment', desc: 'Teacher-marked baseline' },
    { item: '1 support cycle', desc: 'Reteach and practice window' },
    { item: '1 report', desc: 'Evidence of learning change' },
  ],
  output: 'Pilot output: weak-topic analysis, learner support summary, teacher action brief, school improvement snapshot, and a before/after evidence report.',
  ctaPrimary: { label: 'Request a pilot', href: 'mailto:impact@zimlearngraph.com' },
  ctaSecondary: { label: 'View demo dashboard', href: '/impact/school-dashboard' },
} as const;

export const FINAL_CTA = {
  heading: 'Move from marks to measurable learning impact.',
  subheading: 'Bring assessment intelligence to your school.',
  ctaPrimary: { label: 'Book a walkthrough', href: 'mailto:impact@zimlearngraph.com' },
  ctaSecondary: { label: 'Open live demo', href: '/impact' },
} as const;

export const NAV = {
  logo: SITE.title,
  links: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Intelligence layers', href: '#layers' },
    { label: 'Metrics', href: '#metrics' },
    { label: 'Pilot', href: '#pilot' },
  ],
  cta: { label: 'View demo', href: '/impact' },
} as const;

