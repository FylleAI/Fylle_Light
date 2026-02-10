# 🧪 Testing Context-Specific Agent Packs

## ✅ Migration Status

**Database migration 007 completed successfully!**

- ✅ Columns `context_id` and `user_id` added to `agent_packs`
- ✅ RLS policies updated (`view_packs`, `manage_own_packs`)
- ✅ Indexes created for performance
- ✅ 4 template packs available (Newsletter, Blog, Social, Podcast)

## 🚀 Test Plan

### Step 1: Login & Navigate to Context
1. Open browser: http://localhost:5173
2. Login with your credentials
3. Navigate to **Design Lab**
4. Select or create a **Context** (e.g., "Fylle")

### Step 2: View Agent Pack Section
1. Go to **Agent Pack** section within the context
2. You should see **TWO sections**:

   **📦 Your Packs** (empty initially)
   - This will show packs specific to this context
   - Each pack will have "New Brief", "Edit", "Delete" buttons

   **📚 Template Packs** (4 packs visible)
   - Newsletter Pack
   - Blog Pack
   - Social Pack
   - Podcast Pack
   - Each with "Clone to Context" button

### Step 3: Clone a Template Pack
1. Click **"Clone to Context"** on "Newsletter Pack"
2. Wait for success toast: "Pack cloned successfully"
3. The cloned pack should appear in **"Your Packs"** section
4. Name will be: "Newsletter Pack (Copy)"

### Step 4: Verify Context Separation
1. Create or switch to a **different context** (e.g., "Cliente A")
2. Go to **Agent Pack** section
3. Verify that the cloned pack from step 3 **is NOT visible** here
4. Only template packs should be visible
5. Clone a different pack (e.g., "Blog Pack")
6. Switch back to first context → verify "Blog Pack (Copy)" is NOT there

### Step 5: Create a Brief with Cloned Pack
1. In a context with a cloned pack, click **"+ New Brief"**
2. Configure the brief
3. Generate content
4. Verify it works the same as before

## 🔍 Expected Behavior

### ✅ Correct Behavior
- Each context shows: **Template packs + its own cloned packs**
- Packs cloned in "Fylle" context are **not visible** in "Cliente A" context
- Template packs are **always visible** in all contexts
- Cloning the same template in different contexts creates **independent copies**
- You can customize each cloned pack per context

### ❌ Incorrect Behavior (Report if you see this)
- Cloned pack appears in multiple contexts
- Cannot clone template pack (error message)
- Template packs not visible
- Cloned pack disappears after refresh
- RLS errors in console

## 🐛 Debugging

### Check Backend Logs
```bash
tail -f /tmp/backend.log
```

### Check Frontend Logs
```bash
tail -f /tmp/frontend.log
```

### Check Browser Console
Open DevTools → Console tab and look for:
- API call to `/api/v1/packs?context_id=...`
- Response should include `is_template`, `context_id`, `user_id` fields
- Errors related to pack mutations

### Manual API Testing

**List packs for a context:**
```bash
# Get your auth token from browser localStorage
TOKEN="your-token-here"
CONTEXT_ID="your-context-id-here"

curl http://localhost:8000/api/v1/packs?context_id=$CONTEXT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Clone a pack:**
```bash
PACK_ID="d795e636-5175-4cd2-9e12-0fed0d57e848"  # Newsletter Pack

curl -X POST http://localhost:8000/api/v1/packs/$PACK_ID/clone \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"context_id\": \"$CONTEXT_ID\"}"
```

## 📊 Database Verification

**Check template packs:**
```sql
SELECT id, name, context_id, user_id
FROM agent_packs
WHERE context_id IS NULL;
```

**Check context-specific packs:**
```sql
SELECT id, name, context_id, user_id
FROM agent_packs
WHERE context_id IS NOT NULL;
```

**Check packs for a specific context:**
```sql
SELECT id, name, context_id, user_id
FROM agent_packs
WHERE context_id IS NULL  -- templates
   OR context_id = 'your-context-id-here';
```

## ✅ Success Criteria

- [x] Migration applied without errors
- [ ] Template packs visible in UI
- [ ] "Clone to Context" button works
- [ ] Cloned pack appears in "Your Packs"
- [ ] Cloned pack **not visible** in other contexts
- [ ] Can create briefs with cloned packs
- [ ] Can customize cloned pack name/settings
- [ ] Can delete cloned pack (if no briefs)

## 🎯 Next Steps After Testing

1. **If everything works**: Implementation is complete! 🎉
2. **If issues found**: Report the specific error and we'll debug together
3. **Future enhancements**:
   - Pack editing UI (PackManager component)
   - Pack creation from scratch
   - Pack duplication within same context
   - Pack sharing between contexts (optional)

---

**Quick Start Testing:**
```bash
# Backend running on: http://localhost:8000
# Frontend running on: http://localhost:5173
#
# 1. Login
# 2. Go to Design Lab → Select Context
# 3. Go to Agent Pack section
# 4. Click "Clone to Context" on any template pack
# 5. Verify it appears in "Your Packs"
```

Good luck! 🚀
