# ResqLink: Offline Disaster SOS & Command Network

ResqLink is a state-of-the-art, 4-tier disaster management architecture designed for the Kerala State Disaster Management Authority (KSDMA). It provides citizens with an unbreakable offline mesh network for sending distress signals during complete internet/cellular blackouts, while providing government officials with luxurious, real-time command centers via an internet-synced backend.

---

## 1. System Architecture (For Architecture Diagram)

The system operates on a hybrid **Offline-to-Online** topology divided into 4 hierarchical tiers.

### Tier 1: The Citizen (Ground Zero)
* **Technology:** Android Application (Java, MVVM, Room DB).
* **Role:** Sends SOS distress signals containing GPS coordinates and battery life.
* **Connectivity:** Connects to the local ESP32 Hardware Mesh Network via Wi-Fi Direct/Local WLAN when cellular networks are down. Receives high-priority screen-wake broadcast alarms from the government.

### Tier 2: The Sub-Admin (Local Police / Fire Stations)
* **Technology:** React.js Web Portal + ESP32 Master Node.
* **Role:** The physical endpoint of the offline ESP32 Mesh. Captures citizen SOS signals from the hardware and forwards them to the internet-based centralized database.
* **Connectivity:** Bridges the offline hardware mesh to the online Supabase database.

### Tier 3: The District Admin (Collectorates - DDMA)
* **Technology:** React.js Web Portal.
* **Role:** Monitors all forwarded citizen alerts for their specific district (e.g., Ernakulam, Alappuzha). Has the authority to triage and mark SOS signals as "Resolved" or "False Alarm." Can send district-wide broadcasts.
* **Connectivity:** Purely Internet-based (Node.js API -> Supabase DB).

### Tier 4: The Super Admin (State Secretariat - KSDMA)
* **Technology:** React.js Web Portal.
* **Role:** Apex command center. Features AI Flood Mapping, Fleet Tracking, GIS Heatmaps, and Advanced State-Wide Broadcasting. Sends internal notices (Voice/Image) down to District Admins.
* **Connectivity:** Purely Internet-based (Node.js API -> Supabase DB).

---

## 2. Database Schema (For ER Diagram)

The backend utilizes **PostgreSQL (Supabase)**.

**Entities and Relationships:**

1. **`stations`**
   * `id` (UUID, Primary Key)
   * `station_id` (Text, Unique) - e.g., 'POL-ALP-SOUTH'
   * `station_name` (Text)
   * `department` (Text) - 'POLICE' or 'FIRE_AND_RESCUE'
   * `username` (Text)
   * `temporary_password` (Text)
   * `status` (Text) - 'ACTIVE' or 'INACTIVE'

2. **`sos_messages`**
   * `id` (Text, Primary Key) - e.g., 'SOS-170342'
   * `citizen_id` (Text) - Foreign Key to Citizens (Implicit)
   * `lat` (Float) - Latitude
   * `lng` (Float) - Longitude
   * `status` (Text) - 'ACTIVE', 'RESOLVED', 'FALSE_ALARM'
   * `created_at` (Timestamp)

3. **`broadcasts`**
   * `id` (Text, Primary Key)
   * `message` (Text)
   * `created_at` (Timestamp)

4. **`notices`** (Inter-Departmental Comms)
   * `id` (Text, Primary Key)
   * `sender` (Text) - e.g., 'KSDMA Super Admin'
   * `target` (Text) - e.g., 'ALL_DISTRICTS', 'ERNAKULAM'
   * `type` (Text) - 'TEXT', 'IMAGE', 'VOICE'
   * `content` (Text) - Text Payload or S3 URL
   * `created_at` (Timestamp)

---

## 3. Data Flow Diagram (DFD)

### Level 0 (Context Diagram):
* **Citizen** -> [Offline SOS Payload] -> **ResqLink System**
* **ResqLink System** -> [Wake-Up Alarm Broadcast] -> **Citizen**
* **Super Admin / District Admin** -> [Internal Notices] -> **ResqLink System**
* **ResqLink System** -> [GIS Heatmaps & Triage Data] -> **Super Admin / District Admin**

