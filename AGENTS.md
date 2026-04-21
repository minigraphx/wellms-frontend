<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GitHub Workflow

## Issues
- Issues werden über die Merge-Message geschlossen: `Closes #XX` im Commit-Titel oder PR-Beschreibung — kein manuelles Schließen nötig.

## Pull Requests
- PRs immer als Draft erstellen, bis sie merge-bereit sind.
- Vor dem Merge prüfen: keine Konflikte mit `main`, Code fehlerfrei.
- Branch-Hierarchie beachten: einen PR der einen anderen vollständig enthält direkt mergen, den anderen schließen.
