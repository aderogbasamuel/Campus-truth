alter table public.posts drop constraint if exists posts_author_id_fkey, add constraint posts_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.comments drop constraint if exists comments_author_id_fkey, add constraint comments_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.questions drop constraint if exists questions_author_id_fkey, add constraint questions_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
alter table public.answers drop constraint if exists answers_author_id_fkey, add constraint answers_author_id_fkey foreign key (author_id) references public.profiles(id) on delete cascade;
notify pgrst, 'reload schema';