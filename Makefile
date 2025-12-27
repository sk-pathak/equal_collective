.PHONY: server dashboard demo clean

# Server: generate sqlc, build, and run
server:
	cd server && go run github.com/sqlc-dev/sqlc/cmd/sqlc@latest generate && go build -o xray-server && ./xray-server

# Demo: run the demo script
demo:
	cd demo && node index.js

# Dashboard: install deps and run dev server
dashboard:
	cd dashboard && pnpm install && pnpm dev

# Clean build artifacts
clean:
	rm -f server/xray-server server/xray.db
