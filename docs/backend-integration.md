# Backend integration contract for AI features

This project currently implements frontend UX for:
- Text chat (mocked locally)
- PDF upload and summarization trigger

The backend team should provide the following endpoints and contracts.

## Environment on frontend

- `NEXT_PUBLIC_API_BASE_URL` (optional): If set, the client will send requests to `${NEXT_PUBLIC_API_BASE_URL}/api/...`.
  - Example: `https://api.example.com` → calls `https://api.example.com/api/summarize`.
  - If not set, requests go to same-origin `/api/...`.

## 1) PDF Summarization

Synchronous endpoint (simple path used by the current UI):

- Method: POST
- URL: `/api/summarize`
- Auth: Ideally Bearer token or cookie-based; if using a different domain, enable CORS accordingly.
- Request: `multipart/form-data`
  - Field `file`: the PDF file
  - Optional fields:
    - `purpose` (string): "summary" | "outline" | "key_points"
    - `targetLength` (string): e.g. "short", "medium", "long"
    - `model` (string): model identifier used by LLM
    - `language` (string): preferred output language code (e.g. `en`)
- Response: `application/json`
  ```json
  {
    "summary": "string",
    "meta": {
      "pages": 12,
      "characters": 48213,
      "tokens": 6200,
      "model": "gpt-4.1-mini"
    }
  }
  ```
- Error responses:
  - `400` invalid input or unsupported file
  - `413` payload too large (file size limit exceeded)
  - `422` parsing failure
  - `500` internal error
  - Body shape:
    ```json
    { "error": { "message": "string", "code": "string_optional" } }
    ```

Optional async variant for very large PDFs:
- `POST /api/summarize` returns 202 with `{ jobId }`.
- `GET /api/summarize/:jobId` returns status and, when complete, `{ summary, meta }`.
- Optional streaming (SSE): `GET /api/summarize/stream?jobId=...` emitting `data:` chunks.

## 2) Text Chat (future-proofing)

Current frontend still uses a local mock for text chat. If you want backend-driven chat:

- Method: POST
- URL: `/api/chat`
- Request: `application/json`
  ```json
  {
    "messages": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "Hi!" }
    ],
    "model": "gpt-4.1-mini",
    "temperature": 0.3,
    "context": { "documentIds": ["abc123"] }
  }
  ```
- Response:
  ```json
  { "content": "assistant reply string" }
  ```
- Streaming option: `GET /api/chat/stream` using SSE, with `messages` sent via query or a prior POST that returns a `streamId`.

## 3) File Upload (optional)

If you prefer a two-step flow (upload once, reuse many times):

- `POST /api/upload` (multipart/form-data) → `{ fileId }`
- `POST /api/summarize` with `{ fileId }` or as form field instead of direct file upload.

## Constraints & limits to consider

- Max file size (e.g., 25 MB). Return `413` when exceeded.
- Accepted MIME types: `application/pdf`.
- Timeouts: synchronous summarization should keep < 30s; else switch to async job.
- Auth: include secure auth; if cross-origin, configure CORS. Same-origin is easiest.

## Frontend expectations

- The UI calls `POST /api/summarize` with form field `file` and expects `{ summary: string }`.
- On failure/non-200, the UI shows a fallback message.
- To change the base URL, set `NEXT_PUBLIC_API_BASE_URL` in the environment.

## Versioning

- If you expect breaking changes, consider prefixing with `/api/v1/...`.
