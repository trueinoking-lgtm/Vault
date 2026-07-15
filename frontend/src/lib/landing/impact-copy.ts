/* ============================================================
   HiveMind Intelligence — Public Landing Copy Constants
   All text content centralized here for easy review & editing.
   Naming hierarchy:
     HiveMind Intelligence (HMI)  — platform & public brand
     Impact Intelligence          — assessment & intervention module inside HMI
     ZimLearnGraph                — structured education-data layer beneath HMI
   Relationship: "Impact Intelligence by HiveMind Intelligence · Powered by ZimLearnGraph"
   ============================================================ */

export const SITE = {
  title: 'HiveMind Intelligence',
  altTitle: 'Impact Intelligence',
  url: '/impact-intelligence',
  // Public positioning line (from strategy doc)
  positioning: 'Driving education equity in Zimbabwe',
} as const;

export const HERO = {
  // Phrase-by-phrase reveal target (Turn school data / into governance / intelligence.)
  headlinePhrases: ['Turn school data', 'into governance', 'intelligence.'] as readonly string[],
  headline: 'Turn school data into governance intelligence.',
  subheadline:
    'HiveMind Intelligence collects, connects and analyses school data to produce practical decision signals for teachers, school leaders and education stakeholders.',
  secondaryStatement: 'Deterministic analysis first. AI advisory. Human decisions remain central.',
  ctaPrimary: { label: 'Explore the school intelligence workflow', href: '#workflow' },
  ctaSecondary: { label: 'View the controlled demonstration', href: '/impact' },
  trustStrip: [
    'Teacher-supportive',
    'Assessment-oriented',
    'Deterministic first',
    'AI advisory',
    'School-ready evidence',
  ] as readonly string[],
} as const;

// Section 2 — Example governance signal (Form 1B demonstration)
export const GOVERNANCE_SIGNAL = {
  eyebrow: 'Example governance signal',
  heading: 'What a school intelligence signal looks like',
  intro:
    'One class, connected to its context. HMI does not report a single average and stop. It surfaces granular evidence, marks contextual factors as possible causes, and leaves the decision to the teacher.',
  example: {
    headline: 'Form 1B requires targeted mathematics support',
    learnersBelowThreshold: 12,
    learnersTotal: 30,
    topGaps: ['ratios', 'fractions', 'multi-step problem solving'] as readonly string[],
    classGap: '18 percentage points below Form 1A on the same assessment',
    evidenceRequiringReview: [
      'Two curriculum topics were only partially covered.',
      'This class has the highest learner-to-teacher ratio in the grade.',
      'Most errors occurred on multi-step questions.',
      'Six affected learners also showed weakness in the previous assessment.',
    ] as readonly string[],
    recommendedResponse: [
      'Conduct focused reteaching.',
      'Group learners by misconception.',
      'Provide worked examples and targeted practice.',
      'Reassess within seven days.',
      'Compare the follow-up results with the baseline.',
    ] as readonly string[],
  },
  labels: {
    possibleContributingFactors: 'Possible contributing factors',
    associatedConditions: 'Associated conditions',
    evidenceRequiringReview: 'Evidence requiring human review',
  },
} as const;

// Section 3 — Data HMI connects
export const DATA_CATEGORIES = {
  eyebrow: 'Data HMI connects',
  heading: 'More than marks.',
  subheading:
    'HiveMind Intelligence works with the scattered evidence schools already hold — administrative, resource, assessment and intervention data — not just test scores.',
  categories: [
    {
      title: 'School administration',
      icon: 'admin',
      items: [
        'Enrolment',
        'Number of teachers',
        'Classes and streams',
        'Subjects',
        'Attendance where available',
        'Staffing allocations',
      ] as readonly string[],
    },
    {
      title: 'School resources and environment',
      icon: 'resource',
      items: [
        'Library availability',
        'Laboratories',
        'Sports fields',
        'Textbooks and learning materials',
        'Devices and connectivity',
        'Classroom capacity',
        'Other relevant facilities',
      ] as readonly string[],
    },
    {
      title: 'Learning and assessment evidence',
      icon: 'assessment',
      items: [
        'Assessments',
        'Question-level marks',
        'Topics and curriculum objectives',
        'Learner performance',
        'Class performance',
        'Question difficulty',
        'Recurring misconceptions',
      ] as readonly string[],
    },
    {
      title: 'Teaching and intervention evidence',
      icon: 'intervention',
      items: [
        'Topics taught',
        'Curriculum coverage',
        'Reteaching plans',
        'Learner-support groups',
        'Intervention actions',
        'Follow-up assessments',
        'Changes after support',
      ] as readonly string[],
    },
  ] as const,
} as const;

