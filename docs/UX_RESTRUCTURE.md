# Mobile UX restructure

## Plan by phase

1. **Orientation and progression foundation** — map the existing routes and API contracts; add progression API types/functions, progression provider, and focused API/provider logic tests. Keep errors silent and rewards understated.
2. **Navigation and Today** — restructure the five tabs (Today, Library, Capture, Ask, You), keep compatibility routes/deep links, gate Screen memory to supported entitled Android devices, and rebuild Today from existing insight endpoints.
3. **Library** — add scoped search/filter controls and segmented browse views using the existing observation, topic, entity, and project APIs; add bulk project action where supported.
4. **Ask and memory detail** — improve scoped Ask, follow-up/citation/evidence UI and conversation management; strengthen observation detail and cited chunk navigation.
5. **You and progression UX** — add Progress, leaderboard opt-in, cosmetics and freeze purchase; replace Devices stub and connect Insights/settings links.
6. **Polish and backend default** — complete accessibility/loading/error states, add only the explicitly allowed migration changing the new-row leaderboard default, update documentation, run required mobile/backend checks, and commit.

## Initial route map

- Tabs: `(app)/(tabs)/index` (Today), `(app)/(tabs)/library` (Library, new), `(app)/(tabs)/capture` (Capture sheet), `(app)/(tabs)/ask` (Ask), `(app)/(tabs)/profile` (You).
- Detail and utility routes remain under `(app)`: observation, topics, entities, projects, dashboard, activity, predictions, brief, settings, privacy, devices, and how-it-works.
- Screen memory moves to `(app)/screen-memory`; the previous tab route remains as a redirect. Existing `/ask`, `/projects/...`, `/observation/...`, and `/memory/...` entry points remain resolvable.

## Deferred items

- Peer invitation/discovery is deferred unless an existing clean invitation code capability is found. The backend peer API accepts an internal user ID and exposes no discovery endpoint, so the mobile app must not invent a way to obtain IDs.
- No hybrid search or knowledge-graph endpoint work is planned.

## Phase notes

- **Phase 1 complete:** typed progression and leaderboard API client, silent progression provider, foreground refresh, reward delta detection, and API endpoint tests.
- **Phase 2/3 in progress:** five-tab navigation, Capture launcher, Today summaries, Library browse/search/filter views, bulk selection operations, and the Screen memory route have been added. This phase is ready for review after its commit.
