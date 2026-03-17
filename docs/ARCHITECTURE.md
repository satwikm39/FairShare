# FairShare — Architecture

## System Diagram

```mermaid
flowchart TD
    subgraph Browser["🌐 User's Browser"]
        UI["React SPA\n(TypeScript + Tailwind)"]
        FB_SDK["Firebase Client SDK\n(Google Sign-In)"]
        UI <--> FB_SDK
    end

    subgraph Vercel["▲ Vercel CDN"]
        STATIC["Static Assets\n(JS/CSS bundle)"]
    end

    subgraph Firebase["🔥 Firebase (Google)"]
        AUTH["Firebase Auth\n(issues JWT tokens)"]
    end

    subgraph Render["🖥 Render — Backend"]
        direction TB
        FASTAPI["FastAPI App"]
        CORS["CORS Middleware\n(origin allowlist)"]
        AUTH_DEP["Auth Dependency\nget_current_user()\n(verifies Firebase JWT)"]
        
        subgraph Routes["API Routes"]
            R_GROUPS["/groups\n/groups/balances"]
            R_BILLS["/bills\n/bills/shares/bulk"]
            R_USERS["/users/me"]
        end
        
        subgraph Services["Services"]
            DEBT_SVC["recompute_group_debts()\n(triggered on payer/share change)"]
            OCR_SVC["Receipt OCR\n(Textract wrapper)"]
        end
        
        FASTAPI --> CORS --> AUTH_DEP --> Routes
        Routes --> Services
    end

    subgraph Supabase["🐘 Supabase — PostgreSQL"]
        direction LR
        T_USERS["users"]
        T_GROUPS["groups · group_members"]
        T_BILLS["bills · bill_items · item_shares"]
        T_DEBTS["debts\n(cached balances)"]
    end

    subgraph AWS["☁️ AWS"]
        S3["S3\n(receipt images)"]
        TEXTRACT["Textract\n(OCR)"]
        S3 --> TEXTRACT
    end

    Browser -->|"serves static app"| Vercel
    FB_SDK <-->|"OAuth + JWT"| Firebase
    UI -->|"HTTPS + Bearer JWT"| Render
    AUTH_DEP <-->|"verify JWT"| Firebase
    Routes <-->|"SQLAlchemy ORM"| Supabase
    DEBT_SVC -->|"DELETE + INSERT"| T_DEBTS
    OCR_SVC -->|"upload + detect"| AWS

    classDef cloud fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    classDef app fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef db fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef ext fill:#fce7f3,stroke:#db2777,color:#831843

    class Vercel,Render cloud
    class Browser,Routes,Services app
    class Supabase,T_USERS,T_GROUPS,T_BILLS,T_DEBTS db
    class Firebase,AWS,S3,TEXTRACT ext
```

---

## Database Schema

| Table | Key Columns |
|---|---|
| `users` | `id`, `name`, `email`, `textract_usage_count` |
| `groups` | `id`, `name`, `currency` |
| `group_members` | `group_id`, `user_id` (composite PK) |
| `bills` | `id`, `group_id`, `paid_by_user_id`, `name`, `date`, `subtotal`, `total_tax`, `grand_total` |
| `bill_items` | `id`, `bill_id`, `item_name`, `unit_cost` |
| `item_shares` | `id`, `item_id`, `user_id`, `share_count` |
| `debts` | `id`, `group_id`, `from_user_id`, `to_user_id`, `amount` |

---

## Key Data Flows

### Save Splits
```
User saves splits
  → POST /bills/{id}/shares/bulk  [+JWT]
  → upsert item_shares in DB
  → recompute_group_debts() fires
    → DELETE FROM debts WHERE group_id=X
    → INSERT simplified pairwise debts
```

### Load Group Balances
```
User opens Group page
  → GET /groups/{id}/balances  [+JWT]
  → SELECT * FROM debts WHERE group_id=X  (fast cached read)
  → compute user_net from cached rows
  → return GroupBalances response
```

### Receipt Upload
```
User uploads photo
  → POST /bills/{id}/upload-receipt  [+JWT]
  → image saved to S3
  → AWS Textract DetectDocumentText
  → parsed items inserted into bill_items
  → user.textract_usage_count incremented
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Debts cached in DB | Avoid O(bills × items × shares) computation on every page load |
| Firebase JWT on every route | True server-side auth; CORS alone is insufficient |
| Weighted integer shares | Intuitive; avoids floating point drift from percentages |
| Tax pro-rated per item | Fairest allocation — heavy orderers pay proportionally more tax |
| Alembic migrations | Safe schema evolution in production; no `create_all()` |
