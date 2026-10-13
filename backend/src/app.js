import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import {query,pool} from './db.js';
import {auth,admin,hashToken,newToken} from './auth.js';
import {validMoney,toCents} from './money.js';

export const app=express();
app.use(cors({origin:process.env.FRONTEND_ORIGIN||'http://localhost:5173'}));
app.use(express.json({limit:'100kb'}));
const err=(res,status,code,message)=>res.status(status).json({error:{code,message}});
const validUuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const numeric=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&Number.isSafeInteger(Math.round(x*100))&&Math.abs(x*100-Math.round(x*100))<1e-7;
const accessible=async(a,user)=>{
 if(a.visibility==='PUBLIC'||a.seller_id===user?.id)return true;
 if(!user)return false;
 const r=await query('SELECT 1 FROM private_auction_access WHERE auction_id=$1 AND user_id=$2',[a.id,user.id]);
 return !!r.rowCount;
};
async function auction(id){
 const r=await query('SELECT a.*,i.seller_id,i.title FROM auctions a JOIN items i ON i.id=a.item_id WHERE a.id=$1',[id]);
 return r.rows[0];
}
async function closeIfEnded(id){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const r=await client.query('SELECT * FROM auctions WHERE id=$1 FOR UPDATE',[id]);
  if(!r.rowCount){await client.query('ROLLBACK');return}
  const a=r.rows[0];
  const time=await client.query('SELECT clock_timestamp() AS current_time');
  if(a.status!=='CLOSED'&&new Date(a.end_time)<=time.rows[0].current_time){
   const w=await client.query('SELECT id FROM bids WHERE auction_id=$1 ORDER BY amount DESC,created_at ASC LIMIT 1',[id]);
   await client.query("UPDATE auctions SET status='CLOSED' WHERE id=$1",[id]);
   await client.query('INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,$2) ON CONFLICT(auction_id) DO NOTHING',[id,w.rows[0]?.id||null]);
  }
  await client.query('COMMIT');
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
app.get('/health',(_req,res)=>res.json({data:{status:'ok'}}));
app.post('/auth/register',async(req,res,next)=>{
 try{
  const {name,email,password}=req.body||{};
  if(typeof name!=='string'||!name.trim()||typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<8)return err(res,400,'INVALID_INPUT','Valid name, email and password (8+ chars) required');
  const hash=await bcrypt.hash(password,12);
  const r=await query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role',[name.trim(),email.trim().toLowerCase(),hash]);
  res.status(201).json({data:r.rows[0]});
 }catch(e){if(e.code==='23505')return err(res,409,'DUPLICATE_EMAIL','Email already registered');next(e)}
});
app.post('/auth/login',async(req,res,next)=>{
 try{
  const {email,password}=req.body||{};
  if(typeof email!=='string'||typeof password!=='string')return err(res,400,'INVALID_INPUT','Email and password required');
  const r=await query('SELECT * FROM users WHERE email=$1',[email.trim().toLowerCase()]);
  if(!r.rowCount||!await bcrypt.compare(password,r.rows[0].password_hash))return err(res,401,'INVALID_CREDENTIALS','Invalid credentials');
  const token=newToken(),u=r.rows[0];
  await query("INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '7 days')",[u.id,hashToken(token)]);
  res.json({data:{token,user:{id:u.id,name:u.name,email:u.email,role:u.role}}});
 }catch(e){next(e)}
});
app.post('/auth/logout',auth,async(req,res,next)=>{try{await query('DELETE FROM user_sessions WHERE token_hash=$1',[hashToken(req.token)]);res.json({data:{signedOut:true}})}catch(e){next(e)}});
app.get('/categories',async(_req,res,next)=>{try{res.json({data:(await query('SELECT id,name FROM categories ORDER BY name')).rows})}catch(e){next(e)}});
app.post('/items',auth,async(req,res,next)=>{
 try{
  const {categoryId,title,description,categoryFields={}}=req.body||{};
  if(!validUuid(categoryId)||typeof title!=='string'||!title.trim()||typeof description!=='string'||!description.trim()||typeof categoryFields!=='object'||!categoryFields||Array.isArray(categoryFields))return err(res,400,'INVALID_INPUT','Valid listing fields required');
  const r=await query('INSERT INTO items(seller_id,category_id,title,description,category_fields) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user.id,categoryId,title.trim(),description.trim(),JSON.stringify(categoryFields)]);
  res.status(201).json({data:r.rows[0]});
 }catch(e){if(e.code==='23503')return err(res,400,'INVALID_CATEGORY','Unknown category');next(e)}
});
app.get('/items',auth,async(req,res,next)=>{
 try{const r=req.user.role==='ADMIN'&&req.query.status==='PENDING_REVIEW'
 ?await query("SELECT * FROM items WHERE status='PENDING_REVIEW' ORDER BY id")
 :await query('SELECT * FROM items WHERE seller_id=$1 ORDER BY id',[req.user.id]);
 res.json({data:r.rows})}catch(e){next(e)}
});
app.get('/items/:id',auth,async(req,res,next)=>{
 try{if(!validUuid(req.params.id))return err(res,400,'INVALID_ID','Invalid ID');
 const r=await query('SELECT * FROM items WHERE id=$1',[req.params.id]);
 if(!r.rowCount)return err(res,404,'NOT_FOUND','Item not found');
 if(r.rows[0].seller_id!==req.user.id&&req.user.role!=='ADMIN')return err(res,403,'FORBIDDEN','Not your item');
 res.json({data:r.rows[0]})}catch(e){next(e)}
});
app.patch('/items/:id',auth,async(req,res,next)=>{
 try{const {title,description}=req.body||{};
 if(!validUuid(req.params.id)||typeof title!=='string'||!title.trim()||typeof description!=='string'||!description.trim())return err(res,400,'INVALID_INPUT','Title and description required');
 const r=await query("UPDATE items SET title=$1,description=$2,status='PENDING_REVIEW',review_reason=NULL,reviewed_by=NULL,reviewed_at=NULL WHERE id=$3 AND seller_id=$4 AND status='REJECTED' RETURNING *",[title.trim(),description.trim(),req.params.id,req.user.id]);
 if(!r.rowCount)return err(res,409,'INVALID_STATE','Only your rejected items can be resubmitted');
 res.json({data:r.rows[0]})}catch(e){next(e)}
});
app.post('/admin/items/:id/review',auth,admin,async(req,res,next)=>{
 try{const {decision,reason}=req.body||{};
 if(!['APPROVED','REJECTED'].includes(decision)||decision==='REJECTED'&&(!reason||typeof reason!=='string'))return err(res,400,'INVALID_INPUT','Valid decision and rejection reason required');
 const r=await query("UPDATE items SET status=$1,review_reason=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$4 AND status='PENDING_REVIEW' RETURNING *",[decision,decision==='REJECTED'?reason:null,req.user.id,req.params.id]);
 if(!r.rowCount)return err(res,409,'INVALID_STATE','Listing not pending review');
 res.json({data:r.rows[0]})}catch(e){next(e)}
});
app.post('/auctions',auth,async(req,res,next)=>{
 try{const {itemId,visibility,startingPrice,minimumIncrement,startTime,endTime}=req.body||{};
 if(!validUuid(itemId)||!['PUBLIC','PRIVATE'].includes(visibility)||!validMoney(startingPrice)||!validMoney(minimumIncrement)||!startTime||!endTime||!Number.isFinite(Date.parse(startTime))||!Number.isFinite(Date.parse(endTime))||new Date(endTime)<=new Date(startTime))return err(res,400,'INVALID_INPUT','Invalid auction parameters');
 const accessCode=visibility==='PRIVATE'?randomBytes(12).toString('hex'):null;
 const codeHash=accessCode?await bcrypt.hash(accessCode,12):null;
 const r=await query(`INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time)
 SELECT id,$2,$3,$4,$4,$5,$6,$7 FROM items WHERE id=$1 AND seller_id=$8 AND status='APPROVED'
 RETURNING id,item_id,visibility,starting_price,current_price,minimum_increment,start_time,end_time,status`,[itemId,visibility,codeHash,startingPrice,minimumIncrement,startTime,endTime,req.user.id]);
 if(!r.rowCount)return err(res,403,'NOT_APPROVED','Only approved owned items can be auctioned');
 res.status(201).json({data:{...r.rows[0],...(accessCode?{accessCode}:{})}});
 }catch(e){if(e.code==='23505')return err(res,409,'DUPLICATE_AUCTION','Item already has auction');next(e)}
});
app.get('/auctions',async(_req,res,next)=>{try{const r=await query("SELECT a.id,a.item_id,a.starting_price,a.current_price,a.start_time,a.end_time,a.status,i.title FROM auctions a JOIN items i ON i.id=a.item_id WHERE a.visibility='PUBLIC' ORDER BY a.start_time DESC");res.json({data:r.rows})}catch(e){next(e)}});
app.get('/auctions/:id',async(req,res,next)=>{
 try{if(!validUuid(req.params.id))return err(res,400,'INVALID_ID','Invalid ID');
 const a=await auction(req.params.id);if(!a)return err(res,404,'NOT_FOUND','Auction not found');
 const token=req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];let user=null;
 if(token){const r=await query('SELECT u.id FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hashToken(token)]);user=r.rows[0]}
 if(!await accessible(a,user))return err(res,404,'NOT_FOUND','Auction not found');
 await closeIfEnded(a.id);
 const current=await auction(a.id);delete current.access_code_hash;
 const result=await query('SELECT winner_bid_id,closed_at FROM auction_results WHERE auction_id=$1',[a.id]);
 res.json({data:{...current,result:result.rows[0]||null}})}catch(e){next(e)}
});
app.post('/auctions/:id/access',auth,async(req,res,next)=>{
 try{const a=await auction(req.params.id);
 if(!a||a.visibility!=='PRIVATE')return err(res,404,'NOT_FOUND','Private auction not found');
 if(a.seller_id===req.user.id)return err(res,403,'OWNER','Owner cannot join as bidder');
 if(typeof req.body?.accessCode!=='string'||!await bcrypt.compare(req.body.accessCode,a.access_code_hash))return err(res,403,'INVALID_CODE','Invalid access code');
 await query('INSERT INTO private_auction_access(auction_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[a.id,req.user.id]);
 res.json({data:{accessGranted:true}})}catch(e){next(e)}
});
app.post('/auctions/:id/commitment',auth,async(req,res,next)=>{
 try{const a=await auction(req.params.id);
 if(!a||!await accessible(a,req.user))return err(res,404,'NOT_FOUND','Auction not found');
 if(a.seller_id===req.user.id)return err(res,403,'OWNER','Cannot commit to own auction');
 return err(res,503,'BANK_SANDBOX_UNAVAILABLE','Official sandbox provider and operation have not been verified; no commitment approved');
 }catch(e){next(e)}
});
app.get('/auctions/:id/commitment',auth,async(req,res,next)=>{
 try{const r=await query('SELECT id,status,sandbox_reference,created_at FROM bid_commitments WHERE auction_id=$1 AND user_id=$2',[req.params.id,req.user.id]);
 if(!r.rowCount)return err(res,404,'NOT_FOUND','No commitment');
 res.json({data:r.rows[0]})}catch(e){next(e)}
});
app.post('/auctions/:id/bids',auth,async(req,res,next)=>{
 const {amount,requestId}=req.body||{};
 if(!validMoney(amount)||!validUuid(requestId)||!validUuid(req.params.id))return err(res,400,'INVALID_INPUT','Valid amount and UUID requestId required');
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  const ar=await c.query('SELECT a.*,i.seller_id FROM auctions a JOIN items i ON i.id=a.item_id WHERE a.id=$1 FOR UPDATE OF a',[req.params.id]);
  if(!ar.rowCount){await c.query('ROLLBACK');return err(res,404,'NOT_FOUND','Auction not found')}
  const a=ar.rows[0];
  if(a.seller_id===req.user.id){await c.query('ROLLBACK');return err(res,403,'OWNER','Cannot bid on own auction')}
  if(a.visibility==='PRIVATE'){
   const access=await c.query('SELECT 1 FROM private_auction_access WHERE auction_id=$1 AND user_id=$2',[a.id,req.user.id]);
   if(!access.rowCount){await c.query('ROLLBACK');return err(res,403,'NO_ACCESS','Private access required')}
  }
  const prior=await c.query('SELECT id,amount FROM bids WHERE request_id=$1',[requestId]);
  if(prior.rowCount){await c.query('ROLLBACK');return err(res,409,'DUPLICATE_REQUEST','Bid request already processed')}
  const commitment=await c.query("SELECT 1 FROM bid_commitments WHERE auction_id=$1 AND user_id=$2 AND status='SUCCESS'",[a.id,req.user.id]);
  if(!commitment.rowCount){await c.query('ROLLBACK');return err(res,403,'COMMITMENT_REQUIRED','Verified commitment required')}
  const clock=await c.query('SELECT clock_timestamp() AS current_time');
  const now=clock.rows[0].current_time;
  if(now<new Date(a.start_time)||now>=new Date(a.end_time)||a.status==='CLOSED'){await c.query('ROLLBACK');return err(res,409,'AUCTION_NOT_ACTIVE','Auction not active')}
  const count=await c.query('SELECT 1 FROM bids WHERE auction_id=$1 LIMIT 1',[a.id]);
  const minimumCents=count.rowCount?toCents(a.current_price)+toCents(a.minimum_increment):toCents(a.starting_price);
  if(toCents(amount)<minimumCents){await c.query('ROLLBACK');return err(res,409,'BID_TOO_LOW','Bid below minimum')}
  const bid=await c.query('INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,$3,$4) RETURNING id,amount',[a.id,req.user.id,amount,requestId]);
  await c.query("UPDATE auctions SET current_price=$1,status='ACTIVE' WHERE id=$2",[amount,a.id]);
  await c.query('COMMIT');
  res.status(201).json({data:{bidId:bid.rows[0].id,amount,currentPrice:amount}});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});if(e.code==='23505')return err(res,409,'DUPLICATE_REQUEST','Bid request already processed');next(e)}finally{c.release()}
});
app.get('/auctions/:id/bids',auth,async(req,res,next)=>{
 try{const a=await auction(req.params.id);
 if(!a||!await accessible(a,req.user))return err(res,404,'NOT_FOUND','Auction not found');
 const r=await query('SELECT id,amount,created_at FROM bids WHERE auction_id=$1 ORDER BY created_at DESC LIMIT 100',[a.id]);
 res.json({data:r.rows})}catch(e){next(e)}
});
app.get('/me/items',auth,async(req,res,next)=>{try{res.json({data:(await query('SELECT * FROM items WHERE seller_id=$1 ORDER BY id',[req.user.id])).rows})}catch(e){next(e)}});
app.get('/me/auctions',auth,async(req,res,next)=>{try{res.json({data:(await query('SELECT DISTINCT a.id,a.status,a.end_time,i.title FROM auctions a JOIN items i ON i.id=a.item_id LEFT JOIN bids b ON b.auction_id=a.id WHERE i.seller_id=$1 OR b.bidder_id=$1',[req.user.id])).rows})}catch(e){next(e)}});
app.use((error,req,res,next)=>{console.error('API error',error.code||error.message);if(res.headersSent)return next(error);err(res,500,'INTERNAL_ERROR','Unexpected server error')});
