# Mobile UX restructure

## Plan by phase

1. **Orientation and progression foundation** — map the existing routes and API contracts; add progression API types/functions, progression provider, and focused API/provider logic tests. Keep errors silent and rewards understated.
2. **Navigation and Today** — restructure the five tabs (Today, Library, Capture, Ask, You), keep compatibility routes/deep links, gate Screen memory to supported entitled Android devices, and rebuild Today from existing insight endpoints.
3. **Library** — add scoped search/filter controls and segmented browse views using the existing observation, topic, entity, and project APIs; add bulk project action where supported.
4. **Ask and memory detail** — improve scoped Ask, follow-up/citation/evidence UI and conversation management; strengthen observation detail and cited chunk navigation.
5. **You and progression UX** — add Progress, leaderboard opt-in, cosmetics and freeze purchase; replace Devices stub and connect Insights/settings links.
6. **Polish and backend default** — complete accessibility/loading/error states, add only the explicitly allowed migration changing the new-row leaderboard default, update documentation, run required mobile/backend checks, and commit.

## Final route map

- Tabs: `(app)/(tabs)/index` (Today), `(app)/(tabs)/library` (Library), `(app)/(tabs)/capture` (capture options sheet), `(app)/(tabs)/ask` (Ask), `(app)/(tabs)/profile` (You).
- Capture routes: `(app)/quick-capture` (note/link), `(app)/voice-capture` (voice), and `(app)/capture-file` (existing file/photo and text capture flow).
- You routes: `(app)/progress`, `(app)/insights`, `(app)/devices`, `(app)/settings`, `(app)/privacy`, `(app)/about`, and `(app)/how-it-works`.
- Detail routes remain under `(app)`: observation, topics, entities, projects, dashboard, activity, predictions, brief, and related memories.
- Screen memory is `(app)/screen-memory`; the old `(app)/(tabs)/recall` route redirects there and both routes reject unsupported iOS or unavailable native builds. Existing `/ask`, `/projects/...`, `/observation/...`, `/memory/...`, capture, voice, insight, dashboard, prediction, brief, and notification deep links continue to resolve.

## Deferred items

- Peer invitation/discovery is deferred unless an existing clean invitation code capability is found. The backend peer API accepts an internal user ID and exposes no discovery endpoint, so the mobile app must not invent a way to obtain IDs.
- No hybrid search or knowledge-graph endpoint work is planned.
- The Ask response contract has no dedicated `followUps` or `suggestedQuestions` fields, so empty-thread prompts and post-answer follow-ups are seeded from the existing predictions endpoint.
- Observation detail does not expose chunk records or offsets. Cited chunk IDs are carried to the detail route and the supplied citation snippet is matched and highlighted when present in extracted text.
- Progression cosmetic patch validation treats `null` as “not supplied”, so the current API cannot unequip an already equipped title or aura. Equipping unlocked cosmetics works; true unequip needs a backend contract change and remains deferred.
- The observations list endpoint does not accept `observationType`; Library filters that type within each fetched cursor page. Semantic search passes all supported type filters to the search endpoint.

## Phase notes

- **Phase 1 complete:** typed progression and leaderboard API client, silent progression provider, foreground refresh, reward delta detection, and API endpoint tests.
- **Phase 2/3 complete:** five-tab navigation, Capture launcher, Today summary, Library browse/search/filter views, bulk selection operations, and Screen memory compatibility routing are implemented.
- **Phase 4 complete:** Ask now exposes scopes, prediction seeded prompts, citation cards, insufficient-evidence guidance, searchable eight-item conversation history, and progression refresh after successful answers. Memory detail highlights citation snippets and shows the chunk identifier when supplied.
- **Phase 5/6 complete:** Progress and privacy opt-in, freeze purchase, cosmetics, leaderboard, Insights, device push controls, and the new-row private default migration are implemented. Existing progression rows are not updated by the migration.
