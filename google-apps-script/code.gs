/**
 * @file code.gs
 * @description Google Apps Script web app designed to read the campaign canvass dataset from the active spreadsheet,
 * clean and parse the data columns, and export it as a public CORS-enabled JSON API payload.
 *
 * Spreadsheet Column Layout expected:
 * Column A: committee_name
 * Column B: week_start
 * Column C: doors_attempted
 * Column D: doors_canvassed
 */

/**
 * Serves HTTP GET requests by fetching the spreadsheet content and returning a CORS-compliant JSON payload.
 * @param {GoogleAppsScript.Events.AppsScriptEvent} e - The event object representing the GET request parameters.
 * @returns {GoogleAppsScript.HTML.HtmlOutput | GoogleAppsScript.Content.TextOutput} The API response with formatted data or error context.
 */
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error("No active spreadsheet found. Please make sure this script is container-bound to your sheet.");
    }
    
    const sheet = spreadsheet.getSheets()[0]; // Read first sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      return createJsonResponse({
        success: false,
        error: "Spreadsheet contains no data rows besides the header."
      });
    }
    
    // Parse header to identify columns or fall back to standard indices (A:0, B:1, C:2, D:3)
    const headers = values[0].map(h => String(h).toLowerCase().trim());
    const colIndices = {
      committeeName: headers.indexOf("committee_name") !== -1 ? headers.indexOf("committee_name") : 0,
      weekStart: headers.indexOf("week_start") !== -1 ? headers.indexOf("week_start") : 1,
      doorsAttempted: headers.indexOf("doors_attempted") !== -1 ? headers.indexOf("doors_attempted") : 2,
      doorsCanvassed: headers.indexOf("doors_canvassed") !== -1 ? headers.indexOf("doors_canvassed") : 3
    };
    
    const campaigns = [];
    
    // Loop through rows skipping the header
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const committeeName = String(row[colIndices.committeeName] || "").trim();
      
      // Skip empty names
      if (!committeeName) continue;
      
      let weekStartVal = row[colIndices.weekStart];
      let weekStartStr = "";
      if (weekStartVal instanceof Date) {
        weekStartStr = weekStartVal.toISOString().split("T")[0];
      } else if (weekStartVal) {
        weekStartStr = String(weekStartVal).trim();
      }
      
      const doorsAttempted = parseInt(row[colIndices.doorsAttempted], 10) || 0;
      const doorsCanvassed = parseInt(row[colIndices.doorsCanvassed], 10) || 0;
      
      campaigns.push({
        committee_name: committeeName,
        week_start: weekStartStr,
        doors_attempted: doorsAttempted,
        doors_canvassed: doorsCanvassed
      });
    }
    
    return createJsonResponse({
      success: true,
      last_updated: new Date().toISOString(),
      data: campaigns
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || String(error)
    });
  }
}

/**
 * Creates an evaluation-safe, CORS-enabled JSON payload response for Web API queries.
 * @param {Object} payload - The JavaScript object representation to serialize.
 * @returns {GoogleAppsScript.Content.TextOutput} The output container parsed with application/json mime-type.
 */
function createJsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
