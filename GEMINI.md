<!-- satomoext:start -->
## Local retrieval and routing

For non-trivial repository tasks, call route_coding_task once at the start
using project id 3. Use returned chunks as initial context.
Routing is advisory: inspect more source when needed, respect the recommended tier
for task dispatch, and decide independently when workflow confidence is below 0.75.
Never let the router authorize destructive operations. After editing, run focused tests
plus the recommended verification.
<!-- satomoext:end -->
