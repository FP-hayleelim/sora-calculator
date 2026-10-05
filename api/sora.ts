/**
 * Serverless MAS SORA Data Fetcher Endpoint
 * Path: /api/sora
 *
 * Pulls MAS backed overnight rates and compounded averages from the
 * Monetary Authority of Singapore Domestic Interest Rates Daily API:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 *
 * Header required: KeyId: <MAS_KEY_ID>
 */

const MAS_DOMESTIC_RATES_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface MasRecord {
  end_of_day?: string;
  sora?: number | string;
  comp_sora_1m?: number | string;
  comp_sora_3m?: number | string;
  comp_sora_6m?: number | string;
  sora_index?: number | string;
  aggregate_volume?: number | string;
  [key: string]: any;
}

export interface NormalizedSoraRecord {
  date: string;
  rate: number;
  comp1m: number;
  comp3m: number;
  comp6m: number;
  soraIndex: number;
  volumeSgdM: number;
}

export interface SoraApiResponse {
  status: 'success' | 'error';
  source: string;
  count: number;
  latestDate?: string;
  data: NormalizedSoraRecord[];
  raw?: any;
  message?: string;
}

export default async function handler(req: any, res?: any) {
  // Support CORS preflight
  if (req.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, x-mas-key-id, authorization');
      return res.status(204).end();
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, KeyId, x-mas-key-id, authorization',
      },
    });
  }

  // Extract KeyId from environment variables, request headers, or query parameters
  const getHeader = (name: string): string | undefined => {
    if (req.headers) {
      if (typeof req.headers.get === 'function') {
        return req.headers.get(name) || req.headers.get(name.toLowerCase());
      }
      return req.headers[name] || req.headers[name.toLowerCase()];
    }
    return undefined;
  };

  const getQueryParam = (name: string): string | undefined => {
    if (req.query && req.query[name]) return String(req.query[name]);
    if (req.url) {
      try {
        const parsed = new URL(req.url, 'http://localhost');
        return parsed.searchParams.get(name) || undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const masKeyId =
    process.env.MAS_KEY_ID?.trim() ||
    getHeader('KeyId') ||
    getHeader('x-mas-key-id') ||
    getQueryParam('keyId');

  // Verify that an API key is present
  if (!masKeyId || masKeyId === 'YOUR_MAS_KEY_ID_HERE') {
    const errorPayload: SoraApiResponse = {
      status: 'error',
      source: MAS_DOMESTIC_RATES_ENDPOINT,
      count: 0,
      data: [],
      message:
        'MAS_KEY_ID is missing or not configured. Please configure MAS_KEY_ID in your environment variables (.env / Vercel Environment Variables) or pass it via the "KeyId" request header.',
    };

    if (!res || typeof res.status !== 'function') {
      return new Response(JSON.stringify(errorPayload, null, 2), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(401).json(errorPayload);
  }

  try {
    // Construct MAS API URL and forward any query parameters (e.g., limit, sort, filters)
    const url = new URL(MAS_DOMESTIC_RATES_ENDPOINT);

    // Default to sorting by most recent first and reasonable batch size
    const limit = getQueryParam('limit') || '100';
    url.searchParams.set('limit', limit);

    // Forward optional query parameters
    const offset = getQueryParam('offset');
    if (offset) url.searchParams.set('offset', offset);

    const sort = getQueryParam('sort');
    if (sort) url.searchParams.set('sort', sort);

    const startDate = getQueryParam('start_date');
    const endDate = getQueryParam('end_date');
    if (startDate && endDate) {
      url.searchParams.set('between[end_of_day]', `${startDate},${endDate}`);
    }

    // Call MAS API Gateway
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        KeyId: masKeyId,
        Accept: 'application/json',
        'User-Agent': 'SORA-Calculator-Serverless/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { raw: errorText };
      }

      const errorPayload: SoraApiResponse = {
        status: 'error',
        source: MAS_DOMESTIC_RATES_ENDPOINT,
        count: 0,
        data: [],
        message: `MAS API returned HTTP ${response.status} (${response.statusText}): ${
          parsedError?.message || parsedError?.error || errorText || 'Upstream error'
        }`,
        raw: parsedError,
      };

      if (!res || typeof res.status !== 'function') {
        return new Response(JSON.stringify(errorPayload, null, 2), {
          status: response.status >= 400 && response.status < 600 ? response.status : 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 502).json(errorPayload);
    }

    const masJson = await response.json();
    const records: MasRecord[] =
      masJson?.result?.records ||
      masJson?.data ||
      (Array.isArray(masJson) ? masJson : []);

    // Transform raw MAS records into normalized SORA format
    const normalized: NormalizedSoraRecord[] = records.map((r) => {
      const date = r.end_of_day || r.date || '';
      const rate = parseFloat(String(r.sora ?? r.overnight_rate ?? 0));
      const comp1m = parseFloat(String(r.comp_sora_1m ?? r.sora_comp_1m ?? r.comp_1m ?? rate));
      const comp3m = parseFloat(String(r.comp_sora_3m ?? r.sora_comp_3m ?? r.comp_3m ?? rate));
      const comp6m = parseFloat(String(r.comp_sora_6m ?? r.sora_comp_6m ?? r.comp_6m ?? rate));
      const soraIndex = parseFloat(String(r.sora_index ?? 1.0));
      const volumeSgdM = parseFloat(String(r.aggregate_volume ?? r.volume_sgd_m ?? 0));

      return {
        date,
        rate: isNaN(rate) ? 0 : rate,
        comp1m: isNaN(comp1m) ? 0 : comp1m,
        comp3m: isNaN(comp3m) ? 0 : comp3m,
        comp6m: isNaN(comp6m) ? 0 : comp6m,
        soraIndex: isNaN(soraIndex) ? 1.0 : soraIndex,
        volumeSgdM: isNaN(volumeSgdM) ? 0 : volumeSgdM,
      };
    });

    const includeRaw = getQueryParam('raw') === 'true';

    const payload: SoraApiResponse = {
      status: 'success',
      source: MAS_DOMESTIC_RATES_ENDPOINT,
      count: normalized.length,
      latestDate: normalized[0]?.date,
      data: normalized,
      ...(includeRaw ? { raw: masJson } : {}),
    };

    // Return response with caching headers (MAS updates once daily at 9:00 AM SGT)
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    };

    if (!res || typeof res.status !== 'function') {
      return new Response(JSON.stringify(payload, null, 2), {
        status: 200,
        headers,
      });
    }

    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json(payload);
  } catch (err: any) {
    const errorPayload: SoraApiResponse = {
      status: 'error',
      source: MAS_DOMESTIC_RATES_ENDPOINT,
      count: 0,
      data: [],
      message: `Failed to connect to MAS API Gateway: ${err?.message || 'Network / internal error'}`,
    };

    if (!res || typeof res.status !== 'function') {
      return new Response(JSON.stringify(errorPayload, null, 2), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json(errorPayload);
  }
}

// Web standard export for Edge runtimes
export async function GET(request: Request) {
  return handler(request);
}
