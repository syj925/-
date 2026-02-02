# Swagger Annotations Plan

## TL;DR
> **Quick Summary**: Document every uncovered Express route in `server/src/routes/` with `@swagger` tags, `components.schemas`, parameter/response descriptions, and security metadata so the existing Swagger UI surfaces the missing resources with accurate detail.
> **Deliverables**:
- Content routes: `category`, `topic`, `tag`, `event`/`event-registration`, `banner`, `badge`, `emoji`.
- Interaction routes: `comment`, `like`, `favorite`.
- Social routes: `follow`, `message`, `private-message`, `search`.
- System/Admin routes: `admin`, `settings`, `upload`.
> **Estimated Effort**: Large (multiple route files, detailed docs).
> **Parallel Execution**: YES – four logical waves (one per group).
> **Critical Path**: Group-by-group annotation → regenerate Swagger spec → confirm `/api-docs` surfaces new tags.

---

## Context

### Original Request
Add Swagger/OpenAPI annotations to the remaining route files under `server/src/routes/` (admin, badge, banner, category, comment, emoji, event, event-registration, favorite, follow, like, message, private-message, search, settings, tag, topic, upload), grouped into Content / Interaction / Social / System+Admin collections.

### Interview Summary
- Swagger config already exists (`server/config/swagger.js`), and `user.routes.js`/`post.routes.js` show the desired style.
- Definitions should stay close to their routes: each file should declare its own `components.schemas` block and reference Joi validation details for request bodies, params, and query strings; authenticated endpoints must use the existing `bearerAuth` security scheme.
- Tags use specific resource names (e.g., `Comments`, `Likes`, `Topics`, `Admin`).
- Grouping by Content/Interaction/Social/SystemAdmin allows waves to execute in parallel while keeping responsibilities clear.

### Research Findings
- Route files uniformly use Express routers with Joi/express-validator for validation, `AuthMiddleware` for security, and `ResponseUtil` for consistent success/error envelopes.
- Swagger-jsdoc already products OpenAPI 3.0.0 docs; we just need to supply per-route annotations (paths, responses, components).
- Best practices include defining reusable schemas (`components.schemas`) and referencing them via `$ref` in request/response sections, documenting `security` blocks, and listing all possible response codes (200, 400, 401, 403, 404).

### Metis Review
Metis agent invocation is unavailable in this environment (`call_omo_agent` rejects `subagent_type="metis"`). Mitigation: replicated auto-review by double-checking requirements, research, and existing swagger examples before drafting this plan—Metis follow-up would otherwise flag missing coverage of each group and schema alignment.

---

## Work Objectives

### Core Objective
Deliver a single plan that maps out how to add Swagger documentation to the remaining route modules without touching controller logic.

### Concrete Deliverables
- Annotated Content routes (category, topic, tag, event/event-registration, banner, badge, emoji) with new tag sections, schemas (e.g., `Category`, `Topic`, `Event`, `Banner`, `Emoji`), and responses referencing `ResponseUtil` formats.
- Annotated Interaction routes (comment, like, favorite) with CRUD summaries, request body schema definitions, and response descriptions describing success/failure states.
- Annotated Social routes (follow, message, private-message, search) covering permission requirements, query filters, and the mix of optional/required auth flows.
- Annotated System/Admin routes (`admin`, `settings`, `upload`) that highlight admin-only endpoints, system health endpoints, and multipart upload responses.

### Definition of Done
- Each route handler in the listed files is described in `@swagger` format with `summary`, `tags`, request parameters/bodies, referenced `components.schemas`, and status code responses.
- Authenticated endpoints include `security: - bearerAuth: []` and document 401/403 outcomes; public endpoints do not require security blocks.
- Swagger UI (`/api-docs`) reflects the new tags when the server runs, and the documentation stays consistent with Joi validation rules.

### Must Have
- Tag names that match resources (`Comments`, `Likes`, `Topics`, `Admin`, etc.).
- Schema blocks located at the top of each route file so the component definitions stay near their consumers.
- Accurate references to existing validators (IDs, pagination, request shapes).

