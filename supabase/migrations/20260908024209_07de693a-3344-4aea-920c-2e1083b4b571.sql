insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'developersamzy@gmail.com'
on conflict (user_id, role) do nothing;

update public.profiles set verified = true
where id in (select id from auth.users where email = 'developersamzy@gmail.com');