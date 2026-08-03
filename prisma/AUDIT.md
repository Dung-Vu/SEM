# Prisma Schema Audit

## Added indexes

- `PushSubscription.userId` (`@@index([userId])`): notification delivery loads subscriptions by user; the unique endpoint index cannot efficiently serve that lookup.

## Confirmed existing indexes and constraints

- `SrsCard(userId, wordId)` is unique, preventing duplicate cards for the same user and word.
- `SrsCard(userId, nextReview)` supports due-card filtering and review-date ordering.
- `SrsCard(userId, status)` supports new-card and status-count queries.
- `ReviewLog(userId, reviewedAt DESC)` supports daily review counts and recent review history.
- `ActivityLog(userId, createdAt DESC)` supports per-user activity timelines.
- `ActivityLog(userId, source)` supports per-user source aggregation/filtering.
- `PushSubscription.endpoint` is unique, matching endpoint-based upsert and unsubscribe behavior.
- `ConversationSession(userId, createdAt DESC)` supports the conversations list endpoint.
- `ConversationMessage(conversationId, createdAt)` supports ordered message loading for a conversation.
- `Word.english` is unique. The Anki word creation route reuses a global normalized word and `SrsCard(userId, wordId)` enforces per-user ownership uniqueness.
- `WeeklyReport(userId, weekNumber, year)` is unique, making weekly report generation idempotent.

## Considered but not added

- `ExpTransaction`: no such Prisma model or API usage exists in the current schema/source, so no speculative table or index was introduced.
- Separate `SrsCard.userId` or `SrsCard.nextReview` indexes: the existing user-leading composite indexes cover current per-user queries; there is no observed global `nextReview` query.
- Separate `ActivityLog.userId` or `ActivityLog.createdAt` indexes: current queries are user-scoped and are covered by the existing composite indexes.
- `PushSubscription(userId, endpoint)` unique constraint: `endpoint` is already globally unique, so a composite unique constraint would be redundant.
- `ConversationMessage(conversationId, role, createdAt)`: assistant-message filtering currently occurs within a single conversation and returns one row; adding another index is not justified at present scale.
- Sunday weekly report schedule: the handler summarizes the completed week, so Monday 08:00 ICT is a deliberate, sane boundary and was retained.
