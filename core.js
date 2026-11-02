/* Travel accounting + backup format. No DOM, network or storage side effects. */
(function(root){
'use strict';
const Lx=(typeof self!=='undefined'&&typeof self.Lx==='function')?self.Lx:(z=>z);
const pad=n=>String(n).padStart(2,'0');
const iso=ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
function validDate(s){
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const [y,m,d]=s.split('-').map(Number),x=new Date(Date.UTC(y,m-1,d));
  return y>=1900&&y<=2199&&x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d;
}
const ordinal=s=>Date.parse(s+'T12:00:00Z')/864e5;
const dateOf=e=>e.date||iso(e.ts);
const cents=n=>Math.round(n*100);
const total=entries=>entries.reduce((a,e)=>a+cents(e.amt),0)/100;
function days(t){
  if(!validDate(t.startDate)||!validDate(t.endDate)||t.endDate<t.startDate)return [];
  const n=Math.round(ordinal(t.endDate)-ordinal(t.startDate))+1;
  const dates=new Set(Array.from({length:Math.min(n,120)},(_,i)=>new Date((ordinal(t.startDate)+i)*864e5).toISOString().slice(0,10)));
  for(const d of [...Object.keys(t.plan||{}),...(t.entries||[]).map(dateOf)])if(validDate(d)&&d>=t.startDate&&d<=t.endDate)dates.add(d);
  return [...dates].sort();
}
const phase=(t,d)=>d<t.startDate?'before':d>t.endDate?'after':'during';
function daily(t){
  const g=new Map(days(t).map(day=>[day,{day,income:0,out:0,count:0,phase:'during'}]));
  for(const e of t.entries){const day=dateOf(e);if(!g.has(day))g.set(day,{day,income:0,out:0,count:0,phase:phase(t,day)});const r=g.get(day);r[e.type==='in'?'income':'out']+=cents(e.amt);r.count++}
  return [...g.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(r=>({...r,income:r.income/100,out:r.out/100,net:(r.income-r.out)/100}));
}
function stats(t){
  const out=t.entries.filter(e=>e.type==='out'),inc=t.entries.filter(e=>e.type==='in'),by={};
  out.forEach(e=>by[e.cat]=(by[e.cat]||0)+cents(e.amt));Object.keys(by).forEach(k=>by[k]/=100);
  const so=total(out),si=total(inc),n=Math.max(1,Math.round(ordinal(t.endDate)-ordinal(t.startDate))+1),during=total(out.filter(e=>phase(t,dateOf(e))==='during'));
  return {so,si,by,top:out.reduce((m,e)=>!m||e.amt>m.amt?e:m,null),days:n,avg:during/n,during,before:total(out.filter(e=>phase(t,dateOf(e))==='before')),after:total(out.filter(e=>phase(t,dateOf(e))==='after')),n:t.entries.length};
}
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
function validateBackup(input){
  const fail=s=>{throw Error(Lx('備份格式不正確：','Invalid backup format: ')+s)};
  if(!obj(input))fail(Lx('需要 JSON 物件','a JSON object is required'));
  if(input.format!==undefined&&(input.format!=='lvtie-backup'||input.version!==1))fail(Lx('不支援此備份版本','unsupported backup version'));
  const data=input.format?input.data:input;
  if(!obj(data)||!Array.isArray(data.trips)||data.trips.length>1000)fail(Lx('旅程清單不正確或超過 1,000 趟','trip list is invalid or over 1,000 trips'));
  const str=(v,label,max=200)=>{if(typeof v!=='string'||v.length>max)fail(label);return v};
  const id=v=>{if(typeof v!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v))fail(Lx('記錄 ID','record ID'));return v};
  const money=(v,optional=false)=>{if(optional&&(v==null||v===''))return null;if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>999999999.99||Math.abs(v*100-Math.round(v*100))>0.0001)fail(Lx('金額必須為正數，最多兩位小數','amounts must be positive with up to 2 decimals'));return v};
  const budget=v=>{if(v==null||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<=0)fail(Lx('預算必須是有效正數','budget must be a valid positive number'));return v};
  const ids=new Set();let count=0;
  const trips=data.trips.map(raw=>{
    if(!obj(raw))fail(Lx('旅程','Trip'));const tid=id(raw.id);if(ids.has(tid))fail(Lx('旅程 ID 重複','duplicate trip ID'));ids.add(tid);
    const name=str(raw.name,Lx('旅程名稱','trip name'));if(!name.trim())fail(Lx('旅程名稱不能留空','trip name can’t be blank'));
    const currency=str(raw.currency,Lx('幣別','Currency'),3);if(!/^[A-Z]{3}$/.test(currency))fail(Lx('幣別需為三個大寫英文字母','currency must be three capital letters'));
    const sd=raw.startDate||iso(raw.start),ed=raw.endDate||iso(raw.end||raw.start);
    if(!validDate(sd)||!validDate(ed)||ed<sd)fail(Lx('旅程日期或時長','trip dates or length'));
    if(!['planned','done','active'].includes(raw.status))fail(Lx('旅程狀態','trip status'));
    if(!Array.isArray(raw.entries)||(count+=raw.entries.length)>100000)fail(Lx('記錄數量超過上限','too many records'));
    const eids=new Set(),entries=raw.entries.map(e=>{
      if(!obj(e))fail(Lx('帳目','record'));const eid=id(e.id);if(eids.has(eid))fail(Lx('帳目 ID 重複','duplicate record ID'));eids.add(eid);
      if(!['in','out'].includes(e.type))fail(Lx('收入／支出類型','income/expense type'));
      if(!(e.type==='in'?e.cat==='in':['food','move','stay','shop','play','other'].includes(e.cat)))fail(Lx('分類','Category'));
      if(typeof e.ts!=='number'||!Number.isFinite(e.ts)||!validDate(iso(e.ts)))fail(Lx('記帳時間','record time'));
      const date=e.date===undefined?iso(e.ts):e.date;if(!validDate(date))fail(Lx('記帳日期','record date'));
      return {id:eid,type:e.type,amt:money(e.amt),cat:e.cat,note:str(e.note??'',Lx('備註','Note'),500),ts:e.ts,date};
    });
    const plan={};if(raw.plan!=null&&!obj(raw.plan))fail(Lx('每日行程','Daily plan'));
    for(const [d,note] of Object.entries(raw.plan||{})){if(!validDate(d))fail(Lx('行程日期','plan date'));plan[d]=str(note,Lx('行程備註','plan note'),2000)}
    const rate=raw.hkdRate??null;if(rate!==null&&(typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||rate>1000000))fail(Lx('參考匯率','reference rate'));
    /* 參考貨幣：舊備份沒有這欄，當作港幣；空字串＝不換算。hkdRate 是舊欄名，意思是 1 當地幣＝多少參考貨幣 */
    const ref=raw.ref===undefined?'HKD':raw.ref;if(typeof ref!=='string'||!(ref===''||/^[A-Z]{3}$/.test(ref)))fail(Lx('參考貨幣','reference currency'));
    const t={id:tid,name,currency,start:new Date(sd+'T00:00:00').getTime(),startDate:sd,endDate:ed,status:raw.status==='active'?'planned':raw.status,entries,plan,budget:budget(raw.budget),dailyBudget:budget(raw.dailyBudget),hkdRate:ref&&currency===ref?1:ref?rate:null,snoozeUntil:0};
    if(raw.ref!==undefined)t.ref=ref;
    if(typeof raw.snoozeUntil==='number'&&Number.isFinite(raw.snoozeUntil)&&raw.snoozeUntil>0)t.snoozeUntil=raw.snoozeUntil;
    if(raw.destinationId!==undefined)t.destinationId=id(raw.destinationId);
    if(raw.country!==undefined){if(typeof raw.country!=='string'||!/^[A-Z]{2}$/.test(raw.country))fail(Lx('國家代碼','country code'));t.country=raw.country}
    if(raw.artIndex!==undefined){if(![0,1,2].includes(raw.artIndex))fail(Lx('卡片景點','card landmark'));if(raw.artIndex)t.artIndex=raw.artIndex}
    if(raw.artVariant!==undefined){if(!['day','night'].includes(raw.artVariant))fail(Lx('卡片日夜設定','card day/night setting'));if(raw.artVariant==='night')t.artVariant='night'}
    if(t.status==='done')t.end=new Date(ed+'T00:00:00').getTime();
    return t;
  });
  return {trips};
}
/* 比對是否同一趟：沒有 ref 的舊旅程等同 ref 'HKD' */
const canonical=x=>JSON.stringify(x,(k,v)=>obj(v)?Object.fromEntries(Object.keys(Array.isArray(v.entries)&&v.ref===undefined?{...v,ref:'HKD'}:v).filter(k=>!['id','snoozeUntil','start','end'].includes(k)).sort().map(k=>[k,k==='ref'&&v.ref===undefined?'HKD':v[k]])):v);
function merge(current,incoming,newId){
  const trips=current.trips.slice(),seen=new Set(trips.map(canonical)),used=new Set(trips.map(t=>t.id));let added=0,skipped=0,copies=0;
  for(const t of incoming.trips){const fingerprint=canonical(t);if(seen.has(fingerprint)){skipped++;continue}const copy=JSON.parse(JSON.stringify(t));if(used.has(copy.id)){do{copy.id=newId()}while(used.has(copy.id));copies++}used.add(copy.id);seen.add(fingerprint);trips.push(copy);added++}
  return {data:{...current,trips},added,skipped,copies};
}
function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function csv(data){
  const lines=[[Lx('旅程','Trip'),Lx('幣別','Currency'),Lx('日期','Date'),Lx('時間','Time'),Lx('階段','Phase'),Lx('收支','Type'),Lx('分類','Category'),Lx('金額','Amount'),Lx('備註','Note'),Lx('參考換算（非實際結算）','Reference value (not actual settlement)'),Lx('參考貨幣','Reference currency'),Lx('手動匯率（1 當地幣＝參考貨幣）','Manual rate (1 local = reference)')]];
  const labels={food:Lx('餐飲','Food'),move:Lx('交通','Transport'),stay:Lx('住宿','Stay'),shop:Lx('購物','Shopping'),play:Lx('玩樂','Fun'),other:Lx('其他','Other'),in:Lx('收入','Income')};
  data.trips.forEach(t=>t.entries.forEach(e=>{const d=new Date(e.ts),ref=t.ref===undefined?'HKD':t.ref,rate=!ref?null:t.currency===ref?1:t.hkdRate;lines.push([t.name,t.currency,dateOf(e),pad(d.getHours())+':'+pad(d.getMinutes()),{before:Lx('行前','Pre-trip'),during:Lx('旅途中','During trip'),after:Lx('回程後','After trip')}[phase(t,dateOf(e))],e.type==='in'?Lx('收入','Income'):Lx('支出','Expense'),labels[e.cat]||e.cat,e.amt,e.note,rate?(e.amt*rate).toFixed(2):'',rate?ref:'',rate||''])}));
  return '﻿'+lines.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
const api={validDate,ordinal,dateOf,total,days,phase,daily,stats,validateBackup,merge,csv,csvCell};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TravelCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
