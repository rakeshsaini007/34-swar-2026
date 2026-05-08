/**
 * Google Apps Script backend for Elector Verification Portal.
 * Deploy as a Web App with access 'Anyone'.
 */

const SHEET_NAME = 'Data';

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'search') {
    return searchRecords(e.parameter.epicNumber);
  }
  
  return createResponse({ error: "Invalid Action" }, 400);
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    
    if (action === 'update') {
      return updateRecord(contents.data);
    }
  } catch (err) {
    return createResponse({ error: err.message }, 500);
  }
  
  return createResponse({ error: "Invalid POST Action" }, 400);
}

function searchRecords(epicNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createResponse({ error: "Sheet '" + SHEET_NAME + "' not found" }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];

  const epicIdx = headers.indexOf('Epic Number');
  if (epicIdx === -1) {
    return createResponse({ error: "Column 'Epic Number' not found" }, 404);
  }

  for (let i = 1; i < data.length; i++) {
    const sheetEpic = String(data[i][epicIdx]).trim().toUpperCase();
    const searchEpic = String(epicNumber).trim().toUpperCase();
    if (sheetEpic === searchEpic) {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = data[i][index];
      });
      results.push(obj);
    }
  }

  return createResponse(results);
}

function updateRecord(updateData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return createResponse({ success: false, error: "Sheet not found" }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const epicIdx = headers.indexOf('Epic Number');
  const adharIdx = headers.indexOf('Adhar Number');
  const mobileIdx = headers.indexOf('Mobile Number');

  if (epicIdx === -1 || adharIdx === -1 || mobileIdx === -1) {
    return createResponse({ success: false, error: "Required columns missing in Sheet" }, 400);
  }

  let foundRowIndex = -1;
  const updateEpic = String(updateData['Epic Number']).trim().toUpperCase();

  for (let i = 1; i < data.length; i++) {
    const sheetEpic = String(data[i][epicIdx]).trim().toUpperCase();
    if (sheetEpic === updateEpic) {
      foundRowIndex = i + 1; // 1-based index for sheet
      break;
    }
  }

  if (foundRowIndex !== -1) {
    // Update Adhar Number
    sheet.getRange(foundRowIndex, adharIdx + 1).setValue(updateData['Adhar Number']);
    // Update Mobile Number
    sheet.getRange(foundRowIndex, mobileIdx + 1).setValue(updateData['Mobile Number']);
    
    return createResponse({ success: true });
  }

  return createResponse({ success: false, error: "Record not found" }, 404);
}

function createResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