// Section 4 — Actual product workflow (replaces the duplicated assessment pipeline)
export const WORKFLOW = {
  eyebrow: 'Actual product workflow',
  heading: 'From scattered school data to governance evidence.',
  subheading: 'One clear workflow. Deterministic analysis first; AI supports the teacher, not the other way around.',
  steps: [
    {
      number: '01',
      title: 'Build the school profile',
      description:
        'Schools enter administrative, staffing, enrolment, class, subject and resource information.',
    },
    {
      number: '02',
      title: 'Record micro-assessment evidence',
      description: 'Teachers upload spreadsheets or enter question-level assessment results.',
    },
    {
      number: '03',
      title: 'Map evidence to the curriculum',
      description:
        'Each assessment question is linked to the relevant topic, skill and curriculum objective.',
    },
    {
      number: '04',
      title: 'Connect performance with school context',
      description:
        'HMI analyses learning patterns alongside class size, staffing, resource availability, previous performance and curriculum coverage.',
    },
    {
      number: '05',
      title: 'Generate intelligence signals',
      description:
        'The system identifies weak topics, difficult questions, affected learner groups, class-level performance differences, recurring misconceptions, possible contributing factors, and issues requiring leadership review.',
    },
    {
      number: '06',
      title: 'Plan teacher-led support',
      description:
        'HMI recommends possible support actions while keeping teacher judgement central.',
    },
    {
      number: '07',
      title: 'Implement and track change',
      description:
        'Teachers and school leaders record the action taken and compare later evidence with the original baseline.',
    },
    {
      number: '08',
      title: 'Produce governance evidence',
      description:
        'HMI creates outputs for teachers, heads of department, school leadership, district or policy stakeholders, and curriculum and examination planning where appropriate.',
    },
  ] as const,
} as const;

export const LAYERS = {
  eyebrow: 'Intelligence levels',
  heading: 'Intelligence at three levels.',
  subheading: 'One connected data model, three decision audiences.',
  layers: [
    {
      title: 'Teacher intelligence',
      description:
        'Question-level, topic-level and learner-group evidence that helps a teacher decide the next classroom action.',
      accent: 'from-cyan-500 to-blue-600',
      details: [
        'Weak-topic analysis',
        'Difficult-question analysis',
        'Learner-support signals',
        'Misconception grouping',
        'Reteaching recommendations',
        'Follow-up checks',
        'Evidence of change',
      ] as readonly string[],
    },
    {
      title: 'School leadership intelligence',
      description:
        'Class, stream and school patterns that help leaders see where support is working and where it is still needed.',
      accent: 'from-amber-400 to-orange-600',
      details: [
        'Class and stream comparison',
        'Learner-to-teacher ratios',
        'Curriculum-coverage signals',
        'Teacher-allocation patterns',
        'Resource gaps',
        'Intervention progress',
        'Performance trends',
        'Areas requiring leadership action',
      ] as readonly string[],
    },
    {
      title: 'Stakeholder intelligence',
      description:
        'Aggregated or anonymised evidence for district, policy and infrastructure planning — without exposing learner-sensitive data.',
      accent: 'from-emerald-400 to-teal-600',
      details: [
        'Resource-allocation planning',
        'District and school trend analysis',
        'Curriculum weakness detection',
        'Examination-readiness signals',
        'Infrastructure planning',
        'Policy evaluation',
        'Long-term education planning',
      ] as readonly string[],
    },
  ] as const,
  sensitiveNote:
    'Learner-sensitive data must not be exposed carelessly. Stakeholder outputs are aggregated or anonymised where necessary.',
} as const;

// Section 6 — Powered by ZimLearnGraph
export const ZLG = {
  eyebrow: 'Powered by ZimLearnGraph',
  heading: 'The structured education-data layer beneath HMI.',
  body: 'ZimLearnGraph connects schools, classes, teachers, learners, assessments, questions, curriculum topics, resources, interventions and follow-up evidence across time. It is not a dataset dump — it is the structured relationship and intelligence layer that lets HMI turn scattered school data into connected evidence.',
  flow: [
    'School',
    'Classes',
    'Teachers & learners',
    'Assessments',
    'Questions',
    'Topics',
    'Signals',
    'Interventions',
    'Follow-up evidence',
  ] as readonly string[],
} as const;

// Section 7 — Outputs (operational vs longitudinal)
export const OUTPUTS = {
  eyebrow: 'Outputs',
  heading: 'From classroom evidence to governance documents.',
  operational: {
    label: 'Operational outputs',
    note: 'Available today in the controlled demonstration.',
    items: [
      'Weak-topic reports',
      'Difficult-question analysis',
      'Learner-support signals',
      'Class-comparison reports',
      'Teacher reteaching briefs',
      'Intervention plans',
      'Follow-up evidence reports',
      'School improvement snapshots',
    ] as readonly string[],
  },
  longitudinal: {
    label: 'Longitudinal capabilities',
    note: 'As sufficient longitudinal and representative data becomes available, HMI can support the development of these. They are not yet validated or fully operational.',
    items: [
      'Examination-readiness forecasts',
      'School-risk trend models',
      'Resource-allocation signals',
      'Curriculum-development datasets',
      'Broader performance prediction models',
      'Evidence for examination and policy planning',
    ] as readonly string[],
  },
} as const;

