/* ============================================================
   Impact Intelligence Landing Page — Copy Constants
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
    'ZimLearnGraph Impact transforms teacher-marked assessments into weak-topic analysis, learner support signals, intervention plans, and school-level evidence.',
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
    'Every marked test contains critical learning signals — which questions exposed misconceptions, which topics need reteaching, which learners are falling behind. But after the score is recorded, most of that intelligence stays trapped inside paper mark books and static spreadsheets.',
    'Impact Intelligence extracts those signals and surfaces them as actionable evidence — for teachers, school leaders, and educational stakeholders.',
  ],
} as const;

export const HOW_IT_WORKS = {
  heading: 'From marks to measurable insight.',
  steps: [
    { number: '01', title: 'Record marks', description: 'Teachers enter or upload raw assessment scores. No complex setup.' },
    { number: '02', title: 'Map to topics', description: 'Questions are linked to curriculum topics. The structure mirrors what was taught.' },
    { number: '03', title: 'Detect weaknesses', description: 'The system identifies topic-level gaps across the class and flags systemic issues.' },
    { number: '04', title: 'Flag risk', description: 'Learners requiring targeted support are surfaced programmatically.' },
    { number: '05', title: 'Recommend interventions', description: 'Actionable remediation plans are generated for each identified weakness.' },
    { number: '06', title: 'Track improvement', description: 'Progress is measured over time. Follow-up assessments confirm recovery.' },
  ],
} as const;

export const LAYERS = {
  heading: 'Intelligence at every level.',
  subheading: 'One assessment pipeline, three stakeholder views.',
  layers: [
    {
      title: 'Teacher layer',
      description: 'See weak topics, question-by-question performance, and which learners need support — all derived from marks you already entered.',
      accent: 'from-cyan-500 to-blue-600',
      icon: '🎯',
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
      icon: '📊',
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
      icon: '🔭',
      details: [
        'Anonymized aggregate views',
        'Curriculum coverage indices',
        'Longitudinal performance trends',
      ],
    },
  ],
} as const;

export const METRICS = {
  heading: 'Anchored in real assessment data.',
  subheading: 'The live demo is seeded with structured diagnostic data from a standard mathematics assessment.',
  items: [
    { value: '30', label: 'Learners assessed', color: 'text-cyan-400' },
    { value: '8', label: 'Questions analysed', color: 'text-blue-400' },
    { value: '50%', label: 'Pass rate', color: 'text-amber-400' },
    { value: '5', label: 'Weak topics identified', color: 'text-amber-400' },
    { value: '15', label: 'Learners flagged for support', color: 'text-red-400' },
    { value: '240', label: 'Marked data points processed', color: 'text-cyan-400' },
  ],
} as const;

export const INTERVENTION = {
  heading: 'From dashboards to action.',
  subheading: 'Impact Intelligence does not stop at reporting — it leads to measurable teaching interventions.',
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
  subheading: 'A contained, measurable first engagement — designed to demonstrate impact before commitment.',
  scope: [
    { item: '1 school', desc: 'Your chosen pilot site' },
    { item: '1 teacher', desc: 'Familiar with the class and subject' },
    { item: '1 class', desc: 'A representative learner group' },
    { item: '1 subject', desc: 'Mathematics or equivalent' },
    { item: '1 diagnostic', desc: 'Baseline assessment' },
    { item: '1 follow-up', desc: 'Measure improvement' },
  ],
  output: 'A school learning impact report showing weak-topic analysis, learner support needs, and intervention progress.',
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
