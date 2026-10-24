import glob, sys, os, re, shutil, pgserver, psycopg2
REPO='/home/claude/MPINGO-SEED-TO-TREE--main/supabase/migrations'
def fresh():
    p='/home/claude/dbt/pgdata'; shutil.rmtree(p, ignore_errors=True)
    srv=pgserver.get_server(p, cleanup_mode='stop')
    c=psycopg2.connect(srv.get_uri()); c.autocommit=True
    cur=c.cursor()
    cur.execute("""
    create role anon nologin; create role authenticated nologin;
    grant usage on schema public to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
    create function public.uuid_generate_v4() returns uuid language sql as 'select gen_random_uuid()'; create schema auth; create table auth.users(id uuid primary key default gen_random_uuid(), email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    create schema storage; grant usage on schema storage to anon, authenticated;
    create table storage.buckets(id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, owner_id text);
    alter table storage.objects enable row level security; grant all on storage.objects, storage.buckets to anon, authenticated;
    """)
    return srv,c,cur
def migrate(cur, files):
    ok=True
    for f in files:
        try:
            cur.execute('begin;'+re.sub(r'(?i)create extension[^;]*;','',open(f).read())+';commit;')
            print('OK  ', os.path.basename(f))
        except Exception as e:
            cur.execute('rollback'); ok=False
            print('FAIL', os.path.basename(f), '->', str(e).strip().splitlines()[0])
    return ok
def as_user(cur, uid, role='authenticated'):
    cur.execute("reset role"); cur.execute(f"select set_config('request.jwt.claim.sub','{uid or ''}',false)"); cur.execute(f"set role {role}")
def su(cur):
    cur.execute("reset role"); cur.execute("select set_config('request.jwt.claim.sub','',false)")
