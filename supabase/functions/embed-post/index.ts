import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function truncateBody(md: string, max = 500): string {
  const s = String(md ?? '');
  return s.length <= max ? s : s.slice(0, max);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const openaiKey = (Deno.env.get('OPENAI_API_KEY') ?? '').trim();

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase env not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!bearer || bearer !== serviceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openaiKey) {
      console.warn('[embed-post] OPENAI_API_KEY missing; skip embedding');
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no_openai_key' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const slug = String(body?.slug ?? '').trim();
    if (!slug) {
      return new Response(JSON.stringify({ error: 'slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: post, error: qErr } = await supabase
      .from('posts')
      .select('id, slug, title, description, body_markdown')
      .eq('slug', slug)
      .maybeSingle();

    if (qErr) {
      console.error('[embed-post] posts select:', qErr.message);
      return new Response(JSON.stringify({ error: qErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const title = String(post.title ?? '').trim();
    const description = String(post.description ?? '').trim();
    const bodySnippet = truncateBody(String(post.body_markdown ?? ''));
    const textToEmbed = [title, description, bodySnippet].filter(Boolean).join('\n\n');
    if (!textToEmbed.trim()) {
      return new Response(JSON.stringify({ error: 'Nothing to embed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const oaRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: textToEmbed,
      }),
    });

    const oaJson = await oaRes.json().catch(() => ({}));
    if (!oaRes.ok) {
      const msg = (oaJson as { error?: { message?: string } })?.error?.message ?? oaRes.statusText;
      console.error('[embed-post] OpenAI:', msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = (oaJson as { data?: Array<{ embedding?: number[] }> })?.data;
    const embedding = data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      console.error('[embed-post] invalid embedding shape', embedding?.length);
      return new Response(JSON.stringify({ error: 'Invalid embedding response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vectorLiteral = `[${embedding.join(',')}]`;
    const { error: uErr } = await supabase.from('posts').update({ embedding: vectorLiteral }).eq('id', post.id);
    if (uErr) {
      console.error('[embed-post] posts update:', uErr.message);
      return new Response(JSON.stringify({ error: uErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, slug }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[embed-post]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
