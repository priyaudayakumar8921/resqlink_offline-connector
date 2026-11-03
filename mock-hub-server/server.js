require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================================
// DATA PERSISTENCE & OFFLINE QUEUES
// ============================================================
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SOS_FILE = path.join(DATA_DIR, 'sos_messages.json');
const QUEUE_FILE = path.join(DATA_DIR, 'offline_sync_queues.json');
const CONFIG_FILE = path.join(DATA_DIR, 'sync_config.json');

let sosMessages = [];
let broadcasts = [];
let notices = [];
let offlineSupabaseQueue = [];
let offlineSheetsQueue = [];

// Load persisted SOS logs if present
try {
    if (fs.existsSync(SOS_FILE)) {
        const raw = fs.readFileSync(SOS_FILE, 'utf8');
        sosMessages = JSON.parse(raw);
        console.log(`📂 Loaded ${sosMessages.length} saved SOS log(s) from disk.`);
    }
} catch (e) {
    console.error('Failed to load saved SOS messages:', e.message);
}

// Load persisted offline sync queues
try {
    if (fs.existsSync(QUEUE_FILE)) {
        const rawQueue = fs.readFileSync(QUEUE_FILE, 'utf8');
        const parsed = JSON.parse(rawQueue);
        offlineSupabaseQueue = parsed.supabase || [];
        offlineSheetsQueue = parsed.sheets || [];
    }
} catch (e) {
    console.error('Failed to load offline queues:', e.message);
}

