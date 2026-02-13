# データモデル (Firestore)

```
tripGroups (collection)
└── {tripGroupId} (document)
    ├── name, departure?, status (draft/active/completed)
    ├── created_at, updated_at
    ├── candidates (subcollection)
    │   └── {candidateId}
    │       ├── name, source_url?
    │       ├── description?, image_url?
    │       ├── tags, info?, ai_summary?
    │       └── created_at, updated_at
    └── questions (subcollection)
        └── {questionId}
            ├── content, candidate_id?
            ├── ai_answer?, ai_streaming
            └── created_at, updated_at
```
