import { useMemo, useState } from "react";
import EntityCrudPage from "./EntityCrudPage";

function ModuleCrudWorkbench({ sections = [] }) {
  const safeSections = useMemo(() => sections.filter(Boolean), [sections]);
  const [selectedKey, setSelectedKey] = useState(safeSections[0]?.key || "");

  const selected = safeSections.find((section) => section.key === selectedKey) || safeSections[0];

  if (!selected) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl border border-white/70 p-3 shadow-card">
        <div className="flex flex-wrap gap-2">
          {safeSections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setSelectedKey(section.key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                section.key === selected.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 hover:bg-brand-100 hover:text-brand-700"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <EntityCrudPage
        key={selected.key}
        entity={selected.entity}
        idKey={selected.idKey}
        title={selected.title}
        subtitle={selected.subtitle}
        quickFilters={selected.quickFilters}
        formFields={selected.formFields}
        columns={selected.columns}
      />
    </div>
  );
}

export default ModuleCrudWorkbench;
