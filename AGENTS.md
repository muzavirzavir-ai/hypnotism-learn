# Project Guidance

## User Preferences

- Premium dark navy/black theme with blue and purple accents, modern cards, smooth lightweight animations
- Responsive mobile-first layout
- English/Malayalam language switcher across all user-facing text
- Accessibility: keyboard navigation, focus states, sufficient contrast, labeled inputs
- Educational/ethical disclaimer in the footer
- Access keys stored server-side only, never in frontend code or browser storage
- 24-hour class unlock countdown must use backend server time, never the client clock
- No public media URLs and no download buttons for protected content
- Optional student watermarking on video and poster display

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Enhanced Migration is configured (mops.toml [canisters.backend.migrations], check-limit=1); with a pending baseline, fold its initialization into the single pending migration rather than adding a second file.
- 'actor' and 'class' are reserved Motoko keywords; use actorPrincipal and classInfo as record field names.
- caffeineai-authorization: hasPermission(state, caller, #user) is true for both #admin and #user; #admin rejects students. getUserRole traps 'User is not registered' for unregistered principals, so verifyAccessKey must register the caller in accessControlState.userRoles on success.
- Each included mixin contributes its top-level declarations to the actor block, so helper names like requireAdmin must be unique per mixin (M0051 duplicate definition).
- Student sessions carry no student identity: resolveStudent(identifier) binds caller principal to studentId in a stable map, and student-facing endpoints enforce ownership from that binding.
- OQL manual entities must project from the actual stored collection shape and every entity must call .sample(...); edge targets must be registered in the same Expose list.
- Tailwind darkMode: ['class'] requires the 'dark' class on <html>; set it in index.html so the .dark tokens apply before first paint.
- TanStack Router pages that read a search param must receive it on every navigation; resolve a fallback from session state so direct links work.
- Test files live under src/frontend/src/__tests__/ and test/pocketic/; the root test script runs both lanes and the frontend typecheck includes test files (register jest-dom matcher types).
- Verified commands: backend mops check --fix / mops build; frontend pnpm typecheck / pnpm fix / pnpm build; root pnpm bindgen after backend changes.
