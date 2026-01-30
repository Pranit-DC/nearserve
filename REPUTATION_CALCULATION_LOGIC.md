# Reputation Structure & Calculation Logic

## 📊 Reputation Calculation

### Points Per Assessment
```
Came on time  → +1 point  ✅
Came late     →  0 points ⏰
Didn't come   → -1 point  ❌
```

### Cumulative Score Examples

**Worker A - Excellent (On-Time):**
```
Job 1: On-time    → +1 (Total: 1)
Job 2: On-time    → +1 (Total: 2)
Job 3: On-time    → +1 (Total: 3)
Job 4: On-time    → +1 (Total: 4)
Job 5: On-time    → +1 (Total: 5)
       Category: RELIABLE ✓
```

**Worker B - Mixed Performance:**
```
Job 1: On-time    → +1 (Total: 1)
Job 2: On-time    → +1 (Total: 2)
Job 3: Late       →  0 (Total: 2)
Job 4: On-time    → +1 (Total: 3)
Job 5: Late       →  0 (Total: 3)
Job 6: On-time    → +1 (Total: 4)
       Category: NEEDS_IMPROVEMENT ⚠️
```

**Worker C - Problematic:**
```
Job 1: On-time    → +1 (Total: 1)
Job 2: Didn't come → -1 (Total: 0)
Job 3: On-time    → +1 (Total: 1)
Job 4: Didn't come → -1 (Total: 0)
Job 5: Late       →  0 (Total: 0)
       Category: NEEDS_IMPROVEMENT ⚠️
```

---

## 🏆 Reputation Categories

### Category Thresholds
```typescript
const REPUTATION_THRESHOLDS = {
  TOP_RATED:           20,  // ⭐ Excellent
  RELIABLE:             5,  // ✓ Good
  NEEDS_IMPROVEMENT:    0,  // ⚠️ Average
  BOOKING_RESTRICTION: -5,  // 🚫 Cannot book
};
```

### Category Mapping
```
Score >= 20   → TOP_RATED           ⭐ "Excellent worker with outstanding service record"
Score 5-19    → RELIABLE            ✓ "Reliable worker - consistently good performance"
Score 0-4     → NEEDS_IMPROVEMENT   ⚠️ "Worker is building experience"
Score < 0     → NEEDS_IMPROVEMENT   ⚠️ "Worker needs to improve service quality"
Score <= -5   → BOOKING_RESTRICTED  🚫 Cannot accept new bookings
```

---

## 📈 Score Range & Limits

```
Maximum Score:  +100  (Hard cap)
Minimum Score:  -50   (Hard cap)

Range: [-50, 100]

Practical Examples:
  100: Impossible (would need 100+ on-time jobs)
   50: Exceptional (50 on-time jobs, no late/no-shows)
   25: Excellent (25+ on-time jobs)
   20: Top Rated threshold
    5: Reliable threshold
    0: Neutral (equal on-time and no-shows)
   -5: Booking restricted
  -50: Severely penalized
```

---

## 🔄 Workflow: How Reputation Changes

### Step 1: Job Completed
```
Customer views job in "Previous" tab
Status: COMPLETED
Initial: reputationAssessed = false
```

### Step 2: Customer Opens Review
```
ReviewDialog opens with:
  - Service Category: "Electrical Repair"
  - Quality Rating: 1-5 stars (REQUIRED)
  - Attendance Status: Not selected yet (REQUIRED)
  - Comment: Optional
```

### Step 3: Customer Submits Assessment
```
POST /api/reputation/assessment
{
  "jobId": "job_123",
  "assessmentType": "ON_TIME"
}
```

### Step 4: Backend Processing
```
1. Verify job exists & belongs to customer
2. Check job status = COMPLETED
3. Check reputationAssessed = false (prevent duplicates)
4. Calculate change:
   - ON_TIME: +1
   - LATE: 0
   - NO_SHOW: -1
5. Fetch worker's current reputation (e.g., 4)
6. Calculate new reputation: 4 + 1 = 5
7. Clamp to range [-50, 100]: Still 5
8. Update worker_profiles.reputation = 5
9. Log the change to reputation_logs
10. Return success
```

### Step 5: Worker Category Updated
```
New Reputation: 5
Check: 5 >= 20? No
Check: 5 >= 5? Yes ✓
Category: RELIABLE
Description: "Reliable worker - consistently good performance"
```

---

## 💾 Database Updates

### Job Document
```typescript
{
  id: "job_123",
  status: "COMPLETED",
  workerId: "worker_456",
  customerId: "customer_789",
  
  // Before assessment
  reputationAssessed: false,
  
  // After assessment
  reputationAssessed: true,
  reputationAssessmentType: "ON_TIME",
  reputationAssessmentAt: Timestamp("2026-01-31"),
}
```

### Worker Profile Document
```typescript
{
  id: "worker_456",
  reputation: 5,  // Changed from 4 to 5
  
  // Category is calculated from reputation
  // (not stored, derived at read time)
}
```

### Reputation Log Document
```typescript
{
  id: "log_abc",
  workerId: "worker_456",
  customerId: "customer_789",
  jobId: "job_123",
  change: 1,
  reason: "ATTENDANCE_ASSESSMENT",
  description: "Worker came on time",
  assessmentType: "ON_TIME",
  previousReputation: 4,
  newReputation: 5,
  createdAt: Timestamp("2026-01-31"),
}
```

---

## ✅ Validation Rules

```
1. Can only assess COMPLETED jobs
2. Can only assess jobs you booked (customer validation)
3. Can't assess same job twice (reputationAssessed check)
4. Assessment type must be: ON_TIME | LATE | NO_SHOW
5. Reputation clamped: Math.max(-50, Math.min(100, newRep))
6. Job must have a workerId assigned
7. Both review AND assessment required for completion
```

---

## 🎯 Points Summary

| Action | Points | Status | Impact |
|--------|--------|--------|--------|
| On-time arrival | +1 | ✅ Positive | Builds reputation |
| Late arrival | 0 | ⏰ Neutral | No change |
| No-show | -1 | ❌ Negative | Damages reputation |
| First job | 0-1 | 🆕 New | Depends on attendance |
| Multiple no-shows | -N | 🚫 Restricted | Can be banned |

---

## 📊 Visual Reputation Flow

```
                    +100 (Max)
                      |
        ⭐ TOP_RATED   |  (20+)
                      |
        ✓ RELIABLE    |  (5-19)
                      |
    ⚠️ NEEDS_IMPROV   |  (0-4)
                      |
    🚫 BOOKING_BAN    |  (-5 or below)
                      |
                    -50 (Min)
```

---

## 🔍 Monitoring

Track these metrics:
- Average reputation per worker
- Distribution across categories
- No-show frequency
- Late arrival percentage
- Customer satisfaction correlation
- Repeat booking rate

---

## 🚀 Future Enhancements

- Reputation decay over time (old no-shows less impactful)
- Weighted scoring (first 10 jobs worth more)
- Time-based reputation (recent performance > old)
- Appeal system for disputed assessments
- Automated warnings at -3, -5 reputation
- Reputation restoration programs
