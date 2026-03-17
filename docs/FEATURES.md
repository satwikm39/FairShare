# FairShare — Features

## Groups
- Create & manage groups with a custom name and currency symbol
- Edit group name and currency after creation
- Add members by email address
- Per-group currency displayed throughout all views

## Receipt Processing
- **AWS Textract OCR** — upload a JPEG, PNG, or PDF receipt; items auto-extracted with names and prices
- **Usage limit** — 2 free Textract scans per account; UI gracefully disables with "Premium coming soon" when reached

## Bill Management
- Create, edit, and delete bills with custom names and dates
- Add / edit / delete individual items inline (name and unit cost)
- Edit bill-level tax, which is pro-rated across items
- Real-time grand total recalculation on every change

## Splitting
- **Weighted share system** — assign integer share counts per person per item (e.g. 2:1:1 means one person pays twice as much)
- **Auto-split equally** — distributes all items evenly across all group members with one click
- **Reset all shares** — clears all shares to start fresh
- **Save splits** — persisted to the database; unsaved changes are clearly indicated

## Debt Tracking (Splitwise-style)
- **Payer assignment** — record who fronted the money for each bill via inline dropdown
- **Automatic balance computation** — per-group cumulative net balances computed across all bills
- **Debt simplification** — pairwise debts are netted (A owes B $10, B owes A $4 → A owes B $6)
- **Cached debts** — stored in the `debts` table, only recomputed when payer or shares change
- **Group page balance panel** — personal net summary + full debt list with your rows highlighted
- **Dashboard debt badge** — quick "you owe / you're owed" badge on each group card

## User Profiles
- Edit display name from the navbar profile menu
- Firebase Google sign-in with persistent sessions

## UI/UX
- Dark mode support
- Fully responsive (mobile, tablet, desktop)
- Horizontal scroll hint on small screens for the splitter table
- Sticky table headers on the bill splitter
- Inline editing of bill names, dates, and item details
- Micro-animations and premium card design
