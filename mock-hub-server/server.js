const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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

let sosMessages = [];
let broadcasts = [];

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Endpoint to fetch all stations (without passwords for safety, though it's a mock)
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
    
    // For demo purposes, we accept "admin123" universally, or their exact temporary password
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
    broadcasts.unshift(newBroadcast); // Add to top
    res.status(201).json({ success: true, broadcast: newBroadcast });
});

// Endpoint for Android App to GET broadcasts
app.get('/api/v1/broadcast', (req, res) => {
    res.status(200).json(broadcasts);
});

// Endpoint for Android app to post a new SOS message
app.post('/api/v1/sos', (req, res) => {
    const sosData = req.body;
    console.log('Received new SOS:', sosData);
    
    const newSos = {
        id: sosData.sosId || sosData.messageId || `SOS-${Date.now()}`,
        citizenId: sosData.citizenId || 'UNKNOWN',
        lat: sosData.latitude || null,
        lng: sosData.longitude || null,
        timestamp: sosData.timestamp || new Date(),
        status: 'ACTIVE' // Always ACTIVE when first received by dashboard
    };
    sosMessages.unshift(newSos);
    
    res.status(201).json({ success: true, message: 'SOS saved' });
});

// Endpoint for Web Dashboard to mark SOS as resolved
app.put('/api/v1/sos/:id/resolve', (req, res) => {
    const sosId = req.params.id;
    const sos = sosMessages.find(s => s.id === sosId);
    if (sos) {
        sos.status = 'RESOLVED';
        res.status(200).json({ success: true, message: 'SOS marked as resolved' });
    } else {
        res.status(404).json({ success: false, message: 'SOS not found' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Mock Hub Server running at http://0.0.0.0:${port}`);
});
