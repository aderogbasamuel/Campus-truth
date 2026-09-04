revoke all on function public.handle_new_user() from public;
revoke all on function public.touch_updated_at() from public;
revoke all on function public.notify_on_comment() from public;
revoke all on function public.notify_on_answer() from public;
revoke all on function public.spend_credit(integer, text) from public;
revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.spend_credit(integer, text) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;