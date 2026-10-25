# AfrikEdge frontend

Vue 3, Tailwind CSS, Vue Router and Pinia. All business data comes from the NestJS backend.

## Development

Start the existing backend on http://localhost:3000, then run:

    pnpm --filter frontend dev

The Vite development server forwards /api requests to http://localhost:3000, removing the /api prefix. Copy .env.example to .env only if you need to override the default:

    VITE_API_BASE_URL=/api

For deployment, configure a reverse proxy for /api or set VITE_API_BASE_URL to the backend origin before building. A direct cross-origin URL requires the backend's existing CORS_ORIGIN setting to match the frontend origin. Vite's development proxy is not part of the production build.

    pnpm --filter frontend build
    pnpm --filter frontend type-check

No frontend test suite is included in this integration.

## Identity

The header selects Diane (Dispatcher) or Eric (Responsable logistique), matching the backend's simulated identity registry. Only the selected ID is persisted in localStorage. The useAPI composable captures that ID in X-User-Id for every request. There are no tokens or sessions.

Business records are loaded from the backend on refresh and are never initialized from frontend fixtures. Backend changes persist according to the database, independently of browser refresh.

## Requests and stores

Each data store instantiates useAPI. Every network action issues exactly one request for one task. Filter changes and other local state actions issue no requests.

useAPI uses native fetch, serializes query parameters while retaining status 0, encodes JSON bodies, handles 204 responses, and exposes safe ApiError values with status, message, and validation fields. No fake fallback, artificial delay, request retry, or synthetic API method is used.

Page composables coordinate multi-request workflows:

- useSalesPlanning collects all Unplanned pages through the sales store, then the store derives city options, city filtering, and local pagination. The current backend has no city-filter endpoint; city is never sent as a backend query parameter.
- useDraftPicker collects Draft summary pages and requests capacity details only for the selected transport.
- useOverview coordinates individual count requests and transport pages, publishing summary data only after the complete load.
- useTransportActions coordinates mutations and synchronous cache invalidation. Removal explicitly requests updated details after its successful 204 response. A refresh failure does not turn a successful write into a failed mutation.
- useAssignment coordinates separate creation and assignment requests. A successfully created Draft remains selected when assignment fails, so retry does not create another transport.

Mutations use returned details directly when available. Unmounted pages reload when visited; stores do not silently cascade requests after mutations. Mounted sales tables refresh explicitly after assignment. Loading, errors, missing records, confirmation dialogs, role controls, and stale-read protection remain in place.

## Layout

The app uses a viewport-height flex shell. The sidebar and header remain stationary while main content scrolls independently. The sidebar is not fixed-positioned. On mobile, navigation expands in normal flow with its own constrained scrolling. Tables and dialogs retain their own overflow containers.
