/* Travel accounting + backup format. No DOM, network or storage side effects. */
(function(root){
'use strict';
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
  const fail=s=>{throw Error('備份格式不正確：'+s)};
  if(!obj(input))fail('需要 JSON 物件');
  if(input.format!==undefined&&(input.format!=='lvtie-backup'||input.version!==1))fail('不支援此備份版本');
  const data=input.format?input.data:input;
  if(!obj(data)||!Array.isArray(data.trips)||data.trips.length>1000)fail('旅程清單不正確或超過 1,000 趟');
  const str=(v,label,max=200)=>{if(typeof v!=='string'||v.length>max)fail(label);return v};
  const id=v=>{if(typeof v!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(v))fail('記錄 ID');return v};
  const money=(v,optional=false)=>{if(optional&&(v==null||v===''))return null;if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>999999999.99||Math.abs(v*100-Math.round(v*100))>0.0001)fail('金額必須為正數，最多兩位小數');return v};
  const budget=v=>{if(v==null||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||v<=0)fail('預算必須是有效正數');return v};
  const ids=new Set();let count=0;
  const trips=data.trips.map(raw=>{
    if(!obj(raw))fail('旅程');const tid=id(raw.id);if(ids.has(tid))fail('旅程 ID 重複');ids.add(tid);
    const name=str(raw.name,'旅程名稱');if(!name.trim())fail('旅程名稱不能留空');
    const currency=str(raw.currency,'幣別',3);if(!/^[A-Z]{3}$/.test(currency))fail('幣別需為三個大寫英文字母');
    const sd=raw.startDate||iso(raw.start),ed=raw.endDate||iso(raw.end||raw.start);
    if(!validDate(sd)||!validDate(ed)||ed<sd)fail('旅程日期或時長');
    if(!['planned','done','active'].includes(raw.status))fail('旅程狀態');
    if(!Array.isArray(raw.entries)||(count+=raw.entries.length)>100000)fail('記錄數量超過上限');
    const eids=new Set(),entries=raw.entries.map(e=>{
      if(!obj(e))fail('帳目');const eid=id(e.id);if(eids.has(eid))fail('帳目 ID 重複');eids.add(eid);
      if(!['in','out'].includes(e.type))fail('收入／支出類型');
      if(!(e.type==='in'?e.cat==='in':['food','move','stay','shop','play','other'].includes(e.cat)))fail('分類');
      if(typeof e.ts!=='number'||!Number.isFinite(e.ts)||!validDate(iso(e.ts)))fail('記帳時間');
      const date=e.date===undefined?iso(e.ts):e.date;if(!validDate(date))fail('記帳日期');
      return {id:eid,type:e.type,amt:money(e.amt),cat:e.cat,note:str(e.note??'','備註',500),ts:e.ts,date};
    });
    const plan={};if(raw.plan!=null&&!obj(raw.plan))fail('每日行程');
    for(const [d,note] of Object.entries(raw.plan||{})){if(!validDate(d))fail('行程日期');plan[d]=str(note,'行程備註',2000)}
    const rate=raw.hkdRate??null;if(rate!==null&&(typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||rate>1000000))fail('港幣匯率');
    const t={id:tid,name,currency,start:new Date(sd+'T00:00:00').getTime(),startDate:sd,endDate:ed,status:raw.status==='active'?'planned':raw.status,entries,plan,budget:budget(raw.budget),dailyBudget:budget(raw.dailyBudget),hkdRate:currency==='HKD'?1:rate,snoozeUntil:0};
    if(typeof raw.snoozeUntil==='number'&&Number.isFinite(raw.snoozeUntil)&&raw.snoozeUntil>0)t.snoozeUntil=raw.snoozeUntil;
    if(raw.destinationId!==undefined)t.destinationId=id(raw.destinationId);
    if(raw.country!==undefined){if(typeof raw.country!=='string'||!/^[A-Z]{2}$/.test(raw.country))fail('國家代碼');t.country=raw.country}
    if(raw.artIndex!==undefined){if(![0,1,2].includes(raw.artIndex))fail('卡片景點');if(raw.artIndex)t.artIndex=raw.artIndex}
    if(raw.artVariant!==undefined){if(!['day','night'].includes(raw.artVariant))fail('卡片日夜設定');if(raw.artVariant==='night')t.artVariant='night'}
    if(t.status==='done')t.end=new Date(ed+'T00:00:00').getTime();
    return t;
  });
  return {trips};
}
const canonical=x=>JSON.stringify(x,(k,v)=>obj(v)?Object.fromEntries(Object.keys(v).filter(k=>!['id','snoozeUntil','start','end'].includes(k)).sort().map(k=>[k,v[k]])):v);
function merge(current,incoming,newId){
  const trips=current.trips.slice(),seen=new Set(trips.map(canonical)),used=new Set(trips.map(t=>t.id));let added=0,skipped=0,copies=0;
  for(const t of incoming.trips){const fingerprint=canonical(t);if(seen.has(fingerprint)){skipped++;continue}const copy=JSON.parse(JSON.stringify(t));if(used.has(copy.id)){do{copy.id=newId()}while(used.has(copy.id));copies++}used.add(copy.id);seen.add(fingerprint);trips.push(copy);added++}
  return {data:{...current,trips},added,skipped,copies};
}
function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function csv(data){
  const lines=[['旅程','幣別','日期','時間','階段','收支','分類','金額','備註','港幣參考（非實際結算）','手動匯率（1 當地幣＝HKD）']];
  const labels={food:'餐飲',move:'交通',stay:'住宿',shop:'購物',play:'玩樂',other:'其他',in:'收入'};
  data.trips.forEach(t=>t.entries.forEach(e=>{const d=new Date(e.ts),rate=t.currency==='HKD'?1:t.hkdRate;lines.push([t.name,t.currency,dateOf(e),pad(d.getHours())+':'+pad(d.getMinutes()),{before:'行前',during:'旅途中',after:'回程後'}[phase(t,dateOf(e))],e.type==='in'?'收入':'支出',labels[e.cat]||e.cat,e.amt,e.note,rate?(e.amt*rate).toFixed(2):'',rate||''])}));
  return '﻿'+lines.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
const api={validDate,ordinal,dateOf,total,days,phase,daily,stats,validateBackup,merge,csv,csvCell};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TravelCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
