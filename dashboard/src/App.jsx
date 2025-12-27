import { useState } from 'react';
import TraceList from './components/TraceList';
import TraceDetail from './components/TraceDetail';

function App() {
  const [selectedTraceId, setSelectedTraceId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 dark:text-gray-100 text-gray-900 font-sans">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center shadow-sm">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
          X-Ray
        </span>
        <span className="ml-3 text-sm text-gray-500 border-l pl-3 border-gray-300 dark:border-gray-700">
          Algorithm Debugger
        </span>
      </nav>

      <main>
        {selectedTraceId ? (
          <TraceDetail
            traceId={selectedTraceId}
            onBack={() => setSelectedTraceId(null)}
          />
        ) : (
          <TraceList onSelectTrace={setSelectedTraceId} />
        )}
      </main>
    </div>
  );
}

export default App;
