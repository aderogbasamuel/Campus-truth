import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/campus";

const REASONS = [
  "Spam",
  "Harassment",
  "False information",
  "Offensive content",
  "Impersonation",
  "Other",
];

export function ReportDialog({
  targetType,
  targetId,
  children,
}: {
  targetType: "post" | "comment" | "question" | "answer" | "user" | "ai_answer";
  targetId: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in first.");
      const { error } = await supabase.from("reports").insert({
        reporter_id: auth.user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks — our moderators will review this.");
      setOpen(false);
      setDetails("");
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this content</DialogTitle>
          <DialogDescription>
            Reports go to CampusTruth moderators. Misinformation is taken seriously.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
          {REASONS.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <RadioGroupItem value={item} id={`${targetId}-${item}`} />
              <Label htmlFor={`${targetId}-${item}`}>{item}</Label>
            </div>
          ))}
        </RadioGroup>
        <Label htmlFor={`${targetId}-details`} className="sr-only">
          More details
        </Label>
        <Textarea
          id={`${targetId}-details`}
          placeholder="Anything else we should know? (optional)"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
