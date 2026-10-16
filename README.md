# Vouch: A Web-Based Digital Notary

Upload a document -> SHA-256 fingerprint -> anchored on a blockchain (hash + timestamp + uploader ref) -> QR-coded PDF proof certificate.
Verify later by re-hashing: **AUTHENTIC**, **TAMPERED** or **NO RECORD FOUND**.

```
vouch-app/
  contracts/   Solidity smart contract + Hardhat (tests, deploy script)
  server/      Node.js + Express API, MongoDB + GridFS, JWT auth, PDF/QR certificates
  client/      React (Vite) web app
```

## Prerequisites
- Node.js 18+ and VS Code
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas URI

## Quick start (one command after setup)
```
npm install          # root: installs concurrently + wait-on
npm run setup        # installs contracts/server/client deps and creates server/.env
npm run dev          # starts blockchain + deploys contract + API + web app
```
Then open http://localhost:5173 (API health: http://localhost:5000/api/health).
Make sure MongoDB is running first. `npm test` runs the contract tests and server tests (27 server tests).

## Manual start (4 terminals, if you prefer to see each part)
1. `cd contracts && npm install && npx hardhat node` (local blockchain, leave running)
2. `cd contracts && npm run deploy:local` (writes server/deployment.json)
3. `cd server && npm install && cp .env.example .env && npm run dev` (Windows: `copy`)
4. `cd client && npm install && npm run dev`

Note: restarting the Hardhat node resets the chain. Redeploy and restart the API afterwards.
For QR codes to open on a phone, set `CLIENT_URL` in server/.env to your laptop's LAN address (e.g. http://192.168.1.5:5173) and run the client with `npm run dev -- --host`.

## Integrity and security features (new)
- **Independent check** (`/independent`, and `verifier/verify.mjs`): hashes a file in your browser or terminal and reads the blockchain directly. The Vouch server is never involved. The CLI needs no `npm install`.
- **Document versions:** the dashboard's **New version** button links a new file to the previous one on-chain (`notarizeVersion`). The contract refuses a version whose predecessor does not exist, so history only grows forwards. Verify results show the version history.
- **Tamper-evident audit log:** every security event is hash-chained. Check it with `node server/scripts/verify-audit.js` (add `--anchor` to write the head hash on-chain).
- **Account protection:** lockout after 5 failed logins, rate limits, and uniform login errors.
- **Explorer links** on transactions once `EXPLORER_TX_URL` is set.

## Documentation for your report
| File | Contents |
|---|---|
| `docs/THREAT_MODEL.md` | STRIDE threat model, controls, residual risks, what Vouch does not claim |
| `docs/ARCHITECTURE.md` | Diagrams (PNG + Mermaid sources in `docs/diagrams/`), API, data model |
| `docs/AMOY_GUIDE.md` | Step-by-step deployment to the Polygon Amoy testnet |
| `docs/DEPLOYMENT.md` | Docker and free-cloud hosting |
| `docs/MEASUREMENTS.md` and `measurements/` | How to measure, plus reference hash results |

## Docker
`docker compose up --build` (after `cp .env.docker.example .env.docker`) starts MongoDB, the API and an nginx-served web app on http://localhost:8080. See `docs/DEPLOYMENT.md`.

## Multiple ways to add data (Notarize, Verify and Analyse)
Every page uses the same picker with four tabs, and you can mix modes in one batch (up to 10 items):

| Mode | How it works |
|---|---|
| **Files** | Drag and drop or browse; select many files at once |
| **Camera** | Live in-browser camera, or the phone's camera app. Photos get a capture time |
| **Voice** | Live microphone recording with a level meter and timer (saved as webm/m4a/ogg) |
| **Link** | Paste a URL; the server downloads the file (10 MB max, redirects followed safely) |
| **Scan QR** (Verify page) | Scan a Vouch certificate QR with the camera, or upload a photo of it; loads the certificate fingerprint to detect tampering |

- **Location:** on Camera and Voice tabs, an opt-in checkbox attaches the browser's GPS position. It is stored with the record and printed on the certificate, **not** on the blockchain, and it is **self-reported and unverifiable**. Say so in the review.
- **Batch notarize:** items are processed one by one (one relayer wallet must send transactions in order). Each item gets its own result: Notarized, Already notarized, or Failed.
- **Links are security-sensitive:** only http/https, private and local addresses are blocked (this also defeats DNS tricks), 3 redirects max, 10 s timeout. For local testing only, set `ALLOW_PRIVATE_URLS=true` in `server/.env`.
- **HTTPS requirement:** browsers allow camera, microphone and location only on `localhost` or HTTPS. On a laptop `npm run dev` is fine. To test from a phone, run `npm run dev:phone` in `client/` (self-signed HTTPS), open `https://<laptop-ip>:5173`, and set `CLIENT_URL=https://<laptop-ip>:5173` in `server/.env` so certificate QR codes point there.
- Code: `client/src/components/InputPicker.jsx`, `QrScanner.jsx`, `client/src/inputs.js`; `server/src/services/inputs.js`, `remoteFile.js`.

