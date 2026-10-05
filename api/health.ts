/**
 * Serverless Health Check Endpoint
 * Path: /api/health
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    nodeEnv: string;
    masKeyConfigured: boolean;
  };
  endpoints: {
    health: string;
    sora: string;
  };
}

const startTime = Date.now();

export default async function handler(req: any, res?: any) {
  // Check if MAS_KEY_ID is configured without exposing the secret
  const masKeyConfigured = Boolean(
    process.env.MAS_KEY_ID && process.env.MAS_KEY_ID !== 'YOUR_MAS_KEY_ID_HERE'
  );

  const payload: HealthResponse = {
    status: 'ok',
    service: 'singapore-sora-calculator-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      masKeyConfigured,
    },
    endpoints: {
      health: '/api/health',
      sora: '/api/sora',
    },
  };

  // Support Web Standard Response (Edge / Next.js runtime)
  if (!res || typeof res.status !== 'function') {
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  // Support Node.js / Express / Vercel Serverless runtime
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, x-mas-key-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json(payload);
}

// Web standard export for Edge runtimes
export async function GET(request: Request) {
  return handler(request);
}
