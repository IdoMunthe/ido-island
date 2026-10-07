import { motion, useReducedMotion } from "framer-motion";

// The wrapper every document section shares: a hairline above, generous
// space, and a gentle rise into view. `padding` is the vertical rhythm;
// the honest paragraph asks for more of it.
export function SectionShell({ id, className = "", padding = "py-12 md:py-16", labelledBy, children }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      aria-labelledby={labelledBy || `${id}-title`}
      className={`doc-section border-t border-rule ${padding} ${className}`}
      initial={reduce ? false : { opacity: 0.55, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px 0px" }}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
    >
      {children}
    </motion.section>
  );
}

// The opening of a section: the numbered mono rail label on the left and
// the heading, with its deck line, in the text column.
export function SectionHead({ id, label, title, subtitle }) {
  return (
    <div className="doc-head doc-rail-grid gap-y-3">
      <p className="eyebrow doc-rail md:pt-2.5">{label}</p>
      <div className="min-w-0">
        <h2 id={`${id}-title`} className="doc-title text-ink">
          {title}
        </h2>
        {subtitle ? <p className="doc-deck doc-measure mt-3 text-ink-soft">{subtitle}</p> : null}
      </div>
    </div>
  );
}

// One CV section. `layout="column"` keeps the content in the text column
// (a paragraph, a list); `layout="wide"` hands the whole width to the
// content, which then lays itself out — rows on the rail axis, a grid of
// cells, a grid of photographs. `aside` is a margin note: in the rail on
// desktop, after the content on phones and in print.
export function Section({ id, label, title, subtitle, children, layout = "column", aside = null }) {
  return (
    <SectionShell id={id}>
      <SectionHead id={id} label={label} title={title} subtitle={subtitle} />
      {layout === "column" ? (
        <div className="doc-rail-grid mt-7 md:mt-8">
          <div className="hidden md:block">{aside ? <div className="no-print pt-1">{aside}</div> : null}</div>
          <div className="min-w-0">
            {children}
            {aside ? <div className="print-block mt-5 md:hidden">{aside}</div> : null}
          </div>
        </div>
      ) : (
        <div className="mt-8 md:mt-10">{children}</div>
      )}
    </SectionShell>
  );
}

// A blue-ballpoint note in the margin.
export function MarginNote({ children, className = "" }) {
  if (!children) return null;
  return (
    <span className={`hand inline-block rotate-[-2deg] text-[1.35rem] ${className}`} aria-label={`Margin note: ${children}`}>
      {children}
    </span>
  );
}
