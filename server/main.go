package main

import (
	"database/sql"
	_ "embed"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/equal-collective/xray/database"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed sql/schema.sql
var ddl string

func main() {
	db, err := sql.Open("sqlite3", "./xray.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := initSchema(db); err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	queries := database.New(db)

	mux := http.NewServeMux()

	// 1. Create Trace
	mux.HandleFunc("POST /api/traces", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name     string          `json:"name"`
			Metadata json.RawMessage `json:"metadata"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		id := uuid.New().String()
		trace, err := queries.CreateTrace(r.Context(), database.CreateTraceParams{
			ID:        id,
			Name:      req.Name,
			Status:    "RUNNING",
			Metadata:  req.Metadata,
			StartedAt: time.Now(),
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(trace)
	})

	// 2. Append Step
	mux.HandleFunc("POST /api/steps", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			TraceID      string          `json:"trace_id"`
			ParentStepID *string         `json:"parent_step_id"`
			StepName     string          `json:"step_name"`
			Status       string          `json:"status"`
			Input        json.RawMessage `json:"input"`
			Output       json.RawMessage `json:"output"`
			Reasoning    *string         `json:"reasoning"`
			StartedAt    time.Time       `json:"started_at"`
			EndedAt      *time.Time      `json:"ended_at"`
			OrderIndex   int64           `json:"order_index"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if req.StartedAt.IsZero() {
			req.StartedAt = time.Now()
		}

		id := uuid.New().String()
		step, err := queries.CreateStep(r.Context(), database.CreateStepParams{
			ID:           id,
			TraceID:      req.TraceID,
			ParentStepID: toNullString(req.ParentStepID),
			StepName:     req.StepName,
			Status:       req.Status,
			Input:        req.Input,
			Output:       req.Output,
			Reasoning:    toNullString(req.Reasoning),
			StartedAt:    req.StartedAt,
			EndedAt:      toNullTime(req.EndedAt),
			OrderIndex:   req.OrderIndex,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(step)
	})

    // 3. Update Trace
    mux.HandleFunc("PATCH /api/traces/{traceId}", func(w http.ResponseWriter, r *http.Request) {
        traceId := r.PathValue("traceId")
         var req struct {
            Status string `json:"status"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        
        updated, err := queries.UpdateTraceStatus(r.Context(), database.UpdateTraceStatusParams{
            Status: req.Status,
            CompletedAt: sql.NullTime{Time: time.Now(), Valid: true},
            ID: traceId,
        })
        if err != nil {
             http.Error(w, err.Error(), http.StatusInternalServerError)
             return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(updated)
    })

	// 4. List Traces
	mux.HandleFunc("GET /api/traces", func(w http.ResponseWriter, r *http.Request) {
		traces, err := queries.ListTraces(r.Context())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(traces)
	})

	// 5. Get Trace Detail
	mux.HandleFunc("GET /api/traces/{traceId}", func(w http.ResponseWriter, r *http.Request) {
		traceID := r.PathValue("traceId")
		trace, err := queries.GetTrace(r.Context(), traceID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		steps, err := queries.ListStepsByTrace(r.Context(), traceID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp := struct {
			Trace database.Trace  `json:"trace"`
			Steps []database.Step `json:"steps"`
		}{
			Trace: trace,
			Steps: steps,
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(resp)
	})

	log.Println("Server executing on :8080")
	if err := http.ListenAndServe(":8080", enableCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        if r.Method == "OPTIONS" {
            return
        }

		next.ServeHTTP(w, r)
	})
}

func toNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}

func toNullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

func initSchema(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(ddl); err != nil {
		return err
	}

	return tx.Commit()
}
