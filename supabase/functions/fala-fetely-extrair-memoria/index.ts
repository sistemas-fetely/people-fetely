// Edge Function: fala-fetely-extrair-memoria
// Analisa uma conversa encerrada e extrai memórias úteis (decisões, preferências, fatos, contexto)
// usando Lovable AI Gateway. Salva em fala_fetely_memoria.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-2.5-pro";

function jsonResp(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const TIPOS_VALIDOS = new Set(["decisao", "preferencia", "fato", "contexto_pessoal"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp(401, { error: "Missing Authorization header" });

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) return jsonResp(401, { error: "Não autenticado" });
    const user = userData.user;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const conversa_id: string | null = body.conversa_id || null;
    if (!conversa_id) return jsonResp(400, { error: "conversa_id obrigatório" });

    // Valida posse (ou super_admin)
    const { data: conv, error: convErr } = await supabase
      .from("fala_fetely_conversas")
      .select("id, user_id, memorias_extraidas")
      .eq("id", conversa_id)
      .maybeSingle();

    if (convErr || !conv) return jsonResp(404, { error: "Conversa não encontrada" });

    let isSuperAdmin = false;
    if (conv.user_id !== user.id) {
      const { data: roleCheck } = await supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" });
      isSuperAdmin = !!roleCheck;
      if (!isSuperAdmin) return jsonResp(403, { error: "Conversa não pertence ao usuário" });
    }

    if (conv.memorias_extraidas) {
      return jsonResp(200, { extraidas: 0, motivo: "já processada" });
    }

    // Busca todas as mensagens em ordem cronológica
    const { data: msgs } = await supabase
      .from("fala_fetely_mensagens")
      .select("papel, conteudo")
      .eq("conversa_id", conversa_id)
      .order("created_at", { ascending: true });

    const mensagens = msgs || [];

    if (mensagens.length < 4) {
      await supabase
        .from("fala_fetely_conversas")
        .update({ memorias_extraidas: true })
        .eq("id", conversa_id);
      return jsonResp(200, { extraidas: 0, motivo: "conversa muito curta" });
    }

    // Formata conversa para o prompt
    const conversaFormatada = mensagens
      .map((m: any) => `${m.papel === "user" ? "USUÁRIO" : "FALA FETELY"}: ${m.conteudo}`)
      .join("\n\n");

    const prompt = `Você é um extrator de memórias do Fala Fetely. Analise a conversa abaixo e identifique FATOS, DECISÕES ou PREFERÊNCIAS do usuário que sejam ÚTEIS para conversas FUTURAS com ele.

CONVERSA:
${conversaFormatada}

REGRAS ESTRITAS:
1. Só extraia memórias REALMENTE úteis. Ignore perguntas triviais respondidas com info pública da empresa.
2. Memórias boas: decisões do usuário ("Flavio decidiu que vendedores não têm celular"), preferências explícitas ("prefere respostas curtas"), fatos pessoais relevantes ao trabalho ("está construindo o SNCF"), contextos de projeto em andamento.
3. Memórias ruins (NÃO extrair): perguntas casuais, pedidos triviais como cálculos ou tradução, recusas da IA, saudações.
4. Se a conversa não tem nada relevante, retorne array vazio.
5. Resumo deve ser curto (até 100 chars) e na terceira pessoa ("Flavio decidiu...", "Usuário prefere...").

Retorne JSON com estrutura:
{
  "memorias": [
    {
      "tipo": "decisao" | "preferencia" | "fato" | "contexto_pessoal",
      "resumo": "frase curta",
      "conteudo_completo": "descrição detalhada quando relevante, senão null",
      "relevancia": 1-10,
      "tags": ["tag1", "tag2"]
    }
  ]
}

Retorne APENAS JSON válido, sem texto adicional, sem markdown.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Você extrai memórias estruturadas em JSON. Sempre responde com JSON válido apenas." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      console.error("AI gateway error", aiResp.status);
      // Marca como processada para não retentar
      await supabase
        .from("fala_fetely_conversas")
        .update({ memorias_extraidas: true })
        .eq("id", conversa_id);
      return jsonResp(200, { extraidas: 0, erro: `IA falhou (${aiResp.status})` });
    }

    const aiJson = await aiResp.json();
    const conteudo = aiJson.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(conteudo);
    } catch (e) {
      console.error("JSON inválido da IA:", conteudo);
      await supabase
        .from("fala_fetely_conversas")
        .update({ memorias_extraidas: true })
        .eq("id", conversa_id);
      return jsonResp(200, { extraidas: 0, erro: "JSON inválido da IA" });
    }

    const memoriasExtraidas: any[] = Array.isArray(parsed.memorias) ? parsed.memorias : [];

    // Filtra e prepara para insert
    const paraInserir = memoriasExtraidas
      .filter((m) => m && typeof m.resumo === "string" && m.resumo.trim() && TIPOS_VALIDOS.has(m.tipo))
      .map((m) => ({
        user_id: conv.user_id,
        tipo: m.tipo,
        resumo: String(m.resumo).slice(0, 200),
        conteudo_completo: m.conteudo_completo ? String(m.conteudo_completo).slice(0, 2000) : null,
        conversa_origem_id: conversa_id,
        relevancia: Math.min(10, Math.max(1, Number(m.relevancia) || 5)),
        tags: Array.isArray(m.tags) ? m.tags.slice(0, 10).map(String) : [],
        origem: "ia_automatica" as const,
      }));

    let inseridas = 0;
    if (paraInserir.length > 0) {
      const { error: insErr, count } = await supabase
        .from("fala_fetely_memoria")
        .insert(paraInserir, { count: "exact" });
      if (insErr) {
        console.error("Erro inserindo memórias:", insErr);
      } else {
        inseridas = count ?? paraInserir.length;
      }
    }

    // Marca como processada
    await supabase
      .from("fala_fetely_conversas")
      .update({ memorias_extraidas: true })
      .eq("id", conversa_id);

    return jsonResp(200, { extraidas: inseridas, memorias: paraInserir });
  } catch (e) {
    console.error("fala-fetely-extrair-memoria error:", e);
    return jsonResp(500, { error: e instanceof Error ? e.message : "Erro interno" });
  }
});
