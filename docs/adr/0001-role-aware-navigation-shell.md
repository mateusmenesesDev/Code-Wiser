# Role-aware navigation shell

The product uses one responsive navigation shell instead of duplicating product links in the header and profile menu. Authenticated destinations live in a desktop sidebar/mobile drawer, grouped into Work and Administration; each destination is filtered by its effective permission, while the profile menu remains limited to account/session actions. This keeps admin workflows discoverable as the menu grows without making the header or profile menu a second navigation system.

## Consequences

- Detail and edit routes stay out of the persistent menu and use page context for orientation.
- Navigation visibility and protected admin route layouts must use the same permission names.
- Search is limited to currently authorized navigation destinations.
