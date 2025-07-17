Product Requirements Document – Chess Voice / Multiplayer Project (Phases 1‑3)

Version 0.2 – 2025‑07‑16

⸻

1 · Purpose

Create a browser‑based chessboard that supports (a) validated play through chess.js, (b) optional voice‑driven moves powered by ElevenLabs streaming STT, and (c) pluggable opponents: either another human connected by a lightweight Socket.IO room or a local Stockfish engine.

⸻

2 · Design Principles & Priorities
	•	Simplicity First – Deliver a clean, happy path with minimal surface area and clear seams for later growth.
	•	Phased Implementation – Core > Voice > Multiplayer/AI; each phase complete & testable on its own.
	•	Minimise Error Surface – Small, explicit APIs; unit‑test around GameBus; prefer fail‑fast semantics.
	•	Implementation Priorities
  – Cost ≠ issue (ample STT tokens).
  – Ease of implementation > micro‑optimisation.
  – Avoid complexity traps/time sinks.
  – Predictability & stability over raw perf.
  – Use well‑documented, battle‑tested libs.
	•	LLM‑Aided Dev – Smaller scope & sharper interfaces reduce hallucination risk in generated code.
	•	Transport Choice – Prefer the path with fewer edge‑case pitfalls and better DX; ultra‑low‑latency not required.

⸻

3 · Outstanding Ambiguities & Proposed Resolutions

#	Topic	Ambiguity	Proposed Resolution
1	STT Quota	Will ElevenLabs usage be rate‑limited?	Quota declared non‑issue – proceed with stream‑first design.
2	Voice‑to‑Move Authority	If two users & voice both issue commands, who wins?	Each client tagged (socket.id); server applies moves FIFO & echoes author in event. Voice belongs to local user only.
3	Board Sync Source of Truth	Client vs server FEN?	Server holds authoritative chess.js; clients are render‑only.
4	Deployment Target	Where does the Node hub live?	Use Render or Fly.io free tier for demo; containerise with Dockerfile.​
5	Security	Need auth for casual rooms?	No—rooms are 6‑char IDs. Not sensitive.
6	Engine Strength	Stockfish depth?	Depth 12 limit; permit spinner visual while engine thinks.

Open to change if requirements evolve.

⸻

4 · Transport Layer Decision Matrix (Socket.IO vs WebRTC)

Criterion	Socket.IO	WebRTC (peer‑data)	Commentary
Impl. Complexity	⭐ Very low – single npm lib, server relay	⚠️ Higher – signalling, STUN/TURN infra	Socket.IO simpler for student timeframe
NAT / Firewall	Relayed via same WS port; virtually no issues	Peer‑to‑peer often blocked, TURN required	More edge cases with WebRTC
Server Cost	Needs 1 small Node process	TURN servers add cost if peers fail to connect	Cost not issue, but setup friction higher
Latency	~50–100 ms round‑trip via relay	Can be 10–30 ms peer‑to‑peer	Project doesn’t need ultra‑low latency
Reliability & Ordering	Built‑in ack & ordered delivery	Requires ordered + reliable datachannel config	Reliability easier with Socket.IO
Scalability	Server hop for each message	Scales well peer‑mesh, but only 2 players	2‑player load trivial for Socket.IO
Debug Tooling	Chrome devtools WS inspectors + simple logs	WebRTC ICE debugging notoriously tricky	Fewer hidden states with Socket.IO
LLM‑Generated Code Risk	Lower – API surface small, examples abundant	Higher – ICE/STUN flows are subtle	Aligns with “minimise error surface”

Recommendation: use Socket.IO for Phase 3 multiplayer; defer WebRTC unless later perf/infra needs dictate.  Node server already required for Stockfish worker & ElevenLabs proxy, so piggy‑backing is natural.

⸻

(Sections beyond 4 re‑numbered accordingly.)## 3 · Non‑Goals
	•	Bulletproof anti‑cheat, advanced ratings, or long‑term match storage.
	•	High‑depth engine search (depth ≤ 12 is acceptable).

⸻

4 · System Overview

graph TD
  subgraph Client (Browser)
    UI[Phaser 3 Scene] --SAN--> Bus(GameBus)
    Bus --emit--> NetSock[Socket.IO Client]
    Mic[Mic Capture] --PCM--> STT[ElevenLabs WS]
    STT --Text--> Parser
    Parser --SAN--> Bus
    Bus --FEN--> StockfishW
    StockfishW((Stockfish.wasm)) --SAN--> Bus
  end
  subgraph Server (Node)
    Socket[Socket.IO Server] --relay SAN--> OtherClient
  end
  NetSock --WS--> Socket

	•	GameBus – local pub‑sub hub; single source of truth for moves.
	•	Socket.IO – mirrors move, state, chat events between clients that share a room code.
	•	Stockfish Worker – subscribes to Bus and publishes best reply when in AI mode.

