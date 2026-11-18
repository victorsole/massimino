// src/lib/mcp/server.ts
// The Massimino MCP server: JSON-RPC 2.0 over HTTP POST ("Streamable HTTP", stateless,
// answering with application/json). It lets AI assistants such as Claude and ChatGPT use
// Massimino's open fitness data as tools. Two routes share this code:
//
//   /api/mcp      open. No key needed; an optional API key raises the rate limit.
//   /api/mcp/me   personal. Needs a sign-in (OAuth, see src/lib/mcp/oauth.ts) or a key.
//
// Decisions that matter, several learned the hard way on a sister project:
// - The open route never answers 401 to a request without a key. A 401 makes ChatGPT
//   start an OAuth flow, and claude.ai's connector dialog has no field for a header.
//   The sign-in flow lives on its own route so the open one stays one URL and no questions.
// - serverInfo is { name, version } and nothing more. Extra fields there have made
//   claude.ai reject a server as invalid.
// - Tool problems are reported inside the result (isError), not as HTTP errors, so the
//   assistant can read the message and correct itself.

import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { CORS_HEADERS, RATE_LIMIT, SITE_URL, findLeak, type Caller } from '@/lib/public-api/http';
import { ToolInputError, toolsFor } from '@/lib/mcp/tools';

const SERVER_INFO = { name: 'massimino', version: '1.0.0' };
/**
 * Assistant apps call from their own servers, so everyone using Massimino through one app
 * can arrive from the same address. The anonymous allowance here is therefore its own
 * bucket, separate from the REST API's and larger.
 */
export const MCP_RATE_LIMIT = {
  anonymous: { maxRequests: 300, windowMs: 60_000, identifier: 'mcp-anon' },
  keyed: { ...RATE_LIMIT.keyed, identifier: 'mcp-key' },
};

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = [
  'Massimino is an open-source, safety-first fitness platform. These tools read its open data: public-domain exercises with instructions, training programmes with their workouts, public teams, and Eurostat physical-activity figures by European country.',
  'Start with search, then fetch a result by its id. For a workout, find_exercises filters by muscle group, equipment and difficulty; get_program returns a full programme.',
  'This is general fitness information, not medical advice. Tell people with an injury or a medical condition to ask a professional first.',
].join(' ');

export const MCP_HEADERS = {
  ...CORS_HEADERS,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
  'Cache-Control': 'no-store',
};

type Rpc = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: any };

const rpcResult = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result });
export const rpcError = (id: unknown, code: number, message: string, data?: unknown) => ({
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

/** Answer one MCP request for a caller who has already been identified */
export async function respond(req: NextRequest, caller: Caller) {
  const limit = checkRateLimit(caller.id, caller.keyed ? MCP_RATE_LIMIT.keyed : MCP_RATE_LIMIT.anonymous);
  const rateHeaders = getRateLimitHeaders(limit) as Record<string, string>;
  if (!limit.success) {
    const retryAfter = String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)));
    return NextResponse.json(rpcError(null, -32000, 'Too many requests. Wait a moment and try again.', { retry_after_seconds: retryAfter }), {
      status: 429,
      headers: { ...MCP_HEADERS, ...rateHeaders, 'Retry-After': retryAfter },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error: the body is not valid JSON.'), { status: 400, headers: { ...MCP_HEADERS, ...rateHeaders } });
  }

  const headers = { ...MCP_HEADERS, ...rateHeaders };
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
export function describe(req: NextRequest, authentication: string) {
  // An MCP client asking for a server-sent event stream: this server does not offer one,
  // and the specification says to answer 405 so the client carries on with POST only.
  if ((req.headers.get('accept') || '').includes('text/event-stream')) {
    return new NextResponse(null, { status: 405, headers: { ...MCP_HEADERS, Allow: 'POST, OPTIONS' } });
  }
  return NextResponse.json(
    {
      name: 'Massimino MCP server',
      description: 'Model Context Protocol endpoint for Massimino\'s open fitness data. Send JSON-RPC 2.0 requests with POST.',
      transport: 'Streamable HTTP (stateless, JSON responses)',
      protocol_versions: PROTOCOL_VERSIONS,
      authentication,
      documentation_uri: `${SITE_URL}/mcp`,
    },
    { headers: MCP_HEADERS }
  );
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: MCP_HEADERS });
}

/** Stateless: there is no session to end */
export function noSession() {
  return new NextResponse(null, { status: 405, headers: { ...MCP_HEADERS, Allow: 'GET, POST, OPTIONS' } });
}
