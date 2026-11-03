# 📊 ResQLink Dual-Storage: Supabase & Google Sheets Integration Guide

ResQLink provides high-reliability, disaster-hardened dual logging:
1. **Local Offline Storage (Instant zero-latency)**: All incoming SOS signals are instantly saved in memory and on disk (`mock-hub-server/data/sos_messages.json`).
2. **Supabase Cloud Database**: Stores structured records in the `sos_messages` SQL table for high-performance querying and cross-district synchronization.
3. **Google Sheets Live Logger**: Automatically appends each SOS as a new row with Date, Time, Latitude, Longitude, Clickable Google Maps Link, Priority, Category, and Voice Transcript.
4. **Offline Resilience Queue**: If internet fails during a flood, cyclone, or power outage, all distress signals are safely queued locally and automatically synced once network connectivity returns.
5. **Instant 1-Click CSV Export**: You can immediately export/download all logs directly to Excel/Google Sheets anytime from the Command Center dashboard or API.

---

## 🟢 Part 1: Quick 60-Second Google Sheets Setup

### Step 1: Open Google Sheets
1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet (e.g. name it `ResQLink Alappuzha Disaster SOS Logs`).

### Step 2: Add the Apps Script Logger
1. In the top menu, click **Extensions > Apps Script**.
2. Delete any default code in the editor.
3. Open `google-sheets-integration/Code.gs` in this repository, copy all code, and paste it into the Apps Script editor.
4. Press `Ctrl + S` (or `Cmd + S`) to save.

### Step 3: Deploy as Web App
1. In the top right corner, click **Deploy > New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and select **Web app**.
3. Fill in:
   - **Description**: `ResQLink SOS Logger`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(Crucial so the hub can post records without expiring OAuth tokens)*
4. Click **Deploy**.
5. Grant permissions if prompted (Click *Advanced > Go to ResQLink (unsafe)* — standard for personal Apps Scripts).
6. Copy the generated **Web app URL** (looks like: `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 4: Connect to ResQLink Hub
You can connect the URL in either of two ways:
- **Option A (Via Web Dashboard)**:
  1. Open the ResQLink Command Center at `http://localhost:5173`.
  2. Click the **"Connect Sheet"** button in the top right.
  3. Paste your Web App URL and click **"Save & Start Syncing"**.
- **Option B (Via .env file)**:
  1. In `mock-hub-server/.env`, set:
     ```env
     GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfycb.../exec
     ```
  2. Restart the hub server.

---

## 🟢 Part 2: Supabase Setup

Your Supabase project is configured in `mock-hub-server/.env`:
```env
SUPABASE_URL=https://hftdouodbtwqzleeaiju.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Table Schema (`sos_messages`)
To ensure your Supabase table has all columns including voice transcripts, run this in your **Supabase SQL Editor**:
```sql
CREATE TABLE IF NOT EXISTS public.sos_messages (
    id TEXT PRIMARY KEY,
    citizen_id TEXT NOT NULL,
    lat FLOAT,
    lng FLOAT,
    emergency_type TEXT DEFAULT 'GENERAL',
    priority TEXT DEFAULT 'NORMAL',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sos_messages ADD COLUMN IF NOT EXISTS emergency_type TEXT DEFAULT 'GENERAL';
ALTER TABLE public.sos_messages ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
ALTER TABLE public.sos_messages ADD COLUMN IF NOT EXISTS description TEXT;
```

---

## 📥 Instant CSV Download for Excel & Google Sheets
Even without a webhook, you can export and open all data logs immediately:
- **From Web Dashboard**: Click **"📥 Export Logs (.CSV)"** in the top bar.
- **Direct Link**: Open `http://localhost:3000/api/v1/sos/export-csv` in any browser.
- **Importing to Google Sheets**: Open Google Sheets > File > Import > Upload the CSV file.

### Columns Included in Every Log:
1. `Date` (e.g., `31/10/2026`)
2. `Time` (e.g., `08:45:12 AM`)
3. `SOS ID` (e.g., `SOS-1790089200`)
4. `Citizen ID` (e.g., `CITIZEN-9482`)
5. `Emergency Category` (e.g., `FLOOD`, `TRAPPED`, `FIRE`, `MEDICAL`, `GENERAL_HELP`)
6. `Priority` (e.g., `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
7. `Latitude` (e.g., `9.4981`)
8. `Longitude` (e.g., `76.3388`)
9. `Google Maps Link` (e.g., `https://www.google.com/maps?q=9.4981,76.3388`)
10. `Voice Transcript / Description` (e.g., `"Flood water is rising rapidly inside the living room"`)
11. `Status` (`ACTIVE`, `RESOLVED`, `FALSE_ALARM`)

