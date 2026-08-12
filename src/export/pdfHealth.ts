export async function checkPdfAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/export/pdf/health');
    if (!response.ok) return false;
    const result = await response.json() as { available?: boolean };
    return result.available === true;
  } catch {
    return false;
  }
}

