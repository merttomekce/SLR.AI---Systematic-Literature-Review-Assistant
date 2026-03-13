import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint parameter is required' }, { status: 400 });
  }

  try {
    const urlV1 = endpoint.endsWith('/') ? `${endpoint}models` : `${endpoint}/models`;
    
    // Server-side fetch completely bypasses browser CORS restrictions
    const resV1 = await fetch(urlV1, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!resV1.ok) {
      throw new Error(`Local engine responded with status: ${resV1.status}`);
    }

    let data = await resV1.json();

    // Deep-Check for LM Studio: Attempt to hit the internal v0 API to check RAM Load State
    try {
        const urlV0 = endpoint.replace(/\/v1\/?$/, '/api/v0/models');
        if (urlV0 !== endpoint) {
            const resV0 = await fetch(urlV0, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(2000) // Short timeout so we don't hold up Ollama/Jan
            });
            
            if (resV0.ok) {
                const dataV0 = await resV0.json();
                // LM Studio v0 API returns active memory state!
                if (dataV0 && Array.isArray(dataV0.data)) {
                    // Force the data array to ONLY include models actively loaded in RAM
                    data.data = dataV0.data.filter((m: any) => m.state === 'loaded');
                }
            }
        }
    } catch (e) {
        // Silently discard v0 errors. This means the engine is Ollama, Jan, or legacy, 
        // which don't support memory-state querying. We just fallback to the v1 data!
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Local proxy fetch error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch from local proxy' }, { status: 500 });
  }
}