### Level 1 (Core Processes):
1. **Process 1: SOS Transmission (Offline to Online)**
   * Citizen App constructs `{ id, citizenId, lat, lng, battery }` JSON.
   * Transmitted over local ESP32 Wi-Fi to Sub-Admin Hardware Node.
   * Sub-Admin Portal fires `HTTP POST /api/v1/sos` to Node.js Backend.
   * Node.js Backend fires `SQL INSERT` into Supabase `sos_messages` Table.

2. **Process 2: Command Center Triage (Online)**
   * District/Super Admin Portals fire `HTTP GET /api/v1/sos` to Node.js Backend (Polling every 3s).
   * Node.js Backend fires `SQL SELECT` from Supabase DB.
   * Admins click "Resolve" -> `HTTP PUT /api/v1/sos/:id/resolve` -> DB Update.

3. **Process 3: Internal Communications**
   * Super Admin records Voice Memo or attaches Image.
   * Sends `HTTP POST /api/v1/notices` to Backend.
   * Node.js Backend inserts into `notices` table.
   * District Admins poll `HTTP GET /api/v1/notices` and render the payload in the UI.

---

## 4. Sequential Flow (For Sequence Diagrams)

**Scenario A: Citizen sends SOS during blackout**
1. `Citizen Android Device` -> Searches for "ResqLink_Emergency" Wi-Fi SSID.
2. `Citizen Android Device` -> Connects to physical ESP32 Node 1.
3. `Citizen Android Device` -> Sends `{ lat, lng, battery }` to Node 1 via HTTP/Sockets.
4. `ESP32 Node 1` -> Forwards payload via LoRa/Mesh to Master ESP32 Node (Sub-Admin Station).
5. `Sub-Admin Station` -> Detects Internet Connection via Satellite/Restored Line.
6. `Sub-Admin Station` -> Fires `POST /api/v1/sos` to Node.js backend.
7. `Node.js Server` -> Validates payload and Inserts into Supabase `sos_messages`.
8. `Super Admin Portal` -> `setInterval(fetch, 3000)` hits DB.
9. `Super Admin Portal` -> UI updates GIS Map with new red marker instantly.

**Scenario B: Super Admin sends Voice Directive**
1. `Super Admin` -> Clicks Voice Record on Dashboard.
2. `Super Admin Portal` -> Generates Audio Blob -> Fires `POST /api/v1/notices`.
3. `Node.js Server` -> Inserts notice with `type: 'VOICE'` into Supabase.
4. `District Admin Portal` -> Polls `GET /api/v1/notices`.
5. `District Admin Portal` -> Displays "New Voice Directive" in the Internal Notices tab.

---

## 5. Use Cases (For Use Case Diagrams)

**Actor 1: Citizen**
* Send Offline SOS Signal with GPS Coordinates.
* Add/Edit Emergency Contacts.
* Receive High-Priority Wake-Up Alarms (Screen turns on, loud siren plays).

**Actor 2: Sub-Admin (Local Police / Fire Stations)**
* Bridge the offline hardware mesh network to the internet database.
* Monitor immediate local vicinity citizen SOS signals.
* Forward Citizen Alerts to District level.

**Actor 3: District Admin (Collectorate / DDMA)**
* Login using Station ID and Password (e.g., POL-ALP-SOUTH).
* View overall District Dashboard and Live Connections.
* Monitor Citizen Alerts forwarded from Sub-Admins in a dedicated tab.
* Triage: Mark SOS as "Resolved" or "False Alarm".
* Issue localized District-wide Broadcast warnings.
* Receive Internal Voice/Image notices from the Super Admin.

**Actor 4: Super Admin (KSDMA Secretariat)**
* View State-Wide GIS Heatmap of all active SOS signals (Ultra-High Res Google Hybrid Satellite).
* View Hardware Infrastructure Map.
* Send override Broadcasts via WhatsApp API and SMS Gateway.
* Dispatch Internal Directives (Audio/Text/Image) to specific Collectorates via the secure internet backbone.
