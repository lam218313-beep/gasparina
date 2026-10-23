// Prueba de la fase 0: ¿llega la respuesta "en vivo" (SSE) al WebView del celular?
// Manda cinco mensajes, uno por segundo, y un evento final. La app mide cuándo llega cada uno:
// si llegan separados (≈1 s, 2 s, 3 s…), el celular recibe en vivo; si llegan todos juntos al final, no.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const enc = new TextEncoder();
  const t0 = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      for (let n = 1; n <= 5; n++) {
        await new Promise((r) => setTimeout(r, 1000));
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ n, t: Date.now() - t0 })}\n\n`));
      }
      controller.enqueue(enc.encode('event: done\ndata: {}\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
});
