import { useEffect, useState } from 'react';

export default function TraceDetail({ traceId, onBack }) {
  const [data, setData] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/traces/${traceId}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        if (data.steps && data.steps.length > 0) {
          setSelectedStep(data.steps[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [traceId]);

  if (loading) return <div className="p-4">Loading trace details...</div>;
  if (!data) return <div className="p-4">Trace not found</div>;

  const { trace, steps } = data;

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:underline mb-1">
            &larr; Back to List
          </button>
          <h1 className="text-2xl font-bold">{trace.name}</h1>
          <div className="text-sm text-gray-500">
            {new Date(trace.started_at).toLocaleString()} - {trace.status}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Timeline */}
        <div className="w-1/3 border-r overflow-y-auto bg-white dark:bg-gray-800">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => setSelectedStep(step)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedStep?.id === step.id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500' : ''
                }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold">{step.step_name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${step.status === 'COMPLETED' || step.output
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
                >
                  {step.status || (step.output ? 'OK' : 'FAIL')}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {step.reasoning?.Valid ? step.reasoning.String : "No reasoning provided"}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Step Details */}
        <div className="w-2/3 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {selectedStep ? (
            <div>
              <h2 className="text-xl font-bold mb-4">{selectedStep.step_name}</h2>

              {selectedStep.reasoning?.Valid && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide mb-1">Reasoning</h3>
                  <p className="text-gray-800 dark:text-gray-200">{selectedStep.reasoning.String}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Input</h3>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded border overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedStep.input || {}, null, 2)}
                    </pre>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Output</h3>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded border overflow-x-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(selectedStep.output || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a step to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
