.PHONY: server demo clean

# Server: generate sqlc, build, and run
server:
	cd server && sqlc generate && go build -o xray-server && ./xray-server

# Demo: run the demo script
demo:
	cd demo && node index.js

# Clean build artifacts
clean:
	rm -f server/xray-server server/xray.db
