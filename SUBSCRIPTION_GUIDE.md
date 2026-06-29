# AgentCard Subscription Integration Guide

Once virtual cards are created, follow these steps to link them to the automated scheduler.

## 1. Create Cards
Use the gateway or CLI to create a dedicated card for each service:
- `YouTube Premium` ($15 limit)
- `Zeus Network` ($10 limit)
- `Amazon Prime` ($15 limit)
- `Hulu` ($10 limit)
- `Starz` ($10 limit)

## 2. Update Scheduler
For each card created, get the `card_id` and add it to `backend/gateway/scheduler.json`.

Example:
```json
{
  "subscription_id": "youtube",
  "name": "YouTube Premium",
  "next_payment": "2024-07-01",
  "status": "scheduled",
  "card_ids": ["card_abc123"]
}
```

## 3. Update Subscriptions
Optionally, update `backend/gateway/subscriptions.json` to keep track of active cards.

```json
{
  "id": "youtube",
  "name": "YouTube Premium",
  "type": "monthly",
  "amount": 13.99,
  "due_day": 1,
  "card_limit": 15,
  "card_ids": ["card_abc123"]
}
```

## 4. Multi-Card Support
If a service requires multiple cards (e.g., Fly.io), simply add all card IDs to the `card_ids` array:
```json
"card_ids": ["card_1", "card_2", "card_3"]
```

## 5. Verification
Verify the configuration by querying the admin endpoints:
- `GET /admin/subscriptions`
- `GET /admin/scheduler`
