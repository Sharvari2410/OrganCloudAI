function TransportTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-slate-500">No timeline updates yet.</p>;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.tracking_id} className="relative border-l-2 border-brand-200 pl-4">
          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-brand-600" />
          <p className="text-sm font-semibold text-slate-800">{event.current_location}</p>
          <p className="text-xs text-slate-500">{new Date(event.update_time).toLocaleString()}</p>
          <p className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
            {event.status}
          </p>
        </div>
      ))}
    </div>
  );
}

export default TransportTimeline;