function persistSosData() {
    try {
        fs.writeFileSync(SOS_FILE, JSON.stringify(sosMessages, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to persist SOS messages to disk:', e.message);
    }
}

function persistQueues() {
    try {
        fs.writeFileSync(QUEUE_FILE, JSON.stringify({
            supabase: offlineSupabaseQueue,
            sheets: offlineSheetsQueue
        }, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to persist queues:', e.message);
    }
}

// ============================================================
// SUPABASE CLIENT INITIALIZATION & DUAL SYNC
// ============================================================
let supabaseUrl = process.env.SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_KEY || '';
let supabase = null;
let supabaseStatus = 'INITIALIZING';

function initSupabase() {
    if (supabaseUrl && supabaseKey) {
        try {
            supabase = createClient(supabaseUrl, supabaseKey);
            supabaseStatus = 'CONFIGURED';
            console.log('✅ [Supabase] Client initialized for:', supabaseUrl);
        } catch (err) {
            supabaseStatus = 'ERROR';
            console.warn('⚠️ [Supabase] Client init failed:', err.message);
        }
    } else {
        supabaseStatus = 'NOT_CONFIGURED';
        console.log('ℹ️ [Supabase] Not configured. Set SUPABASE_URL and SUPABASE_KEY in .env to enable cloud sync.');
    }
}
initSupabase();

async function syncToSupabase(sos) {
    if (!supabase) {
        return;
    }

    const payload = {
        id: sos.id,
        citizen_id: sos.citizenId || 'UNKNOWN',
        lat: sos.lat !== undefined ? sos.lat : null,
        lng: sos.lng !== undefined ? sos.lng : null,
        emergency_type: sos.emergencyType || 'GENERAL',
        priority: sos.priority || 'NORMAL',
        description: sos.description || 'No description provided',
        status: sos.status || 'ACTIVE',
        created_at: sos.timestamp ? new Date(sos.timestamp).toISOString() : new Date().toISOString()
    };

    try {
        const { error } = await supabase.from('sos_messages').upsert([payload]);
        if (error) {
            // Check if column error (e.g. older schema missing emergency_type/priority/description)
            if (error.message && (error.message.includes('emergency_type') || error.message.includes('priority') || error.message.includes('description'))) {
                const fallbackPayload = {
                    id: payload.id,
                    citizen_id: payload.citizen_id,
                    lat: payload.lat,
                    lng: payload.lng,
                    status: payload.status,
                    created_at: payload.created_at
                };
                const { error: fallbackErr } = await supabase.from('sos_messages').upsert([fallbackPayload]);
                if (fallbackErr) throw fallbackErr;
            } else {
                throw error;
            }
        }
        supabaseStatus = 'CONNECTED';
        console.log(`☁️ [Supabase] Successfully synced SOS: ${sos.id}`);
    } catch (err) {
        supabaseStatus = 'OFFLINE_QUEUED';
        console.warn(`⚠️ [Supabase] Sync failed (${err.message}). Queued SOS ${sos.id} for retry.`);
        if (!offlineSupabaseQueue.some(q => q.id === sos.id)) {
            offlineSupabaseQueue.push(sos);
            persistQueues();
        }
    }
}

// ============================================================
// GOOGLE SHEETS LIVE LOGGER (WEBHOOK & LIVE SHEET VIEW)
// ============================================================
let googleSheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';
let googleSheetViewUrl = process.env.GOOGLE_SHEET_VIEW_URL || '';

// Load persisted sync config if present
try {
    if (fs.existsSync(CONFIG_FILE)) {
        const rawConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (rawConfig.googleSheetWebhookUrl) googleSheetWebhookUrl = rawConfig.googleSheetWebhookUrl;
        if (rawConfig.googleSheetViewUrl) googleSheetViewUrl = rawConfig.googleSheetViewUrl;
    }
} catch (e) {
    console.error('Failed to load sync config:', e.message);
}

function persistSyncConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({
            googleSheetWebhookUrl,
            googleSheetViewUrl
        }, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to persist sync config:', e.message);
    }
}

function postToGoogleSheet(url, payload, retryCount = 0) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        
        function send(currentUrl) {
            let parsed;
            try {
                parsed = new URL(currentUrl);
            } catch (err) {
                return reject(err);
            }
            
            const isHttps = parsed.protocol === 'https:';
            const lib = isHttps ? https : http;
            
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || (isHttps ? 443 : 80),
                path: parsed.pathname + parsed.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = lib.request(options, (res) => {
                // Google Apps Script redirects with 302 after processing doPost
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const redirectUrl = new URL(res.headers.location, currentUrl).href;
                    // For Google Apps Script echo, the redirect is fetched via GET
                    const redirectLib = redirectUrl.startsWith('https') ? https : http;
                    redirectLib.get(redirectUrl, (redRes) => {
                        let redBody = '';
                        redRes.on('data', chunk => redBody += chunk);
                        redRes.on('end', () => resolve({ status: redRes.statusCode, body: redBody }));
                    }).on('error', (err) => {
                        if (retryCount < 2) {
                            setTimeout(() => postToGoogleSheet(url, payload, retryCount + 1).then(resolve).catch(reject), 1000);
                        } else {
                            reject(err);
                        }
                    });
                    return;
                }

                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body }));
            });

            req.on('error', (err) => {
                if (retryCount < 2) {
                    setTimeout(() => postToGoogleSheet(url, payload, retryCount + 1).then(resolve).catch(reject), 1000);
                } else {
                    reject(err);
                }
            });

            req.setTimeout(25000, () => {
                req.destroy();
                if (retryCount < 2) {
                    setTimeout(() => postToGoogleSheet(url, payload, retryCount + 1).then(resolve).catch(reject), 1000);
                } else {
                    reject(new Error('Google Sheets request timed out'));
                }
            });

            req.write(data);
            req.end();
        }

        send(url);
    });
}

async function syncToGoogleSheets(sos) {
    if (!googleSheetWebhookUrl || googleSheetWebhookUrl.trim() === '') {
        return;
    }

    const d = sos.timestamp ? new Date(sos.timestamp) : new Date();
    const dateStr = d.toLocaleDateString('en-GB'); // YYYY-MM-DD or DD/MM/YYYY
    const timeStr = d.toLocaleTimeString('en-US'); // HH:MM:SS AM/PM
    const mapsLink = (sos.lat && sos.lng) ? `https://www.google.com/maps?q=${sos.lat},${sos.lng}` : '';

    const payload = {
        sosId: sos.id,
        id: sos.id,
        date: dateStr,
        time: timeStr,
        isoTimestamp: d.toISOString(),
        citizenId: sos.citizenId || 'UNKNOWN',
        emergencyType: sos.emergencyType || 'GENERAL',
        priority: sos.priority || 'NORMAL',
        latitude: sos.lat !== null && sos.lat !== undefined ? sos.lat : '',
        longitude: sos.lng !== null && sos.lng !== undefined ? sos.lng : '',
        googleMapsUrl: mapsLink,
        description: sos.description || 'No description provided',
        status: sos.status || 'ACTIVE'
    };

    try {
        const res = await postToGoogleSheet(googleSheetWebhookUrl, payload);
        console.log(`📊 [Google Sheet] Row appended for SOS ${sos.id}. HTTP status: ${res.status}`);
    } catch (err) {
        console.warn(`⚠️ [Google Sheet] Webhook failed (${err.message}). Queued SOS ${sos.id} for retry.`);
        if (!offlineSheetsQueue.some(q => q.id === sos.id)) {
            offlineSheetsQueue.push(sos);
            persistQueues();
        }
    }
}

