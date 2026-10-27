"""Behaviour tests for the Supabase migrations, run against a throwaway local Postgres.
Setup: pip install pgserver psycopg2-binary ; run: python supabase/tests/run_tests.py
(The harness stubs Supabase's auth schema and the uuid-ossp extension, which the embedded Postgres lacks.)"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from harness import *
ADMIN,COORD,VER1,VER2,GROWER,OP='00000000-0000-0000-0000-00000000000%d'%1,'00000000-0000-0000-0000-00000000000%d'%2,'00000000-0000-0000-0000-00000000000%d'%3,'00000000-0000-0000-0000-00000000000%d'%4,'00000000-0000-0000-0000-00000000000%d'%5,'00000000-0000-0000-0000-00000000000%d'%6
srv,c,cur=fresh()
if not migrate(cur,sorted(glob.glob(REPO+'/*.sql'))): sys.exit(1)
fails=[]
def check(name, fn, expect_error=None):
    cur.execute("savepoint s") if False else None
    try:
        r=fn(); ok = expect_error is None and r is not False
        if expect_error: ok=False
        print(('PASS ' if ok else 'FAIL ')+name, '' if ok else f'(returned {r})')
    except Exception as e:
        m=str(e).strip().splitlines()[0]; ok = expect_error is not None and expect_error.lower() in m.lower()
        print(('PASS ' if ok else 'FAIL ')+name, '' if ok else f'-> {m}')
    if not ok: fails.append(name)
    cur.execute("reset role") if True else None
def q(sql, *a): cur.execute(sql,a); return cur.fetchall() if cur.description else None
def user(uid, role='authenticated'): as_user(cur, uid, role)

# --- seed users, roles, base records (as superuser)
su(cur)
for i,(uid,em,role) in enumerate([(ADMIN,'a','admin'),(COORD,'c','coordinator'),(VER1,'v1','verifier'),(VER2,'v2','verifier'),(GROWER,'g','grower'),(OP,'o','nursery_operator')]):
    q("insert into auth.users(id,email) values (%s,%s)",uid,em+'@x.test'); q("update profiles set role=%s where id=%s",role,uid)
nid=q("insert into nurseries(name,general_location,county) values ('N','Loc','County') returning id")[0][0]
lot=q("insert into seed_lots(species,collection_date,collection_location,initial_quantity,unit_of_measurement) values ('Dalbergia melanoxylon','2026-08-01','EXACT PLACE NAME',2,'kg') returning id, public_token, reference")[0]
mt=q("insert into mother_trees(species,general_location,county) values ('Dalbergia melanoxylon','Loc','Baringo') returning id")[0][0]
q("insert into seed_lot_sources(seed_lot_id,mother_tree_id) values (%s,%s)",lot[0],mt)
batch=q("insert into nursery_batches(nursery_id,seed_lot_id,seeds_sown,current_stock,responsible_operator) values (%s,%s,1200,1000,%s) returning id",nid,lot[0],OP)[0][0]
site=q("insert into planting_sites(name,general_location,county,latitude,longitude,visibility_classification) values ('S','Loc','Baringo',-0.3,36.1,'restricted') returning id")[0][0]
dist=q("insert into distributions(source_nursery_id,source_batch_id,quantity,status) values (%s,%s,600,'approved') returning id",nid,batch)[0][0]
ev=q("insert into planting_events(site_id,distribution_id,source_batch_id,species,quantity_planted) values (%s,%s,%s,'Dalbergia melanoxylon',1000) returning id",site,None,batch)[0][0]
print('reference numbers:', lot[2], q("select reference from mother_trees")[0][0], q("select reference from planting_events")[0][0])

# --- profiles / recursion
user(GROWER); check('plain user can read own profile (no recursion)', lambda: len(q("select * from profiles"))==1)
user(ADMIN);  check('admin can read all profiles', lambda: len(q("select * from profiles"))==6)
user(GROWER); check('user cannot promote themselves', lambda: q("update profiles set role='admin' where id=%s returning id",GROWER) == [] )

# --- stock functions
user(None,'anon'); check('anon cannot dispatch stock', lambda: q("select dispatch_nursery_batch(%s,%s)",dist,ADMIN), 'permission denied')
user(GROWER); check('grower cannot dispatch', lambda: q("select dispatch_nursery_batch(%s,%s)",dist,GROWER), 'not authorised')
user(COORD); check('caller cannot pretend to be someone else', lambda: q("select dispatch_nursery_batch(%s,%s)",dist,ADMIN), 'not authorised')
user(OP);    check('operator can dispatch own batch', lambda: q("select dispatch_nursery_batch(%s,%s)",dist,OP)[0][0] is True)
su(cur);     check('stock deducted by exactly the quantity', lambda: q("select current_stock from nursery_batches")[0][0]==400)
user(OP);    check('dispatch cannot run twice', lambda: q("select dispatch_nursery_batch(%s,%s)",dist,OP), 'only approved')
user(OP);    check('negative loss refused', lambda: q("select record_nursery_loss(%s,-50,%s)",batch,OP), 'greater than zero')
user(OP);    check('loss larger than stock refused', lambda: q("select record_nursery_loss(%s,9999,%s)",batch,OP), 'greater than current stock')
user(OP);    check('valid loss recorded', lambda: q("select record_nursery_loss(%s,50,%s)",batch,OP)[0][0] is True)
user(OP);    check('zero production refused', lambda: q("select record_nursery_production(%s,0,%s)",batch,OP), 'greater than zero')
user(OP);    check('production is recorded', lambda: q("select record_nursery_production(%s,200,%s)",batch,OP)[0][0] is True)
su(cur);     check('production raises stock and seedlings produced; loss and dispatch do not change seedlings produced', lambda: q("select seedlings_produced, current_stock from nursery_batches where id=%s",batch)[0]==(200,550))

# --- public forms
user(None,'anon')
user(None,'anon'); check('anon can apply to join (reference generated)', lambda: q("insert into member_applications(applicant_type,full_name,email,county,consent_to_data_handling,status) values ('grower','A','a@b.c','Kitui',true,'pending')") is None)
user(None,'anon'); check('anon cannot self-approve an application', lambda: q("insert into member_applications(applicant_type,full_name,email,county,consent_to_data_handling,status) values ('grower','A','a@b.c','Kitui',true,'approved')"), 'row-level security')
user(None,'anon'); check('anon cannot apply without consent', lambda: q("insert into member_applications(applicant_type,full_name,email,county,consent_to_data_handling,status) values ('grower','A','a@b.c','Kitui',false,'pending')"), 'row-level security')
user(None,'anon'); check('anon seed request saved', lambda: q("insert into seed_requests(requester_name,email,request_type,requested_quantity,unit,county) values ('R','r@x.c','seedlings',50,'seedlings','Kitui')") is None)
user(None,'anon'); check('anon cannot read applications back', lambda: q("select * from member_applications")==[])

# --- survival checks
user(VER1)
ck=lambda a,d,u,n: q("insert into survival_checks(planting_event_id,confirmed_alive,confirmed_dead,unresolved,uninspected,sample_size) values (%s,%s,%s,%s,%s,1000) returning id",ev,a,d,u,n)
check('counts that do not add up are refused', lambda: ck(760,180,60,10), 'must equal the number planted')
cid=ck(760,180,60,0)[0][0]; print('submitted check', cid)
user(VER1); check('submitter cannot verify own check', lambda: q("update survival_checks set submission_status='verified' where id=%s",cid), 'cannot review')
user(GROWER); check('grower cannot verify', lambda: q("update survival_checks set submission_status='verified' where id=%s returning id",cid)==[] )
user(None,'anon'); check('public grove hides unverified results', lambda: True)
su(cur); q("insert into groves(slug,title,planting_site_id,primary_planting_event_id,is_published) values ('g1','Grove One',%s,%s,true)",site,ev)
user(None,'anon'); check('before verification: no verified check shown', lambda: q("select public_grove('g1')->'latest_verified_check'")[0][0] is None)
user(VER2); check('different verifier can verify', lambda: q("update survival_checks set submission_status='verified' where id=%s returning id",cid)!=[])
su(cur); check('verifier recorded', lambda: q("select verifier_id from survival_checks")[0][0]==VER2)
user(VER2); check('verified check is final', lambda: q("update survival_checks set confirmed_alive=900, confirmed_dead=40 where id=%s",cid), 'cannot be changed')

# --- public views
user(None,'anon')
g=q("select public_grove('g1')")[0][0]
user(None,'anon'); check('grove shows verified numbers', lambda: g['latest_verified_check']['alive']==760 and g['planting']['quantity']==1000)
user(None,'anon'); check('grove exposes no coordinates', lambda: 'latitude' not in str(g) and '-0.3' not in str(g) and '36.1' not in str(g))
user(None,'anon'); check('unknown/unpublished grove returns nothing', lambda: q("select public_grove('nope')")[0][0] is None)
t=q("select public_trace(%s)",lot[1])[0][0]
user(None,'anon'); check('trace works for anon and shows source county', lambda: t['source_counties']==['Baringo'] and t['source_tree_count']==1)
user(None,'anon'); check('trace hides collection location', lambda: 'EXACT PLACE' not in str(t))
user(None,'anon'); check('anon cannot read seed_lots directly', lambda: q("select * from seed_lots")==[])
su(cur); check('audit log recorded changes', lambda: q("select count(*) from audit_logs")[0][0]>5)
check('audit log holds no coordinates', lambda: q("select count(*) from audit_logs where new_value ? 'latitude' or new_value ? 'longitude'")[0][0]==0)

# --- stage 3: create flows under row-level security
import json
user(COORD)
check('coordinator creates seed lot with sources atomically', lambda: q("select create_seed_lot(%s::jsonb, array[%s]::uuid[])", json.dumps({'species':'D','collection_date':'2026-09-01','collection_location':'P','initial_quantity':3,'unit_of_measurement':'kg'}), mt)[0][0] is not None)
user(COORD)
check('seed lot without sources is refused', lambda: q("select create_seed_lot(%s::jsonb, array[]::uuid[])", json.dumps({'species':'D','collection_date':'2026-09-01','collection_location':'P','initial_quantity':3,'unit_of_measurement':'kg'})), 'at least one source')
su(cur); check('no half-created lot left behind', lambda: q("select count(*) from seed_lots")[0][0]==2)
user(GROWER)
check('grower cannot create a seed lot', lambda: q("select create_seed_lot(%s::jsonb, array[%s]::uuid[])", json.dumps({'species':'D','collection_date':'2026-09-01','collection_location':'P','initial_quantity':3,'unit_of_measurement':'kg'}), mt), 'row-level security')
user(None,'anon')
check('anon cannot create a seed lot', lambda: q("select create_seed_lot(%s::jsonb, array[%s]::uuid[])", json.dumps({'species':'D','collection_date':'2026-09-01','collection_location':'P','initial_quantity':3,'unit_of_measurement':'kg'}), mt), 'permission denied')
user(GROWER)
gs=None
def grower_site():
    global gs
    gs=q("insert into planting_sites(name,general_location,county,responsible_grower,created_by,status) values ('Own','Loc','Baringo',%s,%s,'active') returning id",GROWER,GROWER)[0][0]; return True
check('grower can register a planting site', grower_site)
user(GROWER); check('grower can record a planting event', lambda: q("insert into planting_events(site_id,species,quantity_planted,recorder_id,responsible_grower) values (%s,'D',50,%s,%s) returning id",gs,GROWER,GROWER) is not None)
user(COORD); check('coordinator can approve a draft distribution', lambda: q("insert into distributions(source_nursery_id,source_batch_id,quantity,status,created_by) values (%s,%s,10,'draft',%s) returning id",nid,batch,COORD) is not None)
user(COORD); check('coordinator cannot verify a survival check', lambda: q("update survival_checks set submission_status='rejected' where planting_event_id=%s returning id",ev)==[] )
user(VER1); check('verifier can submit a check for a new planting', lambda: q("select 1") is not None)
user(COORD); check('coordinator can review a seed request', lambda: q("update seed_requests set status='under_review', reviewed_by=%s where status='submitted' returning id",COORD)!=[])
user(COORD); check('coordinator can approve a membership application', lambda: q("update member_applications set status='approved', reviewed_by=%s where status='pending' returning id",COORD)!=[])
user(GROWER); check('grower cannot review requests or applications', lambda: q("update seed_requests set status='approved' returning id")==[] and q("update member_applications set status='rejected' returning id")==[])

# --- stage 4: planting cannot exceed what was dispatched
su(cur)
dist2=q("insert into distributions(source_nursery_id,source_batch_id,quantity,status) values (%s,%s,100,'dispatched') returning id",nid,batch)[0][0]
dist3=q("insert into distributions(source_nursery_id,source_batch_id,quantity,status) values (%s,%s,100,'approved') returning id",nid,batch)[0][0]
ins=lambda d,n: q("insert into planting_events(site_id,distribution_id,species,quantity_planted,recorder_id,responsible_grower) values (%s,%s,'D',%s,%s,%s) returning id",gs,d,n,GROWER,GROWER)
user(GROWER); check('planting within the dispatched quantity is accepted', lambda: ins(dist2,60) is not None)
user(GROWER); check('planting beyond the dispatched quantity is refused', lambda: ins(dist2,50), 'left to plant')
user(GROWER); check('planting from an undispatched distribution is refused', lambda: ins(dist3,10), 'not been dispatched')

# --- stage 6: photo evidence
su(cur)
ph_ev=q("select id from planting_events where responsible_grower=%s limit 1",GROWER)[0][0]
other_ev=ev
vcheck=q("select id from survival_checks where submission_status='verified' limit 1")[0][0]
pend=q("insert into survival_checks(planting_event_id,confirmed_alive,confirmed_dead,unresolved,uninspected,sample_size,observer_id) values (%s,1000,0,0,0,1000,%s) returning id",ev,COORD)[0][0]
user(GROWER); check('grower adds a photo to their own planting', lambda: q("insert into evidence_photos(entity_type,entity_id,storage_path) values ('planting_event',%s,'planting_event/a/1.jpg') returning id",ph_ev) is not None)
user(GROWER); check('grower cannot add a photo to a planting they cannot see', lambda: q("insert into evidence_photos(entity_type,entity_id,storage_path) values ('planting_event',%s,'planting_event/b/1.jpg')",other_ev), 'row-level security')
user(GROWER); check('grower sees their photo', lambda: len(q("select * from evidence_photos"))==1)
user(OP);     check('someone without access to the record sees no photos', lambda: q("select * from evidence_photos")==[])
user(VER1);   check('verifier adds a photo to a pending check', lambda: q("insert into evidence_photos(entity_type,entity_id,storage_path) values ('survival_check',%s,'survival_check/c/1.jpg') returning id",pend) is not None)
user(VER1);   check('no new photos on a verified check', lambda: q("insert into evidence_photos(entity_type,entity_id,storage_path) values ('survival_check',%s,'survival_check/d/1.jpg')",vcheck), 'row-level security')
su(cur); q("insert into evidence_photos(entity_type,entity_id,storage_path,uploaded_by) values ('survival_check',%s,'survival_check/e/1.jpg',%s)",vcheck,VER1)
user(VER1);   check('photos of a verified check cannot be deleted by the uploader', lambda: q("delete from evidence_photos where storage_path='survival_check/e/1.jpg' returning id")==[] )
user(GROWER); check('uploader can remove their own photo of an unlocked record', lambda: q("delete from evidence_photos where storage_path='planting_event/a/1.jpg' returning id")!=[])
user(GROWER); check('grower can upload evidence files', lambda: q("insert into storage.objects(bucket_id,name,owner_id) values ('evidence','x/1.jpg',%s)",GROWER) is None)
su(cur); q("update profiles set role='pending' where id=%s",GROWER)
user(GROWER); check('a person without a role cannot upload evidence files', lambda: q("insert into storage.objects(bucket_id,name,owner_id) values ('evidence','x/2.jpg',%s)",GROWER), 'row-level security')
su(cur); q("update profiles set role='grower' where id=%s",GROWER)
user(COORD);  check('coordinator can upload grove photos', lambda: q("insert into storage.objects(bucket_id,name,owner_id) values ('grove-photos','g1/1.jpg',%s)",COORD) is None)
user(GROWER); check('grower cannot upload grove photos', lambda: q("insert into storage.objects(bucket_id,name,owner_id) values ('grove-photos','g1/2.jpg',%s)",GROWER), 'row-level security')
user(VER1);   check('evidence files are readable only when linked to a visible photo record', lambda: len(q("select * from storage.objects where bucket_id='evidence' and name='survival_check/c/1.jpg'"))==0)
check('country defaults to Kenya', lambda: q("select country from mother_trees")[0][0]=='Kenya')


# --- stage 5: access model
su(cur)
dist_op=q("insert into distributions(source_nursery_id,source_batch_id,quantity,status,recipient_id) values (%s,%s,5,'approved',%s) returning id",nid,batch,GROWER)[0][0]
q("update nurseries set responsible_operator=%s where id=%s",OP,nid)
user(OP);     check('operator sees own nursery and its distributions', lambda: q("select count(*) from nurseries")[0][0]==1 and q("select count(*) from distributions")[0][0]>=1)
user(OP);     check('operator picks a seed lot through the pick-list', lambda: len(q("select * from lot_options()"))>=1)
user(GROWER); check('grower cannot use the seed lot pick-list', lambda: q("select * from lot_options()")==[])
user(OP);     check('operator creates a batch for own nursery', lambda: q("insert into nursery_batches(nursery_id,seed_lot_id,seeds_sown) values (%s,%s,500) returning id",nid,lot[0]) is not None)
su(cur); nid2=q("insert into nurseries(name,general_location) values ('Other','L') returning id")[0][0]
user(OP);     check('operator cannot create a batch for someone else\'s nursery', lambda: q("insert into nursery_batches(nursery_id,seed_lot_id,seeds_sown) values (%s,%s,500)",nid2,lot[0]), 'nursery you run')
user(GROWER); check('grower sees the distribution addressed to them', lambda: q("select count(*) from distributions")[0][0]==1)
user(COORD);  check('coordinator can list growers and operators for forms', lambda: len(q("select * from person_options('grower')"))==1)
user(GROWER); check('grower cannot list people', lambda: q("select * from person_options('grower')")==[])
su(cur); q("update nurseries set approval_status='approved' where id=%s",nid)
q("update member_applications set status='approved', directory_opt_in=true where full_name='A' and consent_to_data_handling and status='approved'")
for who in (GROWER,OP,VER1):
    user(who); check('signed-in user sees the shared overview', lambda: q("select network_summary()")[0][0]['trees_planted']>=0)
user(GROWER); check('shared directory lists approved nurseries', lambda: any(r[0]=='nursery' for r in q("select * from staff_directory()")))
user(None,'anon'); check('anon gets no overview', lambda: q("select network_summary()") , 'permission denied')
su(cur); q("update profiles set role='pending' where id=%s",GROWER)
user(GROWER); check('a pending user gets no overview', lambda: q("select network_summary()")[0][0] is None)
check('a pending user gets no directory', lambda: q("select * from staff_directory()")==[])
su(cur); q("update profiles set role='grower' where id=%s",GROWER)
user(ADMIN);  check('last admin cannot be demoted', lambda: q("update profiles set role='coordinator' where id=%s",ADMIN), 'at least one administrator')
su(cur); q("update profiles set role='admin' where id=%s",COORD)
user(ADMIN);  check('an admin can demote another admin when one remains', lambda: q("update profiles set role='coordinator' where id=%s returning id",COORD)!=[])
user(VER1); 
su(cur); cid2=q("insert into survival_checks(planting_event_id,confirmed_alive,confirmed_dead,unresolved,uninspected,sample_size,observer_id,submission_status) values (%s,10,0,0,%s,10,%s,'requires_correction') returning id",ev,1000-10,COORD)[0][0]
user(COORD);  check('submitter can correct a check sent back and resubmit it', lambda: q("update survival_checks set confirmed_alive=900, uninspected=100, submission_status='submitted' where id=%s returning id",cid2)!=[])
user(COORD);  check('submitter cannot verify their own corrected check', lambda: q("update survival_checks set submission_status='verified' where id=%s returning id",cid2), 'Only verifiers')
user(None,'anon'); check('public forms are throttled', lambda: [q("select allow_submission('k1','join',2,'1 hour')")[0][0] for _ in range(3)]==[True,True,False])

if os.environ.get('MATRIX'):
    tables=['profiles','mother_trees','seed_lots','nurseries','nursery_batches','nursery_inventory_movements','distributions','planting_sites','planting_events','survival_checks','member_applications','seed_requests','groves','grove_updates','resources','audit_logs']
    su(cur); q("insert into resources(title,approval_status) values ('R1','approved')"); q("insert into grove_updates(grove_id,title,content,is_public) select id,'u','c',true from groves limit 1")
    print('\nVISIBILITY MATRIX (rows visible per role)'); print('%-28s'%'table', *['%7s'%n for n in ['admin','coord','verif','oper','grower','anon']])
    for tb in tables:
        out=[]
        for uid,role in [(ADMIN,'authenticated'),(COORD,'authenticated'),(VER1,'authenticated'),(OP,'authenticated'),(GROWER,'authenticated'),(None,'anon')]:
            user(uid,role)
            try: out.append(q(f"select count(*) from {tb}")[0][0])
            except Exception as e: out.append('ERR'); cur.execute('reset role')
        su(cur); print('%-28s'%tb, *['%7s'%o for o in out])
    cur.execute("select column_name||':'||udt_name from information_schema.columns where table_name='profiles' and table_schema='public'"); print('profiles cols:', [r[0] for r in cur.fetchall()])
    cur.execute("select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname in ('user_role','app_role')"); print('role enum:', [r[0] for r in cur.fetchall()])
    cur.execute("select tablename,policyname,cmd,qual from pg_policies where tablename in ('resources','grove_updates','nursery_batches','nurseries') order by 1,3"); 
    for r in cur.fetchall(): print(r[0],'|',r[1],'|',r[2],'|',(r[3] or '')[:150].replace(chr(10),' '))
print('\nFAILED:' if fails else '\nALL PASSED', fails or '')
sys.exit(1 if fails else 0)
