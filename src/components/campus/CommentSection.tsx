import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ReportDialog } from "@/components/campus/ReportDialog";
import { UserAvatar } from "@/components/campus/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, timeAgo } from "@/lib/campus";

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: { full_name: string | null; avatar_url: string | null; verified: boolean } | null;
};

export function CommentSection({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId: string | null;
}) {
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();

  const comments = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, author_id, author:profiles!comments_author_id_fkey(full_name, avatar_url, verified)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Please sign in first.");
      const content = draft.trim();
      if (!content) throw new Error("Write something first.");
      const { error } = await supabase
        .from("comments")
        .insert({ post_id: postId, author_id: currentUserId, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <div className="space-y-4 border-t border-border bg-secondary/40 p-4">
      {comments.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : comments.data?.length ? (
        <ul className="space-y-3">
          {comments.data.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <UserAvatar
                name={comment.author?.full_name}
                url={comment.author?.avatar_url}
                className="size-8"
              />
              <div className="min-w-0 flex-1 rounded-xl bg-card px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {comment.author?.full_name ?? "Student"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(comment.created_at)}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <ReportDialog targetType="comment" targetId={comment.id}>
                      <Button variant="ghost" size="icon" aria-label="Report comment">
                        <Flag className="size-3.5" />
                      </Button>
                    </ReportDialog>
                    {comment.author_id === currentUserId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete comment"
                        onClick={() => deleteComment.mutate(comment.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm">{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to reply.</p>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addComment.mutate();
        }}
      >
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Write a comment
        </label>
        <Textarea
          id={`comment-${postId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment…"
          className="min-h-11 bg-card"
          rows={1}
        />
        <Button type="submit" disabled={addComment.isPending || !draft.trim()}>
          {addComment.isPending ? "Posting…" : "Post"}
        </Button>
      </form>
    </div>
  );
}
