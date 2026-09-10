import { supabase } from "@/integrations/supabase/client";

export const UNILAG_ID = "11111111-1111-1111-1111-111111111111";

export const POST_CATEGORIES = [
  "general",
  "academics",
  "exams",
  "registration",
  "hostel",
  "events",
  "opportunities",
  "campus_life",
  "question",
  "announcement",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const LEVELS = ["100", "200", "300", "400", "500", "Postgraduate"];

export function categoryLabel(category: string) {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function timeAgo(value: string | null | undefined) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function initialsOf(name: string | null | undefined) {
  if (!name) return "CT";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Uploads to a private bucket and returns a long-lived signed URL. */
export async function uploadImage(
  bucket: "avatars" | "post-images",
  userId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please choose a PNG, JPG, WEBP or GIF image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("That image is larger than 5MB. Please choose a smaller one.");
  }
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw new Error("We couldn't upload that image. Please try again.");

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error || !data?.signedUrl) throw new Error("We couldn't prepare that image. Please try again.");
  return data.signedUrl;
}

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const message = typeof error === "string" ? error : (error as { message?: string }).message;
  if (!message) return fallback;
  if (message.includes("INSUFFICIENT_CREDITS")) return "You're out of AI credits.";
  if (message.toLowerCase().includes("duplicate key")) return "That already exists.";
  if (message.toLowerCase().includes("row-level security")) return "You don't have access to do that.";
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "That email and password don't match. Please try again.";
  }
  if (message.toLowerCase().includes("weak") || message.toLowerCase().includes("pwned")) {
    return "That password is too easy to guess. Try a longer one with letters and numbers.";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Your email isn't confirmed yet. Try signing up again to get straight in.";
  }
  if (message.toLowerCase().includes("already registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (message.length > 160) return fallback;
  return message;
}
