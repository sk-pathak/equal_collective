import { useEffect, useState } from 'react';

export default function TraceList({ onSelectTrace }) {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/traces')
      .then((res) => res.json())
      .then((data) => {
        setTraces(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading traces...</div>;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Recent Traces</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Time</th>
              <th className="py-2 px-4 border-b text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {traces.map((trace) => (
              <tr
                key={trace.id}
                onClick={() => onSelectTrace(trace.id)}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="py-2 px-4 border-b">
                  <span
                    className={`px-2 py-1 rounded text-sm ${trace.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : trace.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}
                  >
                    {trace.status}
                  </span>
                </td>
                <td className="py-2 px-4 border-b font-medium">{trace.name}</td>
                <td className="py-2 px-4 border-b text-gray-500">
                  {new Date(trace.started_at).toLocaleString()}
                </td>
                <td className="py-2 px-4 border-b text-gray-400 font-mono text-xs">
                  {trace.id.substring(0, 8)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
