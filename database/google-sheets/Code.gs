/**
 * RESQLINK DISASTER SOS - GOOGLE SHEETS LIVE LOGGER
 * ===================================================
 * This script receives real-time emergency SOS distress signals
 * from the ResQLink Emergency Hub and logs them directly into
 * this Google Sheet with Date, Time, GPS Coordinates, and Voice Transcripts.
 * 
 * SETUP INSTRUCTIONS (takes < 1 minute):
 * 1. Open a new Google Sheet (or existing sheet).
 * 2. In Google Sheets menu, click: Extensions > Apps Script.
 * 3. Delete any default code and paste this entire file.
 * 4. Click the Save icon (Ctrl+S or Cmd+S).
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Set:
 *    - Description: "ResQLink Emergency Logger"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy", authorize the script if prompted, and copy the "Web app URL".
 * 9. Paste that URL into ResQLink Hub:
 *    - In mock-hub-server/.env: GOOGLE_SHEET_WEBHOOK_URL=<Your Web app URL>
 *    - OR via the Admin Web Dashboard under "Connect Google Sheet".
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent concurrent write collisions
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Auto-create and format header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Date",
        "Time",
        "SOS ID",
        "Citizen ID",
        "Emergency Category",
        "Priority",
        "Latitude",
        "Longitude",
        "Google Maps Link",
        "Voice Transcript / Description",
        "Status",
        "Logged At (ISO)"
      ];
      sheet.appendRow(headers);
      
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1e293b"); // Slate dark
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    // Format Date & Time
    var now = new Date();
    var dateStr = data.date || Utilities.formatDate(now, Session.getScriptTimeZone() || "UTC", "yyyy-MM-dd");
    var timeStr = data.time || Utilities.formatDate(now, Session.getScriptTimeZone() || "UTC", "HH:mm:ss");
    
    // Build Google Maps Link
    var mapsUrl = (data.latitude && data.longitude)
      ? "https://www.google.com/maps?q=" + data.latitude + "," + data.longitude
      : "No GPS Coordinates";
      
    // Priority styling helper
    var priority = (data.priority || "NORMAL").toUpperCase();
    var category = (data.emergencyType || "GENERAL").toUpperCase();
    var status = (data.status || "ACTIVE").toUpperCase();
    
    // Clean description / voice transcript
    var description = (data.description || "No description provided")
      .replace(/\[VOICE_EMERGENCY\]/g, "")
      .trim();

    // Append the row
    sheet.appendRow([
      dateStr,
      timeStr,
      data.sosId || data.id || ("SOS-" + now.getTime()),
      data.citizenId || "UNKNOWN",
      category,
      priority,
      data.latitude !== undefined && data.latitude !== null ? data.latitude : "",
      data.longitude !== undefined && data.longitude !== null ? data.longitude : "",
      mapsUrl,
      description,
      status,
      data.isoTimestamp || now.toISOString()
    ]);
    
    var lastRow = sheet.getLastRow();
    
    // Highlight Critical / High Priority rows
    var priorityCell = sheet.getRange(lastRow, 6);
    if (priority === "CRITICAL") {
      priorityCell.setBackground("#fee2e2"); // Light red
      priorityCell.setFontColor("#991b1b");
      priorityCell.setFontWeight("bold");
    } else if (priority === "HIGH") {
      priorityCell.setBackground("#fef3c7"); // Light amber
      priorityCell.setFontColor("#92400e");
      priorityCell.setFontWeight("bold");
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "SOS Logged Successfully",
      row: lastRow,
      sosId: data.id || data.sosId
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    lock.releaseLock();
  }
}

// Health check endpoint for testing deployment in browser
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "ResQLink Emergency SOS Google Sheets Logger",
    version: "2.0",
    message: "Web hook active and ready to log distress signals."
  })).setMimeType(ContentService.MimeType.JSON);
}

