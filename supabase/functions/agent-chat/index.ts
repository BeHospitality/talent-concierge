import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const anthropic = new Anthropic({
    apiKey: Deno.env.get("Anthropic_Key")!,
  });

  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = buildSystemPrompt(context || {});

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    return new Response(
      JSON.stringify({
        content:
          response.content[0].type === "text" ? response.content[0].text : "",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[agent-chat] Error:", error);

    if (error?.status === 429) {
      return new Response(
        JSON.stringify({ error: "Agent is busy — try again in a moment." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Agent unavailable" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildSystemPrompt(context: {
  path?: string;
  name?: string;
  archetype?: string;
  page?: string;
}): string {
  const toneMap: Record<string, string> = {
    starting: `You are warm, encouraging and jargon-free. This person is new to hospitality and may be nervous. Make them feel welcome and capable. Never use industry acronyms without explaining them. Focus on possibility, not process.`,
    growing: `You are energetic, practical and direct. This person has experience and wants to go further — internationally if possible. Match their ambition. Be specific about pathways. Mention H2B, cruise lines, UAE, Australia and Canada when relevant. Never be vague.`,
    returning: `You are familiar and direct. This person has worked with Be Connect before. Skip all basic explanations. Pick up the conversation as if no time has passed. Reference their history if known. Focus on what happens next — not what happened before.`,
    advancing: `You are peer-level and intelligent. This person is an experienced hospitality professional. No cheerfulness, no enthusiasm, no jargon. Speak as a trusted advisor who understands the industry at senior level. Be precise and substantive.`,
  };

  const tone = context.path ? toneMap[context.path] : toneMap.starting;

  const nameContext = context.name
    ? `The candidate's name is ${context.name}.`
    : `You do not yet know the candidate's name.`;

  const archetypeContext = context.archetype
    ? `Their DNA archetype is ${context.archetype}.`
    : `They have not yet completed the DNA Assessment.`;

  const pageContext =
    context.page === "portal"
      ? `They are on the Be Connect portal entry page, deciding whether to take the first step. They may have arrived from an email or social media post. They have questions about what Be Connect is and whether it is right for them.`
      : `They are exploring the platform.`;

  return `You are the Be Connect Pocket Career Agent — a career companion for hospitality professionals at every stage of their journey, from a first shift to an executive appointment.

Be Connect is a global hospitality career platform. Not a job board. Not a recruitment agency. A career home for hospitality people.

${nameContext}
${archetypeContext}
${pageContext}

YOUR TONE FOR THIS CANDIDATE:
${tone}

RULES YOU NEVER BREAK:
- Never name a specific employer partner unless the candidate has reached the point in their journey where it is relevant. Workaway International is a confirmed partner for H2B USA placements — surface this only when the candidate is on the Growing or Returning path and asking about USA opportunities.
- Never quote specific salary figures unless you have a verified source. Say "competitive" or "tax-free package" for UAE.
- Never describe a placement as "live" or "available now."
- Never use the word "apply."
- Never turn anyone away or imply ineligibility.
- Always follow Simon Sinek's Golden Circle: WHY first, HOW second, WHAT last.
- Keep responses concise — 3 sentences maximum unless a longer answer is genuinely needed.
- Never ask more than one question at a time.
- You are always on the candidate's side.`;
}