export const AI_BOUNDARIES = {
  eyebrow: 'Trust, governance and AI boundaries',
  heading: 'Built for evidence, not automated judgement.',
  subheading:
    'HMI keeps the source of truth visible: teacher-marked evidence, transparent topic mapping, and advisory summaries that support human decisions.',
  principles: [
    {
      title: 'Teacher-supportive',
      detail: 'Every signal is framed to help a teacher act, not to replace professional judgement.',
      icon: 'users',
    },
    {
      title: 'Assessment-oriented',
      detail: 'Grounded in question-level and topic-level evidence, not vague aggregate claims.',
      icon: 'list',
    },
    {
      title: 'Deterministic first',
      detail: 'Weak-topic signals, pass rates and support lists are derived from structured evidence.',
      icon: 'database',
    },
    {
      title: 'AI advisory',
      detail: 'Generated summaries explain patterns and possible actions. They do not grade learners or make final decisions.',
      icon: 'brain',
    },
    {
      title: 'Human judgement remains central',
      detail: 'Teachers and school leaders make the final call on support, promotion and resource use.',
      icon: 'gavel',
    },
    {
      title: 'Sensitive data protected',
      detail: 'Learner-sensitive information is protected. Stakeholder outputs are aggregated or anonymised where necessary.',
      icon: 'lock',
    },
  ] as const,
} as const;

// Impact Intelligence module (assessment) — kept as a module inside HMI
export const IMPACT_MODULE = {
  eyebrow: 'Impact Intelligence',
  headline: 'Turn marked tests into learning intelligence.',
  subheading:
    'Impact Intelligence is the assessment and intervention intelligence module inside HiveMind Intelligence. It maps marked evidence to curriculum topics and surfaces where support is needed.',
} as const;

export const METRICS = {
  heading: 'Anchored in structured school data.',
  subheading:
    'The controlled demonstration is seeded with structured, multi-school evidence across Mathematics, English and Combined Science.',
  items: [
    { value: '180', label: 'Learners assessed', color: 'text-violet-400' },
    { value: '39', label: 'Questions analysed', color: 'text-blue-400' },
    { value: '57%', label: 'School pass rate', color: 'text-emerald-400' },
    { value: '5', label: 'Weak topics identified', color: 'text-amber-400' },
    { value: '39', label: 'Learner support signals', color: 'text-red-400' },
    { value: '1,166', label: 'Marked data points processed', color: 'text-cyan-400' },
  ],
} as const;

export const PILOT = {
  eyebrow: 'Controlled pilot',
  heading: 'Start with one controlled school intelligence pilot.',
  subheading:
    'A contained, repeatable cycle — honest about what it demonstrates and what it does not.',
  scope: [
    { item: '1 school', desc: 'Chosen pilot site' },
    { item: '1 grade', desc: 'Representative year group' },
    { item: '1 subject', desc: 'Mathematics or equivalent' },
    { item: 'Selected classes', desc: 'Within the grade' },
    { item: 'Repeated assessment cycles', desc: 'Baseline and follow-up' },
    { item: 'Intervention tracking', desc: 'Action and measurement' },
    { item: 'Follow-up evidence', desc: 'Compare with baseline' },
  ],
  output:
    'Pilot output: weak-topic analysis, learner support summary, teacher action brief, school improvement snapshot, and a before/after evidence report.',
  ctaPrimary: { label: 'Request a controlled school intelligence pilot', href: 'mailto:impact@hivemind.intelligence' },
  ctaSecondary: { label: 'View the controlled demonstration', href: '/impact' },
} as const;

export const FINAL_CTA = {
  heading: 'Turn your school data into governance intelligence.',
  subheading: 'Bring school intelligence to teachers, leaders and stakeholders.',
  ctaPrimary: { label: 'Book a walkthrough', href: 'mailto:impact@hivemind.intelligence' },
  ctaSecondary: { label: 'Open the demonstration', href: '/impact' },
} as const;

export const NAV = {
  logo: 'HiveMind Intelligence',
  links: [
    { label: 'Governance signal', href: '#governance-signal' },
    { label: 'Data HMI connects', href: '#data-categories' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Intelligence levels', href: '#layers' },
    { label: 'Powered by ZimLearnGraph', href: '#zlg' },
    { label: 'Pilot', href: '#pilot' },
  ],
  cta: { label: 'Explore workflow', href: '#workflow' },
} as const;
