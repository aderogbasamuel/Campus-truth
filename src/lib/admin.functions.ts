import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Throws unless the caller holds the admin role (checked as the user, never trusted from the client). */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("You don't have access to the admin tools.");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [reports, posts, profiles, announcements, students, questions] = await Promise.all([
      supabaseAdmin
        .from("reports")
        .select("id, target_type, target_id, reason, details, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("posts")
        .select("id, title, content, category, verified, removed, created_at, author_id")
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, username, level, verified")
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("announcements")
        .select("id, title, source_name, verified, published_at")
        .order("published_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("questions").select("id", { count: "exact", head: true }),
    ]);

    return {
      reports: reports.data ?? [],
      posts: posts.data ?? [],
      profiles: profiles.data ?? [],
      announcements: announcements.data ?? [],
      stats: {
        students: students.count ?? 0,
        questions: questions.count ?? 0,
        openReports: (reports.data ?? []).filter((row: any) => row.status === "open").length,
      },
    };
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["resolved", "dismissed"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ status: data.status, resolved_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error("We couldn't update that report.");
    return { ok: true };
  });

export const moderatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        removed: z.boolean().optional(),
        verified: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { removed?: boolean; verified?: boolean } = {};
    if (typeof data.removed === "boolean") patch.removed = data.removed;
    if (typeof data.verified === "boolean") patch.verified = data.verified;
    const { error } = await supabaseAdmin.from("posts").update(patch).eq("id", data.id);
    if (error) throw new Error("We couldn't update that post.");
    return { ok: true };
  });

/** Only an admin can grant official / course-representative status. */
export const setStudentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        verified: z.boolean().optional(),
        role: z.enum(["student", "course_rep", "admin"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (typeof data.verified === "boolean") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ verified: data.verified })
        .eq("id", data.userId);
      if (error) throw new Error("We couldn't update that student.");
    }
    if (data.role) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error("We couldn't update that role.");
    }
    return { ok: true };
  });

export const publishAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(4).max(160),
        content: z.string().min(10).max(4000),
        sourceName: z.string().max(120).optional(),
        sourceUrl: z.string().url().max(500).optional().or(z.literal("")),
        schoolId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").insert({
      school_id: data.schoolId,
      title: data.title,
      content: data.content,
      source_name: data.sourceName || null,
      source_url: data.sourceUrl || null,
      confidence: 95,
      verified: true,
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error("We couldn't publish that update.");

    // Keep the assistant's knowledge base in step with what students can see.
    await supabaseAdmin.from("knowledge_sources").insert({
      school_id: data.schoolId,
      title: data.title,
      content: data.content,
      source_name: data.sourceName || null,
      source_url: data.sourceUrl || null,
      category: "announcement",
      verified: true,
      published_at: new Date().toISOString(),
    });
    return { ok: true };
  });
