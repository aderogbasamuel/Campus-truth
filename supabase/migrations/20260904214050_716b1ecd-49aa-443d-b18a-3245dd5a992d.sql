revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.touch_updated_at() from anon, authenticated;
revoke all on function public.notify_on_comment() from anon, authenticated;
revoke all on function public.notify_on_answer() from anon, authenticated;
revoke all on function public.spend_credit(integer, text) from anon;
revoke all on function public.has_role(uuid, public.app_role) from anon;