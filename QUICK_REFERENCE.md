# 🚀 Real-Time Content - Quick Reference

## 📦 Files Overview

```
hooks/use-live-content.ts              → Custom hook for real-time data
components/live-content-display.tsx    → UI component with animations
lib/refresh-data-service.ts            → CRUD operations
app/api/live-content/route.ts          → API endpoints
app/live-content/page.tsx              → Demo page
```

## 🎯 Most Common Tasks

### Display Live Content

```tsx
import LiveContentDisplay from '@/components/live-content-display';

<LiveContentDisplay maxItems={10} />
```

### Add Content

```typescript
import { addLiveContent } from '@/lib/refresh-data-service';

await addLiveContent({
  title: 'My Title',
  message: 'My message'
});
```

### Use the Hook

```typescript
import { useLiveContent } from '@/hooks/use-live-content';

const { content, loading, error, isConnected } = useLiveContent();
```

## 🔥 Firestore

**Collection:** `refresh_data`

**Fields:**
- `title` (string, required)
- `message` (string, required)  
- `timestamp` (auto)

## 🌐 API Endpoints

```bash
POST   /api/live-content      # Add content
PUT    /api/live-content      # Update content
DELETE /api/live-content?id=  # Delete content
GET    /api/live-content      # Get all content
```

## 📍 Demo Page

Visit: `http://localhost:3000/live-content`

## ⚡ Quick Setup

```bash
npm run setup-live-content    # Add sample data
npm run dev                   # Start dev server
```

## 🔒 Security Rules (Firebase Console)

```javascript
// Testing
match /refresh_data/{doc} {
  allow read, write: if true;
}

// Production
match /refresh_data/{doc} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

## 🎨 Component Props

```typescript
<LiveContentDisplay 
  showConnectionStatus={true}  // Show live indicator
  maxItems={10}               // Max items to show
  className=""                // Additional classes
/>
```

## 📊 Hook Returns

```typescript
{
  content: LiveContentItem[];  // Array of items
  loading: boolean;            // Loading state
  error: string | null;        // Error message
  isConnected: boolean;        // WebSocket status
}
```

## 🛠️ Service Functions

```typescript
import { 
  addLiveContent,          // Add new item
  updateLiveContent,       // Update item
  deleteLiveContent,       // Delete item
  getLiveContentById,      // Get one item
  getAllLiveContent,       // Get all items
  addTestContent,          // Add test data
  clearAllLiveContent      // Clear all
} from '@/lib/refresh-data-service';
```

## 🧪 Testing

**Firebase Console:**
1. Go to Firestore → `refresh_data`
2. Add/edit/delete documents
3. Watch instant updates

**Test Button:**
1. Visit `/live-content`
2. Click "Add Test Content"

**API:**
```bash
curl -X POST localhost:3000/api/live-content \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello!"}'
```

## 📝 TypeScript Interface

```typescript
interface LiveContentItem {
  id: string;
  title: string;
  message: string;
  timestamp?: any;
}
```

## 🎯 Key Features

✅ Real-time WebSocket updates
✅ Zero page reloads
✅ Smooth animations
✅ Error handling
✅ Auto reconnection
✅ Free tier optimized
✅ Production ready

## 📖 Full Documentation

See `REALTIME_CONTENT_GUIDE.md` for complete documentation.

## 🔍 Console Logs

Look for:
- 🔌 Connection status
- ✅ Success messages
- ❌ Errors
- 🔄 Updates
- 📦 Data received

## 💡 Pro Tips

1. **Multiple Windows**: Open `/live-content` in multiple tabs to see sync
2. **Network Tab**: Check WebSocket connection in DevTools
3. **Console**: Enable verbose logging with `NODE_ENV=development`
4. **Firestore Console**: Best way to test real-time updates
5. **Limit Reads**: Use `maxItems` prop to control costs

---

**That's it! You're ready to use real-time content updates! 🎉**
