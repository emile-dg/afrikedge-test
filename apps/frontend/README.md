# AfrikEdge frontend

Vue 3, Tailwind CSS, Vue Router, and Pinia. The interface is in French.

## Run and verify

    pnpm --filter frontend dev
    pnpm --filter frontend build
    pnpm --filter frontend test

The build includes Vue/TypeScript checking. Tests cover the fake data source and stores without a browser or backend.

## Pages

- Accueil: planning counts, recent transports, and creation shortcuts.
- Commandes à planifier: city filter, pagination, selection across pages, and assignment to an existing or new Draft transport.
- Ordres de transport: status/date filters, pagination, creation, and detail links.
- Détail du transport: assigned orders, capacity gauge, addition/removal, validation, and departure.
- Véhicules: active vehicles and their capacities.

The sidebar uses normal flex/document flow. The mobile menu expands above the page. Wide tables scroll inside their containers.

## Demo identity and data

The header selects Diane (Dispatcher) or Eric (Responsable logistique). Only Eric can validate. Both can plan transports, edit Draft assignments, and mark Validated transports as departed.

Only the selected ID is stored in localStorage under afrikedge.current-user. Invalid or unavailable storage falls back to Diane. Business data is in memory: route changes and user changes preserve it, while a full refresh restores the assessment seed dataset and recalculates its dates relative to today in Africa/Douala.

The dataset mirrors init.sql: ten vehicles including one inactive vehicle, forty sales orders, four transports, and their assignments. The adapter returns only active vehicles, camelCase records, numeric weights, date-only strings, and paginated responses.

## Data boundary

    Page → Pinia action → PlanningApi → fake dataset

The integration entry point is src/data/api.ts. Replace its planningApi implementation with an HTTP adapter conforming to src/data/contracts.ts. Views and components do not import fixtures or make network requests.

The fake implementation in src/data/fake-api.ts checks roles, scheduling, Draft-only edits, assignment uniqueness, atomic batches, capacity, sales-status synchronization, validation, and departure. Reads return detached records and have a short artificial delay.

City filtering and city options are frontend adapter conveniences. The current backend has no city filter, so a future HTTP adapter must derive these from all Unplanned pages or use a separately extended backend contract. Apply city filtering before frontend pagination. The existing Draft-picker helper already traverses every transport page.

Creation followed by assignment uses two operations. When creation succeeds but assignment fails, the dialog retains the new empty Draft as its destination for retry. No backend or database changes are included.

## Components

UiButton, UiInput, UiSelect, UiCard, UiBadge, UiTable, UiPagination, UiDialog, UiAlert, and CapacityGauge supply the basic styling and accessible states. SalesSelection and TransportFields reuse workflow-specific controls across pages and dialogs.
