.PHONY: all build index wasm solve test clean serve https-serve serve-https cert-https

# Build everything: Go WASM + React app
all: build

# Full production build
build: index wasm
	cd web && npm run build

# Generate the canonical puzzle browser index from puzzles/*.json metadata.
index:
	cd core && go run ./cmd/buildindex ../puzzles

# Build Go WASM binary and copy wasm_exec.js into web/public/
wasm:
	cd core && GOARCH=wasm GOOS=js go build -o ../web/public/sliding-puzzle.wasm ./cmd/wasm/
	cp $$(go env GOROOT)/lib/wasm/wasm_exec.js web/public/wasm_exec.js

# Compute min_moves for any puzzle that doesn't have it yet.
# Run this after adding new puzzle JSON files.
# Override the per-puzzle search limit with: make solve TIMEOUT=2m
TIMEOUT ?= 30s
solve:
	cd core && go run ./cmd/solve/ -timeout $(TIMEOUT) -skip-solved ../puzzles/*.json
	$(MAKE) index

# Run Go tests
test:
	cd core && go test ./...

# Serve the production build locally (requires a static file server)
serve:
	cd web/dist && python3 -m http.server 8080

# Generate a self-signed local HTTPS certificate for phone/PWA testing.
# Usage: make cert-https IP=192.168.1.161
cert-https:
	./scripts/generate_local_https_cert.sh $(IP)

# Serve the production build over HTTPS for local phone/PWA testing.
https-serve:
	python3 ./scripts/serve_https.py --dir web/dist --host 0.0.0.0 --port 8443

# Backward-compatible alias for the old target name.
serve-https: https-serve

clean:
	rm -f web/public/sliding-puzzle.wasm web/public/wasm_exec.js
	rm -rf web/dist
