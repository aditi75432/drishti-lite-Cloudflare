/**
 * UTILS MODULE
 * Helper functions to handle data cleaning and parsing.
 */

export function extractJson(rawString) {
  // 1. Try parsing directly (Best case)
  try {
    return JSON.parse(rawString);
  } catch (e) {
    // Continue to hunter logic
  }

  // 2. JSON Hunter: Find the first '{' and the last '}'
  const start = rawString.indexOf('{');
  const end = rawString.lastIndexOf('}');

  if (start !== -1 && end !== -1) {
    const jsonCandidate = rawString.substring(start, end + 1);
    try {
      // Remove any markdown formatting like ```json or ```
      const cleanCandidate = jsonCandidate.replace(/\\n/g, '').replace(/\\"/g, '"'); 
      return JSON.parse(jsonCandidate);
    } catch (e) {
      console.error("JSON Hunter failed on candidate:", jsonCandidate);
      throw new Error("Could not extract valid JSON from AI response.");
    }
  }

  throw new Error("No JSON object found in response.");
}