# AfrikEdge SEFS1026 backend

NestJS transport planning API using SQL Server 2022, parameterized mssql queries, and Zod.

## Setup

Run commands from the repository root. Install dependencies with pnpm, copy apps/backend/.env.example to apps/backend/.env, and configure the SQL Server connection.

    docker compose up -d
    pnpm --filter backend dev

Initialize an empty assessment database using the instructions in docker-compose.yml. The supplied init.sql drops and recreates TransportPlanning; do not rerun it against data you need to retain.

The API defaults to http://localhost:3000. Configure PORT, CORS_ORIGIN, and DB_* settings in apps/backend/.env. Environment values are validated at startup; the pool closes on shutdown.

## Swagger documentation

Start the backend and open http://localhost:3000/docs for the generated Swagger UI. The OpenAPI document is available at /docs-json and /docs-yaml. These paths use the configured backend port and do not change the existing API route paths.

Click **Authorize** and enter `diane` or `eric` to send the `X-User-Id` header with requests. Swagger documents the existing role restrictions; only Eric can validate transports. Documentation is accessible without a user header, while feature requests retain their authorization guard.

Routes are discovered automatically by Nest Swagger. Request bodies and query parameters are generated from the existing Zod schemas; response schemas describe the shared pagination and backend contracts. Custom Zod refinements and business rules remain enforced by the API.

## Simulated identity and permissions

Every feature request requires X-User-Id. This is an assessment identity simulation, not real authentication.

| ID | Role |
|---|---|
| diane | DISPATCHER |
| eric | LOGISTICS_MANAGER |

IDs are case-sensitive; surrounding whitespace is trimmed. Missing, malformed, or unknown identities receive 401. Insufficient permission receives 403. Routes without permission metadata are denied. The registry, permissions, and role policies are centralized in src/authorization.

| Method | Endpoint | Permission |
|---|---|---|
| GET | /vehicles | vehicles:read |
| GET | /sales-orders | sales-orders:read |
| GET | /sales-orders/to-plan | sales-orders:read |
| GET | /transport-orders | transport-orders:read |
| GET | /transport-orders/:no | transport-orders:read |
| POST | /transport-orders | transport-orders:create |
| POST | /transport-orders/:no/lines | transport-orders:lines:add |
| DELETE | /transport-orders/:no/lines/:salesOrderNo | transport-orders:lines:remove |
| POST | /transport-orders/:no/validate | transport-orders:validate |
| POST | /transport-orders/:no/depart | transport-orders:depart |

Both roles have every listed permission except transport-orders:validate, which belongs only to LOGISTICS_MANAGER. Creator and validator fields use the resolved registry ID.

## Contracts

Sales-order and transport-order lists accept page and limit. Defaults are page=1 and limit=100. The maximum limit is 100; values must be positive integers and the calculated offset must fit a SQL Server int.

    { "data": [], "total": 0, "page": 1, "limit": 100, "totalPages": 0 }

Totals include every matching item even when the requested page is empty. Lists are ordered by record number. Count and page queries retain read-committed semantics and do not promise a snapshot across concurrent changes.

Sales lists accept optional status=0, 1, or 2. The to-plan route always selects status 0. Items use no, customerNo, customerName, deliveryCity, totalWeightKg, and status. Weights are JSON numbers.

Transport lists accept optional status=0, 1, or 2 and date=YYYY-MM-DD, independently or together. Creation accepts:

    { "vehicleCode": "VH-01", "deliveryDate": "2099-01-01" }

Assignments accept:

    { "salesOrderNos": ["SO-1008", "SO-1009"] }

Dates are date-only values; today is calculated in Africa/Douala. Identifiers are trimmed nonempty strings of at most 20 characters. Creation and assignment bodies reject unknown fields. Assignment arrays must be nonempty and have no duplicate IDs.

Creation returns 201; other successful POST operations return 200. Removal returns 204 with no body. Vehicles return an array. Transport details include vehicle registration/capacity, assigned sales orders, total weight, and remaining capacity.

## Consistency and errors

Creation requires an existing active vehicle, a non-past date, and a unique vehicle/date schedule across every transport status. Assignments require unplanned, unassigned sales orders and a Draft transport. Capacity includes existing and incoming weights and permits equality.

Line changes and sales-status updates are atomic. Validation requires manager permission and a nonempty Draft transport. Departure requires Validated status and changes all assigned sales orders to In Delivery atomically. Validated and Departed transports reject line edits.

Transport mutations and standalone detail reads acquire the same transaction-owned application lock. Mutations use SERIALIZABLE with UPDLOCK/HOLDLOCK and transaction-bound requests, including number generation. This intentionally serializes transport workflows for the assessment. External ERP writers must honor compatible invariants. The supplied schema is unchanged.

| HTTP status | Meaning |
|---|---|
| 400 | Invalid request, query, identifier, date, or array |
| 401 | Missing, malformed, or unknown identity |
| 403 | Missing required permission |
| 404 | Missing record or line membership |
| 409 | Assignment, capacity, schedule, state, duplicate-key, or lock-contention conflict |
| 503 | Database connection unavailable or request timeout |
| 500 | Unexpected database failure |

Database internals are logged and excluded from API messages. Existing domain HTTP errors retain their status and message.

## Verification

    pnpm --filter backend build
    pnpm --filter backend type-check
    pnpm --filter backend lint
    pnpm --filter backend test
    pnpm --filter backend test:e2e

Unit and HTTP suites use mocks and require no database. The HTTP suite covers both roles on all ten routes, denied identities, validation, status codes, and resolved-user persistence. Use these backend commands; the root workspace test script is still a starter placeholder.

The optional real-SQL suite requires INTEGRATION_DB_NAME explicitly selecting an initialized assessment database. Other DB_* settings come from the environment or apps/backend/.env.

PowerShell:

    $env:INTEGRATION_DB_NAME = 'TransportPlanning'
    pnpm --filter backend test:integration

Without INTEGRATION_DB_NAME the SQL suite is skipped. It creates uniquely named disposable vehicle, sales-order, and transport records and removes them in teardown. It never invokes init.sql. Use an assessment database, not production. An interrupted process may require manual cleanup of its QA-prefixed fixtures.

SQL checks cover rollback after partial assignment/removal/departure writes, concurrent scheduling/numbering/assignment/capacity protection, exact capacity, validation/edit races, consistent detail reads, and sales-status synchronization.