### Must NOT Have
- No controller/service logic changes—only documentation comments.
- No duplicate schema definitions across files (reuse when necessary via `$ref`).
- No assumption of authentication state when endpoints already guard via middleware.

---

## Verification Strategy (Manual)

### Test Decision
- **Infrastructure exists**: YES – Swagger-jsdoc + Swagger UI already integrated.
- **User wants tests**: NO automated tests; use manual verification that `/api-docs` loads the new tags and response bodies match the annotations.
- **Framework**: swagger-jsdoc with OpenAPI 3.0.0 (no additional test framework required).

### Manual Verification Steps
1. Start the backend (`npm run dev` from `server/`) and confirm Swagger UI loads at `http://localhost:3000/api-docs`.
2. Run `curl -s http://localhost:3000/api-docs | jq '.paths | keys'` to ensure new path entries appear for the annotated routes and the new tags (e.g., `Comments`, `Banner`) surface in the `tags` array.
3. Spot-check that each tag lists the expected responses/body schema (use `grep` or the UI to confirm e.g., the comment `POST /api/comments` has the `CreateComment` schema defined in `components.schemas`).

---

## Execution Strategy

### Parallel Waves
1. **Wave 1 – Content Routes**: `category`, `topic`, `tag`, `event`, `event-registration`, `banner`, `badge`, `emoji`. (These define the bulk of the data catalog.)
2. **Wave 2 – Interaction Routes**: `comment`, `like`, `favorite`. (High-frequency user interactions share similar patterns.)
3. **Wave 3 – Social Routes**: `follow`, `message`, `private-message`, `search`. (Relationship and discovery features.)
4. **Wave 4 – System/Admin Routes**: `admin`, `settings`, `upload`. (Administrative/system-level endpoints that document security and payload constraints.)

Parallelization: All waves are independent and can proceed simultaneously; verification occurs once all waves finish (rebuild docs and check `/api-docs`).

### Dependency Matrix
| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|----------------------|
| Content Routes | None | Interaction/Social/System routes need shared schema awareness | Wave 2,3,4 |
| Interaction Routes | None | None | Wave 1,3,4 |
| Social Routes | None | None | Wave 1,2,4 |
| System/Admin Routes | None | None | Wave 1,2,3 |

### Agent Dispatch Summary
| Wave | Tasks | Recommended Skills |
|------|-------|--------------------|
| 1 | Content route annotations | `doc-coauthoring`, `frontend-ui-ux` to stay consistent with existing docs |
| 2 | Interaction route annotations | `doc-coauthoring`, `frontend-ui-ux` |
| 3 | Social route annotations | `doc-coauthoring`, `frontend-ui-ux` |
| 4 | System/Admin annotations | `doc-coauthoring`, `frontend-ui-ux` |

---

