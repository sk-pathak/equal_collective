-- name: CreateTrace :one
INSERT INTO traces (id, name, status, metadata, started_at)
VALUES (?, ?, ?, ?, ?)
RETURNING *;

-- name: UpdateTraceStatus :one
UPDATE traces
SET status = ?, completed_at = ?
WHERE id = ?
RETURNING *;

-- name: GetTrace :one
SELECT * FROM traces
WHERE id = ? LIMIT 1;

-- name: ListTraces :many
SELECT * FROM traces
ORDER BY started_at DESC
LIMIT 50;

-- name: CreateStep :one
INSERT INTO steps (
  id, trace_id, parent_step_id, step_name, status, input, output, reasoning, started_at, ended_at, order_index
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
RETURNING *;

-- name: UpdateStep :one
UPDATE steps
SET status = ?, output = ?, reasoning = ?, ended_at = ?
WHERE id = ?
RETURNING *;

-- name: ListStepsByTrace :many
SELECT * FROM steps
WHERE trace_id = ?
ORDER BY order_index ASC;
