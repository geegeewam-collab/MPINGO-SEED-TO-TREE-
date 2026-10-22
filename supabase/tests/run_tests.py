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
ev=q("insert into planting_events(site_id,distribution_id,source_batch_id,species,quantity_planted) values (%s,%s,%s,'Dalbergia melanoxylon',1000) returning id",site,dist,batch)[0][0]
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
check('country defaults to Kenya', lambda: q("select country from mother_trees")[0][0]=='Kenya')
print('\nFAILED:' if fails else '\nALL PASSED', fails or '')
sys.exit(1 if fails else 0)
