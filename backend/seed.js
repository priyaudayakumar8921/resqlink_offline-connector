require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const stations = [
  { station_id: "POL-ALP-SOUTH", station_name: "Alappuzha South Police Station", department: "POLICE", username: "ALP_POL_SOUTH", temporary_password: "ALP@South2026", status: "ACTIVE" },
  { station_id: "POL-ALP-NORTH", station_name: "Alappuzha North Police Station", department: "POLICE", username: "ALP_POL_NORTH", temporary_password: "ALP@North2026", status: "ACTIVE" },
  { station_id: "POL-PUNNAPRA", station_name: "Punnapra Police Station", department: "POLICE", username: "ALP_POL_PUNNAPRA", temporary_password: "ALP@Punnapra2026", status: "ACTIVE" },
  { station_id: "POL-AMBALAPUZHA", station_name: "Ambalapuzha Police Station", department: "POLICE", username: "ALP_POL_AMBALAPUZHA", temporary_password: "ALP@Ambalapuzha2026", status: "ACTIVE" },
  { station_id: "POL-NEDUMUDY", station_name: "Nedumudy Police Station", department: "POLICE", username: "ALP_POL_NEDUMUDY", temporary_password: "ALP@Nedumudy2026", status: "ACTIVE" },
  { station_id: "POL-MARARIKKULAM", station_name: "Mararikkulam Police Station", department: "POLICE", username: "ALP_POL_MARARIKKULAM", temporary_password: "ALP@Mararikkulam2026", status: "ACTIVE" },
  { station_id: "POL-MANNANCHERY", station_name: "Mannanchery Police Station", department: "POLICE", username: "ALP_POL_MANNANCHERY", temporary_password: "ALP@Mannanchery2026", status: "ACTIVE" },
  { station_id: "POL-CHERTHALA", station_name: "Cherthala Police Station", department: "POLICE", username: "ALP_POL_CHERTHALA", temporary_password: "ALP@Cherthala2026", status: "ACTIVE" },
  { station_id: "POL-AROOR", station_name: "Aroor Police Station", department: "POLICE", username: "ALP_POL_AROOR", temporary_password: "ALP@Aroor2026", status: "ACTIVE" },
  { station_id: "POL-KUTHIATHODE", station_name: "Kuthiathode Police Station", department: "POLICE", username: "ALP_POL_KUTHIATHODE", temporary_password: "ALP@Kuthiathode2026", status: "ACTIVE" },
  { station_id: "POL-PATTANAKKAD", station_name: "Pattanakkad Police Station", department: "POLICE", username: "ALP_POL_PATTANAKKAD", temporary_password: "ALP@Pattanakkad2026", status: "ACTIVE" },
  { station_id: "POL-MUHAMMA", station_name: "Muhamma Police Station", department: "POLICE", username: "ALP_POL_MUHAMMA", temporary_password: "ALP@Muhamma2026", status: "ACTIVE" },
  { station_id: "POL-ARTHUNKAL", station_name: "Arthunkal Police Station", department: "POLICE", username: "ALP_POL_ARTHUNKAL", temporary_password: "ALP@Arthunkal2026", status: "ACTIVE" },
  { station_id: "POL-PULINCUNNU", station_name: "Pulincunnu Police Station", department: "POLICE", username: "ALP_POL_PULINCUNNU", temporary_password: "ALP@Pulincunnu2026", status: "ACTIVE" },
  { station_id: "POL-EDATHUA", station_name: "Edathua Police Station", department: "POLICE", username: "ALP_POL_EDATHUA", temporary_password: "ALP@Edathua2026", status: "ACTIVE" },
  { station_id: "POL-RAMANKARI", station_name: "Ramankari Police Station", department: "POLICE", username: "ALP_POL_RAMANKARI", temporary_password: "ALP@Ramankari2026", status: "ACTIVE" },
  { station_id: "POL-KAINADY", station_name: "Kainady Police Station", department: "POLICE", username: "ALP_POL_KAINADY", temporary_password: "ALP@Kainady2026", status: "ACTIVE" },
  { station_id: "POL-KAYAMKULAM", station_name: "Kayamkulam Police Station", department: "POLICE", username: "ALP_POL_KAYAMKULAM", temporary_password: "ALP@Kayamkulam2026", status: "ACTIVE" },
  { station_id: "POL-HARIPPAD", station_name: "Harippad Police Station", department: "POLICE", username: "ALP_POL_HARIPPAD", temporary_password: "ALP@Harippad2026", status: "ACTIVE" },
  { station_id: "POL-KAREELAKULANGARA", station_name: "Kareelakulangara Police Station", department: "POLICE", username: "ALP_POL_KAREELAKULANGARA", temporary_password: "ALP@Kareelakulangara2026", status: "ACTIVE" },
  { station_id: "POL-TRIKKUNNAPUZHA", station_name: "Trikkunnapuzha Police Station", department: "POLICE", username: "ALP_POL_TRIKKUNNAPUZHA", temporary_password: "ALP@Trikkunnapuzha2026", status: "ACTIVE" },
  { station_id: "POL-KANAKAKUNNU", station_name: "Kanakakunnu Police Station", department: "POLICE", username: "ALP_POL_KANAKAKUNNU", temporary_password: "ALP@Kanakakunnu2026", status: "ACTIVE" },
  { station_id: "POL-VALLIKUNNAM", station_name: "Vallikunnam Police Station", department: "POLICE", username: "ALP_POL_VALLIKUNNAM", temporary_password: "ALP@Vallikunnam2026", status: "ACTIVE" },
  { station_id: "POL-CHENGANNUR", station_name: "Chengannur Police Station", department: "POLICE", username: "ALP_POL_CHENGANNUR", temporary_password: "ALP@Chengannur2026", status: "ACTIVE" },
  { station_id: "POL-MANNAR", station_name: "Mannar Police Station", department: "POLICE", username: "ALP_POL_MANNAR", temporary_password: "ALP@Mannar2026", status: "ACTIVE" },
  { station_id: "POL-VENMONY", station_name: "Venmony Police Station", department: "POLICE", username: "ALP_POL_VENMONY", temporary_password: "ALP@Venmony2026", status: "ACTIVE" },
  { station_id: "POL-MAVELIKARA", station_name: "Mavelikara Police Station", department: "POLICE", username: "ALP_POL_MAVELIKARA", temporary_password: "ALP@Mavelikara2026", status: "ACTIVE" },
  { station_id: "POL-NOORANAD", station_name: "Nooranad Police Station", department: "POLICE", username: "ALP_POL_NOORANAD", temporary_password: "ALP@Nooranad2026", status: "ACTIVE" },
  { station_id: "POL-KURATHIKAD", station_name: "Kurathikad Police Station", department: "POLICE", username: "ALP_POL_KURATHIKAD", temporary_password: "ALP@Kurathikad2026", status: "ACTIVE" },
  { station_id: "POL-VEEYAPURAM", station_name: "Veeyapuram Police Station", department: "POLICE", username: "ALP_POL_VEEYAPURAM", temporary_password: "ALP@Veeyapuram2026", status: "ACTIVE" },
  { station_id: "POL-CYBER", "station_name": "Cyber Police Station", department: "POLICE", username: "ALP_POL_CYBER", temporary_password: "ALP@Cyber2026", status: "ACTIVE" },
  { station_id: "POL-VANITHA", "station_name": "Alappuzha Vanitha Police Station", department: "POLICE", username: "ALP_POL_VANITHA", temporary_password: "ALP@Vanitha2026", status: "ACTIVE" },
  { station_id: "POL-COASTAL", "station_name": "Thottappally Coastal Police Station", department: "POLICE", username: "ALP_POL_COASTAL", temporary_password: "ALP@Coastal2026", status: "ACTIVE" },
  { station_id: "POL-TRAFFIC", "station_name": "Alappuzha Traffic Police Station", department: "POLICE", username: "ALP_POL_TRAFFIC", temporary_password: "ALP@Traffic2026", status: "ACTIVE" },
  { station_id: "FRS-ALAPPUZHA", "station_name": "Fire and Rescue Station, Alappuzha", department: "FIRE_AND_RESCUE", username: "ALP_FRS_ALAPPUZHA", temporary_password: "FRS@Alappuzha2026", status: "ACTIVE" },
  { station_id: "FRS-AROOR", "station_name": "Fire and Rescue Station, Aroor", department: "FIRE_AND_RESCUE", username: "ALP_FRS_AROOR", temporary_password: "FRS@Aroor2026", status: "ACTIVE" },
  { station_id: "FRS-CHERTHALA", "station_name": "Fire and Rescue Station, Cherthala", department: "FIRE_AND_RESCUE", username: "ALP_FRS_CHERTHALA", temporary_password: "FRS@Cherthala2026", status: "ACTIVE" },
  { station_id: "FRS-THAKAZHY", "station_name": "Fire and Rescue Station, Thakazhy", department: "FIRE_AND_RESCUE", username: "ALP_FRS_THAKAZHY", temporary_password: "FRS@Thakazhy2026", status: "ACTIVE" },
  { station_id: "FRS-HARIPAD", "station_name": "Fire and Rescue Station, Haripad", department: "FIRE_AND_RESCUE", username: "ALP_FRS_HARIPAD", temporary_password: "FRS@Haripad2026", status: "ACTIVE" },
  { station_id: "FRS-KAYAMKULAM", "station_name": "Fire and Rescue Station, Kayamkulam", department: "FIRE_AND_RESCUE", username: "ALP_FRS_KAYAMKULAM", temporary_password: "FRS@Kayamkulam2026", status: "ACTIVE" },
  { station_id: "FRS-MAVELIKKARA", "station_name": "Fire and Rescue Station, Mavelikkara", department: "FIRE_AND_RESCUE", username: "ALP_FRS_MAVELIKKARA", temporary_password: "FRS@Mavelikkara2026", status: "ACTIVE" },
  { station_id: "FRS-CHENGANNUR", "station_name": "Fire and Rescue Station, Chengannur", department: "FIRE_AND_RESCUE", username: "ALP_FRS_CHENGANNUR", temporary_password: "FRS@Chengannur2026", status: "ACTIVE" }
];

async function seed() {
  console.log('Seeding data...');
  const { data, error } = await supabase.from('stations').upsert(stations, { onConflict: 'station_id' });
  if (error) {
    console.error('Failed to seed:', error);
  } else {
    console.log('Seeding successful!');
  }
}

seed();
