// src/app/api/mcp/route.ts
// The Massimino MCP server: JSON-RPC 2.0 over HTTP POST ("Streamable HTTP", stateless,
// answering with application/json). It lets AI assistants such as Claude and ChatGPT use
// Massimino's open fitness data as tools.
//
// Decisions that matter, several learned the hard way on a sister project:
// - No key is needed. The data is open, so an assistant connects with the bare URL.
//   This is deliberate: a server that answers 401 makes ChatGPT start an OAuth flow,
//   and claude.ai's connector dialog has no field for a header.
// - A key is optional (Authorization: Bearer, X-API-Key, or ?key= in the URL because
//   some connector dialogs accept nothing else). It raises the rate limit, and a key
//   with the workout-log permission adds one personal tool for its owner.
// - serverInfo is { name, version } and nothing more. Extra fields there have made
//   claude.ai reject a server as invalid.
// - Tool problems are reported inside the result (isError), not as HTTP errors, so the
//   assistant can read the message and correct itself.

import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { ApiError, CORS_HEADERS, RATE_LIMIT, SITE_URL, findLeak, identifyCaller, type Caller } from '@/lib/public-api/http';
import { ToolInputError, toolsFor } from '@/lib/mcp/tools';

export const dynamic = 'force-dynamic';

const SERVER_INFO = { name: 'massimino', version: '1.0.0' };
const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = [
  'Massimino is an open-source, safety-first fitness platform. These tools read its open data: public-domain exercises with instructions, training programmes with their workouts, public teams, and Eurostat physical-activity figures by European country.',
  'Start with search, then fetch a result by its id. For a workout, find_exercises filters by muscle group, equipment and difficulty; get_program returns a full programme.',
  'This is general fitness information, not medical advice. Tell people with an injury or a medical condition to ask a professional first.',
].join(' ');

const HEADERS = {
  ...CORS_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
  'Cache-Control': 'no-store',
};

type Rpc = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: any };

const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id: unknown, code: number, message: string, data?: unknown) => ({
  jsonrpc: '2.0',
  id: id ?? null,
  error: data === undefined ? { code, message } : { code, message, data },
});

function toolResult(payload: unknown, isError = false) {
  return {
    content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2) }],
    ...(typeof payload === 'object' && payload !== null && !isError ? { structuredContent: payload } : {}),
    isError,
  };
}

async function handle(message: Rpc, caller: Caller): Promise<unknown | null> {
  const { id, method, params } = message;
  if (message.jsonrpc !== '2.0' || typeof method !== 'string') return rpcError(id, -32600, 'Invalid request: expected a JSON-RPC 2.0 message with a method.');

  // Notifications carry no id and get no reply
  if (id === undefined || method.startsWith('notifications/')) return null;

  switch (method) {
    case 'initialize': {
      const requested = typeof params?.protocolVersion === 'string' ? params.protocolVersion : '';
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, {
        tools: toolsFor(caller).map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          // Every tool only reads: an assistant may call them without asking each time
          annotations: { title: tool.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        })),
      });
    case 'tools/call': {
      const name = typeof params?.name === 'string' ? params.name : '';
      const tool = toolsFor(caller).find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `Unknown tool "${name}".`);
      const args = params?.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments) ? params.arguments : {};
      try {
        const payload = await tool.run(args, caller);
        // The same guard as the REST API: a response holding private data is withheld
        const leak = findLeak(payload, '$', Boolean(tool.scope));
        if (leak) {
          console.error(`[mcp] tool result blocked, private data detected at ${leak} (${name})`);
          return rpcResult(id, toolResult('This result was withheld by a safety check. The problem has been logged.', true));
        }
        return rpcResult(id, toolResult(payload));
      } catch (error) {
        if (error instanceof ToolInputError) return rpcResult(id, toolResult(error.message, true));
        console.error(`[mcp] tool ${name} failed`, error);
        return rpcResult(id, toolResult('Massimino could not answer this just now. Please try again.', true));
      }
    }
    // Capabilities this server does not offer: answer empty rather than failing a client that asks
    case 'resources/list':
      return rpcResult(id, { resources: [] });
    case 'resources/templates/list':
      return rpcResult(id, { resourceTemplates: [] });
    case 'prompts/list':
      return rpcResult(id, { prompts: [] });
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: NextRequest) {
  let caller: Caller;
  let rateHeaders: Record<string, string> = {};
  try {
    caller = await identifyCaller(req, { allowQueryKey: true });
    const limit = checkRateLimit(caller.id, caller.keyed ? RATE_LIMIT.keyed : RATE_LIMIT.anonymous);
    rateHeaders = getRateLimitHeaders(limit) as Record<string, string>;
    if (!limit.success) {
      const retryAfter = String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)));
      return NextResponse.json(rpcError(null, -32000, 'Too many requests. Wait a moment and try again.', { retry_after_seconds: retryAfter }), {
        status: 429,
        headers: { ...HEADERS, ...rateHeaders, 'Retry-After': retryAfter },
      });
    }
  } catch (error) {
    // Only a key that was presented and is wrong or revoked ends up here. No WWW-Authenticate
    // header: this server has no OAuth, and advertising a challenge sends clients looking for it.
    const status = error instanceof ApiError && error.status === 'PERMISSION_DENIED' ? 403 : 401;
    const message = error instanceof ApiError ? error.message : 'This API key is not recognised.';
    return NextResponse.json(rpcError(null, -32001, `${message} The server also works without a key.`), { status, headers: HEADERS });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error: the body is not valid JSON.'), { status: 400, headers: HEADERS });
  }

  const headers = { ...HEADERS, ...rateHeaders };
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > 20) return NextResponse.json(rpcError(null, -32600, 'Invalid request: a batch needs 1 to 20 messages.'), { status: 400, headers });
    const replies = (await Promise.all(body.map((message) => handle(message as Rpc, caller)))).filter((reply) => reply !== null);
    return replies.length ? NextResponse.json(replies, { headers }) : new NextResponse(null, { status: 202, headers });
  }
  if (!body || typeof body !== 'object') return NextResponse.json(rpcError(null, -32600, 'Invalid request.'), { status: 400, headers });

  const reply = await handle(body as Rpc, caller);
  return reply === null ? new NextResponse(null, { status: 202, headers }) : NextResponse.json(reply, { headers });
}

/** A person opening the URL in a browser, or a client probing it, gets a short description */
export function GET(req: NextRequest) {
  // An MCP client asking for a server-sent event stream: this server does not offer one,
  // and the specification says to answer 405 so the client carries on with POST only.
  if ((req.headers.get('accept') || '').includes('text/event-stream')) {
    return new NextResponse(null, { status: 405, headers: { ...HEADERS, Allow: 'POST, OPTIONS' } });
  }
  return NextResponse.json(
    {
      name: 'Massimino MCP server',
      description: 'Model Context Protocol endpoint for Massimino\'s open fitness data. Send JSON-RPC 2.0 requests with POST.',
      transport: 'Streamable HTTP (stateless, JSON responses)',
      protocol_versions: PROTOCOL_VERSIONS,
      authentication: 'None needed. An optional API key raises the rate limit.',
      documentation_uri: `${SITE_URL}/mcp`,
    },
    { headers: HEADERS }
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}

/** Stateless: there is no session to end */
export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { ...HEADERS, Allow: 'GET, POST, OPTIONS' } });
}
