require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Track live connections (IP -> Last Seen Timestamp)
const activeConnections = new Map();

// In-memory notices for inter-departmental communication
const notices = [];

app.use((req, res, next) => {
    // Record heartbeat for every request
    activeConnections.set(req.ip, Date.now());
    next();
});

// Endpoint to get system stats (e.g., live connections)
app.get('/api/v1/stats', (req, res) => {
    const now = Date.now();
    const threshold = 15000; // 15 seconds
    let count = 0;
    
    for (const [ip, lastSeen] of activeConnections.entries()) {
        if (now - lastSeen <= threshold) {
            count++;
        } else {
            activeConnections.delete(ip); // Cleanup old entries
        }
    }
    
    res.status(200).json({ liveConnections: count });
});

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized.');
} else {
    console.warn('⚠️ WARNING: Missing SUPABASE_URL or SUPABASE_KEY in .env file.');
    console.warn('The server will fail when attempting database operations.');
}

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok', dbConnected: !!supabase });
});

// Fallback mock stations in case Supabase is blocked by ISP/Firewall
const MOCK_STATIONS = [
    { stationId: 'POL-ALP-SOUTH', stationName: 'Alappuzha South Police Station (Offline Fallback)', department: 'POLICE' },
    { stationId: 'POL-ALP-NORTH', stationName: 'Alappuzha North Police Station (Offline Fallback)', department: 'POLICE' },
    { stationId: 'FRS-ALAPPUZHA', stationName: 'Fire and Rescue, Alappuzha (Offline Fallback)', department: 'FIRE_AND_RESCUE' }
];

// Endpoint to fetch all stations
app.get('/api/v1/stations', async (req, res) => {
    if (!supabase) return res.status(200).json(MOCK_STATIONS);

    try {
        const { data, error } = await supabase
            .from('stations')
            .select('station_id, station_name, department');
            
        if (error) throw error;
        
        // Map to expected camelCase format
        const formattedData = data.map(s => ({
            stationId: s.station_id,
            stationName: s.station_name,
            department: s.department
        }));
        
        res.status(200).json(formattedData);
    } catch (err) {
        console.error('Error fetching stations from Supabase. Falling back to local data:', err.message);
        res.status(200).json(MOCK_STATIONS);
    }
});

// Login endpoint
app.post('/api/v1/login', async (req, res) => {
    const { stationId, password } = req.body;

    if (!supabase) {
        if (password === 'admin123') return res.status(200).json({ success: true, station: { station_id: stationId, station_name: 'Offline Station' } });
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    try {
        const { data, error } = await supabase
            .from('stations')
            .select('*')
            .eq('station_id', stationId)
            .single();

        if (error) throw error;
        
        // Demo accept admin123 universally or exact temp password
        if (data && (password === data.temporary_password || password === 'admin123')) {
            res.status(200).json({ success: true, station: data });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Error during login (Supabase offline fallback):', err.message);
        if (password === 'admin123') {
            res.status(200).json({ success: true, station: { station_id: stationId, station_name: 'Offline Station' } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials or database error' });
        }
    }
});

// Endpoint to get all active SOS messages
app.get('/api/v1/sos', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    try {
        const { data, error } = await supabase
            .from('sos_messages')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Format to camelCase for frontend
        const formattedData = data.map(s => ({
            id: s.id,
            citizenId: s.citizen_id,
            lat: s.lat,
            lng: s.lng,
            timestamp: s.created_at,
            status: s.status
        }));
        
        res.status(200).json(formattedData);
    } catch (err) {
        console.error('Error fetching SOS:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to post a new SOS message
app.post('/api/v1/sos', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    const sosData = req.body;
    const id = sosData.sosId || sosData.messageId || `SOS-${Date.now()}`;
    
    try {
        const { error } = await supabase
            .from('sos_messages')
            .insert([{
                id: id,
                citizen_id: sosData.citizenId || 'UNKNOWN',
                lat: sosData.latitude || null,
                lng: sosData.longitude || null,
                status: 'ACTIVE'
            }]);
            
        if (error) throw error;
        res.status(201).json({ success: true, message: 'SOS saved' });
    } catch (err) {
        console.error('Error saving SOS:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to mark SOS as resolved
app.put('/api/v1/sos/:id/resolve', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    const sosId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('sos_messages')
            .update({ status: 'RESOLVED' })
            .eq('id', sosId);
            
        if (error) throw error;
        res.status(200).json({ success: true, message: 'SOS marked as resolved' });
    } catch (err) {
        console.error('Error resolving SOS:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to mark SOS as false alarm
app.put('/api/v1/sos/:id/false-alarm', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    const sosId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('sos_messages')
            .update({ status: 'FALSE_ALARM' })
            .eq('id', sosId);
            
        if (error) throw error;
        res.status(200).json({ success: true, message: 'SOS marked as false alarm' });
    } catch (err) {
        console.error('Error marking false alarm:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to POST a broadcast
app.post('/api/v1/broadcast', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    const data = req.body;
    const id = `BC-${Date.now()}`;
    
    try {
        const { error } = await supabase
            .from('broadcasts')
            .insert([{
                id: id,
                message: data.message
            }]);
            
        if (error) throw error;
        res.status(201).json({ success: true, broadcast: { id, message: data.message } });
    } catch (err) {
        console.error('Error saving broadcast:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to GET broadcasts
app.get('/api/v1/broadcast', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Database not configured' });

    try {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        const formattedData = data.map(b => ({
            id: b.id,
            message: b.message,
            timestamp: b.created_at
        }));
        
        res.status(200).json(formattedData);
    } catch (err) {
        console.error('Error fetching broadcasts:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to GET notices
app.get('/api/v1/notices', async (req, res) => {
    if (!supabase) return res.status(200).json(notices); // Fallback to memory
    
    try {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Notices table might not exist yet, falling back to memory');
            return res.status(200).json(notices);
        }
        
        const formattedData = data.map(n => ({
            id: n.id,
            sender: n.sender,
            target: n.target,
            type: n.type,
            content: n.content,
            timestamp: n.created_at
        }));
        
        res.status(200).json(formattedData);
    } catch (err) {
        res.status(200).json(notices); // Fallback
    }
});

// Endpoint to POST a notice
app.post('/api/v1/notices', async (req, res) => {
    const data = req.body;
    const newNotice = {
        id: `NOTICE-${Date.now()}`,
        sender: data.sender || 'KSDMA Super Admin',
        target: data.target || 'ALL',
        type: data.type || 'TEXT',
        content: data.content,
        timestamp: new Date().toISOString()
    };
    
    // Always add to memory as fallback/cache
    notices.unshift(newNotice);
    
    if (supabase) {
        try {
            await supabase.from('notices').insert([{
                id: newNotice.id,
                sender: newNotice.sender,
                target: newNotice.target,
                type: newNotice.type,
                content: newNotice.content
            }]);
        } catch(err) {
            console.error('Failed to insert notice into Supabase (table may not exist).');
        }
    }
    
    res.status(201).json({ success: true, notice: newNotice });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Production Backend Server running at http://0.0.0.0:${port}`);
});
