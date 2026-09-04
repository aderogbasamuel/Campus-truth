import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().min(2).max(1000),
  conversationId: z.string().uuid().nullable().optional(),
});

type Source = {
  title: string;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
};

const STOP_WORDS = new Set([
  "the","is","are","a","an","of","for","to","in","on","my","what","when","how","do","i","does","and","it","this","that","can","you","about","much","where","who",
]);

function score(text: string, terms: string[]) {
  const haystack = text.toLowerCase();
  return terms.reduce((total, term) => (haystack.includes(term) ? total + 1 : total), 0);
}

export const askTrustBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The campus assistant isn't configured yet.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id, faculty_id, department_id, level, full_name")
      .eq("id", userId)
      .maybeSingle();

    const terms = data.question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

    const [{ data: knowledge }, { data: announcements }] = await Promise.all([
      supabase
        .from("knowledge_sources")
        .select("title, content, source_name, source_url, published_at, category")
        .eq("verified", true)
        .order("published_at", { ascending: false })
        .limit(50),
      supabase
        .from("announcements")
        .select("title, content, source_name, source_url, published_at")
        .eq("verified", true)
        .order("published_at", { ascending: false })
        .limit(20),
    ]);

    const ranked = [
      ...(knowledge ?? []).map((row) => ({ ...row, kind: "Verified campus record" })),
      ...(announcements ?? []).map((row) => ({ ...row, kind: "Official announcement" })),
    ]
      .map((row) => ({ row, relevance: score(`${row.title} ${row.content}`, terms) }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 6)
      .filter((entry, index) => entry.relevance > 0 || index < 2);

    const sources: Source[] = ranked.map(({ row }) => ({
      title: row.title,
      source_name: row.source_name ?? null,
      source_url: row.source_url ?? null,
      published_at: row.published_at ?? null,
    }));

    const contextBlock = ranked.length
      ? ranked
          .map(
            ({ row }, index) =>
              `[${index + 1}] ${row.kind} — ${row.title}\nSource: ${row.source_name ?? "CampusTruth"}${
                row.published_at ? ` (updated ${new Date(row.published_at).toDateString()})` : ""
              }\n${row.content}`,
          )
          .join("\n\n")
      : "No verified records were found for this question.";

    // Charge a credit only once we're about to call the model.
    const { error: creditError } = await supabase.rpc("spend_credit", {
      _amount: 1,
      _description: data.question.slice(0, 80),
    });
    if (creditError) {
      if (creditError.message?.includes("INSUFFICIENT_CREDITS")) {
        throw new Error("You're out of AI credits. Campus updates and browsing stay free.");
      }
      throw new Error("We couldn't start that request. Please try again.");
    }

    const systemPrompt = `You are TrustBot, the CampusTruth campus assistant for ${
      "University of Lagos (UNILAG)"
    }. You answer only from the VERIFIED CAMPUS CONTEXT provided.

Rules you must never break:
- Never invent dates, fees, policies, deadlines, contacts or announcements.
- If the context does not clearly answer the question, reply exactly: "I couldn't find a verified source for that information yet." and then suggest where the student can check (department office, student portal, Student Affairs).
- Keep answers short, plain and student-friendly (max 120 words).
- Never claim something is official unless the context says it is.
- Do not mention that you were given context; just answer.

Student profile: level ${profile?.level ?? "unknown"}.

VERIFIED CAMPUS CONTEXT:
${contextBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway error [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("TrustBot is busy right now. Please try again shortly.");
      if (response.status === 402) throw new Error("The campus assistant has run out of AI capacity. Please contact CampusTruth support.");
      throw new Error("TrustBot couldn't answer that right now. Please try again.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer =
      payload.choices?.[0]?.message?.content?.trim() ??
      "I couldn't find a verified source for that information yet.";

    const grounded = !answer.startsWith("I couldn't find a verified source");

    // Persist the conversation.
    let conversationId = data.conversationId ?? null;
    if (!conversationId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: data.question.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw new Error("We couldn't save that conversation.");
      conversationId = created.id;
    } else {
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    await supabase.from("messages").insert([
      { conversation_id: conversationId, role: "user", content: data.question },
      {
        conversation_id: conversationId,
        role: "assistant",
        content: answer,
        sources: grounded ? sources : [],
      },
    ]);

    return { conversationId, answer, sources: grounded ? sources : [] };
  });
