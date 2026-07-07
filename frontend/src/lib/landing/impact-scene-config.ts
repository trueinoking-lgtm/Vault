/* ============================================================
   Impact Intelligence — 3D Scene Configuration
   Central constants for the R3F hero scene layout.
   ============================================================ */

export const SCENE = {
  camera: { position: [0, 0, 8] as [number, number, number], fov: 45, near: 0.1, far: 100 },
  bgColor: '#050814',
} as const;

export const PARTICLES = {
  count: 2000,
  spread: { x: 8, y: 5, z: 4 },
  colors: {
    cyan: '#00f0ff',
    blue: '#1e40af',
    amber: '#f59e0b',
    white: '#ffffff',
  },
  sizes: { min: 0.02, max: 0.08 },
  opacity: 0.6,
} as const;

export const QUESTIONS = [
  { id: 'Q1', label: 'Q1', position: [-2.8, 2.2, 0.8] as [number, number, number] },
  { id: 'Q2', label: 'Q2', position: [-3.2, 1.2, -0.4] as [number, number, number] },
  { id: 'Q3', label: 'Q3', position: [-2.8, 0.2, 0.6] as [number, number, number] },
  { id: 'Q4', label: 'Q4', position: [-3.2, -0.8, -0.6] as [number, number, number] },
  { id: 'Q5', label: 'Q5', position: [-2.6, -1.8, 0.4] as [number, number, number] },
  { id: 'Q6', label: 'Q6', position: [-3.4, -2.4, -0.2] as [number, number, number] },
  { id: 'Q7', label: 'Q7', position: [-2.2, -3.0, 0.8] as [number, number, number] },
  { id: 'Q8', label: 'Q8', position: [-3.6, -3.2, -0.6] as [number, number, number] },
] as const;

export const TOPICS = [
  { id: 'fractions', label: 'Fractions', position: [2.5, 1.8, 0.0] as [number, number, number], score: 72, color: '#00f0ff' },
  { id: 'ratios', label: 'Ratios', position: [3.5, 0.6, 0.6] as [number, number, number], score: 32, color: '#f59e0b' },
  { id: 'percentages', label: 'Percentages', position: [3.0, -0.6, -0.4] as [number, number, number], score: 58, color: '#1e40af' },
  { id: 'graphs', label: 'Graphs', position: [2.0, -1.8, 0.3] as [number, number, number], score: 65, color: '#00f0ff' },
  { id: 'word-problems', label: 'Word Problems', position: [1.0, -2.8, -0.5] as [number, number, number], score: 41, color: '#f59e0b' },
] as const;

export const DASHBOARD_PANELS = [
  { label: 'Pass Rate', value: '50%', position: [-1.5, 3.0, -2.5] as [number, number, number], color: '#00f0ff' },
  { label: 'Weak Topics', value: '5', position: [0.0, 3.2, -3.0] as [number, number, number], color: '#f59e0b' },
  { label: 'At Risk', value: '15', position: [1.5, 3.0, -2.5] as [number, number, number], color: '#f97316' },
  { label: 'Interventions', value: '3', position: [3.0, 2.8, -2.0] as [number, number, number], color: '#10b981' },
] as const;

export const STREAMS = [
  { from: 0, to: 0 }, // Q1 → Fractions
  { from: 1, to: 0 }, // Q2 → Fractions
  { from: 2, to: 1 }, // Q3 → Ratios
  { from: 3, to: 1 }, // Q4 → Ratios
  { from: 4, to: 2 }, // Q5 → Percentages
  { from: 5, to: 2 }, // Q6 → Percentages
  { from: 6, to: 3 }, // Q7 → Graphs
  { from: 7, to: 4 }, // Q8 → Word Problems
] as const;
