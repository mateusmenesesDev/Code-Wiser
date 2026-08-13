# Project Board/List view

The project workspace will expose Board and List as two presentations of the same project task set. Board remains the Kanban view; List is a read-oriented table with collapsible groups by status, sprint, or priority. The default grouping is status, groups use the domain order, and rows are visually sortable by manual order, title, or priority without changing the Board's persisted task order. The view, filters, and sort are URL-backed; group expansion is local session state.

The List will preserve the existing task filters, open the existing TaskDialog when a row is selected, and omit inline editing, drag-and-drop, and row action menus in its first version. It will be available from the main Board for every project methodology, but will not replace or alter the Backlog or Sprint Board views.

## Consequences

- Board and List must consume the same filtered task collection so switching views does not change the user's working set.
- The Kanban data projection must include task type and the sprint ordering needed to render the List correctly.
- URL values for view and sort need closed, validated enums with safe fallbacks for invalid links.
- Grouping by sprint must retain a `Without sprint` group; grouping by priority must retain a `Without priority` group.
- The List is a read surface, so sorting cannot mutate the manual task order used by the Board.
- The table requires horizontal scrolling on narrow screens rather than hiding selected columns.
