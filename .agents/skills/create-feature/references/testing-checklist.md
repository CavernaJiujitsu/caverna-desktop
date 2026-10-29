# Feature test checklist

- Cover acceptance criteria through visible behavior, not private functions or CSS selectors.
- Test meaningful Zod validation and form feedback.
- Mock HTTP/service boundaries; automated frontend tests must not call the real API.
- Cover pending, empty, success, error and retry where relevant.
- Check keyboard and accessible names for new interactions.
- Run lint, typecheck, `test:run` and build; report exact results and any skipped check.
