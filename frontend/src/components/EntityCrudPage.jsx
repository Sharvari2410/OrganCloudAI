import { useEffect, useMemo, useState } from "react";
import { createEntity, deleteEntity, fetchEntityList, updateEntity } from "../api/client";
import DataTable from "./DataTable";
import SectionCard from "./SectionCard";

function EntityCrudPage({
  entity,
  idKey,
  columns,
  formFields,
  title,
  subtitle,
  quickFilters = [],
}) {
  const initialForm = useMemo(
    () =>
      formFields.reduce((acc, field) => {
        acc[field.key] = "";
        return acc;
      }, {}),
    [formFields]
  );

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(quickFilters[0]?.value || "");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const activeFilter = quickFilters.find((f) => f.value === selectedFilter);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, q: search };
      if (activeFilter?.column && activeFilter?.criteria) {
        params[activeFilter.column] = activeFilter.criteria;
      }
      const response = await fetchEntityList(entity, params);
      setRows(response.items || []);
      setPagination(response.pagination || { page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [search, selectedFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") payload[key] = null;
    });

    const shouldReloadFirstPage = !editingId;

    if (editingId) {
      await updateEntity(entity, editingId, payload);
    } else {
      await createEntity(entity, payload);
    }

    setForm(initialForm);
    setEditingId(null);
    loadData(shouldReloadFirstPage ? 1 : pagination.page);
  };

  const handleEdit = (row) => {
    setEditingId(row[idKey]);
    const next = { ...initialForm };
    formFields.forEach((field) => {
      next[field.key] = row[field.key] ?? "";
    });
    setForm(next);
  };

  const handleDelete = async (id) => {
    await deleteEntity(entity, id);
    loadData(pagination.page);
  };

  return (
    <div className="space-y-6">
      <SectionCard title={title} subtitle={subtitle}>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 focus:ring"
          />
          <select
            value={selectedFilter}
            onChange={(event) => setSelectedFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 focus:ring"
          >
            {quickFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => loadData(1)}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Apply Filters
          </button>
        </div>
      </SectionCard>

      <SectionCard title={editingId ? "Update Record" : "Add Record"}>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
          {formFields.map((field) => (
            <label key={field.key} className="text-sm font-semibold text-slate-600">
              {field.label}
              <input
                type={field.type || "text"}
                value={form[field.key] ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 outline-none ring-brand-200 focus:ring"
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              />
            </label>
          ))}
          <div className="md:col-span-3 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
                className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Records"
        rightContent={
          <p className="text-sm font-semibold text-slate-500">
            Page {pagination.page} / {pagination.totalPages}
          </p>
        }
      >
        <DataTable columns={columns} rows={rows} idKey={idKey} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadData(pagination.page - 1)}
            className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadData(pagination.page + 1)}
            className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

export default EntityCrudPage;
