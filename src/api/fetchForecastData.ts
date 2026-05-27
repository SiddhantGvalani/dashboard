import { z } from 'zod';
import { createEndpoint } from 'zite-integrations-backend-sdk';

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64url(Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })));
  const signingInput = `${header}.${payload}`;
  const pemKey = (serviceAccount.private_key ?? '').replace(/\\n/g, '\n');
  const pemContents = pemKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryKey = Buffer.from(pemContents, 'base64');
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(signingInput, 'utf8'));
  const signature = b64url(Buffer.from(signatureBuf));
  const jwt = `${signingInput}.${signature}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) throw new Error(`Google OAuth failed: ${tokenData.error ?? JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function fetchRange(sheetId: string, range: string, accessToken: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sheets API error (${res.status}): ${errText}`);
  }
  const data = await res.json() as { values?: string[][] };
  return data.values ?? [];
}

export default createEndpoint({
  description: 'Fetches ALL rows from a Google Sheet (no ETD filter). Supports Reference Start Row. Used for Active Forecasts module.',
  inputSchema: z.object({
    sheetId: z.string(),
    sheetName: z.string(),
    serviceAccountJson: z.string(),
    startRow: z.number().optional(), // Reference Start Row (default: 2)
  }),
  outputSchema: z.object({
    rows: z.array(z.record(z.string())),
    columns: z.array(z.string()),
  }),
  execute: async ({ input }) => {
    const serviceAccount = JSON.parse(input.serviceAccountJson) as Record<string, string>;
    const accessToken = await getAccessToken(serviceAccount);

    // Validate startRow — must be >= 2, default 2
    const startRow = (input.startRow != null && input.startRow >= 2) ? input.startRow : 2;

    // Always fetch header from Row 1
    const headerValues = await fetchRange(input.sheetId, `${input.sheetName}!1:1`, accessToken);
    if (!headerValues.length || !headerValues[0].length) {
      return { rows: [], columns: [] };
    }
    const headers = headerValues[0].map((h: string) => h.trim());

    // Fetch data from startRow to end of sheet (no end limit)
    const dataValues = await fetchRange(input.sheetId, `${input.sheetName}!A${startRow}:Z`, accessToken);

    if (!dataValues.length) return { rows: [], columns: headers };

    const rows = dataValues.map(row => {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => { record[h] = (row[i] ?? '').trim(); });
      return record;
    });

    return { rows, columns: headers };
  },
});