⸻

5 · Functional Requirements

5.1 Board & Rules (Phase 1)
	1.	Render 8×8 grid & 32 sprites (PNG atlas) via Phaser.
	2.	Drag‑drop & click‑to‑move interactions.
	3.	Validate every move using chess.js; illegal moves reverted.
	4.	Expose REST endpoint GET /api/state for debugging.

5.2 Voice Path (Phase 2)
	1.	Capture mic audio (16 kHz PCM) and stream to ElevenLabs Conversational WS.
	2.	Parse user_transcript → SAN/uci via PEG grammar with homophone mapping.
	3.	On legal move, speak confirmation via SpeechSynthesis (“Knight to f‑3 acknowledged.”).

5.3 Multiplayer & AI (Phase 3)
	1.	Room join – user enters a 6‑digit code; Socket.IO connects to /room/<code> namespace.
	2.	Sync – first client creates game, spreads initial FEN; thereafter both relay SAN moves.
	3.	Role select – At join, choose Human or Computer.  If Computer, local Stockfish worker responds after each opponent move.
	4.	Engine search limited to depth 12 or movetime 500 ms to keep parity with voice lag.

⸻

6 · Non‑Functional Requirements
	•	Latency – Board update < 100 ms after SAN received; voice transcript < 400 ms E2E.
	•	Code quality – TypeScript 5.x, ESLint + Prettier, Vitest coverage ≥ 80 % for Phase 1 logic.
	•	Deployment – Single docker-compose with Node 18 server + static Vite build; HTTPS via Caddy.
	•	License – MIT.

⸻

7 · Technology Stack

Concern	Choice
Front‑end bundler	Vite + Reactivity plug‑in
Renderer	Phaser 3.70 (Canvas & WebGL)
Rules	chess.js v1.0 (ESM)
Audio STT	ElevenLabs Conversational WS
Networking	Socket.IO v4 (binary)
Engine	stockfish.wasm (2017 NNUE build)
State bus	tiny‑emitter (2 KB)


⸻

8 · Phase Schedule & Deliverables

Week	Deliverable	Acceptance
1	Fork & harden repo, CI pipeline	npm test green on GitHub Actions
2	Board + rule validation	Drag piece, illegal move auto‑reverts
3	GameBus + REST state dump	curl /api/state returns FEN
4	Voice capture + STT streaming	Console logs SAN from speech
5	Parser + board animation	Speak → piece animates legally
6	Socket.IO rooms, two‑tab test	Moves sync within 200 ms
7	Stockfish worker adapter	Single‑player vs AI works
8	Polishing & README	docker-compose up runs full stack


⸻

9 · Open Issues / Risks
	•	STT quotas – ElevenLabs free tier may throttle; fallback to local Whisper.cpp?
	•	WebRTC vs Socket.IO – P2P moves considered but rejected for simplicity.
	•	WASM size – stockfish.wasm (~ 7 MB) incremental loading spinner required.

⸻

10 · Glossary

Term	Meaning
SAN	Standard Algebraic Notation (Nf3, Bxe5+)
FEN	Forsyth‑Edwards Notation – serialised board state
VAD	Voice Activity Detection – determines speech segments


⸻

Note on chessboard.js Integration (clarification)

By default the rendering layer is Phaser 3 sprites so that camera controls, animations, and overlays can share a single WebGL pipeline.  chessboard.js therefore is not required.  However the architecture leaves a narrow seam where a DOM‑based board can be swapped in:
	•	Optional Overlay Mode – Mount a <div id="board"> beside the Phaser canvas and initialise Chessboard('board', options).  A lightweight adapter (BoardDomAdapter) subscribes to the same GameBus events (move, state) and calls board.position(fen).
	•	When to use – Rapid prototyping, instructional demos, or if Phaser is disabled for accessibility reasons.
	•	Trade‑offs – Two render layers, limited visual effects, but zero code to implement drag‑drop.

The PRD keeps this as a pluggable fallback; implementation backlog item: “Provide Chessboard.js adapter with parity test suite” (effort ≈ 0.5 sprint).