## TODOs
- [ ] 1. **Annotate Content Routes**
  
  **What to do**:
  - Add a `@swagger` `tags` block for `Categories`, `Topics`, `Tags`, `Events`, `Banner`, `Badge`, `Emoji` and document which routes belong to each tag.
  - Define near-top `components.schemas` that capture the Joi/validator shapes (e.g., `CreateCategory`, `UpdateCategory`, `EventDetails`, `EventRegistration`, `BannerPayload`, `BadgeSummary`, `EmojiPack`, `EmojiUsage`).
  - Document each path in the files (category, topic, tag, event, event-registration, banner, badge, emoji) with summaries, query/path/body parameters, and `responses` referencing the new schemas or the shared `ResponseUtil` success envelope.
  - Highlight security differences: `AuthMiddleware.authenticate()` means `security: - bearerAuth: []`; optional auth endpoints describe `allowed: optional` but do not require the security object.
  
  **Must NOT do**:
  - Do not modify controllers/services or introduce new middleware.
  - Do not duplicate schema definitions that can be shared via `$ref` (e.g., share `PaginationQuery` where applicable).
  
  **Recommended Agent Profile**:
  > Objective: document existing routes with consistent swagger metadata.
  - **Category**: `writing` – annotation work is documentation-focused.
    - Reason: This task crafts textual API definitions, not new code flows.
  - **Skills**: `doc-coauthoring`, `frontend-ui-ux`
    - `doc-coauthoring`: Keeps structure and style aligned with existing docs.
    - `frontend-ui-ux`: Helps describe request/response UX and keep docs user-friendly.
  - **Skills Evaluated but Omitted**:
    - `artifacts-builder`: Not needed because we are not creating new UI artifacts, only inline annotations.
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (Content group)
  - **Blocks**: None; just needs to finish before overall verification.
  - **Blocked By**: None
  
  **References**:
  - `server/src/routes/category.routes.js` – existing `create/update/sort` flows plus admin guard.
  - `server/src/routes/topic.routes.js` – public topic browsing and admin modifications.
  - `server/src/routes/tag.routes.js` – mix of community endpoints and admin management.
  - `server/src/routes/event.routes.js` & `server/src/routes/event-registration.routes.js` – detailed event flow, registration management, validators, and optional auth endpoints.
  - `server/src/routes/banner.routes.js` – banner retrieval, record statistics, and admin CRUD.
  - `server/src/routes/badge.routes.js` – badge discovery, user stats, and protected user badge endpoints.
  - `server/src/routes/emoji.routes.js` – emoji packs, user favorites, custom uploads.
  - `server/src/routes/user.routes.js` & `server/src/routes/post.routes.js` – existing swagger annotations as stylistic references for structuring components.
  
  **Acceptance Criteria**:
  - All content routes include `@swagger` comments with `summary`, `tags`, `responses`, request body schemas, and security flags mirroring their AuthMiddleware usage.
  - Running `npm run dev` and curling `/api-docs` shows the new tags (e.g., `Topics`, `Events`, `Banner`) and the new component names.
  - The annotated schemas align with Joi validations (e.g., `max`, `uuid`, `enum`) and reference the `ResponseUtil` success structure for responses.

- [ ] 2. **Annotate Interaction Routes**
  
  **What to do**:
  - Create `@swagger` documentation for `comment.routes.js`, `like.routes.js`, and `favorite.routes.js`, wrapping each CRUD/action endpoint with detailed request body schemas (`CreateComment`, `LikeAction`, `FavoriteAction`) and response descriptions.
  - For comment routes, document optional auth read paths (GET comment by ID, replies) without `security` and enforce `security` for create/update/delete endpoints.
  - Describe rate-limited endpoints (e.g., `PublishLimitMiddleware`, `RateLimitMiddleware`) by documenting any throttle-related response code (e.g., 429) in response blocks.
  
  **Must NOT do**:
  - Avoid editing controller imports or middleware usage.
  - Do not leave endpoints undocumented; every exported route should appear in the swagger block.
  
  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Translating middleware-protected flows into reference docs.
  - **Skills**: `doc-coauthoring`, `frontend-ui-ux`
  - **Skills Evaluated but Omitted**:
    - `artifacts-builder`: Not needed—no new UI artifact.
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (Interaction group)
  - **Blocks**: None
  - **Blocked By**: None
  
  **References**:
  - `server/src/routes/comment.routes.js` – create/comment tree/updates, optional auth GETs.
  - `server/src/routes/like.routes.js` – like/unlike flows and GET checks.
  - `server/src/routes/favorite.routes.js` – favorite/unfavorite, user vs post lookups.
  - `server/src/routes/user.routes.js: comment annotations` – for formatting of `responses` and `bearerAuth` usage.
  
  **Acceptance Criteria**:
  - Swagger definitions include request bodies that mirror Joi objects (`post_id`, `content`, `target_type`).
  - Authentication-required endpoints declare `bearerAuth` and describe 401/403 responses; public endpoints omit security.
  - `/api-docs` displays the new `Comments`, `Likes`, and `Favorites` tags with matching endpoints after restarting the backend.

