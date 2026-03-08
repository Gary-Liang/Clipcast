# ToS/Privacy Acceptance Feature - Implementation Plan

## Overview
Users need to explicitly accept Terms of Service and Privacy Policy, and be prompted when they're updated.

---

## Database Schema Changes

### Add to User model:
```prisma
model User {
  // ... existing fields
  tosAcceptedAt      DateTime?  // When user accepted current ToS
  tosAcceptedVersion String?    // Version number (e.g., "2026-02-22")
  privacyAcceptedAt  DateTime?  // When user accepted current Privacy Policy
  privacyAcceptedVersion String? // Version number
}
```

### Add new model for tracking versions:
```prisma
model LegalDocument {
  id        String   @id @default(cuid())
  type      String   // "tos" or "privacy"
  version   String   // "2026-02-22"
  content   String   @db.Text
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type, isActive])
}
```

---

## Implementation Steps

### 1. Database Migration
```bash
# Add fields to User model
npx prisma db push
```

### 2. Create ToS/Privacy Version Constants
```typescript
// src/lib/legal/versions.ts
export const LEGAL_VERSIONS = {
  TOS: '2026-02-22',
  PRIVACY: '2026-02-22',
};
```

### 3. Create Acceptance Modal Component
```typescript
// src/components/LegalAcceptanceModal.tsx
// Modal that shows ToS/Privacy with "Accept" button
// Blocks app usage until accepted
```

### 4. Add Middleware Check
```typescript
// src/middleware.ts (or create if doesn't exist)
// Check if user has accepted current versions
// Redirect to acceptance page if not
```

### 5. Create Acceptance API Endpoint
```typescript
// src/app/api/accept-legal/route.ts
// POST endpoint to record user acceptance
// Updates user.tosAcceptedAt, user.tosAcceptedVersion, etc.
```

### 6. Update Sign-up Flow
- Already done! Sign-up page shows agreement text
- On first sign-in, automatically mark ToS as accepted (implicit acceptance)

### 7. Create Banner for Existing Users
```typescript
// src/components/LegalUpdateBanner.tsx
// Shows at top of dashboard if user hasn't accepted latest version
// "We've updated our Terms. Please review and accept."
```

---

## User Flow

### New Users (Sign-up):
1. See agreement text: "By creating an account, you agree..."
2. Create account → automatically set acceptance version
3. No blocking modal needed (implicit acceptance)

### Existing Users (ToS Update):
1. User logs in
2. Middleware checks if `user.tosAcceptedVersion !== LEGAL_VERSIONS.TOS`
3. If mismatch:
   - Show banner at top of dashboard
   - OR redirect to `/accept-tos` page
   - Block certain actions (like creating new clips) until accepted
4. User clicks "Review Changes" → shows diff or full document
5. User clicks "I Accept" → API call updates user record
6. Banner disappears, full access restored

---

## Implementation Priority

### Phase 1: Basic (Recommended for MVP)
✅ Agreement text on sign-up (DONE)
✅ ToS/Privacy pages (DONE)
🔲 Add version fields to User model
🔲 Set initial version on user creation
🔲 Simple banner component for updates

### Phase 2: Full Feature (Post-MVP)
🔲 Acceptance modal/page
🔲 Middleware enforcement
🔲 API endpoint for acceptance
🔲 Version management system
🔲 Diff viewer for changes
🔲 Email notification of changes

---

## Quick Start (Minimal Implementation)

For a **simple version** that works for beta:

1. **Add version field:**
   ```prisma
   model User {
     tosAcceptedVersion String? @default("2026-02-22")
   }
   ```

2. **On webhook user creation:**
   ```typescript
   // src/app/api/webhooks/clerk/route.ts
   await prisma.user.create({
     data: {
       // ... existing fields
       tosAcceptedVersion: "2026-02-22", // Current version
     }
   });
   ```

3. **When you update ToS:**
   - Change version constant to "2026-02-23"
   - Add banner in dashboard checking if `user.tosAcceptedVersion !== "2026-02-23"`
   - Show "Accept" button that updates the field

This gives you 90% of the value with 10% of the work!

---

## Notes

- For beta/MVP, the simple version is probably sufficient
- Full version management system is overkill unless you're doing frequent updates
- Consider using a service like Termly or Iubenda for auto-generated legal docs with version tracking built-in

---

**Recommendation:** Start with Phase 1 minimal implementation. Add full feature only if you plan frequent ToS updates or need audit trail for compliance.
