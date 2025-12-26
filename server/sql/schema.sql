CREATE TABLE IF NOT EXISTS traces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED'
  metadata JSON
);

CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  parent_step_id TEXT,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED'
  input JSON,
  output JSON,
  reasoning TEXT,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (trace_id) REFERENCES traces(id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_steps_trace_id ON steps(trace_id);
CREATE INDEX IF NOT EXISTS idx_traces_started_at ON traces(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_steps_order ON steps(trace_id, order_index);
