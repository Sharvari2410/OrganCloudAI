function DataTable({ columns = [], rows = [], idKey, onEdit, onDelete, loading }) {
  if (loading) {
    return <p className="py-8 text-sm text-slate-500">Loading records...</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-3 text-left font-semibold text-slate-600">
                  {column.label}
                </th>
              ))}
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row[idKey]} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={`${row[idKey]}-${column.key}`} className="px-3 py-3 text-slate-700">
                      {column.render ? column.render(row[column.key], row) : row[column.key] ?? "-"}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row[idKey])}
                        className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={columns.length + 1}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