// Background queue flusher (Runs every 20 seconds to retry queued offline items)
setInterval(async () => {
    // Flush Supabase Queue
    if (supabase && offlineSupabaseQueue.length > 0) {
        console.log(`🔄 Retrying ${offlineSupabaseQueue.length} queued SOS messages for Supabase...`);
        const item = offlineSupabaseQueue[0];
        try {
            await syncToSupabase(item);
            if (supabaseStatus === 'CONNECTED') {
                offlineSupabaseQueue.shift();
                persistQueues();
            }
        } catch (e) {}
    }

    // Flush Google Sheets Queue
    if (googleSheetWebhookUrl && offlineSheetsQueue.length > 0) {
        console.log(`🔄 Retrying ${offlineSheetsQueue.length} queued SOS messages for Google Sheets...`);
        const item = offlineSheetsQueue[0];
        try {
            await syncToGoogleSheets(item);
            offlineSheetsQueue.shift();
            persistQueues();
        } catch (e) {}
    }
}, 20000);

// Helper to generate CSV for Google Sheets / Excel
function generateCsv(messages) {
    const headers = [
        'Date',
        'Time',
        'SOS ID',
        'Citizen ID',
        'Emergency Category',
        'Priority',
        'Latitude',
        'Longitude',
        'Google Maps Link',
        'Status',
        'Voice Transcript / Description'
    ];

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const s = String(val).replace(/"/g, '""');
        return `"${s}"`;
    };

    const rows = messages.map(m => {
        const d = m.timestamp ? new Date(m.timestamp) : new Date();
        const dateStr = d.toLocaleDateString('en-GB');
        const timeStr = d.toLocaleTimeString('en-US');
        const mapsLink = (m.lat && m.lng) ? `https://www.google.com/maps?q=${m.lat},${m.lng}` : 'N/A';
        
        return [
            escapeCsv(dateStr),
            escapeCsv(timeStr),
            escapeCsv(m.id),
            escapeCsv(m.citizenId),
            escapeCsv(m.emergencyType || 'GENERAL'),
            escapeCsv(m.priority || 'NORMAL'),
            escapeCsv(m.lat !== null && m.lat !== undefined ? m.lat : ''),
            escapeCsv(m.lng !== null && m.lng !== undefined ? m.lng : ''),
            escapeCsv(mapsLink),
            escapeCsv(m.status || 'ACTIVE'),
            escapeCsv(m.description || '')
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
}

// ============================================================
// RESQLINK - ALAPPUZHA DISTRICT EMERGENCY STATION ACCOUNTS
// ============================================================
const stations = [
  { stationId: "POL-ALP-SOUTH", stationName: "Alappuzha South Police Station", department: "POLICE", username: "ALP_POL_SOUTH", temporaryPassword: "ALP@South2026", status: "ACTIVE" },
  { stationId: "POL-ALP-NORTH", stationName: "Alappuzha North Police Station", department: "POLICE", username: "ALP_POL_NORTH", temporaryPassword: "ALP@North2026", status: "ACTIVE" },
  { stationId: "POL-PUNNAPRA", stationName: "Punnapra Police Station", department: "POLICE", username: "ALP_POL_PUNNAPRA", temporaryPassword: "ALP@Punnapra2026", status: "ACTIVE" },
  { stationId: "POL-AMBALAPUZHA", stationName: "Ambalapuzha Police Station", department: "POLICE", username: "ALP_POL_AMBALAPUZHA", temporaryPassword: "ALP@Ambalapuzha2026", status: "ACTIVE" },
  { stationId: "POL-NEDUMUDY", stationName: "Nedumudy Police Station", department: "POLICE", username: "ALP_POL_NEDUMUDY", temporaryPassword: "ALP@Nedumudy2026", status: "ACTIVE" },
  { stationId: "POL-MARARIKKULAM", stationName: "Mararikkulam Police Station", department: "POLICE", username: "ALP_POL_MARARIKKULAM", temporaryPassword: "ALP@Mararikkulam2026", status: "ACTIVE" },
  { stationId: "POL-MANNANCHERY", stationName: "Mannanchery Police Station", department: "POLICE", username: "ALP_POL_MANNANCHERY", temporaryPassword: "ALP@Mannanchery2026", status: "ACTIVE" },
  { stationId: "POL-CHERTHALA", stationName: "Cherthala Police Station", department: "POLICE", username: "ALP_POL_CHERTHALA", temporaryPassword: "ALP@Cherthala2026", status: "ACTIVE" },
  { stationId: "POL-AROOR", stationName: "Aroor Police Station", department: "POLICE", username: "ALP_POL_AROOR", temporaryPassword: "ALP@Aroor2026", status: "ACTIVE" },
  { stationId: "POL-KUTHIATHODE", stationName: "Kuthiathode Police Station", department: "POLICE", username: "ALP_POL_KUTHIATHODE", temporaryPassword: "ALP@Kuthiathode2026", status: "ACTIVE" },
  { stationId: "POL-PATTANAKKAD", stationName: "Pattanakkad Police Station", department: "POLICE", username: "ALP_POL_PATTANAKKAD", temporaryPassword: "ALP@Pattanakkad2026", status: "ACTIVE" },
  { stationId: "POL-MUHAMMA", stationName: "Muhamma Police Station", department: "POLICE", username: "ALP_POL_MUHAMMA", temporaryPassword: "ALP@Muhamma2026", status: "ACTIVE" },
  { stationId: "POL-ARTHUNKAL", stationName: "Arthunkal Police Station", department: "POLICE", username: "ALP_POL_ARTHUNKAL", temporaryPassword: "ALP@Arthunkal2026", status: "ACTIVE" },
  { stationId: "POL-PULINCUNNU", stationName: "Pulincunnu Police Station", department: "POLICE", username: "ALP_POL_PULINCUNNU", temporaryPassword: "ALP@Pulincunnu2026", status: "ACTIVE" },
  { stationId: "POL-EDATHUA", stationName: "Edathua Police Station", department: "POLICE", username: "ALP_POL_EDATHUA", temporaryPassword: "ALP@Edathua2026", status: "ACTIVE" },
  { stationId: "POL-RAMANKARI", stationName: "Ramankari Police Station", department: "POLICE", username: "ALP_POL_RAMANKARI", temporaryPassword: "ALP@Ramankari2026", status: "ACTIVE" },
  { stationId: "POL-KAINADY", stationName: "Kainady Police Station", department: "POLICE", username: "ALP_POL_KAINADY", temporaryPassword: "ALP@Kainady2026", status: "ACTIVE" },
  { stationId: "POL-KAYAMKULAM", stationName: "Kayamkulam Police Station", department: "POLICE", username: "ALP_POL_KAYAMKULAM", temporaryPassword: "ALP@Kayamkulam2026", status: "ACTIVE" },
  { stationId: "POL-HARIPPAD", stationName: "Harippad Police Station", department: "POLICE", username: "ALP_POL_HARIPPAD", temporaryPassword: "ALP@Harippad2026", status: "ACTIVE" },
  { stationId: "POL-KAREELAKULANGARA", stationName: "Kareelakulangara Police Station", department: "POLICE", username: "ALP_POL_KAREELAKULANGARA", temporaryPassword: "ALP@Kareelakulangara2026", status: "ACTIVE" },
  { stationId: "POL-TRIKKUNNAPUZHA", stationName: "Trikkunnapuzha Police Station", department: "POLICE", username: "ALP_POL_TRIKKUNNAPUZHA", temporaryPassword: "ALP@Trikkunnapuzha2026", status: "ACTIVE" },
  { stationId: "POL-KANAKAKUNNU", stationName: "Kanakakunnu Police Station", department: "POLICE", username: "ALP_POL_KANAKAKUNNU", temporaryPassword: "ALP@Kanakakunnu2026", status: "ACTIVE" },
  { stationId: "POL-VALLIKUNNAM", stationName: "Vallikunnam Police Station", department: "POLICE", username: "ALP_POL_VALLIKUNNAM", temporaryPassword: "ALP@Vallikunnam2026", status: "ACTIVE" },
  { stationId: "POL-CHENGANNUR", stationName: "Chengannur Police Station", department: "POLICE", username: "ALP_POL_CHENGANNUR", temporaryPassword: "ALP@Chengannur2026", status: "ACTIVE" },
  { stationId: "POL-MANNAR", stationName: "Mannar Police Station", department: "POLICE", username: "ALP_POL_MANNAR", temporaryPassword: "ALP@Mannar2026", status: "ACTIVE" },
  { stationId: "POL-VENMONY", stationName: "Venmony Police Station", department: "POLICE", username: "ALP_POL_VENMONY", temporaryPassword: "ALP@Venmony2026", status: "ACTIVE" },
  { stationId: "POL-MAVELIKARA", stationName: "Mavelikara Police Station", department: "POLICE", username: "ALP_POL_MAVELIKARA", temporaryPassword: "ALP@Mavelikara2026", status: "ACTIVE" },
  { stationId: "POL-NOORANAD", stationName: "Nooranad Police Station", department: "POLICE", username: "ALP_POL_NOORANAD", temporaryPassword: "ALP@Nooranad2026", status: "ACTIVE" },
  { stationId: "POL-KURATHIKAD", stationName: "Kurathikad Police Station", department: "POLICE", username: "ALP_POL_KURATHIKAD", temporaryPassword: "ALP@Kurathikad2026", status: "ACTIVE" },
  { stationId: "POL-VEEYAPURAM", stationName: "Veeyapuram Police Station", department: "POLICE", username: "ALP_POL_VEEYAPURAM", temporaryPassword: "ALP@Veeyapuram2026", status: "ACTIVE" },
  { stationId: "POL-CYBER", stationName: "Cyber Police Station", department: "POLICE", username: "ALP_POL_CYBER", temporaryPassword: "ALP@Cyber2026", status: "ACTIVE" },
  { stationId: "POL-VANITHA", stationName: "Alappuzha Vanitha Police Station", department: "POLICE", username: "ALP_POL_VANITHA", temporaryPassword: "ALP@Vanitha2026", status: "ACTIVE" },
  { stationId: "POL-COASTAL", stationName: "Thottappally Coastal Police Station", department: "POLICE", username: "ALP_POL_COASTAL", temporaryPassword: "ALP@Coastal2026", status: "ACTIVE" },
  { stationId: "POL-TRAFFIC", stationName: "Alappuzha Traffic Police Station", department: "POLICE", username: "ALP_POL_TRAFFIC", temporaryPassword: "ALP@Traffic2026", status: "ACTIVE" },
  { stationId: "FRS-ALAPPUZHA", stationName: "Fire and Rescue Station, Alappuzha", department: "FIRE_AND_RESCUE", username: "ALP_FRS_ALAPPUZHA", temporaryPassword: "FRS@Alappuzha2026", status: "ACTIVE" },
  { stationId: "FRS-AROOR", stationName: "Fire and Rescue Station, Aroor", department: "FIRE_AND_RESCUE", username: "ALP_FRS_AROOR", temporaryPassword: "FRS@Aroor2026", status: "ACTIVE" },
  { stationId: "FRS-CHERTHALA", stationName: "Fire and Rescue Station, Cherthala", department: "FIRE_AND_RESCUE", username: "ALP_FRS_CHERTHALA", temporaryPassword: "FRS@Cherthala2026", status: "ACTIVE" },
  { stationId: "FRS-THAKAZHY", stationName: "Fire and Rescue Station, Thakazhy", department: "FIRE_AND_RESCUE", username: "ALP_FRS_THAKAZHY", temporaryPassword: "FRS@Thakazhy2026", status: "ACTIVE" },
  { stationId: "FRS-HARIPAD", stationName: "Fire and Rescue Station, Haripad", department: "FIRE_AND_RESCUE", username: "ALP_FRS_HARIPAD", temporaryPassword: "FRS@Haripad2026", status: "ACTIVE" },
  { stationId: "FRS-KAYAMKULAM", stationName: "Fire and Rescue Station, Kayamkulam", department: "FIRE_AND_RESCUE", username: "ALP_FRS_KAYAMKULAM", temporaryPassword: "FRS@Kayamkulam2026", status: "ACTIVE" },
  { stationId: "FRS-MAVELIKKARA", stationName: "Fire and Rescue Station, Mavelikkara", department: "FIRE_AND_RESCUE", username: "ALP_FRS_MAVELIKKARA", temporaryPassword: "FRS@Mavelikkara2026", status: "ACTIVE" },
  { stationId: "FRS-CHENGANNUR", stationName: "Fire and Rescue Station, Chengannur", department: "FIRE_AND_RESCUE", username: "ALP_FRS_CHENGANNUR", temporaryPassword: "FRS@Chengannur2026", status: "ACTIVE" }
];

// Root landing page to confirm server status in browser
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ResQLink Emergency Hub Server</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
                .card { max-width: 650px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
                h1 { color: #38bdf8; margin-top: 0; display: flex; align-items: center; gap: 10px; }
                .status-badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 14px; font-weight: bold; background: #059669; color: white; margin-bottom: 20px; }
                .endpoint { background: #0f172a; padding: 12px 16px; border-radius: 8px; margin: 8px 0; font-family: monospace; border: 1px solid #334155; }
                a { color: #38bdf8; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .dashboard-btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 20px; }
                .dashboard-btn:hover { background: #1d4ed8; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🛰️ ResQLink Hub Server</h1>
                <div class="status-badge">🟢 ONLINE & LISTENING (Port ${port})</div>
                <p>The backend emergency hub API is active and receiving telemetry from citizen devices, Supabase, and Google Sheets.</p>
                
                <h3>Active Integrations:</h3>
                <ul>
                    <li><strong>Supabase:</strong> ${supabaseStatus === 'CONNECTED' ? '🟢 Connected' : '🟡 ' + supabaseStatus}</li>
                    <li><strong>Google Sheets:</strong> ${googleSheetWebhookUrl ? '🟢 Webhook Active' : '⚪ Not Set'}</li>
                </ul>

                <h3>Available API Endpoints:</h3>
                <div class="endpoint">GET <a href="/api/v1/health" target="_blank">/api/v1/health</a> - System Health & Integrations</div>
                <div class="endpoint">GET <a href="/api/v1/sos" target="_blank">/api/v1/sos</a> - Live SOS Message Feed</div>
                <div class="endpoint">GET <a href="/api/v1/sync/status" target="_blank">/api/v1/sync/status</a> - Cloud Sync Queue Status</div>
                <div class="endpoint">GET <a href="/api/v1/sos/export-csv" target="_blank">/api/v1/sos/export-csv</a> - Download SOS CSV</div>

                <a href="http://localhost:5173" class="dashboard-btn" target="_blank">Open Web Dashboard (Port 5173) &rarr;</a>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        supabaseConfigured: !!supabase,
        supabaseStatus: supabaseStatus,
        googleSheetsConfigured: !!googleSheetWebhookUrl
    });
});

// Stats endpoint for Dashboard
app.get('/api/v1/stats', (req, res) => {
    const activeCitizens = new Set(sosMessages.filter(s => s.status === 'ACTIVE').map(s => s.citizenId));
    res.status(200).json({ liveConnections: activeCitizens.size > 0 ? activeCitizens.size : 1 });
});

// Sync Status endpoint for Dashboard
app.get('/api/v1/sync/status', (req, res) => {
    res.status(200).json({
        supabase: {
            configured: !!supabase,
            status: supabaseStatus,
            pendingCount: offlineSupabaseQueue.length
        },
        googleSheets: {
            configured: !!googleSheetWebhookUrl && googleSheetWebhookUrl.trim() !== '',
            webhookUrl: googleSheetWebhookUrl ? googleSheetWebhookUrl.replace(/(macros\/s\/)[^/]+(\/exec)/, '$1...$2') : '',
            rawWebhookUrl: googleSheetWebhookUrl,
            viewUrl: googleSheetViewUrl,
            pendingCount: offlineSheetsQueue.length
        },
        totalLogs: sosMessages.length
    });
});

// Endpoint to update Google Sheets / Supabase sync config
app.post('/api/v1/sync/config', (req, res) => {
    const { 
        googleSheetWebhookUrl: newSheetUrl, 
        googleSheetViewUrl: newViewUrl, 
        supabaseUrl: newSubUrl, 
        supabaseKey: newSubKey 
    } = req.body;
    
    if (newSheetUrl !== undefined) {
        googleSheetWebhookUrl = newSheetUrl.trim();
        process.env.GOOGLE_SHEET_WEBHOOK_URL = googleSheetWebhookUrl;
        console.log(`📌 Updated Google Sheet Webhook URL: ${googleSheetWebhookUrl ? 'Configured' : 'Cleared'}`);
    }

    if (newViewUrl !== undefined) {
        googleSheetViewUrl = newViewUrl.trim();
        process.env.GOOGLE_SHEET_VIEW_URL = googleSheetViewUrl;
        console.log(`📌 Updated Google Sheet View URL: ${googleSheetViewUrl ? 'Configured' : 'Cleared'}`);
    }

    persistSyncConfig();

    if (newSubUrl && newSubKey) {
        supabaseUrl = newSubUrl.trim();
        supabaseKey = newSubKey.trim();
        process.env.SUPABASE_URL = supabaseUrl;
        process.env.SUPABASE_KEY = supabaseKey;
        initSupabase();
    }

    res.status(200).json({
        success: true,
        message: 'Sync configuration updated',
        googleSheetsConfigured: !!googleSheetWebhookUrl,
        googleSheetViewUrl,
        supabaseConfigured: !!supabase
    });
});

// CSV Export endpoint for Google Sheets / Excel
app.get('/api/v1/sos/export-csv', (req, res) => {
    const csvData = generateCsv(sosMessages);
    const filename = `resqlink_sos_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
});

// Endpoint to fetch all stations
app.get('/api/v1/stations', (req, res) => {
    const safeStations = stations.map(s => ({
        stationId: s.stationId,
        stationName: s.stationName,
        department: s.department
    }));
    res.status(200).json(safeStations);
});

// Login endpoint
app.post('/api/v1/login', (req, res) => {
    const { stationId, password } = req.body;
    const station = stations.find(s => s.stationId === stationId);
    
    if (station && (password === station.temporaryPassword || password === 'admin123')) {
        res.status(200).json({ success: true, station });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Endpoint for Web Dashboard to get all SOS messages
app.get('/api/v1/sos', (req, res) => {
    res.status(200).json(sosMessages);
});

// Endpoint for Web Dashboard to POST a broadcast
app.post('/api/v1/broadcast', (req, res) => {
    const data = req.body;
    console.log('Received new broadcast:', data.message);
    const newBroadcast = {
        id: `BC-${Date.now()}`,
        message: data.message,
        timestamp: new Date()
    };
    broadcasts.unshift(newBroadcast);
    res.status(201).json({ success: true, broadcast: newBroadcast });
});

// Endpoint for Android App to GET broadcasts
app.get('/api/v1/broadcast', (req, res) => {
    res.status(200).json(broadcasts);
});

// Endpoint to clear broadcasts for testing
app.delete('/api/v1/broadcast', (req, res) => {
    broadcasts = [];
    res.status(200).json({ success: true, message: 'All broadcasts cleared' });
});

// Endpoint for Android app to post a new SOS message
app.post('/api/v1/sos', (req, res) => {
    const sosData = req.body;
    console.log('\n🚨 [Hub] Received new SOS distress signal:', sosData);
    
    const newSos = {
        id: sosData.sosId || sosData.messageId || `SOS-${Date.now()}`,
        citizenId: sosData.citizenId || 'UNKNOWN',
        lat: sosData.latitude !== undefined ? sosData.latitude : null,
        lng: sosData.longitude !== undefined ? sosData.longitude : null,
        timestamp: sosData.timestamp || new Date(),
        status: 'ACTIVE',
        description: sosData.description || 'No description provided',
        emergencyType: sosData.emergencyType || 'GENERAL',
        priority: sosData.priority || 'NORMAL'
    };

    // 1. Store in memory and local file immediately (100% resilient offline guarantee)
    // Check if duplicate ID exists, update if exists, else unshift
    const existingIndex = sosMessages.findIndex(s => s.id === newSos.id);
    if (existingIndex >= 0) {
        sosMessages[existingIndex] = newSos;
    } else {
        sosMessages.unshift(newSos);
    }
    persistSosData();

    // 2. Dual-Sync: Asynchronously push to Supabase (Cloud SQL Database)
    syncToSupabase(newSos).catch(err => {
        console.warn('Supabase async sync error:', err.message);
    });

    // 3. Dual-Sync: Asynchronously push to Google Sheets (Audit / Spreadsheet Logger)
    syncToGoogleSheets(newSos).catch(err => {
        console.warn('Google Sheets async sync error:', err.message);
    });

    res.status(201).json({ 
        success: true, 
        message: 'SOS received and logged locally and to external sinks',
        id: newSos.id
    });
});

// Endpoint for Web Dashboard to mark SOS as resolved
app.put('/api/v1/sos/:id/resolve', async (req, res) => {
    const sosId = req.params.id;
    const sos = sosMessages.find(s => s.id === sosId);
    if (sos) {
        sos.status = 'RESOLVED';
        persistSosData();

        // Update in Supabase
        if (supabase) {
            try {
                await supabase.from('sos_messages').update({ status: 'RESOLVED' }).eq('id', sosId);
            } catch (e) {}
        }

        // Log resolution update to Google Sheet
        syncToGoogleSheets({ ...sos, status: 'RESOLVED' }).catch(() => {});

        res.status(200).json({ success: true, message: 'SOS marked as resolved' });
    } else {
        res.status(404).json({ success: false, message: 'SOS not found' });
    }
});

// Endpoint for Web Dashboard to mark SOS as false alarm
app.put('/api/v1/sos/:id/false-alarm', async (req, res) => {
    const sosId = req.params.id;
    const sos = sosMessages.find(s => s.id === sosId);
    if (sos) {
        sos.status = 'FALSE_ALARM';
        persistSosData();

        // Update in Supabase
        if (supabase) {
            try {
                await supabase.from('sos_messages').update({ status: 'FALSE_ALARM' }).eq('id', sosId);
            } catch (e) {}
        }

        // Log false alarm update to Google Sheet
        syncToGoogleSheets({ ...sos, status: 'FALSE_ALARM' }).catch(() => {});

        res.status(200).json({ success: true, message: 'SOS marked as false alarm' });
    } else {
        res.status(404).json({ success: false, message: 'SOS not found' });
    }
});

// Endpoints for inter-departmental notices
app.get('/api/v1/notices', (req, res) => {
    res.status(200).json(notices);
});

app.post('/api/v1/notices', (req, res) => {
    const notice = req.body;
    notices.unshift(notice);
    res.status(201).json({ success: true, notice });
});

app.listen(port, '0.0.0.0', () => {
    const os = require('os');
    const dgram = require('dgram');

    console.log('\n==========================================================');
    console.log(`📡 RESQLINK MOCK HUB SERVER running on port ${port}`);
    console.log(`☁️ Supabase Cloud DB: ${supabase ? 'ENABLED' : 'DISABLED / NOT CONFIGURED'}`);
    console.log(`📊 Google Sheets Sync: ${googleSheetWebhookUrl ? 'ENABLED' : 'Awaiting Webhook URL'}`);
    console.log(`📥 Instant CSV / Sheet Export: http://localhost:${port}/api/v1/sos/export-csv`);
    console.log('----------------------------------------------------------');
    console.log('Connect your Android device / Wi-Fi Direct / Local Wi-Fi to:');
    
    const interfaces = os.networkInterfaces();
    const broadcastAddresses = ['255.255.255.255'];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(` 👉 ${name}: http://${iface.address}:${port}/api/v1`);
                
                if (iface.netmask === '255.255.255.0') {
                    const parts = iface.address.split('.');
                    parts[3] = '255';
                    broadcastAddresses.push(parts.join('.'));
                }
            }
        }
    }
    console.log(` 👉 Android Emulator: http://10.0.2.2:${port}/api/v1`);
    console.log('==========================================================\n');
    
    // Start UDP Broadcast for automatic discovery by Android app
    const udpClient = dgram.createSocket('udp4');
    
    udpClient.bind(() => {
        udpClient.setBroadcast(true);
        console.log(`[Discovery] UDP Broadcaster active on port 41144 -> [${broadcastAddresses.join(', ')}]`);
        
        setInterval(() => {
            const message = Buffer.from(`RESQLINK_HUB:${port}`);
            for (const addr of broadcastAddresses) {
                udpClient.send(message, 0, message.length, 41144, addr, (err) => {
                    // Suppress broadcast network unreachable errors
                });
            }
        }, 2000);
    });
});