- [ ] 3. **Annotate Social Routes**
  
  **What to do**:
  - Document `follow.routes.js`, `message.routes.js`, `private-message.routes.js`, and `search.routes.js` with resource-specific tags (`Follows`, `Messages`, `PrivateMessages`, `Search`).
  - Highlight query filters (e.g., `user/me`, `common/:user_id1/:user_id2`, pagination parameters) and describe when auth is optional vs required.
  - For search routes, document POST/DELETE request bodies using the Joi schemas for history management.
  
  **Must NOT do**:
  - Do not invent new endpoints—only document those already exported.
  - Do not assume authentication on optional endpoints (e.g., search suggestions) when middleware is optional.
  
  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `doc-coauthoring`, `frontend-ui-ux`
  - **Skills Evaluated but Omitted**:
    - `artifacts-builder`: Not required.
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (Social group)
  - **Blocks**: None
  - **Blocked By**: None
  
  **References**:
  - `server/src/routes/follow.routes.js` – follow/unfollow, counts, mutual checks, batch operations.
  - `server/src/routes/message.routes.js` – message CRUD, batch read/delete validation.
  - `server/src/routes/private-message.routes.js` – conversation listing, send/read, pagination schema.
  - `server/src/routes/search.routes.js` – global search, suggestions, hot keywords, history management.
  
  **Acceptance Criteria**:
  - Paths include query parameter descriptions (IDs, filters, pagination) mirroring express-validator constraints.
  - `private-message` endpoints include the `send` request body schema (`receiverId`, `content`) and mark optional security appropriately.
  - Running Swagger UI confirms the `Follows`, `Messages`, `PrivateMessages`, and `Search` tags show correct summaries.

- [ ] 4. **Annotate System/Admin Routes**
  
  **What to do**:
  - Annotate `admin.routes.js`, `settings.routes.js`, and `upload.routes.js` with the `Admin`, `Settings`, and `Upload` tags. Cover multi-segment admin endpoints (e.g., `/admin/dashboard`, `/admin/users`, `/admin/events`, `/admin/messages`, `/admin/recommendation`, nested child routers) by describing their purpose, security, and body expectations where schemas exist.
  - Document health/status endpoints (e.g., `/admin/status`, `/admin/health`) with simplified `ResponseUtil` schemas.
  - For `upload.routes.js`, describe multipart/form-data requests and the returned file metadata (URL, mimetype, size). Mention validation steps for the banner upload (type + size checks) to clarify 400 responses.
  
  **Must NOT do**:
  - Do not redefine middleware; only describe its effect through the `security` and response sections.
  - Do not attempt to annotate child admin routers (`/categories`, `/badges`, etc.)—the plan focuses on the top-level `admin.routes.js` file and existing file list.
  
  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `doc-coauthoring`, `frontend-ui-ux`
  - **Skills Evaluated but Omitted**:
    - `artifacts-builder`: Not needed.
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (System/Admin)
  - **Blocks**: None
  - **Blocked By**: None
  
  **References**:
  - `server/src/routes/admin.routes.js` – login/logout, dashboard, users/posts/comments/topic/event management, recommendation endpoints, emoji management, logs, health, config version routes.
  - `server/src/routes/settings.routes.js` – privacy/user settings CRUD.
  - `server/src/routes/upload.routes.js` – single/multi upload and banner upload with size/type checks.
  - `server/config/swagger.js` – existing security scheme definitions (bearerAuth).
  
  **Acceptance Criteria**:
  - Swagger UI lists the `Admin`, `Settings`, and `Upload` tags and each route documents request bodies/responses per Joi/validator constraints.
  - Multipart uploads describe the returned schema (URL, mimetype) and mention the banner-only file restrictions (image type + 5MB limit) with corresponding 400 status path.
  - Restarting the backend and running `/api-docs` shows the new `Upload` and `Settings` entries under the `paths` object.
