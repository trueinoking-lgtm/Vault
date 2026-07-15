const items = [
  "Teacher-supportive",
  "Assessment-oriented",
  "Deterministic first",
  "AI advisory",
  "School-ready evidence",
] as const;

export default function ImpactEvidenceStrip() {
  return (
    <section aria-label="Product principles" className="relative z-10 border-y border-white/[0.04] bg-[#050814]/86 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 lg:px-12">
        {items.map((item) => (
          <span key={item} className="text-xs font-medium text-slate-400 sm:text-sm">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
