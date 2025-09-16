create table profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by the owner."
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Set up Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Set up Storage
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update an avatar."
  on storage.objects for update
  with check ( bucket_id = 'avatars' );

-- DocSpective template seed data
INSERT INTO "sample_to_upload" ("template_type", "system_name", "name", "categories", "data_context", "participant_role", "output_title", "output_file_name", "document_source", "docid") VALUES
  ('Document - Internal', 'sup456', '(QLD) List of Documents - UCPR', 'Court', 'Matter', 'court', 'List of Documents - UCPR', '_titleAsFilenameWithoutTimestamp.docx', 'Superannuation/sup456.docx', '3223.dot'),
  ('Document - Issued', 'sup092f', '(WA version) Letter to treating doctor requesting report - non-Metlife files', 'Medical', 'Superannuation', 'treatment-provider', 'Letter to treating doctor requesting report - non-Metlife files', '_titleAsFilenameWithoutTimestamp.docx', 'Medical/sup092f.docx', '9639.dot'),
  ('Document - Issued', 'sup230', '1st debt recovery letter', 'Client', 'Superannuation', 'client', '1st debt recovery letter', '_titleAsFilenameWithoutTimestamp.docx', 'Superannuation/sup230.docx', '3403.dot'),
  ('Document - Internal', 'sup629', 'Authority - Financial Advice Referral', 'Authority', 'Superannuation', 'financial-advisor', 'Authority - Financial Advice Referral', '_titleAsFilenameWithoutTimestamp.docx', 'Authorities/sup629.docx', '19542.dot');
