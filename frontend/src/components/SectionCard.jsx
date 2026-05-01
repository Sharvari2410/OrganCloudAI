import { motion } from "framer-motion";

function SectionCard({ title, subtitle, rightContent, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass rounded-2xl border border-white/70 p-5 shadow-card"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {rightContent}
      </div>
      {children}
    </motion.section>
  );
}

export default SectionCard;
