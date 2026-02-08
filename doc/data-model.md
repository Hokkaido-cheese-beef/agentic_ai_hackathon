# データモデル (Prisma)

```
TripGroup (trip_groups)
├── trip_group_id: UUID [PK]
├── name, departure?, status (draft/active/completed)
├── created_at
├── → TripCandidate[] (1:N)
└── → Question[] (1:N)

TripCandidate (trip_candidates)
├── id: UUID [PK]
├── trip_group_id: UUID [FK]
├── name, description?, image_url?, rating?, review_count?
├── tags (JSON), info?, ai_summary (JSON), source_url?
├── created_at
└── → Question[] (1:N)

Question (questions)
├── id: UUID [PK]
├── candidate_id?: UUID [FK], trip_group_id: UUID [FK]
├── content, ai_answer?
└── created_at
```