## Metadata Analyser
Reads metadata from **PDF**, **Word/Excel/PowerPoint (.docx .xlsx .pptx)** and **images (JPEG, PNG, TIFF, HEIC)** and runs consistency checks.

- Page: `/analyze` (public, file analysed in memory, never stored). API: `POST /api/metadata/analyze`
- Also runs when you notarize: a metadata snapshot is stored with the record (GPS coordinates removed). Dashboard -> **Metadata** button.
- Reads: title, author, last modified by, creating software, created/modified dates, page count, camera make/model, GPS, macros, tracked changes, comments, PDF incremental updates, hashes (SHA-256/SHA-1/MD5).
- Findings (info / warn / alert): extension not matching real file type, modified before created, future dates, image-editor software tags, PDF saved again after creation, macros, GPS present, stripped metadata, and more.
- Code: `server/src/services/metadata.js` (core), `server/src/routes/metadata.js`, `client/src/pages/Analyzer.jsx`, `client/src/components/MetaReport.jsx`. Tests: `server/test/metadata.test.js`.
- **Limits (say this in the review):** metadata can be edited or stripped, so findings are indicators and not proof. The blockchain hash is the real integrity proof.
- Dependencies `exifr` (EXIF/GPS) and `pdf-lib` (PDFs with compressed metadata) install with `npm run setup`. Without `exifr` images still show size and type only.

## Demo script for the review
1. Register an account and log in.
2. Upload a PDF -> "Notarize". Show the SHA-256 and transaction hash.
3. Click **Certificate**: PDF opens with a QR code.
4. Open **Verify**, upload the same file -> **AUTHENTIC**.
5. Edit the file (change one character), upload it on the Verify page opened from the certificate QR link (`/verify?hash=...`) -> **TAMPERED**.
6. Upload a file never notarized -> **NO RECORD FOUND**.
7. Open **Analyse**, drop in a Word file, a PDF and a phone photo to show author, software, dates and findings.
8. Notarize 3 files at once, plus a live photo and a voice note (location on). Open the certificate to show the capture details.
9. On **Verify**, scan the certificate QR with the camera, then add the original file.

## How it maps to the modules in the deck
| Module | Where |
|---|---|
| Authentication (JWT) | `server/src/routes/auth.js`, `middleware/auth.js` |
| Upload and hashing | `server/src/routes/docs.js`, `services/hash.js` |
| Blockchain recording | `contracts/contracts/Vouch.sol`, `services/blockchain.js` |
| Document storage (GridFS) | `server/src/db.js`, `routes/docs.js` |
| Verification | `server/src/routes/verify.js`, `client/src/pages/Verify.jsx` |
| Certificate and QR | `server/src/services/certificate.js` |

## Design notes (good answers for panel questions)
- **Only the hash is on-chain.** The file lives in MongoDB GridFS; the chain stores hash, block timestamp and an opaque user id (not email or name).
- **Backend relayer:** the server wallet pays gas and calls `notarize`, so users need no crypto wallet. `verify` is a free public read that anyone can run without trusting Vouch.
- **Timestamp** comes from the block (`block.timestamp`), not the server clock.
- **Duplicates:** the contract rejects a hash that is already registered.
- **Scope:** this is tamper-evident proof of existence and integrity. It is not a statutory notarial act, and JWT login is not a CCA-issued digital signature.

## Deploy to Polygon Amoy testnet (optional)
1. Create a wallet (e.g. MetaMask), get free test POL from the Polygon Amoy faucet.
2. `contracts/.env`: set `AMOY_RPC_URL` and `PRIVATE_KEY` (testnet wallet only).
3. `npm run deploy:amoy` in `contracts/`.
4. `server/.env`: set `RPC_URL` to the Amoy RPC and `PRIVATE_KEY` to the same wallet. Restart the server.

## Troubleshooting
- `Contract not deployed`: run step 2, then restart the server.
- `ECONNREFUSED 8545`: the Hardhat node (step 1) is not running. Restarting it resets the chain, so redeploy and restart the server.
- `MongoDB connection` error: start MongoDB or use an Atlas URI in `server/.env`.
- Never use the Hardhat test private key on a real network.

## Next steps
Email verification, admin dashboard, Merkle batching, mainnet or Fabric evaluation, licensed eSign integration.
