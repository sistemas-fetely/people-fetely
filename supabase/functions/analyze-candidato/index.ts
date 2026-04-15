import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidato, vaga, tipo } = await req.json();
    if (!candidato || !vaga) {
      return new Response(JSON.stringify({ error: "candidato e vaga são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tipoLabel = tipo === "rh" ? "entrevistador de RH" : "gestor da área";

    const prompt = `Você é especialista em RH e recrutamento. Analise este candidato para a vaga e gere um resumo para o ${tipoLabel}.

VAGA: ${vaga.titulo ?? ""}
Skills obrigatórias: ${JSON.stringify(vaga.skills_obrigatorias ?? [])}
Skills desejadas: ${JSON.stringify(vaga.skills_desejadas ?? [])}

CANDIDATO: ${candidato.nome}
Experiências: ${JSON.stringify(candidato.experiencias ?? [])}
Formações: ${JSON.stringify(candidato.formacoes ?? [])}
Skills declaradas: ${JSON.stringify(candidato.skills_candidato ?? [])}
Sistemas: ${JSON.stringify(candidato.sistemas_candidato ?? [])}
Score de aderência: ${candidato.score_total ?? 0}%
Motivação: "${candidato.mensagem ?? ""}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em RH e recrutamento. Responda usando a ferramenta fornecida." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_candidato",
              description: "Retorna análise estruturada do candidato para entrevista",
              parameters: {
                type: "object",
                properties: {
                  resumo: { type: "string", description: "2-3 frases sobre o perfil geral do candidato" },
                  pontos_fortes: { type: "array", items: { type: "string" }, description: "3-5 pontos fortes observados" },
                  pontos_atencao: { type: "array", items: { type: "string" }, description: "2-3 pontos de atenção" },
                  recomendacao_ia: { type: "string", enum: ["avançar", "aguardar", "nao_avançar"], description: "Recomendação" },
                  score_fit: { type: "number", description: "Score de fit com a vaga de 0 a 100" },
                },
                required: ["resumo", "pontos_fortes", "pontos_atencao", "recomendacao_ia", "score_fit"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_candidato" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-candidato error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
