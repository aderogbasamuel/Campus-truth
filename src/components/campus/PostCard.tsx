import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Flag, Heart, Link2, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CommentSection } from "@/components/campus/CommentSection";
import { ReportDialog } from "@/components/campus/ReportDialog";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { UserAvatar } from "@/components/campus/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel, friendlyError, timeAgo } from "@/lib/campus";

export type FeedPost = {
  id: string;
  author_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  category: string;
  verified: boolean;
  created_at: string;
  author?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  reaction_count?: number;
  comment_count?: number;
  liked?: boolean;
  saved?: boolean;
  author_role?: string;
};

export function PostCard({
  post,
  currentUserId,
  canModerate,
}: {
  post: FeedPost;
  currentUserId: string | null;
  canModerate?: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["saved"] });
  };

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Please sign in first.");
      if (post.liked) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reactions")
          .insert({ post_id: post.id, user_id: currentUserId, type: "like" });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(friendlyError(error)),
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error("Please sign in first.");
      if (post.saved) {
        const { error } = await supabase
          .from("saved_items")
          .delete()
          .eq("item_id", post.id)
          .eq("item_type", "post")
          .eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_items")
          .insert({ item_id: post.id, item_type: "post", user_id: currentUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(post.saved ? "Removed from saved" : "Saved for later");
      invalidate();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const removePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      invalidate();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const trust = post.verified
    ? "verified"
    : post.author_role === "course_rep"
      ? "course_rep"
      : "student";

  return (
    <article className="surface-card overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <UserAvatar name={post.author?.full_name} url={post.author?.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {post.author?.full_name ?? "CampusTruth student"}
            </span>
            <TrustBadge level={trust} />
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
          {post.title ? <h3 className="mt-2 text-base font-semibold">{post.title}</h3> : null}
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {post.content}
          </p>
          <Badge variant="secondary" className="mt-3 bg-lime-soft text-lime-foreground">
            {categoryLabel(post.category)}
          </Badge>
        </div>
      </div>

      {post.image_url ? (
        <img
          src={post.image_url}
          alt={post.title ?? "Post image"}
          loading="lazy"
          className="max-h-96 w-full object-cover"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-1 border-t border-border px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleLike.mutate()}
          aria-pressed={post.liked}
          aria-label="Like post"
        >
          <Heart className={post.liked ? "fill-destructive text-destructive" : ""} />
          {post.reaction_count ?? 0}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((value) => !value)}>
          <MessageCircle />
          {post.comment_count ?? 0}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Copy link"
          onClick={() => {
            void navigator.clipboard.writeText(`${window.location.origin}/home#post-${post.id}`);
            toast.success("Link copied");
          }}
        >
          <Link2 />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Save post"
          aria-pressed={post.saved}
          onClick={() => toggleSave.mutate()}
        >
          <Bookmark className={post.saved ? "fill-primary text-primary" : ""} />
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <ReportDialog targetType="post" targetId={post.id}>
            <Button variant="ghost" size="sm" aria-label="Report post">
              <Flag />
            </Button>
          </ReportDialog>
          {currentUserId === post.author_id || canModerate ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete post"
              onClick={() => removePost.mutate()}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>

      {showComments ? <CommentSection postId={post.id} currentUserId={currentUserId} /> : null}
    </article>
  );
}
