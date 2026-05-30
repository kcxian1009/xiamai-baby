import React from 'react';
const { useState, useRef, useEffect } = React;
import { db } from './firebase.js';
import { ref, onValue, set } from 'firebase/database';


const DUE_DATE = new Date("2026-08-21");
const PREGNANCY_START = new Date(DUE_DATE.getTime() - 280 * 24 * 60 * 60 * 1000);
function getPregnancyWeeks() {
  const totalDays = Math.floor((new Date() - PREGNANCY_START) / 86400000);
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

const IMGS = {
  "小麥寶寶": "images/小麥寶寶.png",
  "記帳": "images/記帳.png",
  "奶瓶": "images/奶瓶.png",
  "尿布": "images/尿布.png",
  "睡眠": "images/睡眠.png",
  "健康": "images/健康.png",
  "日記": "images/日記.png",
  "媽媽": "images/媽媽.png",
  "爸爸": "images/爸爸.png",
  "母乳圖": "images/母乳圖.png",
  "配方奶圖": "images/配方奶圖.png",
  "副食品圖": "images/副食品圖.png",
  "家": "images/家.png",
  "水杯": "images/水杯.png",
};

function ImgOrEmoji({ src, style, alt="" }) {
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("./") || src.startsWith("http") || src.startsWith("images/")) {
    return <img src={src} style={style} alt={alt}/>;
  }
  return <span style={{ fontSize: style&&style.width ? parseInt(style.width)*0.6+"px" : "28px", display:"flex", alignItems:"center", justifyContent:"center" }}>{src}</span>;
}



const C = {
  bg:"#F5EDE3", card:"#FDF8F3", warm1:"#8A6946", warm2:"#AF9273",
  warm3:"#CFBBA2", warm4:"#EFE2CA", accent:"#F6D387",
  text:"#5C4033", sub:"#A0856C", white:"#FFFDF9",
};

const ACCOUNTS = {
  baby:{ label:"寶寶金", icon:"👶", imgKey:"小麥寶寶", color:"#E8956D", light:"#FDEEE5", grad:["#F0A882","#E8956D"] },
  mom: { label:"媽媽",   icon:"🤱", imgKey:"媽媽",     color:"#D4848A", light:"#FDEAE5", grad:["#E8A0A6","#D4848A"] },
  dad: { label:"爸爸",   icon:"👨", imgKey:"爸爸",     color:"#7AAEC4", light:"#E8F3F8", grad:["#8EC2D8","#7AAEC4"] },
};
const CATEGORY_ICONS = {
  "奶粉/副食品":"🍼","尿布/濕紙巾":"🧷","衣物":"👕","生活用品":"💡",
  "玩具/書籍":"🧸","玩樂":"🏀","醫療":"🏥","孕期用品":"🤰",
  "保險":"🛡️","股票/基金":"📈","節慶/禮物":"🎁","其他":"📦",
};
const CATEGORY_COLORS = {
  "奶粉/副食品":"#D4956A","尿布/濕紙巾":"#7FB5C8","衣物":"#B39DDB","生活用品":"#78C4A8",
  "玩具/書籍":"#E8B84B","玩樂":"#F4A460","醫療":"#E08080","孕期用品":"#C98FA3",
  "保險":"#7AAEC4","股票/基金":"#5A9A6F","節慶/禮物":"#D4848A","其他":"#A5C49A",
};

// ── Page Shell ──────────────────────────────────────────────
function Page({ title, onBack, children, bottomSlot, scrollRef }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, background:C.bg, fontFamily:"'Noto Sans TC','PingFang TC',sans-serif", display:"flex", flexDirection:"column", maxWidth:430, left:"50%", transform:"translateX(-50%)", width:"100%" }}>
      <div style={{ background:C.card, padding:"14px 20px 12px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid #CFBBA288", flexShrink:0 }}>
        <button onClick={onBack} style={{ background:C.warm4, border:"none", borderRadius:10, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:20, color:C.warm1 }}>&#8249;</button>
        <span style={{ fontWeight:800, fontSize:18, color:C.text }}>{title}</span>
      </div>
      <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"16px 16px 24px" }}>{children}</div>
      {bottomSlot && <div style={{ flexShrink:0 }}>{bottomSlot}</div>}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, unit, icon, color }) {
  return (
    <div style={{ flex:1, background:C.card, borderRadius:16, padding:"14px 10px", textAlign:"center", border:"1px solid #EFE2CA", boxShadow:"0 2px 8px rgba(150,100,60,0.07)" }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:20, fontWeight:800, color:color || C.warm1 }}>{value}</div>
      <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{label}{unit ? " ("+unit+")" : ""}</div>
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────
function SectionHeader({ title, onAdd, color }) {
  const bg = color || "linear-gradient(135deg,#C8986A,#B8845A)";
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, marginTop:16 }}>
      <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{title}</span>
      {onAdd && <button onClick={onAdd} style={{ background:bg, border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>}
    </div>
  );
}

// ── Record Row ───────────────────────────────────────────────
function RecordRow({ icon, title, sub, right, color, onDelete }) {
  return (
    <div style={{ background:C.card, borderRadius:14, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, border:"1px solid #EFE2CA", marginBottom:8 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:(color||"#F9EDD9")+"44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{sub}</div>}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontWeight:700, color:color||C.warm1, fontSize:13 }}>{right}</div>
        {onDelete && <button onClick={onDelete} style={{ background:"none", border:"none", color:C.warm3, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>刪除</button>}
      </div>
    </div>
  );
}

// ── Modal Form ───────────────────────────────────────────────
function Modal({ title, onClose, onSave, children, color }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:430, maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ fontWeight:800, color:C.text, fontSize:17, marginBottom:16 }}>{title}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{children}</div>
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, background:C.warm4, border:"none", borderRadius:12, color:C.sub, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
          <button onClick={onSave} style={{ flex:2, padding:12, background:color||"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>儲存</button>
        </div>
      </div>
    </div>
  );
}
function FLabel({ label, children }) {
  return <div><div style={{ fontSize:12, color:C.sub, marginBottom:4 }}>{label}</div>{children}</div>;
}
const IS2 = { width:"100%", padding:"10px 12px", border:"1.5px solid #CFBBA2", borderRadius:12, fontSize:15, fontFamily:"inherit", color:"#5C4033", background:"#FFFDF9", boxSizing:"border-box", outline:"none" };

// ── ALL RECORDS PAGE ─────────────────────────────────────────
function AllRecordsPage({ onBack, onSwitch, feedingRecords, diaperRecords, sleepRecords, tempRecords }) {
  const todayStr = new Date().toISOString().slice(0,10);
  const [searchDate, setSearchDate] = useState(todayStr);

  function calcDuration(start, end) {
    const [sh,sm] = start.split(":").map(Number);
    let [eh,em] = end.split(":").map(Number);
    if (eh < sh) eh += 24;
    return (eh*60+em)-(sh*60+sm);
  }

  const allItems = [
    ...feedingRecords.filter(r=>r.date===searchDate).map(r=>({
      time:r.time, type:"feeding",
      icon: r.type==="母乳"?"🤱":r.type==="喝水"?"💧":"🍼",
      bg: r.type==="母乳"?"#FDEAE5":r.type==="喝水"?"#EAF5FF":"#E8F3F8",
      color: r.type==="母乳"?"#D4848A":r.type==="喝水"?"#5B9EC9":"#7AAEC4",
      title:r.type,
      detail: r.type==="母乳"?(r.ml?r.ml+"ml":(r.duration||0)+"分鐘"):r.type==="副食品"?(r.desc||""):((r.amount||0)+"ml"),
    })),
    ...diaperRecords.filter(r=>r.date===searchDate).map(r=>({
      time:r.time, type:"diaper",
      icon: r.type==="濕"?"💦":r.type==="便便"?"💩":"🔄",
      bg:"#E8F3F8", color:"#7AAEC4",
      title:r.type, detail:r.color+(r.note?" · "+r.note:""),
    })),
    ...sleepRecords.filter(r=>r.date===searchDate).map(r=>({
      time:r.start, type:"sleep",
      icon:r.type==="夜眠"?"🌙":"☀️",
      bg:"#EDE8F5", color:"#9B87D4",
      title:r.type,
      detail:r.start+" ~ "+r.end+" ("+Math.floor(calcDuration(r.start,r.end)/60)+"h"+calcDuration(r.start,r.end)%60+"m)",
    })),
    ...(tempRecords||[]).filter(r=>r.date===searchDate).map(r=>({
      time:r.time, type:"temp",
      icon:"🌡️",
      bg: r.temp>=38?"#FDEAE5":r.temp>=37.5?"#FFF8E8":"#EAF5EE",
      color: r.temp>=38?"#E08080":r.temp>=37.5?"#C8986A":"#5A9A6F",
      title:"體溫",
      detail: r.temp+"°C"+(r.temp>=38?" ⚠️ 發燒":r.temp>=37.5?" 注意":"")+(r.note?" · "+r.note:""),
    })),
  ].sort((a,b)=>b.time.localeCompare(a.time));

  const feedCount   = feedingRecords.filter(r=>r.date===searchDate).length;
  const diaperCount = diaperRecords.filter(r=>r.date===searchDate).length;
  const sleepMin    = sleepRecords.filter(r=>r.date===searchDate).reduce((s,r)=>s+calcDuration(r.start,r.end),0);
  const breastMin   = feedingRecords.filter(r=>r.date===searchDate&&r.type==="母乳").reduce((s,r)=>s+(r.duration||0),0);
  const formulaMl   = feedingRecords.filter(r=>r.date===searchDate&&r.type==="配方奶").reduce((s,r)=>s+(r.amount||0),0);
  const dayTemps    = (tempRecords||[]).filter(r=>r.date===searchDate);
  const highTemp    = dayTemps.filter(r=>r.temp>=38);

  return (
    <Page title="全部記錄" onBack={onBack} bottomSlot={<BottomTabs active="全部記錄" onSwitch={onSwitch}/>}>
      <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, borderRadius:14, padding:"10px 14px", marginBottom:12, border:"1px solid #EFE2CA" }}>
        <span style={{ fontSize:18 }}>📅</span>
        <input type="date" value={searchDate} onChange={e=>setSearchDate(e.target.value)} style={{ flex:1, border:"none", background:"transparent", fontSize:15, fontFamily:"inherit", color:C.text, outline:"none" }}/>
        <button onClick={()=>setSearchDate(todayStr)} style={{ background:C.warm4, border:"none", borderRadius:8, padding:"4px 10px", fontSize:12, color:C.sub, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>今天</button>
      </div>

      <div style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", borderRadius:16, padding:"12px 16px", marginBottom:14, color:"white" }}>
        <div style={{ fontSize:12, opacity:0.8, marginBottom:8 }}>{searchDate} 摘要</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {feedCount>0 && <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>🍼 {feedCount} 次{breastMin>0?" · 母乳 "+breastMin+"分":""}{formulaMl>0?" · 配方 "+formulaMl+"ml":""}</span>}
          {sleepMin>0 && <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>😴 {Math.floor(sleepMin/60)}h{sleepMin%60}m</span>}
          {diaperCount>0 && <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>👶🏻 尿布更換 {diaperCount} 次</span>}
          {dayTemps.length>0 && <span style={{ background:highTemp.length>0?"rgba(220,60,60,0.4)":"rgba(255,255,255,0.2)", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>🌡️ {dayTemps[dayTemps.length-1].temp}°C{highTemp.length>0?" ⚠️":""}</span>}
        </div>
      </div>

      {allItems.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:40, fontSize:14 }}>這天還沒有任何記錄 🍃</div>}
      <div style={{ position:"relative" }}>
        {allItems.length>0 && <div style={{ position:"absolute", left:28, top:8, bottom:8, width:2, background:"#EFE2CA", borderRadius:2 }}/>}
        {allItems.map((item,idx)=>(
          <div key={idx} style={{ display:"flex", gap:12, marginBottom:14, position:"relative", alignItems:"flex-start" }}>
            <div style={{ width:44, textAlign:"center", flexShrink:0, paddingTop:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.time}</div>
            </div>
            <div style={{ width:16, height:16, borderRadius:"50%", background:item.color, flexShrink:0, marginTop:12, zIndex:1, border:"3px solid #F5EDE3" }}/>
            <div style={{ flex:1, background:C.card, borderRadius:14, padding:"10px 14px", border:"1px solid "+(item.type==="temp"&&item.color==="E08080"?"#F5D0D0":"#EFE2CA"), marginTop:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:item.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:item.color==="#E08080"||item.color==="#C8986A"?item.color:C.sub, marginTop:1, fontWeight:item.type==="temp"?600:400 }}>{item.detail}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

// ── FEEDING PAGE ─────────────────────────────────────────────
// ── Bottom Tabs (All / Feeding / Diaper / Sleep) -- v4 ──────────
function BottomTabs({ active, onSwitch }) {
  const tabs = [
    { key:"全部記錄", emoji:"📋",  label:"全部", bg:"#F5EDE3", activeBg:"linear-gradient(135deg,#C8986A,#B8845A)", dot:"#C8986A", textColor:"#8A6946" },
    { key:"餵養",     icon:IMGS["奶瓶"],  label:"餵養", bg:"#FDEAE5", activeBg:"linear-gradient(135deg,#E8A0A6,#D4848A)", dot:"#D4848A", textColor:"#D4848A" },
    { key:"尿布",     icon:IMGS["尿布"],  label:"尿布", bg:"#E8F3F8", activeBg:"linear-gradient(135deg,#8EC2D8,#7AAEC4)", dot:"#7AAEC4", textColor:"#7AAEC4" },
    { key:"睡眠",     icon:IMGS["睡眠"],  label:"睡眠", bg:"#EDE8F5", activeBg:"linear-gradient(135deg,#B0A0D8,#9B87D4)", dot:"#9B87D4", textColor:"#9B87D4" },
  ];
  return (
    <div style={{ background:"#FDF8F3", borderTop:"1px solid #EFE2CA", padding:"8px 0 20px", display:"flex", justifyContent:"space-around" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onSwitch(t.key)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, fontFamily:"inherit", padding:"0 10px" }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:active===t.key?t.activeBg:t.bg, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", transition:"all 0.2s", boxShadow:active===t.key?"0 3px 10px "+t.dot+"55":"none" }}>
            {t.icon ? <img src={t.icon} style={{ width:32, height:32, objectFit:"cover" }}/> : <span style={{ fontSize:22 }}>{t.emoji}</span>}
          </div>
          <span style={{ fontSize:11, fontWeight:active===t.key?800:400, color:active===t.key?t.textColor:"#A0856C" }}>{t.label}</span>
          {active===t.key && <div style={{ width:4, height:4, borderRadius:"50%", background:t.dot }}/>}
        </button>
      ))}
    </div>
  );
}


function FeedingPage({ onBack, onSwitch, records, setRecords, initialTypeFilter=null }) {
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter);
  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), time:"", type:"母乳", duration:"", durationUnit:"分鐘", amount:"", side:"左", desc:"" });
  const dateHook = useDateFilter();

  const allFiltered = dateHook.filterByDate(records).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
  const filtered = typeFilter ? allFiltered.filter(r=>r.type===typeFilter) : allFiltered;
  const waterCount = allFiltered.filter(r=>r.type==="喝水").length;
  const byDate = filtered.reduce((acc,r)=>{ if(!acc[r.date]) acc[r.date]=[]; acc[r.date].push(r); return acc; }, {});
  const isMultiDay = dateHook.mode !== "自訂" || dateHook.range.start !== dateHook.range.end;
  const todayStr = new Date().toISOString().slice(0,10);

  const typeImg   = { "母乳":IMGS["母乳圖"], "配方奶":IMGS["配方奶圖"], "副食品":IMGS["副食品圖"], "喝水":IMGS["水杯"] };
  const typeBg    = { "母乳":"#FDEAE5", "配方奶":"#E8F3F8", "副食品":"#FDF0D8", "喝水":"#EAF5FF" };
  const typeColor = { "母乳":"#D4848A", "配方奶":"#7AAEC4", "副食品":"#C8986A", "喝水":"#5B9EC9" };
  const typeGrad  = { "母乳":"linear-gradient(135deg,#E8A0A6,#D4848A)",
                      "配方奶":"linear-gradient(135deg,#8EC2D8,#7AAEC4)",
                      "副食品":"linear-gradient(135deg,#E0B87A,#C8986A)",
                      "喝水":"linear-gradient(135deg,#7EC8E3,#5B9EC9)" };

  function save() {
    if (!form.time || !form.type) return;
    setRecords(p=>[...p, {
      id:Date.now(), date:form.date, time:form.time, type:form.type,
      duration: form.type==="母乳" && form.durationUnit==="分鐘" ? (form.duration?parseInt(form.duration):null) : null,
      ml:       form.type==="母乳" && form.durationUnit==="ml"  ? (form.duration?parseInt(form.duration):null) : null,
      amount:   form.type==="配方奶"||form.type==="喝水" ? (form.amount?parseInt(form.amount):null) : null,
      desc:     form.type==="副食品" ? form.desc : null,
      side:     form.type==="母乳" ? form.side : null,
    }]);
    setForm({ date:todayStr, time:"", type:"母乳", duration:"", durationUnit:"分鐘", amount:"", side:"左", desc:"" });
    setShowModal(false);
  }

  const modalColor = typeGrad[form.type] || typeGrad["母乳"];

  return (
    <Page title="餵養記錄" onBack={onBack} bottomSlot={<BottomTabs active="餵養" onSwitch={onSwitch}/>}>
      <DateRangeBar hook={dateHook} accentColor="#D4848A" tabs={["月","週","日","自訂"]}/>

      {/* 4 type cards */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[
          { type:"母乳",   img:IMGS["母乳圖"] },
          { type:"配方奶", img:IMGS["配方奶圖"] },
          { type:"副食品", img:IMGS["副食品圖"] },
          { type:"喝水",   img:IMGS["水杯"] },
        ].map(item=>{
          const active = typeFilter === item.type;
          return (
            <button key={item.type} onClick={()=>setTypeFilter(typeFilter===item.type?null:item.type)}
              style={{ flex:1, background:"transparent", border:"none", cursor:"pointer", padding:0, display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ width:"100%", aspectRatio:"1", borderRadius:16, background:active?typeGrad[item.type]:typeBg[item.type], display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", boxShadow:active?"0 4px 16px "+typeColor[item.type]+"55":"0 2px 8px rgba(0,0,0,0.08)", transition:"all 0.2s", border:"3px solid white" }}>
                {item.img
                  ? <img src={item.img} style={{ width:"80%", height:"80%", objectFit:"contain" }}/>
                  : <span style={{ fontSize:28 }}>💧</span>
                }
              </div>
            </button>
          );
        })}
      </div>

      <SectionHeader title={typeFilter ? typeFilter+"明細" : "全部記錄"} onAdd={()=>{ setForm(p=>({...p,date:todayStr})); setShowModal(true); }} color={typeFilter?typeGrad[typeFilter]:"linear-gradient(135deg,#E8A0A6,#D4848A)"}/>

      {filtered.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:28, fontSize:14 }}>此期間沒有記錄 🍃</div>}
      {Object.entries(byDate).map(([date, recs])=>(
        <div key={date}>
          {isMultiDay && <div style={{ fontSize:12, fontWeight:700, color:"#D4848A", marginBottom:6, marginTop:10, paddingLeft:4 }}>{date}</div>}
          {recs.map(r=>(
            <div key={r.id} style={{ background:C.card, borderRadius:16, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, border:"1px solid #EFE2CA", marginBottom:8 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:typeBg[r.type]||"#FDEAE5", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {typeImg[r.type]
                  ? <img src={typeImg[r.type]} style={{ width:46, height:46, objectFit:"contain" }}/>
                  : <span style={{ fontSize:28 }}>💧</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{r.type}</div>
                <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>
                  {r.time}{r.side?" - "+r.side+"邊":""}{r.desc?" - "+r.desc:""}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontWeight:700, color:typeColor[r.type]||C.warm1, fontSize:13 }}>
                  {r.type==="母乳"
                    ? r.ml ? r.ml+"ml" : (r.duration||0)+"分鐘"
                    : r.type==="配方奶"||r.type==="喝水" ? (r.amount||0)+"ml"
                    : r.desc||""}
                </div>
                <button onClick={()=>setRecords(p=>p.filter(x=>x.id!==r.id))} style={{ background:"none", border:"none", color:C.warm3, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {showModal && (
        <Modal title="新增餵養記錄" onClose={()=>setShowModal(false)} onSave={save} color={modalColor}>
          <FLabel label="日期"><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="時間"><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="類型">
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["母乳","配方奶","副食品","喝水"].map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", background:form.type===t?typeGrad[t]:"#EFE2CA", color:form.type===t?"white":"#5C4033", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>{t}</button>
              ))}
            </div>
          </FLabel>
          {form.type==="母乳" && <>
            <FLabel label="哪一邊">
              <div style={{ display:"flex", gap:8 }}>
                {["左","右","兩邊"].map(s=>(
                  <button key={s} onClick={()=>setForm(p=>({...p,side:s}))} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", background:form.side===s?"#D4848A":"#EFE2CA", color:form.side===s?"white":"#5C4033", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{s}</button>
                ))}
              </div>
            </FLabel>
            <FLabel label="記錄方式">
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                {["分鐘","ml"].map(u=>(
                  <button key={u} onClick={()=>setForm(p=>({...p,durationUnit:u}))} style={{ flex:1, padding:"7px 0", borderRadius:10, border:"none", background:form.durationUnit===u?"#D4848A":"#EFE2CA", color:form.durationUnit===u?"white":"#5C4033", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{u}</button>
                ))}
              </div>
              <input type="number" placeholder={form.durationUnit==="分鐘"?"15":"80"} value={form.duration} onChange={e=>setForm(p=>({...p,duration:e.target.value}))} style={IS2}/>
            </FLabel>
          </>}
          {form.type==="配方奶" && <FLabel label="份量（ml）"><input type="number" placeholder="120" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={IS2}/></FLabel>}
          {form.type==="喝水"   && <FLabel label="份量（ml）"><input type="number" placeholder="30" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={IS2}/></FLabel>}
          {form.type==="副食品" && <FLabel label="說明"><input type="text" placeholder="例：南瓜泥 2湯匙" value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} style={IS2}/></FLabel>}
        </Modal>
      )}
    </Page>
  );
}

// ── DIAPER PAGE ──────────────────────────────────────────────
function DiaperPage({ onBack, onSwitch, records, setRecords }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), time:"", type:"濕", color:"淡黃", note:"" });
  const dateHook = useDateFilter();
  const todayStr = new Date().toISOString().slice(0,10);

  const filtered = dateHook.filterByDate(records).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
  const wetCount = filtered.filter(r=>r.type==="濕"||r.type==="混合").length;
  const pooCount = filtered.filter(r=>r.type==="便便"||r.type==="混合").length;
  const byDate = filtered.reduce((acc,r)=>{ if(!acc[r.date]) acc[r.date]=[]; acc[r.date].push(r); return acc; }, {});
  const isMultiDay = dateHook.mode !== "自訂" || dateHook.range.start !== dateHook.range.end;

  const typeIcon = { "濕":"💦", "便便":"💩", "混合":"🔄" };
  const typeColor = { "濕":"#7AAEC4", "便便":"#C8986A", "混合":"#AF9273" };

  function save() {
    if (!form.time) return;
    setRecords(p=>[...p,{ id:Date.now(), ...form }]);
    setForm({ date:todayStr, time:"", type:"濕", color:"淡黃", note:"" });
    setShowModal(false);
  }

  return (
    <Page title="尿布記錄" onBack={onBack} bottomSlot={<BottomTabs active="尿布" onSwitch={onSwitch}/>}>
      <DateRangeBar hook={dateHook} accentColor="#7AAEC4" tabs={["月","週","日","自訂"]}/>

      <div style={{ display:"flex", gap:10, marginBottom:4 }}>
        <StatCard label="期間總換" value={filtered.length} icon="👶🏻" color="#8A6946"/>
        <StatCard label="濕尿布" value={wetCount} icon="💦" color="#7AAEC4"/>
        <StatCard label="便便" value={pooCount} icon="💩" color="#C8986A"/>
      </div>

      <SectionHeader title="記錄明細" onAdd={()=>{ setForm(p=>({...p,date:todayStr})); setShowModal(true); }} color="linear-gradient(135deg,#8EC2D8,#7AAEC4)"/>

      {filtered.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:28, fontSize:14 }}>此期間沒有記錄 🍃</div>}
      {Object.entries(byDate).map(([date, recs])=>(
        <div key={date}>
          {isMultiDay && <div style={{ fontSize:12, fontWeight:700, color:"#7AAEC4", marginBottom:6, marginTop:10, paddingLeft:4 }}>{date}</div>}
          {recs.map(r=>(
            <RecordRow key={r.id}
              icon={typeIcon[r.type]}
              title={r.type+(r.color?" - "+r.color:"")}
              sub={r.time+(r.note?" - "+r.note:"")}
              right={r.time}
              color={typeColor[r.type]}
              onDelete={()=>setRecords(p=>p.filter(x=>x.id!==r.id))}
            />
          ))}
        </div>
      ))}

      {showModal && (
        <Modal title="新增尿布記錄" onClose={()=>setShowModal(false)} onSave={save} color="linear-gradient(135deg,#8EC2D8,#7AAEC4)">
          <FLabel label="日期"><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="時間"><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="類型">
            <div style={{ display:"flex", gap:8 }}>
              {["濕","便便","混合"].map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", background:form.type===t?"#7AAEC4":"#EFE2CA", color:form.type===t?"white":"#5C4033", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{t}</button>
              ))}
            </div>
          </FLabel>
          <FLabel label="顏色">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["淡黃","黃色","深黃","綠色","橘色"].map(c=>(
                <button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{ padding:"6px 12px", borderRadius:10, border:"none", background:form.color===c?"#7AAEC4":"#EFE2CA", color:form.color===c?"white":"#5C4033", fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>{c}</button>
              ))}
            </div>
          </FLabel>
          <FLabel label="備註"><input type="text" placeholder="選填" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} style={IS2}/></FLabel>
        </Modal>
      )}
    </Page>
  );
}

// ── SLEEP PAGE ───────────────────────────────────────────────
function SleepPage({ onBack, onSwitch, records, setRecords }) {
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStart, setSleepStart] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const dateHook = useDateFilter("日");
  const todayForForm = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({ date:todayForForm, start:"", end:"", type:"睡覺", note:"" });
  const todayStr = new Date().toISOString().slice(0,10);

  function calcDuration(start, end) {
    const [sh,sm] = start.split(":").map(Number);
    let [eh,em] = end.split(":").map(Number);
    if (eh < sh) eh += 24;
    return ((eh*60+em)-(sh*60+sm));
  }

  const filtered = dateHook.filterByDate(records).sort((a,b)=>b.date.localeCompare(a.date)||b.start.localeCompare(a.start));
  const totalMin = filtered.reduce((s,r)=>s+calcDuration(r.start,r.end),0);
  const totalH = Math.floor(totalMin/60);
  const totalM = totalMin%60;
  const nightSleep = filtered.filter(r=>r.type==="夜眠").reduce((s,r)=>s+calcDuration(r.start,r.end),0);
  const byDate = filtered.reduce((acc,r)=>{ if(!acc[r.date]) acc[r.date]=[]; acc[r.date].push(r); return acc; }, {});
  const isMultiDay = dateHook.mode !== "自訂" || dateHook.range.start !== dateHook.range.end;

  function save() {
    if (!form.start||!form.end) return;
    setRecords(p=>[...p,{ id:Date.now(), ...form }]);
    setForm({ date:todayStr, start:"", end:"", type:"睡覺", note:"" });
    setShowModal(false);
  }

  return (
    <Page title="睡眠記錄" onBack={onBack} bottomSlot={<BottomTabs active="睡眠" onSwitch={onSwitch}/>}>
      <DateRangeBar hook={dateHook} accentColor="#9B87D4" tabs={["月","週","日","自訂"]}/>

      <div style={{ display:"flex", gap:10, marginBottom:4 }}>
        <StatCard label="期間睡眠" value={totalH+"h"+totalM+"m"} icon="😴" color="#9B87D4"/>
        <StatCard label="夜眠" value={Math.floor(nightSleep/60)+"h"+(nightSleep%60)+"m"} icon="🌙" color="#7B6BB4"/>
        <StatCard label="睡覺次數" value={filtered.filter(r=>r.type==="睡覺").length} icon="☀️" color="#E8B84B"/>
      </div>

      {/* Quick timer - only on today's view */}
      {(dateHook.mode==="日" && dateHook.offset===0) && (
        <div style={{ background:C.card, borderRadius:18, padding:16, textAlign:"center", border:"1px solid #EDE8F5", marginBottom:4 }}>
          <div style={{ fontSize:13, color:C.sub, marginBottom:8 }}>快速計時</div>
          {isSleeping ? (
            <>
              <div style={{ fontSize:14, color:"#9B87D4", marginBottom:10 }}>睡眠中... 開始於 {sleepStart}</div>
              <button onClick={()=>{
                const now = new Date().toTimeString().slice(0,5);
                setRecords(p=>[...p,{ id:Date.now(), date:todayStr, start:sleepStart, end:now, type:"睡覺", note:"" }]);
                setIsSleeping(false); setSleepStart(null);
              }} style={{ background:"linear-gradient(135deg,#9B87D4,#7B6BB4)", border:"none", borderRadius:14, padding:"10px 32px", color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
                醒了 - 停止計時
              </button>
            </>
          ) : (
            <button onClick={()=>{ const now = new Date().toTimeString().slice(0,5); setIsSleeping(true); setSleepStart(now); }} style={{ background:"linear-gradient(135deg,#B0A0D8,#9B87D4)", border:"none", borderRadius:14, padding:"10px 32px", color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>
              開始睡覺
            </button>
          )}
        </div>
      )}

      <SectionHeader title="記錄明細" onAdd={()=>{ setForm(p=>({...p,date:dateHook.range.start})); setShowModal(true); }} color="linear-gradient(135deg,#B0A0D8,#9B87D4)"/>

      {filtered.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:28, fontSize:14 }}>此期間沒有記錄 🍃</div>}
      {Object.entries(byDate).map(([date, recs])=>(
        <div key={date}>
          {isMultiDay && <div style={{ fontSize:12, fontWeight:700, color:"#9B87D4", marginBottom:6, marginTop:10, paddingLeft:4 }}>{date}</div>}
          {recs.map(r=>{
            const dur = calcDuration(r.start,r.end);
            return (
              <RecordRow key={r.id}
                icon={r.type==="夜眠"?"🌙":"☀️"}
                title={r.type}
                sub={r.start+" - "+r.end+(r.note?" - "+r.note:"")}
                right={Math.floor(dur/60)+"h"+dur%60+"m"}
                color={r.type==="夜眠"?"#7B6BB4":"#E8B84B"}
                onDelete={()=>setRecords(p=>p.filter(x=>x.id!==r.id))}
              />
            );
          })}
        </div>
      ))}

      {showModal && (
        <Modal title="新增睡眠記錄" onClose={()=>setShowModal(false)} onSave={save} color="linear-gradient(135deg,#B0A0D8,#9B87D4)">
          <FLabel label="日期"><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="類型">
            <div style={{ display:"flex", gap:8 }}>
              {["睡覺","夜眠"].map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", background:form.type===t?"#9B87D4":"#EFE2CA", color:form.type===t?"white":"#5C4033", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{t}</button>
              ))}
            </div>
          </FLabel>
          <FLabel label="開始時間"><input type="time" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="結束時間"><input type="time" value={form.end} onChange={e=>setForm(p=>({...p,end:e.target.value}))} style={IS2}/></FLabel>
          <FLabel label="備註"><input type="text" placeholder="選填" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} style={IS2}/></FLabel>
        </Modal>
      )}
    </Page>
  );
}

// ── HEALTH PAGE ──────────────────────────────────────────────
function HealthPage({ onBack, growthRecords, setGrowthRecords, fetalRecords, setFetalRecords, vaccineRecords, setVaccineRecords, tempRecords, setTempRecords, isBorn, dueDateStr }) {
  const [medCard, setMedCard] = useState({
    bloodType:"",
    allergies:[ { id:1, type:"食物", item:"", reaction:"", severity:"輕微" } ],
    conditions:[ { id:1, name:"", note:"" } ],
    medications:[ { id:1, name:"", dose:"", note:"" } ],
    emergencyContact:{ name:"", phone:"", relation:"" },
    hospital:"", doctorName:"", note:"",
  });
  const [showGrowth, setShowGrowth] = useState(false);
  const [showVaccine, setShowVaccine] = useState(false);
  const [showTemp, setShowTemp] = useState(false);
  const [growthSearchDate, setGrowthSearchDate] = useState("");
  const [gForm, setGForm] = useState({ date:"", weight:"", height:"", head:"" });
  const [fForm, setFForm] = useState({ date:"", weeks:"", days:"", efw:"", bpd:"", ac:"", fl:"" });
  const [showFetal, setShowFetal] = useState(false);
  const [growthSubTab, setGrowthSubTab] = useState("fetal"); // "fetal" | "birth"
  const [vForm, setVForm] = useState({ date:"", name:"", hospital:"", note:"" });
  const [tForm, setTForm] = useState({ date:new Date().toISOString().slice(0,10), time:"", temp:"", note:"" });
  const [tab, setTab] = useState("growth");

  // ── helpers for medCard array fields
  function addAllergy() { setMedCard(p=>({...p, allergies:[...p.allergies,{ id:Date.now(), type:"食物", item:"", reaction:"", severity:"輕微" }]})); }
  function updateAllergy(id, key, val) { setMedCard(p=>({...p, allergies:p.allergies.map(a=>a.id===id?{...a,[key]:val}:a)})); }
  function removeAllergy(id) { setMedCard(p=>({...p, allergies:p.allergies.filter(a=>a.id!==id)})); }
  function addCondition() { setMedCard(p=>({...p, conditions:[...p.conditions,{ id:Date.now(), name:"", note:"" }]})); }
  function updateCondition(id, key, val) { setMedCard(p=>({...p, conditions:p.conditions.map(c=>c.id===id?{...c,[key]:val}:c)})); }
  function removeCondition(id) { setMedCard(p=>({...p, conditions:p.conditions.filter(c=>c.id!==id)})); }
  function addMed() { setMedCard(p=>({...p, medications:[...p.medications,{ id:Date.now(), name:"", dose:"", note:"" }]})); }
  function updateMed(id, key, val) { setMedCard(p=>({...p, medications:p.medications.map(m=>m.id===id?{...m,[key]:val}:m)})); }
  function removeMed(id) { setMedCard(p=>({...p, medications:p.medications.filter(m=>m.id!==id)})); }

  const GRN = { main:"#8FBA90", dark:"#6A9A6C", light:"#EFF6EF", mid:"#B8D4B8", grad:"linear-gradient(135deg,#A8CCA8,#88B888)", card:"#F5FAF5" };
  const severityColor = { "輕微":"#7FBF95", "中度":"#E8B84B", "嚴重":"#E08080" };
  const allergyTypes = ["食物","藥物","環境","其他"];

  const latest = growthRecords[growthRecords.length-1];
  const prev = growthRecords.length >= 2 ? growthRecords[growthRecords.length-2] : null;

  function diff(cur, pre, key) {
    if (!pre) return null;
    const d = (parseFloat(cur[key]||0) - parseFloat(pre[key]||0));
    return d > 0 ? "+"+d.toFixed(1) : d.toFixed(1);
  }

  return (
    <Page title="健康記錄" onBack={onBack}>
      {/* Latest stats - green card */}
      {latest && (
        <div style={{ background:GRN.grad, borderRadius:20, padding:"18px 20px 20px", color:"white", marginBottom:14, boxShadow:"0 6px 20px rgba(136,184,136,0.35)" }}>
          <div style={{ fontSize:12, opacity:0.85, marginBottom:2 }}>📋 最新健康數據</div>
          <div style={{ fontSize:13, opacity:0.75, marginBottom:14 }}>📅 {latest.date}</div>
          <div style={{ display:"flex" }}>
            {[
              { label:"體重", val:latest.weight, unit:"kg", key:"weight" },
              { label:"身高", val:latest.height, unit:"cm", key:"height" },
              { label:"頭圍", val:latest.head,   unit:"cm", key:"head"   },
            ].map((item, idx)=>{
              const d = diff(latest, prev, item.key);
              return (
                <div key={item.key} style={{ flex:1, textAlign:"center", borderLeft:idx>0?"1px solid rgba(255,255,255,0.3)":undefined }}>
                  <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:3 }}>
                    <span style={{ fontSize:28, fontWeight:800 }}>{item.val}</span>
                    <span style={{ fontSize:13, opacity:0.85 }}>{item.unit}</span>
                  </div>
                  <div style={{ fontSize:11, opacity:0.8, marginBottom:6 }}>{item.label}</div>
                  {d && (
                    <div style={{ background:"rgba(255,255,255,0.22)", borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", gap:2 }}>
                      <span>比上次 {d}{item.unit}</span>
                      <span>{parseFloat(d)>0?"↑":"↓"}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab */}
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {[["growth","📏 生長"],["temp","🌡️ 體溫"],["vaccine","💉 疫苗"],["medcard","🏥 醫療卡"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"9px 0", borderRadius:14, border:"none", fontFamily:"inherit", background:tab===k?GRN.grad:C.card, color:tab===k?"white":C.sub, fontWeight:tab===k?800:500, fontSize:12, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {tab==="growth" && (<>
        {/* Sub-tab: 胎兒 / 出生 */}
        <div style={{ display:"flex", gap:6, marginBottom:14, background:"#EFF6EF", borderRadius:14, padding:4 }}>
          {[["fetal","🤰 胎兒"],["birth","👶 出生"]].map(([k,l])=>(
            <button key={k} onClick={()=>setGrowthSubTab(k)} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", fontFamily:"inherit", background:growthSubTab===k?GRN.grad:"transparent", color:growthSubTab===k?"white":GRN.dark, fontWeight:growthSubTab===k?800:500, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{l}</button>
          ))}
        </div>

        {/* ── 胎兒生長 ── */}
        {growthSubTab==="fetal" && (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>胎兒生長記錄</span>
            <button onClick={()=>setShowFetal(true)} style={{ background:GRN.grad, border:"none", borderRadius:12, padding:"8px 18px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增記錄</button>
          </div>
          {fetalRecords.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:28, fontSize:13 }}>還沒有胎兒生長記錄 🌿</div>}
          {fetalRecords.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>(
            <div key={r.id} style={{ background:C.card, borderRadius:18, padding:"16px", marginBottom:12, border:"1px solid #EFE2CA" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:800, color:C.text, fontSize:15 }}>{r.date}</div>
                  {r.weeks && <div style={{ fontSize:12, color:GRN.dark, fontWeight:700, marginTop:3, background:GRN.light, display:"inline-block", borderRadius:8, padding:"2px 10px" }}>第 {r.weeks} 週</div>}
                </div>
                <button onClick={()=>setFetalRecords(p=>p.filter(x=>x.id!==r.id))} style={{ background:"#FDEAE5", border:"none", borderRadius:10, padding:"6px 10px", color:"#E08080", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>🗑 刪除</button>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {[["EFW體重",r.efw,"g"],["BPD頭寬",r.bpd,"cm"],["AC腹圍",r.ac,"cm"],["FL大腿骨",r.fl,"cm"]].map(([lbl,val,unit])=>val ? (
                  <div key={lbl} style={{ background:GRN.light, borderRadius:10, padding:"6px 12px", minWidth:70 }}>
                    <div style={{ fontSize:10, color:GRN.dark, marginBottom:2 }}>{lbl}</div>
                    <div style={{ fontWeight:700, color:GRN.dark, fontSize:14 }}>{val}<span style={{ fontSize:11 }}> {unit}</span></div>
                  </div>
                ) : null)}
              </div>
            </div>
          ))}
          {showFetal && (
            <Modal title="新增胎兒生長記錄" onClose={()=>setShowFetal(false)} onSave={()=>{
              if(!fForm.date) return;
              const weeksStr = fForm.weeks ? (fForm.days ? `${fForm.weeks}w${fForm.days}d` : `${fForm.weeks}w`) : "";
              setFetalRecords(p=>[...p,{ id:Date.now(), ...fForm, weeks:weeksStr }]);
              setFForm({ date:"", weeks:"", days:"", efw:"", bpd:"", ac:"", fl:"" }); setShowFetal(false);
            }} color={GRN.grad}>
              <FLabel label="日期（產檢日）"><input type="date" value={fForm.date} onChange={e=>setFForm(p=>({...p,date:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
              <FLabel label="週數">
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="number" step="1" min="0" max="42" placeholder="24" value={fForm.weeks} onChange={e=>setFForm(p=>({...p,weeks:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid, flex:1 }}/>
                  <span style={{ color:GRN.dark, fontWeight:700, fontSize:14 }}>w</span>
                  <input type="number" step="1" min="0" max="6" placeholder="5" value={fForm.days||""} onChange={e=>setFForm(p=>({...p,days:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid, flex:1 }}/>
                  <span style={{ color:GRN.dark, fontWeight:700, fontSize:14 }}>d</span>
                </div>
                {(fForm.weeks||fForm.days) && <div style={{ fontSize:12, color:GRN.dark, marginTop:4, fontWeight:600 }}>📅 {fForm.weeks||"0"}w{fForm.days||"0"}d</div>}
              </FLabel>
              <FLabel label="EFW 估計體重 (g)"><input type="number" step="1" placeholder="600" value={fForm.efw} onChange={e=>setFForm(p=>({...p,efw:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
              <FLabel label="BPD 頭寬 (cm)"><input type="number" step="0.1" placeholder="6.2" value={fForm.bpd} onChange={e=>setFForm(p=>({...p,bpd:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
              <FLabel label="AC 腹圍 (cm)"><input type="number" step="0.1" placeholder="20.5" value={fForm.ac} onChange={e=>setFForm(p=>({...p,ac:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
              <FLabel label="FL 大腿骨 (cm)"><input type="number" step="0.1" placeholder="4.3" value={fForm.fl} onChange={e=>setFForm(p=>({...p,fl:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            </Modal>
          )}
        </>)}

        {/* ── 出生生長 ── */}
        {growthSubTab==="birth" && (<>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>出生生長記錄</span>
          <button onClick={()=>setShowGrowth(true)} style={{ background:GRN.grad, border:"none", borderRadius:12, padding:"8px 18px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增記錄</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:GRN.light, borderRadius:14, padding:"9px 14px", marginBottom:12, border:"1.5px solid "+GRN.mid }}>
          <span style={{ fontSize:15 }}>📅</span>
          <span style={{ fontSize:13, color:GRN.dark, fontWeight:600, flexShrink:0 }}>日期篩選</span>
          <input type="date" value={growthSearchDate} onChange={e=>setGrowthSearchDate(e.target.value)}
            style={{ flex:1, border:"none", background:"transparent", fontSize:14, fontFamily:"inherit", color:GRN.dark, outline:"none" }}/>
          {growthSearchDate && <button onClick={()=>setGrowthSearchDate("")}
            style={{ background:GRN.grad, border:"none", borderRadius:8, padding:"4px 12px", fontSize:12, color:"white", fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>全部</button>}
        </div>
        {(() => {
          const allSorted = growthRecords.slice().sort((a,b)=>a.date.localeCompare(b.date));
          const shown = growthSearchDate
            ? allSorted.filter(r => r.date === growthSearchDate)
            : [...allSorted].reverse();
          if (shown.length === 0) return <div style={{ textAlign:"center", color:C.warm3, padding:20, fontSize:13 }}>{growthSearchDate ? "此日期無記錄 🌿" : "還沒有生長記錄 🌿"}</div>;
          return shown.map(r => {
            const idx2 = allSorted.findIndex(x=>x.id===r.id);
            const prevR = idx2 > 0 ? allSorted[idx2-1] : null;
            return (
              <div key={r.id} style={{ background:C.card, borderRadius:18, padding:"16px", marginBottom:12, border:"1px solid #EFE2CA", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:60, height:60, borderRadius:16, background:GRN.light, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <ImgOrEmoji src={IMGS["小麥寶寶"]} style={{ width:50, height:50, objectFit:"contain" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, color:C.text, fontSize:15, marginBottom:4 }}>{r.date}</div>
                  {isBorn && (() => {
                    const birth = new Date(dueDateStr);
                    const rec = new Date(r.date);
                    if (rec < birth) return null;
                    let y = rec.getFullYear()-birth.getFullYear(), m = rec.getMonth()-birth.getMonth(), d2 = rec.getDate()-birth.getDate();
                    if (d2 < 0) { m--; d2 += new Date(rec.getFullYear(), rec.getMonth(), 0).getDate(); }
                    if (m < 0) { y--; m += 12; }
                    const totalDays = Math.floor((rec-birth)/86400000);
                    const label = y>0 ? `${y}歲${m}個月` : m>0 ? `${m}個月${d2}天` : `${totalDays}天`;
                    return <div style={{ fontSize:11, color:GRN.dark, marginBottom:8, fontWeight:600 }}>🎂 {label}</div>;
                  })()}
                  <div style={{ display:"flex", gap:12 }}>
                    {[["體重",r.weight,"kg","weight"],["身高",r.height,"cm","height"],["頭圍",r.head,"cm","head"]].map(([lbl,val,unit,key])=>{
                      const d = prevR ? (parseFloat(val||0)-parseFloat(prevR[key]||0)).toFixed(1) : null;
                      return (
                        <div key={key}>
                          <div style={{ fontSize:11, color:C.sub }}>{lbl}</div>
                          <div style={{ fontWeight:700, color:GRN.dark, fontSize:14 }}>{val}{unit}</div>
                          {d && parseFloat(d)!==0 && <div style={{ fontSize:10, color:parseFloat(d)>0?GRN.main:"#E08080" }}>{parseFloat(d)>0?"+":""}{d}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button onClick={()=>setGrowthRecords(p=>p.filter(x=>x.id!==r.id))} style={{ background:"#FDEAE5", border:"none", borderRadius:10, padding:"6px 10px", color:"#E08080", fontSize:11, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>🗑 刪除</button>
              </div>
            );
          });
        })()}
        {showGrowth && (
          <Modal title="新增生長記錄" onClose={()=>setShowGrowth(false)} onSave={()=>{
            if(!gForm.date) return;
            setGrowthRecords(p=>[...p,{ id:Date.now(), ...gForm, weight:parseFloat(gForm.weight)||0, height:parseFloat(gForm.height)||0, head:parseFloat(gForm.head)||0 }]);
            setGForm({ date:"", weight:"", height:"", head:"" }); setShowGrowth(false);
          }} color={GRN.grad}>
            <FLabel label="日期（記錄當天）"><input type="date" value={gForm.date} onChange={e=>setGForm(p=>({...p,date:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            {isBorn && gForm.date && (() => {
              const birth = new Date(dueDateStr);
              const rec = new Date(gForm.date);
              if (rec < birth) return <div style={{ fontSize:12, color:GRN.dark, padding:"4px 8px", background:GRN.light, borderRadius:8 }}>⚠️ 此日期早於出生日</div>;
              let y = rec.getFullYear()-birth.getFullYear(), m = rec.getMonth()-birth.getMonth(), d = rec.getDate()-birth.getDate();
              if (d < 0) { m--; d += new Date(rec.getFullYear(), rec.getMonth(), 0).getDate(); }
              if (m < 0) { y--; m += 12; }
              const totalDays = Math.floor((rec-birth)/86400000);
              const label = y>0 ? `${y} 歲 ${m} 個月 ${d} 天` : m>0 ? `${m} 個月 ${d} 天` : `${totalDays} 天`;
              return <div style={{ fontSize:12, color:"white", padding:"5px 10px", background:GRN.grad, borderRadius:8, fontWeight:700 }}>🎂 寶寶年齡：{label}</div>;
            })()}
            <FLabel label="體重 (kg)"><input type="number" step="0.1" placeholder="3.5" value={gForm.weight} onChange={e=>setGForm(p=>({...p,weight:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="身高 (cm)"><input type="number" step="0.5" placeholder="52" value={gForm.height} onChange={e=>setGForm(p=>({...p,height:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="頭圍 (cm)"><input type="number" step="0.5" placeholder="35" value={gForm.head} onChange={e=>setGForm(p=>({...p,head:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
          </Modal>
        )}
        </>)}
      </>)}

      {tab==="temp" && (<>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>體溫記錄</span>
          <button onClick={()=>setShowTemp(true)} style={{ background:GRN.grad, border:"none", borderRadius:12, padding:"8px 18px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>
        </div>
        {tempRecords.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:24 }}>還沒有體溫記錄 🌿</div>}
        {tempRecords.slice().reverse().map(r=>{
          const isHigh = parseFloat(r.temp) >= 38;
          const isMid  = parseFloat(r.temp) >= 37.5 && parseFloat(r.temp) < 38;
          const tempColor = isHigh?"#E08080":isMid?"#C8986A":GRN.dark;
          return (
            <div key={r.id} style={{ background:C.card, borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+(isHigh?"#F5D0D0":"#EFE2CA"), display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:isHigh?"#FDEAE5":isMid?"#FFF8E8":GRN.light, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🌡️</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:22, fontWeight:800, color:tempColor }}>{r.temp}</span>
                  <span style={{ fontSize:13, color:tempColor }}>°C</span>
                  {isHigh && <span style={{ background:"#F5D0D0", color:"#E08080", fontSize:11, fontWeight:700, borderRadius:8, padding:"2px 8px" }}>發燒</span>}
                  {isMid  && <span style={{ background:"#FFF0D0", color:"#C8986A", fontSize:11, fontWeight:700, borderRadius:8, padding:"2px 8px" }}>注意</span>}
                </div>
                <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{r.date} {r.time}{r.note?" - "+r.note:""}</div>
              </div>
              <button onClick={()=>setTempRecords(p=>p.filter(x=>x.id!==r.id))} style={{ background:"none", border:"none", color:C.warm3, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>刪除</button>
            </div>
          );
        })}
        {showTemp && (
          <Modal title="新增體溫記錄" onClose={()=>setShowTemp(false)} onSave={()=>{
            if(!tForm.temp||!tForm.date) return;
            setTempRecords(p=>[...p,{ id:Date.now(), ...tForm, temp:parseFloat(tForm.temp) }]);
            setTForm({ date:new Date().toISOString().slice(0,10), time:"", temp:"", note:"" }); setShowTemp(false);
          }} color={GRN.grad}>
            <FLabel label="日期"><input type="date" value={tForm.date} onChange={e=>setTForm(p=>({...p,date:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="時間"><input type="time" value={tForm.time} onChange={e=>setTForm(p=>({...p,time:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="體溫 (°C)"><input type="number" step="0.1" placeholder="36.5" value={tForm.temp} onChange={e=>setTForm(p=>({...p,temp:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="備註"><input type="text" placeholder="例：退燒後" value={tForm.note} onChange={e=>setTForm(p=>({...p,note:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
          </Modal>
        )}
      </>)}


      {tab==="vaccine" && (<>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>疫苗接種</span>
          <button onClick={()=>setShowVaccine(true)} style={{ background:GRN.grad, border:"none", borderRadius:12, padding:"8px 18px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 3px 10px #6A9E6C44" }}>+ 新增記錄</button>
        </div>
        {vaccineRecords.slice().reverse().map(r=>(
          <RecordRow key={r.id} icon="💉" title={r.name} sub={r.date+(r.hospital?" - "+r.hospital:"")+(r.note?" - "+r.note:"")} right="完成" color={GRN.dark} onDelete={()=>setVaccineRecords(p=>p.filter(x=>x.id!==r.id))}/>
        ))}
        {vaccineRecords.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:28, fontSize:14 }}>尚無疫苗記錄 🌿</div>}
        {showVaccine && (
          <Modal title="新增疫苗記錄" onClose={()=>setShowVaccine(false)} onSave={()=>{
            if(!vForm.date||!vForm.name) return;
            setVaccineRecords(p=>[...p,{ id:Date.now(), ...vForm }]);
            setVForm({ date:"", name:"", hospital:"", note:"" }); setShowVaccine(false);
          }} color={GRN.grad}>
            <FLabel label="日期"><input type="date" value={vForm.date} onChange={e=>setVForm(p=>({...p,date:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="疫苗名稱"><input type="text" placeholder="例：B型肝炎第一劑" value={vForm.name} onChange={e=>setVForm(p=>({...p,name:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="接種醫院"><input type="text" placeholder="選填" value={vForm.hospital} onChange={e=>setVForm(p=>({...p,hospital:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
            <FLabel label="備註"><input type="text" placeholder="選填" value={vForm.note} onChange={e=>setVForm(p=>({...p,note:e.target.value}))} style={{ ...IS2, borderColor:GRN.mid }}/></FLabel>
          </Modal>
        )}
      </>)}

      {tab==="medcard" && (<>
        {/* Basic Info */}
        <div style={{ background:GRN.grad, borderRadius:18, padding:"16px 18px", color:"white", marginBottom:14, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:40 }}>🏥</div>
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>寶寶醫療卡</div>
            <div style={{ fontSize:12, opacity:0.85, marginTop:2 }}>過敏史・特殊狀況・就醫資訊</div>
          </div>
        </div>

        {/* Blood type + hospital */}
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid #EFE2CA" }}>
          <div style={{ fontWeight:800, color:C.text, fontSize:14, marginBottom:12 }}>基本資訊</div>
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:C.sub, marginBottom:4 }}>血型</div>
              <select value={medCard.bloodType} onChange={e=>setMedCard(p=>({...p,bloodType:e.target.value}))} style={{ ...IS2, width:"100%" }}>
                <option value="">未知</option>
                {["A型","B型","O型","AB型","A型Rh+","A型Rh-","B型Rh+","B型Rh-","O型Rh+","O型Rh-","AB型Rh+","AB型Rh-"].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <FLabel label="固定就診醫院"><input type="text" placeholder="例：台大兒童醫院" value={medCard.hospital} onChange={e=>setMedCard(p=>({...p,hospital:e.target.value}))} style={IS2}/></FLabel>
          <div style={{ marginTop:10 }}>
            <FLabel label="主治醫師"><input type="text" placeholder="例：陳醫師" value={medCard.doctorName} onChange={e=>setMedCard(p=>({...p,doctorName:e.target.value}))} style={IS2}/></FLabel>
          </div>
        </div>

        {/* Emergency Contact */}
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid #EFE2CA" }}>
          <div style={{ fontWeight:800, color:C.text, fontSize:14, marginBottom:12 }}>緊急聯絡人</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <FLabel label="姓名"><input type="text" placeholder="例：王小明" value={medCard.emergencyContact.name} onChange={e=>setMedCard(p=>({...p,emergencyContact:{...p.emergencyContact,name:e.target.value}}))} style={IS2}/></FLabel>
            <FLabel label="關係"><input type="text" placeholder="例：爸爸" value={medCard.emergencyContact.relation} onChange={e=>setMedCard(p=>({...p,emergencyContact:{...p.emergencyContact,relation:e.target.value}}))} style={IS2}/></FLabel>
            <FLabel label="電話"><input type="tel" placeholder="0912-345-678" value={medCard.emergencyContact.phone} onChange={e=>setMedCard(p=>({...p,emergencyContact:{...p.emergencyContact,phone:e.target.value}}))} style={IS2}/></FLabel>
          </div>
        </div>

        {/* Allergies */}
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid #EFE2CA" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontWeight:800, color:C.text, fontSize:14 }}>⚠️ 過敏史</div>
            <button onClick={addAllergy} style={{ background:"linear-gradient(135deg,#E8A0A6,#E08080)", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>
          </div>
          {medCard.allergies.length===0 && <div style={{ textAlign:"center", color:C.warm3, fontSize:13, padding:8 }}>尚無過敏記錄 🌿</div>}
          {medCard.allergies.map(a=>(
            <div key={a.id} style={{ background:"#FFF5F5", borderRadius:12, padding:12, marginBottom:10, border:"1px solid #F5D0D0" }}>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                {allergyTypes.map(t=>(
                  <button key={t} onClick={()=>updateAllergy(a.id,"type",t)} style={{ flex:1, padding:"5px 0", borderRadius:8, border:"none", background:a.type===t?"#E08080":"#F5D0D0", color:a.type===t?"white":"#C06060", fontWeight:600, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>{t}</button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div><div style={{ fontSize:11, color:"#C06060", marginBottom:3 }}>過敏原</div><input type="text" placeholder="例：花生、青黴素" value={a.item} onChange={e=>updateAllergy(a.id,"item",e.target.value)} style={{ ...IS2, borderColor:"#F5D0D0" }}/></div>
                <div><div style={{ fontSize:11, color:"#C06060", marginBottom:3 }}>反應症狀</div><input type="text" placeholder="例：起疹子、呼吸困難" value={a.reaction} onChange={e=>updateAllergy(a.id,"reaction",e.target.value)} style={{ ...IS2, borderColor:"#F5D0D0" }}/></div>
                <div>
                  <div style={{ fontSize:11, color:"#C06060", marginBottom:3 }}>嚴重程度</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["輕微","中度","嚴重"].map(s=>(
                      <button key={s} onClick={()=>updateAllergy(a.id,"severity",s)} style={{ flex:1, padding:"6px 0", borderRadius:8, border:"none", background:a.severity===s?severityColor[s]:"#F5D0D0", color:a.severity===s?"white":"#C06060", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={()=>removeAllergy(a.id)} style={{ background:"none", border:"none", color:"#C08080", fontSize:12, cursor:"pointer", fontFamily:"inherit", marginTop:6 }}>- 刪除此筆</button>
            </div>
          ))}
        </div>

        {/* Special Conditions */}
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid #EFE2CA" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontWeight:800, color:C.text, fontSize:14 }}>🔔 特殊狀況</div>
            <button onClick={addCondition} style={{ background:"linear-gradient(135deg,#E0B87A,#C8986A)", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>
          </div>
          {medCard.conditions.length===0 && <div style={{ textAlign:"center", color:C.warm3, fontSize:13, padding:8 }}>尚無特殊狀況記錄 🌿</div>}
          {medCard.conditions.map(c=>(
            <div key={c.id} style={{ background:"#FFF8EC", borderRadius:12, padding:12, marginBottom:10, border:"1px solid #F5E0B0" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div><div style={{ fontSize:11, color:"#A07030", marginBottom:3 }}>狀況名稱</div><input type="text" placeholder="例：早產兒、心臟雜音" value={c.name} onChange={e=>updateCondition(c.id,"name",e.target.value)} style={{ ...IS2, borderColor:"#F5E0B0" }}/></div>
                <div><div style={{ fontSize:11, color:"#A07030", marginBottom:3 }}>備註說明</div><textarea placeholder="例：需定期追蹤，每3個月回診" value={c.note} onChange={e=>updateCondition(c.id,"note",e.target.value)} style={{ ...IS2, borderColor:"#F5E0B0", height:60, resize:"none" }}/></div>
              </div>
              <button onClick={()=>removeCondition(c.id)} style={{ background:"none", border:"none", color:"#C08040", fontSize:12, cursor:"pointer", fontFamily:"inherit", marginTop:6 }}>- 刪除此筆</button>
            </div>
          ))}
        </div>

        {/* Medications */}
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid #EFE2CA" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontWeight:800, color:C.text, fontSize:14 }}>💊 常用藥物</div>
            <button onClick={addMed} style={{ background:"linear-gradient(135deg,#8EC2D8,#7AAEC4)", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>
          </div>
          {medCard.medications.length===0 && <div style={{ textAlign:"center", color:C.warm3, fontSize:13, padding:8 }}>尚無藥物記錄 🌿</div>}
          {medCard.medications.map(m=>(
            <div key={m.id} style={{ background:"#F0F8FF", borderRadius:12, padding:12, marginBottom:10, border:"1px solid #C8DFF0" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div><div style={{ fontSize:11, color:"#5080A0", marginBottom:3 }}>藥物名稱</div><input type="text" placeholder="例：維他命D滴劑" value={m.name} onChange={e=>updateMed(m.id,"name",e.target.value)} style={{ ...IS2, borderColor:"#C8DFF0" }}/></div>
                <div><div style={{ fontSize:11, color:"#5080A0", marginBottom:3 }}>劑量</div><input type="text" placeholder="例：每日1滴" value={m.dose} onChange={e=>updateMed(m.id,"dose",e.target.value)} style={{ ...IS2, borderColor:"#C8DFF0" }}/></div>
                <div><div style={{ fontSize:11, color:"#5080A0", marginBottom:3 }}>備註</div><input type="text" placeholder="選填" value={m.note} onChange={e=>updateMed(m.id,"note",e.target.value)} style={{ ...IS2, borderColor:"#C8DFF0" }}/></div>
              </div>
              <button onClick={()=>removeMed(m.id)} style={{ background:"none", border:"none", color:"#608090", fontSize:12, cursor:"pointer", fontFamily:"inherit", marginTop:6 }}>- 刪除此筆</button>
            </div>
          ))}
        </div>

        {/* General note */}
        <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid #EFE2CA" }}>
          <div style={{ fontWeight:800, color:C.text, fontSize:14, marginBottom:10 }}>📝 其他備註</div>
          <textarea placeholder="其他需要注意的事項..." value={medCard.note} onChange={e=>setMedCard(p=>({...p,note:e.target.value}))} style={{ ...IS2, height:80, resize:"none" }}/>
        </div>
      </>)}
    </Page>
  );
}

// ── BADGE PAGE ───────────────────────────────────────────────
// ── ACHIEVEMENT PAGE ─────────────────────────────────────────
function AchievementPage({ onBack, tasks, setTasks, otherTasks, setOtherTasks, points, setPoints, rewards, setRewards, badges, setBadges, timeline, setTimeline }) {
  const [tab, setTab] = useState("tasks");
  const todayStr = new Date().toISOString().slice(0,10);
  const [todayDone, setTodayDone] = useState({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ name:"", category:"日常", points:"10", taskType:"daily" });
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name:"", points:"100", icon:"🎁" });

  const [showAddBadge, setShowAddBadge] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ name:"", icon:"🏅", desc:"", condition:"points", target:"100" });
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Edit mode states
  const [editTasks, setEditTasks] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [editOtherTasks, setEditOtherTasks] = useState(false);
  const [selectedOtherTasks, setSelectedOtherTasks] = useState(new Set());
  const [editRewards, setEditRewards] = useState(false);
  const [selectedRewards, setSelectedRewards] = useState(new Set());
  const [editBadges, setEditBadges] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState(new Set());

  const totalTasksDone = tasks.reduce((s,t)=>s+t.count,0) + otherTasks.reduce((s,t)=>s+t.count,0);

  function checkBadges(newPoints, newTaskCount) {
    setBadges(prev => prev.map(b => {
      if (b.unlocked) return b;
      const val = b.condition === "points" ? newPoints : newTaskCount;
      if (val >= b.target) {
        const today = new Date().toISOString().slice(0,10);
        setTimeline(t => [{ id:Date.now(), type:"badge", text:"解鎖成就徽章："+b.name, time:new Date().toLocaleString("zh-TW") }, ...t]);
        return { ...b, unlocked:true, date:today };
      }
      return b;
    }));
  }

  function doTask(task) {
    if (todayDone[task.id] === todayStr) return;
    const newPoints = points + task.points;
    const newCount = totalTasksDone + 1;
    setPoints(newPoints);
    setTasks(prev => prev.map(t => t.id===task.id ? {...t, count:t.count+1} : t));
    setTodayDone(prev => ({...prev, [task.id]: todayStr}));
    setTimeline(prev => [{ id:Date.now(), type:"task", text:'完成任務「'+task.name+'」，獲得 '+task.points+' 點數', time:new Date().toLocaleString("zh-TW") }, ...prev]);
    checkBadges(newPoints, newCount);
  }

  function doOtherTask(task) {
    const newPoints = points + task.points;
    const newCount = totalTasksDone + 1;
    setPoints(newPoints);
    setOtherTasks(prev => prev.map(t => t.id===task.id ? {...t, count:t.count+1} : t));
    setTimeline(prev => [{ id:Date.now(), type:"task", text:'完成任務「'+task.name+'」，獲得 '+task.points+' 點數', time:new Date().toLocaleString("zh-TW") }, ...prev]);
    checkBadges(newPoints, newCount);
  }

  function doRedeem(reward) {
    if (points < reward.points) return;
    setPoints(p => p - reward.points);
    setTimeline(prev => [{ id:Date.now(), type:"redeem", text:'兌換了獎勵：'+reward.name, time:new Date().toLocaleString("zh-TW") }, ...prev]);
  }

  const catColor = { "健康":"#7AAEC4","親子":"#D4848A","運動":"#7FBF95","日常":"#C8986A","其他":"#AF9273" };
  const tabList = [["tasks","📝 任務"],["redeem","🎁 兌換"],["mybadge","🏅 徽章"],["history","📜 時間軸"]];

  return (
    <Page title="成就" onBack={onBack}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", borderRadius:18, padding:"14px 18px", color:"white", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:12, opacity:0.8 }}>累積點數</div>
          <div style={{ fontSize:30, fontWeight:800 }}>💰 {points.toLocaleString()}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:12, opacity:0.8 }}>完成任務</div>
          <div style={{ fontSize:20, fontWeight:800 }}>{totalTasksDone} 次</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
        {tabList.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flexShrink:0, padding:"8px 14px", borderRadius:20, border:"none", fontFamily:"inherit", background:tab===k?"linear-gradient(135deg,#C8986A,#B8845A)":C.card, color:tab===k?"white":C.sub, fontWeight:tab===k?800:500, fontSize:13, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* ── TASKS ── */}
      {tab==="tasks" && (<>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>每日任務</span>
          <div style={{ display:"flex", gap:8 }}>
            {editTasks
              ? <button onClick={()=>{ setTasks(p=>p.filter(t=>!selectedTasks.has(t.id))); setSelectedTasks(new Set()); setEditTasks(false); }} style={{ background:"#E08080", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>刪除({selectedTasks.size})</button>
              : null}
            <button onClick={()=>{ setEditTasks(e=>!e); setSelectedTasks(new Set()); }} style={{ background:editTasks?"#EFE2CA":"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:editTasks?C.sub:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{editTasks?"完成":"編輯"}</button>
            {!editTasks && <button onClick={()=>setShowAddTask(true)} style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>}
          </div>
        </div>
        {tasks.map(t=>(
          <div key={t.id} onClick={()=>{ if(editTasks){ setSelectedTasks(prev=>{ const n=new Set(prev); n.has(t.id)?n.delete(t.id):n.add(t.id); return n; }); }}} style={{ background:selectedTasks.has(t.id)?"#FDEAE5":C.card, borderRadius:16, padding:"14px 16px", marginBottom:10, border:selectedTasks.has(t.id)?"1px solid #E08080":"1px solid #EFE2CA", display:"flex", alignItems:"center", gap:12, cursor:editTasks?"pointer":"default", transition:"all 0.15s" }}>
            {editTasks && (
              <div style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(selectedTasks.has(t.id)?"#E08080":"#CFBBA2"), background:selectedTasks.has(t.id)?"#E08080":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {selectedTasks.has(t.id) && <span style={{ color:"white", fontSize:14, fontWeight:800 }}>✓</span>}
              </div>
            )}
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <span style={{ background:(catColor[t.category]||"#C8986A")+"33", color:catColor[t.category]||"#C8986A", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8 }}>{t.category}</span>
              </div>
              <div style={{ fontWeight:700, color:C.text, fontSize:15, marginBottom:2 }}>{t.name}</div>
              <div style={{ fontSize:12, color:C.sub }}>💰 {t.points} 點　累計：{t.count}次</div>
            </div>
            {!editTasks && <button onClick={()=>doTask(t)} disabled={todayDone[t.id]===todayStr} style={{ background:todayDone[t.id]===todayStr?"#CFBBA2":"linear-gradient(135deg,#7FBF95,#5A9A6F)", border:"none", borderRadius:14, padding:"10px 18px", color:"white", fontWeight:800, fontSize:14, cursor:todayDone[t.id]===todayStr?"default":"pointer", fontFamily:"inherit", flexShrink:0 }}>{todayDone[t.id]===todayStr?"已完成":"打卡"}</button>}
          </div>
        ))}
        {showAddTask && (
          <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:430 }}>
              <div style={{ fontWeight:800, color:C.text, fontSize:17, marginBottom:16 }}>新增任務</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <FLabel label="加入哪個清單">
                  <div style={{ display:"flex", gap:8 }}>
                    {[["daily","📅 每日任務"],["other","📌 其他任務"]].map(([k,l])=>(
                      <button key={k} onClick={()=>setTaskForm(p=>({...p,taskType:k}))} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:taskForm.taskType===k?"#C8986A":"#EFE2CA", color:taskForm.taskType===k?"white":C.sub, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{l}</button>
                    ))}
                  </div>
                </FLabel>
                <FLabel label="任務名稱"><input type="text" placeholder="例：每天喝水2000ml" value={taskForm.name} onChange={e=>setTaskForm(p=>({...p,name:e.target.value}))} style={IS2}/></FLabel>
                <FLabel label="分類">
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {["日常","健康","親子","運動","其他"].map(c=>(
                      <button key={c} onClick={()=>setTaskForm(p=>({...p,category:c}))} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:taskForm.category===c?"#C8986A":"#EFE2CA", color:taskForm.category===c?"white":C.sub, fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{c}</button>
                    ))}
                  </div>
                </FLabel>
                <FLabel label="點數"><input type="number" placeholder="10" value={taskForm.points} onChange={e=>setTaskForm(p=>({...p,points:e.target.value}))} style={IS2}/></FLabel>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button onClick={()=>setShowAddTask(false)} style={{ flex:1, padding:12, background:C.warm4, border:"none", borderRadius:12, color:C.sub, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
                <button onClick={()=>{
                  if(!taskForm.name) return;
                  const newTask = { id:Date.now(), name:taskForm.name, category:taskForm.category, points:parseInt(taskForm.points)||10, count:0 };
                  if(taskForm.taskType==="other") setOtherTasks(p=>[...p, newTask]);
                  else setTasks(p=>[...p, newTask]);
                  setTaskForm({ name:"", category:"日常", points:"10", taskType:"daily" }); setShowAddTask(false);
                }} style={{ flex:2, padding:12, background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>新增</button>
              </div>
            </div>
          </div>
        )}

        {/* ── OTHER TASKS ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, marginTop:6 }}>
          <div>
            <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>其他任務</span>
            <span style={{ fontSize:11, color:C.sub, marginLeft:8 }}>可多次打卡，累計不重置</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {editOtherTasks
              ? <button onClick={()=>{ setOtherTasks(p=>p.filter(t=>!selectedOtherTasks.has(t.id))); setSelectedOtherTasks(new Set()); setEditOtherTasks(false); }} style={{ background:"#E08080", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>刪除({selectedOtherTasks.size})</button>
              : null}
            <button onClick={()=>{ setEditOtherTasks(e=>!e); setSelectedOtherTasks(new Set()); }} style={{ background:editOtherTasks?"#EFE2CA":"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:editOtherTasks?C.sub:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{editOtherTasks?"完成":"編輯"}</button>
          </div>
        </div>
        {otherTasks.map(t=>(
          <div key={t.id} onClick={()=>{ if(editOtherTasks){ setSelectedOtherTasks(prev=>{ const n=new Set(prev); n.has(t.id)?n.delete(t.id):n.add(t.id); return n; }); }}} style={{ background:selectedOtherTasks.has(t.id)?"#FDEAE5":C.card, borderRadius:16, padding:"14px 16px", marginBottom:10, border:selectedOtherTasks.has(t.id)?"1px solid #E08080":"1px solid #EFE2CA", display:"flex", alignItems:"center", gap:12, cursor:editOtherTasks?"pointer":"default", transition:"all 0.15s" }}>
            {editOtherTasks && (
              <div style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(selectedOtherTasks.has(t.id)?"#E08080":"#CFBBA2"), background:selectedOtherTasks.has(t.id)?"#E08080":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {selectedOtherTasks.has(t.id) && <span style={{ color:"white", fontSize:14, fontWeight:800 }}>✓</span>}
              </div>
            )}
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <span style={{ background:(catColor[t.category]||"#C8986A")+"33", color:catColor[t.category]||"#C8986A", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8 }}>{t.category}</span>
                <span style={{ background:"#E8F3F8", color:"#7AAEC4", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:8 }}>累積</span>
              </div>
              <div style={{ fontWeight:700, color:C.text, fontSize:15, marginBottom:2 }}>{t.name}</div>
              <div style={{ fontSize:12, color:C.sub }}>💰 {t.points} 點　已完成：{t.count}次</div>
            </div>
            {!editOtherTasks && <button onClick={()=>doOtherTask(t)} style={{ background:"linear-gradient(135deg,#7AAEC4,#5A8EB4)", border:"none", borderRadius:14, padding:"10px 18px", color:"white", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>打卡</button>}
          </div>
        ))}
        {otherTasks.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:16, fontSize:13 }}>還沒有其他任務 🌿</div>}
      </>)}

      {/* ── REDEEM ── */}
      {tab==="redeem" && (<>
        <div style={{ background:"#FFF8E8", borderRadius:14, padding:"10px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", border:"1px solid #F6D387" }}>
          <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>目前點數</span>
          <span style={{ fontSize:16, fontWeight:800, color:"#C8986A" }}>💰 {points.toLocaleString()} 點</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>獎勵清單</span>
          <div style={{ display:"flex", gap:8 }}>
            {editRewards
              ? <button onClick={()=>{ setRewards(p=>p.filter(r=>!selectedRewards.has(r.id))); setSelectedRewards(new Set()); setEditRewards(false); }} style={{ background:"#E08080", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>刪除({selectedRewards.size})</button>
              : null}
            <button onClick={()=>{ setEditRewards(e=>!e); setSelectedRewards(new Set()); }} style={{ background:editRewards?"#EFE2CA":"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:editRewards?C.sub:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{editRewards?"完成":"編輯"}</button>
            {!editRewards && <button onClick={()=>setShowAddReward(true)} style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>}
          </div>
        </div>
        {rewards.map(r=>{
          const canRedeem = points >= r.points;
          return (
            <div key={r.id} onClick={()=>{ if(editRewards){ setSelectedRewards(prev=>{ const n=new Set(prev); n.has(r.id)?n.delete(r.id):n.add(r.id); return n; }); }}} style={{ background:selectedRewards.has(r.id)?"#FDEAE5":C.card, borderRadius:16, padding:"14px 16px", marginBottom:10, border:selectedRewards.has(r.id)?"1px solid #E08080":"1px solid #EFE2CA", display:"flex", alignItems:"center", gap:12, cursor:editRewards?"pointer":"default", transition:"all 0.15s" }}>
              {editRewards && (
                <div style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(selectedRewards.has(r.id)?"#E08080":"#CFBBA2"), background:selectedRewards.has(r.id)?"#E08080":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {selectedRewards.has(r.id) && <span style={{ color:"white", fontSize:14, fontWeight:800 }}>✓</span>}
                </div>
              )}
              <div style={{ fontSize:32, flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:C.text, fontSize:15 }}>{r.name}</div>
                <div style={{ fontSize:12, color:canRedeem?"#C8986A":C.warm3, fontWeight:600, marginTop:2 }}>💰 {r.points} 點數</div>
              </div>
              {!editRewards && <button onClick={()=>doRedeem(r)} disabled={!canRedeem} style={{ background:canRedeem?"linear-gradient(135deg,#F6D387,#E8C060)":C.warm4, border:"none", borderRadius:14, padding:"10px 16px", color:canRedeem?C.warm1:C.warm3, fontWeight:800, fontSize:13, cursor:canRedeem?"pointer":"default", fontFamily:"inherit", flexShrink:0 }}>{canRedeem?"兌換":"不足"}</button>}
            </div>
          );
        })}
        {showAddReward && (
          <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:430 }}>
              <div style={{ fontWeight:800, color:C.text, fontSize:17, marginBottom:16 }}>新增獎勵</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <FLabel label="獎勵名稱"><input type="text" placeholder="例：吃大餐一次" value={rewardForm.name} onChange={e=>setRewardForm(p=>({...p,name:e.target.value}))} style={IS2}/></FLabel>
                <FLabel label="圖示 Emoji"><input type="text" placeholder="🎁" value={rewardForm.icon} onChange={e=>setRewardForm(p=>({...p,icon:e.target.value}))} style={IS2}/></FLabel>
                <FLabel label="所需點數"><input type="number" placeholder="100" value={rewardForm.points} onChange={e=>setRewardForm(p=>({...p,points:e.target.value}))} style={IS2}/></FLabel>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button onClick={()=>setShowAddReward(false)} style={{ flex:1, padding:12, background:C.warm4, border:"none", borderRadius:12, color:C.sub, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
                <button onClick={()=>{
                  if(!rewardForm.name) return;
                  setRewards(p=>[...p,{ id:Date.now(), ...rewardForm, points:parseInt(rewardForm.points)||100 }]);
                  setRewardForm({ name:"", points:"100", icon:"🎁" }); setShowAddReward(false);
                }} style={{ flex:2, padding:12, background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>新增</button>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* ── BADGES ── */}
      {tab==="mybadge" && (<>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontWeight:800, color:C.text, fontSize:15 }}>成就徽章 {badges.filter(b=>b.unlocked).length}/{badges.length}</span>
          <div style={{ display:"flex", gap:8 }}>
            {editBadges
              ? <button onClick={()=>{ setBadges(p=>p.filter(b=>!selectedBadges.has(b.id))); setSelectedBadges(new Set()); setEditBadges(false); }} style={{ background:"#E08080", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>刪除({selectedBadges.size})</button>
              : null}
            <button onClick={()=>{ setEditBadges(e=>!e); setSelectedBadges(new Set()); }} style={{ background:editBadges?"#EFE2CA":"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:editBadges?C.sub:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{editBadges?"完成":"編輯"}</button>
            {!editBadges && <button onClick={()=>setShowAddBadge(true)} style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"5px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ 新增</button>}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {badges.map(b=>{
            const progress = b.condition==="points" ? Math.min(points/b.target,1) : Math.min(totalTasksDone/b.target,1);
            const current = b.condition==="points" ? points : totalTasksDone;
            const isSelected = selectedBadges.has(b.id);
            return (
              <div key={b.id} onClick={()=>{ if(editBadges){ setSelectedBadges(prev=>{ const n=new Set(prev); n.has(b.id)?n.delete(b.id):n.add(b.id); return n; }); } else { setSelectedBadge(b); }}} style={{ background:isSelected?"#FDEAE5":b.unlocked?"linear-gradient(135deg,#F6D387,#E8C060)":C.card, borderRadius:18, padding:"16px 12px", border:isSelected?"2px solid #E08080":b.unlocked?"2px solid #E8C060":"1px solid #EFE2CA", cursor:"pointer", textAlign:"center", boxShadow:b.unlocked&&!isSelected?"0 4px 16px #E8C06055":"none", position:"relative", overflow:"hidden" }}>
                {editBadges && (
                  <div style={{ position:"absolute", top:8, left:8, width:20, height:20, borderRadius:5, border:"2px solid "+(isSelected?"#E08080":"#CFBBA2"), background:isSelected?"#E08080":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isSelected && <span style={{ color:"white", fontSize:12, fontWeight:800 }}>✓</span>}
                  </div>
                )}
                {b.unlocked && !editBadges && <div style={{ position:"absolute", top:8, right:8, fontSize:12, fontWeight:700, color:C.warm1 }}>✓</div>}
                <div style={{ fontSize:36, marginBottom:8, opacity:b.unlocked?1:0.4 }}>{b.icon}</div>
                <div style={{ fontWeight:800, fontSize:13, color:b.unlocked?C.warm1:C.text, marginBottom:4 }}>{b.name}</div>
                <div style={{ fontSize:11, color:C.sub, marginBottom:8, lineHeight:1.4 }}>{b.desc}</div>
                {!b.unlocked && (
                  <>
                    <div style={{ background:"#EFE2CA", borderRadius:8, height:6, overflow:"hidden", marginBottom:4 }}>
                      <div style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", height:"100%", width:(progress*100)+"%", borderRadius:8, transition:"width 0.4s" }}/>
                    </div>
                    <div style={{ fontSize:10, color:C.sub }}>{current} / {b.target} {b.condition==="points"?"點":"次"}</div>
                  </>
                )}
                {b.unlocked && b.date && <div style={{ fontSize:10, color:C.warm1, fontWeight:600 }}>達成 {b.date}</div>}
              </div>
            );
          })}
        </div>

        {selectedBadge && (
          <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ background:C.card, borderRadius:24, padding:28, width:300, textAlign:"center" }}>
              <div style={{ fontSize:56, marginBottom:8 }}>{selectedBadge.icon}</div>
              <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:6 }}>{selectedBadge.name}</div>
              <div style={{ fontSize:13, color:C.sub, marginBottom:12, lineHeight:1.6 }}>{selectedBadge.desc}</div>
              <div style={{ background:C.warm4, borderRadius:12, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.text }}>
                條件：{selectedBadge.condition==="points"?"累積點數":"完成任務次數"} 達到 <strong>{selectedBadge.target}</strong> {selectedBadge.condition==="points"?"點":"次"}
              </div>
              {selectedBadge.unlocked && <div style={{ color:"#4A9A6A", fontWeight:800, marginBottom:12 }}>🎉 已解鎖！達成於 {selectedBadge.date}</div>}
              <button onClick={()=>setSelectedBadge(null)} style={{ width:"100%", padding:12, background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>關閉</button>
            </div>
          </div>
        )}

        {showAddBadge && (
          <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:430 }}>
              <div style={{ fontWeight:800, color:C.text, fontSize:17, marginBottom:16 }}>新增徽章</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <FLabel label="圖示 Emoji"><input type="text" placeholder="🏅" value={badgeForm.icon} onChange={e=>setBadgeForm(p=>({...p,icon:e.target.value}))} style={IS2}/></FLabel>
                <FLabel label="徽章名稱"><input type="text" placeholder="例：點數達人" value={badgeForm.name} onChange={e=>setBadgeForm(p=>({...p,name:e.target.value}))} style={IS2}/></FLabel>
                <FLabel label="描述"><input type="text" placeholder="例：累積獲得500點" value={badgeForm.desc} onChange={e=>setBadgeForm(p=>({...p,desc:e.target.value}))} style={IS2}/></FLabel>
                <FLabel label="解鎖條件">
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    {[["points","累積點數"],["tasks","完成任務次數"]].map(([k,l])=>(
                      <button key={k} onClick={()=>setBadgeForm(p=>({...p,condition:k}))} style={{ flex:1, padding:"8px 0", borderRadius:10, border:"none", background:badgeForm.condition===k?"#C8986A":"#EFE2CA", color:badgeForm.condition===k?"white":C.sub, fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>{l}</button>
                    ))}
                  </div>
                  <input type="number" placeholder="需達到的數值" value={badgeForm.target} onChange={e=>setBadgeForm(p=>({...p,target:e.target.value}))} style={IS2}/>
                </FLabel>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button onClick={()=>setShowAddBadge(false)} style={{ flex:1, padding:12, background:C.warm4, border:"none", borderRadius:12, color:C.sub, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
                <button onClick={()=>{
                  if(!badgeForm.name) return;
                  setBadges(p=>[...p,{ id:"custom_"+Date.now(), ...badgeForm, target:parseInt(badgeForm.target)||100, unlocked:false, date:null }]);
                  setBadgeForm({ name:"", icon:"🏅", desc:"", condition:"points", target:"100" }); setShowAddBadge(false);
                }} style={{ flex:2, padding:12, background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>新增</button>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* ── TIMELINE ── */}
      {tab==="history" && (<>
        <div style={{ fontWeight:800, color:C.text, fontSize:15, marginBottom:12 }}>時間軸</div>
        {timeline.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:32 }}>還沒有任何記錄 🌿</div>}
        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", left:22, top:0, bottom:0, width:2, background:"#EFE2CA", borderRadius:2 }}/>
          {timeline.map((item,i)=>{
            const typeIcon = { task:"💰", redeem:"🎁", badge:"🏅" };
            const typeBg = { task:"#FFF8E8", redeem:"#FDEAE5", badge:"#F9EDD9" };
            return (
              <div key={item.id} style={{ display:"flex", gap:12, marginBottom:16, position:"relative" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:typeBg[item.type]||"#F9EDD9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, border:"2px solid #EFE2CA", zIndex:1 }}>{typeIcon[item.type]}</div>
                <div style={{ flex:1, background:C.card, borderRadius:14, padding:"10px 14px", border:"1px solid #EFE2CA" }}>
                  <div style={{ fontSize:13, color:C.text, fontWeight:600, lineHeight:1.5 }}>{item.text}</div>
                  <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>{item.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </>)}
    </Page>
  );
}


const MENU = [
  { key:"expense", label:"記帳", imgKey:"記帳", bg:"#F9EDD9" },
  { key:"餵養",    label:"餵養", imgKey:"奶瓶", bg:"#FDEAE5" },
  { key:"尿布",    label:"尿布", imgKey:"尿布", bg:"#E8F3F8" },
  { key:"睡眠",    label:"睡眠", imgKey:"睡眠", bg:"#EDE8F5" },
  { key:"健康",    label:"健康", imgKey:"健康", bg:"#E8F5E8" },
  { key:"badge",  label:"成就", imgKey:"日記", bg:"#FDF8E0" },
];
const IS = {
  width:"100%", padding:"11px 14px", border:"1.5px solid #CFBBA2",
  borderRadius:14, fontSize:15, fontFamily:"inherit",
  color:"#5C4033", background:"#FFFDF9", boxSizing:"border-box", outline:"none",
};


function FormCard({ title, accent, onCancel, onSave, children }) {
  return (
    <div style={{ background:"#FDF8F3", borderRadius:20, padding:20, border:"1px solid #CFBBA266", boxShadow:"0 4px 24px #AF927333" }}>
      <div style={{ fontWeight:800, color:"#5C4033", marginBottom:16, fontSize:16 }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {children}
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <button onClick={onCancel} style={{ flex:1, padding:12, background:"#EFE2CA", border:"none", borderRadius:12, color:"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
          <button onClick={onSave} style={{ flex:2, padding:12, background:"linear-gradient(135deg," + accent + "," + accent + "cc)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>儲存</button>
        </div>
      </div>
    </div>
  );
}
function FL({ label, children }) {
  return <div><label style={{ fontSize:12, color:"#A0856C", marginBottom:4, display:"block" }}>{label}</label>{children}</div>;
}

function Calculator({ onConfirm, onClose, accentColor }) {
  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [justCalc, setJustCalc] = useState(false);

  function press(val) {
    if (val === "C") { setDisplay("0"); setExpr(""); setJustCalc(false); return; }
    if (val === "⌫") {
      setDisplay(p => p.length > 1 ? p.slice(0,-1) : "0");
      if (justCalc) { setExpr(""); setJustCalc(false); }
      return;
    }
    if (val === "=") {
      try {
        const result = Function('"use strict"; return (' + expr + display + ')')();
        const rounded = Math.round(result * 100) / 100;
        setDisplay(String(rounded));
        setExpr("");
        setJustCalc(true);
      } catch(e) {}
      return;
    }
    const ops = ["+", "-", "×", "÷"];
    if (ops.includes(val)) {
      const opMap = { "×":"*", "÷":"/" };
      setExpr(expr + display + (opMap[val]||val));
      setDisplay("0");
      setJustCalc(false);
      return;
    }
    if (val === ".") {
      if (display.includes(".")) return;
      setDisplay(p => p + ".");
      return;
    }
    if (justCalc) { setDisplay(val); setExpr(""); setJustCalc(false); return; }
    setDisplay(p => p === "0" ? val : p + val);
  }

  const accent = accentColor || "#C8986A";
  const btns = [
    ["C","(",")",  "÷"],
    ["7","8","9",  "×"],
    ["4","5","6",  "-"],
    ["1","2","3",  "+"],
    ["0",".","⌫",  "="],
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"#FDF8F3", borderRadius:"24px 24px 0 0", padding:"16px 16px 32px", width:"100%", maxWidth:430 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontWeight:800, color:"#5C4033", fontSize:16 }}>🧮 計算金額</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#CFBBA2", cursor:"pointer" }}>×</button>
        </div>
        {/* Display */}
        <div style={{ background:"#F5EAD8", borderRadius:16, padding:"10px 16px", marginBottom:12, textAlign:"right" }}>
          {expr && <div style={{ fontSize:12, color:"#A0856C", minHeight:18 }}>{expr}</div>}
          <div style={{ fontSize:32, fontWeight:800, color:"#5C4033", letterSpacing:1 }}>{display}</div>
        </div>
        {/* Buttons */}
        <div style={{ display:"grid", gap:8 }}>
          {btns.map((row, ri) => (
            <div key={ri} style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
              {row.map(btn => {
                const isOp = ["+","-","×","÷"].includes(btn);
                const isEq = btn === "=";
                const isClear = btn === "C";
                return (
                  <button key={btn} onClick={()=>press(btn)} style={{
                    padding:"16px 0", borderRadius:14, border:"none", cursor:"pointer", fontFamily:"inherit",
                    fontSize: btn==="⌫" ? 18 : 20, fontWeight:700,
                    background: isEq ? `linear-gradient(135deg,${accent},${accent}cc)` : isOp ? "#EFE2CA" : isClear ? "#FDEAE5" : "#FFFDF9",
                    color: isEq ? "white" : isOp ? "#8A6946" : isClear ? "#E08080" : "#5C4033",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
                  }}>{btn}</button>
                );
              })}
            </div>
          ))}
        </div>
        {/* Confirm */}
        <button onClick={()=>onConfirm(display)} style={{ width:"100%", marginTop:12, padding:14, background:`linear-gradient(135deg,${accent},${accent}cc)`, border:"none", borderRadius:16, color:"white", fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:"inherit" }}>
          填入 NT$ {parseFloat(display).toLocaleString()}
        </button>
      </div>
    </div>
  );
}

function ComingSoonPage({ label, imgKey, onBack }) {
  return (
    <Page title={label} onBack={onBack}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, gap:18 }}>
        <ImgOrEmoji src={IMGS[imgKey]} style={{ width:120, height:120, objectFit:"contain" }} alt={label}/>
        <div style={{ fontWeight:800, fontSize:20, color:"#5C4033" }}>{label} 功能</div>
        <div style={{ background:"#FDF8F3", borderRadius:16, padding:"14px 28px", color:"#A0856C", fontSize:14, border:"1px solid #EFE2CA", textAlign:"center", lineHeight:1.7 }}>
          寶寶出生後即可啟用<br/><span style={{ fontSize:12, color:"#CFBBA2" }}>敬請期待</span>
        </div>
      </div>
    </Page>
  );
}

// ── Date Range Filter ────────────────────────────────────────
function useDateFilter(initialMode="月") {
  const today = new Date();
  const [mode, setMode] = useState(initialMode);
  const [offset, setOffset] = useState(0);
  const [customStart, setCustomStart] = useState(today.toISOString().slice(0,10));
  const [customEnd, setCustomEnd] = useState(today.toISOString().slice(0,10));
  const [showCustom, setShowCustom] = useState(false);

  function getRange() {
    const base = new Date();
    if (mode === "日") {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      const ds = d.toISOString().slice(0,10);
      const label = offset===0 ? "今天" : ds.slice(5).replace("-","/");
      return { start: ds, end: ds, label };
    } else if (mode === "年") {
      const y = base.getFullYear() + offset;
      return { start: y+"-01-01", end: y+"-12-31", label: y+"年" };
    } else if (mode === "月") {
      const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
      const y = d.getFullYear(), m = d.getMonth();
      const last = new Date(y, m+1, 0).getDate();
      const ms = String(m+1).padStart(2,"0");
      return { start: y+"-"+ms+"-01", end: y+"-"+ms+"-"+String(last).padStart(2,"0"), label: y+"年"+ms+"月" };
    } else if (mode === "週") {
      const d = new Date(base);
      d.setDate(base.getDate() + offset * 7);
      const day = d.getDay();
      const mon = new Date(d); mon.setDate(d.getDate() - (day===0?6:day-1));
      const sun = new Date(mon); sun.setDate(mon.getDate()+6);
      const ms = mon.toISOString().slice(0,10), se = sun.toISOString().slice(0,10);
      return { start: ms, end: se, label: ms.slice(5)+" ~ "+se.slice(5) };
    } else {
      return { start: customStart, end: customEnd, label: customStart+" ~ "+customEnd };
    }
  }

  function filterByDate(items, dateKey="date") {
    const { start, end } = getRange();
    return items.filter(item => item[dateKey] >= start && item[dateKey] <= end);
  }

  const range = getRange();

  return { mode, setMode, offset, setOffset, filterByDate, range, showCustom, setShowCustom, customStart, setCustomStart, customEnd, setCustomEnd };
}

function DateRangeBar({ hook, accentColor, tabs }) {
  const { mode, setMode, offset, setOffset, range, showCustom, setShowCustom, customStart, setCustomStart, customEnd, setCustomEnd } = hook;
  const color = accentColor || "#C8986A";
  const tabList = tabs || ["年","月","週","自訂"];

  function handleModeChange(m) {
    setMode(m);
    setOffset(0);
    if (m === "自訂") setShowCustom(true);
  }

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {tabList.map(m => (
          <button key={m} onClick={()=>handleModeChange(m)} style={{ flex:1, padding:"8px 0", borderRadius:12, border:"none", fontFamily:"inherit", background:mode===m?color:"#F5EDE3", color:mode===m?"white":"#A0856C", fontWeight:mode===m?800:500, fontSize:14, cursor:"pointer", transition:"all 0.15s" }}>{m}</button>
        ))}
      </div>

      {mode !== "自訂" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FDF8F3", borderRadius:14, padding:"8px 12px", border:"1px solid #EFE2CA" }}>
          <button onClick={()=>setOffset(o=>o-1)} style={{ background:color+"22", border:"none", borderRadius:10, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:color, flexShrink:0, fontWeight:800 }}>&#8249;</button>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#5C4033" }}>{range.label}</div>
            {mode !== "日" && <div style={{ fontSize:11, color:"#A0856C", marginTop:1 }}>{range.start} ~ {range.end}</div>}
            {mode === "日" && offset !== 0 && <div style={{ fontSize:11, color:"#A0856C", marginTop:1 }}>{range.start}</div>}
          </div>
          <button onClick={()=>setOffset(o=>o+1)} style={{ background:color+"22", border:"none", borderRadius:10, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:color, flexShrink:0, fontWeight:800 }}>&#8250;</button>
        </div>
      )}

      {mode === "自訂" && (
        <div onClick={()=>setShowCustom(true)} style={{ background:"#FDF8F3", borderRadius:14, padding:"9px 14px", display:"flex", alignItems:"center", gap:8, border:"1px solid #EFE2CA", cursor:"pointer" }}>
          <span style={{ fontSize:16 }}>📅</span>
          <span style={{ fontSize:13, color:"#5C4033", fontWeight:600 }}>{range.label}</span>
          <span style={{ marginLeft:"auto", fontSize:12, color:"#A0856C" }}>點擊修改</span>
        </div>
      )}

      {showCustom && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"white", borderRadius:24, padding:28, width:300, textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:17, color:"#5C4033", marginBottom:20 }}>選擇日期範圍</div>
            <div style={{ textAlign:"left", marginBottom:14 }}>
              <div style={{ fontSize:12, color:"#A0856C", marginBottom:4 }}>起始日期</div>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #CFBBA2", borderRadius:12, fontSize:15, fontFamily:"inherit", color:"#5C4033", boxSizing:"border-box", outline:"none" }}/>
            </div>
            <div style={{ textAlign:"left", marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#A0856C", marginBottom:4 }}>結束日期</div>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #CFBBA2", borderRadius:12, fontSize:15, fontFamily:"inherit", color:"#5C4033", boxSizing:"border-box", outline:"none" }}/>
            </div>
            <button onClick={()=>setShowCustom(false)} style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:14, color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>確定</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseList({ acctKey, expenses, onAdd, onDelete, onEdit, customCategories, setCustomCategories }) {
  const acct = ACCOUNTS[acctKey];

  // All hooks first
  const [deletedBuiltIn, setDeletedBuiltIn] = useState([]);
  const [catFilter, setCatFilter] = useState("全部");
  const [showAddCat, setShowAddCat] = useState(false);
  const [deleteCatMode, setDeleteCatMode] = useState(false);
  const [catForm, setCatForm] = useState({ name:"", icon:"🏷️", color:"#A5C49A" });
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date:"", category:"奶粉/副食品", desc:"", amount:"", payMethod:"現金", creditCard:"" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ date:"", category:"奶粉/副食品", desc:"", amount:"", payMethod:"現金", creditCard:"" });
  const [showCalc, setShowCalc] = useState(false);
  const [calcTarget, setCalcTarget] = useState("add"); // "add" or "edit"
  const dateHook = useDateFilter();

  // Derived values after hooks
  const acctCustom = (customCategories && customCategories[acctKey]) || [];
  const visibleBuiltIn = Object.fromEntries(
    Object.entries(CATEGORY_ICONS).filter(([k]) => !deletedBuiltIn.includes(k))
  );
  const visibleBuiltInColors = Object.fromEntries(
    Object.entries(CATEGORY_COLORS).filter(([k]) => !deletedBuiltIn.includes(k))
  );
  const allCatIcons = { ...visibleBuiltIn, ...Object.fromEntries(acctCustom.map(c=>[c.name, c.icon])) };
  const allCatColors = { ...visibleBuiltInColors, ...Object.fromEntries(acctCustom.map(c=>[c.name, c.color])) };

  const list = expenses.filter(e => e.account === acctKey);
  const dateFiltered = dateHook.filterByDate(list);
  const filtered = (catFilter === "全部" ? dateFiltered : dateFiltered.filter(e => e.category === catFilter))
    .slice().sort((a,b) => new Date(b.date)-new Date(a.date));
  const periodTotal = filtered.reduce((s,e) => s+e.amount, 0);

  function addCustomCat() {
    if (!catForm.name.trim() || acctCustom.find(c=>c.name===catForm.name)) return;
    setCustomCategories(prev => ({ ...prev, [acctKey]: [...(prev[acctKey]||[]), { name:catForm.name.trim(), icon:catForm.icon||"🏷️", color:catForm.color }] }));
    setCatFilter(catForm.name.trim());
    setCatForm({ name:"", icon:"🏷️", color:"#A5C49A" });
    setShowAddCat(false);
  }

  function deleteCat(name) {
    if (acctCustom.find(c=>c.name===name)) {
      setCustomCategories(prev => ({ ...prev, [acctKey]: (prev[acctKey]||[]).filter(c=>c.name!==name) }));
    } else {
      setDeletedBuiltIn(prev => [...prev, name]);
    }
    if (catFilter === name) setCatFilter("全部");
  }

  function save() {
    if (!form.desc || !form.amount || !form.date) return;
    onAdd({ id:Date.now(), account:acctKey, ...form, amount:parseInt(form.amount) });
    setForm({ date:"", category:"奶粉/副食品", desc:"", amount:"", payMethod:"現金", creditCard:"" });
    setShow(false);
  }

  function saveEdit() {
    if (!editForm.desc || !editForm.amount || !editForm.date) return;
    onEdit(editId, { ...editForm, amount:parseInt(editForm.amount) });
    setEditId(null);
  }

  return (
    <div>
      {showCalc && <Calculator accentColor={acct.color} onClose={()=>setShowCalc(false)} onConfirm={val=>{
        if(calcTarget==="add") setForm(p=>({...p, amount:String(Math.round(parseFloat(val)||0))}));
        else setEditForm(p=>({...p, amount:String(Math.round(parseFloat(val)||0))}));
        setShowCalc(false);
      }}/>}
      <DateRangeBar hook={dateHook} accentColor={acct.color}/>
      {/* Period total */}
      <div style={{ background:acct.light, borderRadius:14, padding:"10px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid "+acct.color+"33" }}>
        <span style={{ fontSize:13, color:"#5C4033", fontWeight:600 }}>期間支出</span>
        <span style={{ fontSize:18, fontWeight:800, color:acct.color }}>NT$ {periodTotal.toLocaleString()}</span>
      </div>

      {/* 新增支出 button - placed above category filter */}
      {!show
        ? <button onClick={() => setShow(true)} style={{ width:"100%", padding:12, background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", border:"none", borderRadius:16, color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", marginBottom:12 }}>+ 新增支出</button>
        : <FormCard title="新增支出" accent={acct.color} onCancel={() => setShow(false)} onSave={save}>
            <FL label="日期"><input type="date" value={form.date} onChange={e => setForm(p => ({...p, date:e.target.value}))} style={IS} /></FL>
            <FL label="項目說明"><input type="text" placeholder="例：嬰兒床" value={form.desc} onChange={e => setForm(p => ({...p, desc:e.target.value}))} style={IS} /></FL>
            <FL label="金額 (NT$)">
              <div style={{ display:"flex", gap:8 }}>
                <input type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({...p, amount:e.target.value}))} style={{ ...IS, flex:1 }} />
                <button type="button" onClick={()=>{ setCalcTarget("add"); setShowCalc(true); }} style={{ background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", border:"none", borderRadius:12, padding:"0 14px", color:"white", fontSize:18, cursor:"pointer", flexShrink:0 }}>🧮</button>
              </div>
            </FL>
            <FL label="分類">
              <select value={form.category} onChange={e => setForm(p => ({...p, category:e.target.value}))} style={IS}>
                {Object.keys(allCatIcons).map(c => <option key={c} value={c}>{allCatIcons[c]} {c}</option>)}
              </select>
            </FL>
            <FL label="付款方式">
              <div style={{ display:"flex", gap:8 }}>
                {["現金","信用卡"].map(m => (
                  <button key={m} type="button" onClick={() => setForm(p => ({...p, payMethod:m, creditCard:""}))}
                    style={{ flex:1, padding:"9px 0", borderRadius:12, border:"none",
                      background: form.payMethod===m ? "linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")" : "#EFE2CA",
                      color: form.payMethod===m ? "white" : "#5C4033",
                      fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>
                    {m==="現金"?"💵 現金":"💳 信用卡"}
                  </button>
                ))}
              </div>
            </FL>
            {form.payMethod==="信用卡" && (
              <FL label="信用卡別">
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["星展","台新","富邦","華南","玉山","其他"].map(card => (
                    <button key={card} type="button" onClick={() => setForm(p => ({...p, creditCard: p.creditCard===card&&card!=="其他" ? "" : card}))}
                      style={{ padding:"7px 14px", borderRadius:20, border:"none",
                        background: form.creditCard===card ? acct.color : "#F5EDE3",
                        color: form.creditCard===card ? "white" : "#8A6946",
                        fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
                      {card}
                    </button>
                  ))}
                </div>
                {form.creditCard==="其他" && (
                  <input type="text" placeholder="請輸入卡別名稱" value={form.creditCardCustom||""} onChange={e => setForm(p => ({...p, creditCardCustom:e.target.value}))}
                    style={{ ...IS, marginTop:8 }}/>
                )}
              </FL>
            )}
          </FormCard>
      }

      {/* Category filter row */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:14, alignItems:"center" }}>
        {["全部",...Object.keys(allCatIcons)].map(cat => (
          <div key={cat} style={{ flexShrink:0, position:"relative" }}>
            <button onClick={() => { if(!deleteCatMode) setCatFilter(cat); }} style={{ padding:"6px 12px", borderRadius:20, border:"none", background:catFilter===cat?acct.color:"#FDF8F3", color:catFilter===cat?"white":"#A0856C", fontWeight:catFilter===cat?700:400, fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
              {cat === "全部" ? "全部" : allCatIcons[cat] + " " + cat.split("/")[0]}
            </button>
            {deleteCatMode && cat !== "全部" && (
              <button onClick={()=>deleteCat(cat)} style={{ position:"absolute", top:-4, right:-4, width:16, height:16, borderRadius:"50%", background:"#E08080", border:"none", color:"white", fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, fontWeight:800 }}>×</button>
            )}
          </div>
        ))}
        {/* + add */}
        <button onClick={()=>{ setDeleteCatMode(false); setShowAddCat(true); }} style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", border:"2px dashed "+acct.color, background:"transparent", color:acct.color, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>+</button>
        {/* - delete toggle */}
        <button onClick={()=>setDeleteCatMode(d=>!d)} style={{ flexShrink:0, width:28, height:28, borderRadius:"50%", border:"2px solid "+(deleteCatMode?"#E08080":"#CFBBA2"), background:deleteCatMode?"#E08080":"transparent", color:deleteCatMode?"white":"#CFBBA2", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>-</button>
      </div>

      {/* Add category modal */}
      {showAddCat && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:430 }}>
            <div style={{ fontWeight:800, color:C.text, fontSize:17, marginBottom:16 }}>新增自訂分類</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <FLabel label="分類名稱"><input type="text" placeholder="例：交通、教育、旅遊" value={catForm.name} onChange={e=>setCatForm(p=>({...p,name:e.target.value}))} style={IS2}/></FLabel>
              <FLabel label="圖示 Emoji"><input type="text" placeholder="🏷️" value={catForm.icon} onChange={e=>setCatForm(p=>({...p,icon:e.target.value}))} style={IS2}/></FLabel>
              <FLabel label="顏色">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["#D4956A","#7AAEC4","#B39DDB","#E8B84B","#E08080","#7BBFB5","#C98FA3","#5A9A6F","#A5C49A"].map(col=>(
                    <button key={col} onClick={()=>setCatForm(p=>({...p,color:col}))} style={{ width:28, height:28, borderRadius:"50%", background:col, border:catForm.color===col?"3px solid #5C4033":"2px solid transparent", cursor:"pointer" }}/>
                  ))}
                </div>
              </FLabel>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>setShowAddCat(false)} style={{ flex:1, padding:12, background:C.warm4, border:"none", borderRadius:12, color:C.sub, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
              <button onClick={addCustomCat} style={{ flex:2, padding:12, background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>新增</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        {filtered.length === 0 && <div style={{ textAlign:"center", color:"#CFBBA2", padding:24, fontSize:13 }}>此期間沒有記錄 🍃</div>}
        {filtered.map(exp => (
          <div key={exp.id} style={{ background:"#FDF8F3", borderRadius:16, padding:"13px 15px", display:"flex", alignItems:"center", gap:11, border:"1px solid #EFE2CA" }}>
            {editId === exp.id ? (
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <input type="date" value={editForm.date} onChange={e=>setEditForm(p=>({...p,date:e.target.value}))} style={{ ...IS, fontSize:13 }}/>
                  <input type="text" placeholder="項目說明" value={editForm.desc} onChange={e=>setEditForm(p=>({...p,desc:e.target.value}))} style={{ ...IS, fontSize:13 }}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <input type="number" placeholder="金額" value={editForm.amount} onChange={e=>setEditForm(p=>({...p,amount:e.target.value}))} style={{ ...IS, fontSize:13, flex:1 }}/>
                    <button type="button" onClick={()=>{ setCalcTarget("edit"); setShowCalc(true); }} style={{ background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", border:"none", borderRadius:10, padding:"0 12px", color:"white", fontSize:16, cursor:"pointer", flexShrink:0 }}>🧮</button>
                  </div>
                  <select value={editForm.category} onChange={e=>setEditForm(p=>({...p,category:e.target.value}))} style={{ ...IS, fontSize:13 }}>
                    {Object.keys(allCatIcons).map(c=><option key={c} value={c}>{allCatIcons[c]} {c}</option>)}
                  </select>
                  <div style={{ display:"flex", gap:8 }}>
                    {["現金","信用卡"].map(m=>(
                      <button key={m} type="button" onClick={()=>setEditForm(p=>({...p,payMethod:m,creditCard:""}))}
                        style={{ flex:1, padding:"7px 0", borderRadius:10, border:"none",
                          background:editForm.payMethod===m?"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")":"#EFE2CA",
                          color:editForm.payMethod===m?"white":"#5C4033", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
                        {m==="現金"?"💵 現金":"💳 信用卡"}
                      </button>
                    ))}
                  </div>
                  {editForm.payMethod==="信用卡" && (
                    <div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                        {["星展","台新","富邦","華南","玉山","其他"].map(card=>(
                          <button key={card} type="button" onClick={()=>setEditForm(p=>({...p,creditCard:card}))}
                            style={{ padding:"5px 12px", borderRadius:20, border:"none",
                              background:editForm.creditCard===card?acct.color:"#F5EDE3",
                              color:editForm.creditCard===card?"white":"#8A6946",
                              fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                            {card}
                          </button>
                        ))}
                      </div>
                      {editForm.creditCard==="其他" && (
                        <input type="text" placeholder="請輸入卡別名稱" value={editForm.creditCardCustom||""} onChange={e=>setEditForm(p=>({...p,creditCardCustom:e.target.value}))} style={{ ...IS, fontSize:13 }}/>
                      )}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setEditId(null)} style={{ flex:1, padding:"8px 0", background:"#EFE2CA", border:"none", borderRadius:10, color:"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>取消</button>
                    <button onClick={saveEdit} style={{ flex:2, padding:"8px 0", background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", border:"none", borderRadius:10, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>儲存</button>
                  </div>
                </div>
              </div>
            ) : (<>
              <div style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:(allCatColors[exp.category]||"#CFBBA2")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{allCatIcons[exp.category]||"🏷️"}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:"#5C4033", fontSize:14 }}>{exp.desc}</div>
                <div style={{ fontSize:11, color:"#A0856C", marginTop:2 }}>{exp.date} - <span style={{ color:allCatColors[exp.category]||"#CFBBA2" }}>{exp.category}</span>
                  {exp.payMethod && <span style={{ marginLeft:6, background: exp.payMethod==="現金"?"#EFE2CA":"#E8F3F8", color: exp.payMethod==="現金"?"#8A6946":"#7AAEC4", borderRadius:8, padding:"1px 7px", fontSize:10, fontWeight:600 }}>{exp.payMethod==="信用卡" ? "💳 "+(exp.creditCard==="其他"?(exp.creditCardCustom||"其他"):exp.creditCard||"信用卡") : "💵 現金"}</span>}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800, fontSize:15, color:acct.color }}>NT${exp.amount.toLocaleString()}</div>
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end", marginTop:4 }}>
                  <button onClick={()=>{ setEditId(exp.id); setEditForm({ date:exp.date, category:exp.category, desc:exp.desc, amount:String(exp.amount), payMethod:exp.payMethod||"現金", creditCard:exp.creditCard||"", creditCardCustom:exp.creditCardCustom||"" }); }} style={{ background:"none", border:"none", color:acct.color, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>✏️ 編輯</button>
                  <button onClick={() => onDelete(exp.id)} style={{ background:"none", border:"none", color:"#CFBBA2", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>刪除</button>
                </div>
              </div>
            </>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function DepositList({ acctKey, deposits, onAdd, onDelete }) {
  const acct = ACCOUNTS[acctKey];
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date:"", desc:"", amount:"" });
  const dateHook = useDateFilter();

  const list = deposits.filter(d => d.account === acctKey);
  const dateFiltered = dateHook.filterByDate(list).slice().sort((a,b) => new Date(b.date)-new Date(a.date));
  const periodTotal = dateFiltered.reduce((s,d) => s+d.amount, 0);

  function save() {
    if (!form.desc || !form.amount || !form.date) return;
    onAdd({ id:Date.now(), account:acctKey, ...form, amount:parseInt(form.amount) });
    setForm({ date:"", desc:"", amount:"" });
    setShow(false);
  }
  return (
    <div>
      <DateRangeBar hook={dateHook} accentColor="#7FBF95"/>
      {/* Period total */}
      <div style={{ background:"#EAF5EE", borderRadius:14, padding:"10px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #B8D8B8" }}>
        <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>期間存入</span>
        <span style={{ fontSize:18, fontWeight:800, color:"#5A9A6F" }}>NT$ {periodTotal.toLocaleString()}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        {dateFiltered.length === 0 && <div style={{ textAlign:"center", color:"#CFBBA2", padding:24, fontSize:13 }}>此期間沒有存款記錄 🍃</div>}
        {dateFiltered.map(dep => (
          <div key={dep.id} style={{ background:"#FDF8F3", borderRadius:16, padding:"13px 15px", display:"flex", alignItems:"center", gap:11, border:"1px solid #EFE2CA" }}>
            <div style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:"#E0F5E8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>💵</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:"#5C4033", fontSize:14 }}>{dep.desc}</div>
              <div style={{ fontSize:11, color:"#A0856C", marginTop:2 }}>{dep.date}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:800, fontSize:15, color:"#5A9A6F" }}>+ NT${dep.amount.toLocaleString()}</div>
              <button onClick={() => onDelete(dep.id)} style={{ background:"none", border:"none", color:"#CFBBA2", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>刪除</button>
            </div>
          </div>
        ))}
      </div>
      {!show
        ? <button onClick={() => setShow(true)} style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#7FBF95,#5A9A6F)", border:"none", borderRadius:16, color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>+ 新增存款</button>
        : <FormCard title="新增存款" accent="#5A9A6F" onCancel={() => setShow(false)} onSave={save}>
            <FL label="日期"><input type="date" value={form.date} onChange={e => setForm(p => ({...p, date:e.target.value}))} style={IS} /></FL>
            <FL label="說明（來源）"><input type="text" placeholder="例：政府補助" value={form.desc} onChange={e => setForm(p => ({...p, desc:e.target.value}))} style={IS} /></FL>
            <FL label="金額 (NT$)">
              <div style={{ display:"flex", gap:8 }}>
                <input type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({...p, amount:e.target.value}))} style={{ ...IS, flex:1 }} />
                <button type="button" onClick={()=>{ setCalcTarget("add"); setShowCalc(true); }} style={{ background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", border:"none", borderRadius:12, padding:"0 14px", color:"white", fontSize:18, cursor:"pointer", flexShrink:0 }}>🧮</button>
              </div>
            </FL>
          </FormCard>
      }
    </div>
  );
}

function AccountPage({ acctKey, expenses, deposits, onBack, onAddExp, onAddDep, onDelExp, onDelDep, onEditExp, categoryIcons, categoryColors, customCategories, setCustomCategories }) {
  const acct = ACCOUNTS[acctKey];
  const isBaby = acctKey === "baby";
  const [tab, setTab] = useState("expense");
  const totalExp = expenses.filter(e => e.account === acctKey).reduce((s,e) => s+e.amount, 0);
  const totalDep = deposits.filter(d => d.account === acctKey).reduce((s,d) => s+d.amount, 0);
  return (
    <Page title={acct.label + " 帳戶"} onBack={onBack}>
      <div style={{ background:"linear-gradient(135deg,"+acct.grad[0]+","+acct.grad[1]+")", borderRadius:20, padding:"20px 22px", color:"white", marginBottom:18, boxShadow:"0 6px 24px "+acct.color+"55" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.25)", overflow:"hidden", flexShrink:0 }}>
            <ImgOrEmoji src={IMGS[acct.imgKey]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={acct.label}/>
          </div>
          <div style={{ fontSize:20, fontWeight:800 }}>{acct.label} 帳戶</div>
        </div>
        <div style={{ fontSize:12, opacity:0.82, marginBottom:2 }}>{isBaby ? "帳戶結餘" : "總支出"}</div>
        <div style={{ fontSize:32, fontWeight:800, marginBottom:isBaby?14:0 }}>NT$ {isBaby ? (totalDep-totalExp).toLocaleString() : totalExp.toLocaleString()}</div>
        {isBaby && (
          <div style={{ display:"flex", gap:20 }}>
            <div><div style={{ fontSize:11, opacity:0.75 }}>存入</div><div style={{ fontSize:16, fontWeight:700 }}>NT$ {totalDep.toLocaleString()}</div></div>
            <div style={{ width:1, background:"rgba(255,255,255,0.3)" }}></div>
            <div><div style={{ fontSize:11, opacity:0.75 }}>支出</div><div style={{ fontSize:16, fontWeight:700 }}>NT$ {totalExp.toLocaleString()}</div></div>
          </div>
        )}
      </div>
      {isBaby && (
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {[["expense","支出"],["deposit","存款"]].map(([k,l]) => {
            const activeColor = k==="deposit" ? "linear-gradient(135deg,#7FBF95,#5A9A6F)" : `linear-gradient(135deg,${acct.grad[0]},${acct.grad[1]})`;
            return (
              <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:"10px 0", borderRadius:14, border:"none", fontFamily:"inherit", background:tab===k?activeColor:"#FDF8F3", color:tab===k?"white":"#A0856C", fontWeight:tab===k?800:500, fontSize:15, cursor:"pointer" }}>{l}</button>
            );
          })}
        </div>
      )}
      {(!isBaby || tab === "expense") && <ExpenseList acctKey={acctKey} expenses={expenses} onAdd={onAddExp} onDelete={onDelExp} onEdit={onEditExp} categoryIcons={categoryIcons} categoryColors={categoryColors} customCategories={customCategories} setCustomCategories={setCustomCategories} />}
      {isBaby && tab === "deposit" && <DepositList acctKey={acctKey} deposits={deposits} onAdd={onAddDep} onDelete={onDelDep} />}
    </Page>
  );
}

function AllExpensesPage({ expenses, onBack, onDelete, categoryIcons, categoryColors }) {
  categoryIcons = categoryIcons || CATEGORY_ICONS;
  categoryColors = categoryColors || CATEGORY_COLORS;
  const [catFilter, setCatFilter] = useState("全部");
  const [acctFilter, setAcctFilter] = useState("全部");
  const [viewTab, setViewTab] = useState("list"); // "list" | "chart"
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);
  const dateHook = useDateFilter();

  // 監聽滾動，超過200px就顯示↑按鈕
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 200);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 切換分類或tab時自動回頂
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [catFilter, viewTab]);

  // Base filtered by date + account
  let baseFiltered = dateHook.filterByDate(expenses.slice());
  if (acctFilter !== "全部") baseFiltered = baseFiltered.filter(e => e.account === acctFilter);

  // For list: also filter by category
  let filtered = catFilter === "全部" ? baseFiltered : baseFiltered.filter(e => e.category === catFilter);
  filtered = filtered.slice().sort((a,b) => new Date(b.date)-new Date(a.date));

  const total = baseFiltered.reduce((s,e) => s+e.amount, 0);
  const acctTotals = Object.entries(ACCOUNTS).map(([k,a]) => ({
    k, a, t: dateHook.filterByDate(expenses.filter(e => e.account===k)).reduce((s,e) => s+e.amount, 0)
  }));

  // Category breakdown for chart
  const catData = Object.entries(
    baseFiltered.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, amount]) => ({
    name, amount,
    pct: total > 0 ? (amount/total*100) : 0,
    color: categoryColors[name] || CATEGORY_COLORS[name] || "#CFBBA2",
    icon: categoryIcons[name] || CATEGORY_ICONS[name] || "🏷️",
  })).sort((a,b) => b.amount - a.amount);

  // SVG Pie chart
  function PieChart({ data, size=220 }) {
    if (!data.length || data.reduce((s,d)=>s+d.amount,0)===0) {
      return <div style={{ textAlign:"center", color:C.warm3, padding:20 }}>此期間沒有支出 🍃</div>;
    }
    const r = size/2 - 12;
    const rInner = r * 0.45;
    const cx = size/2, cy = size/2;

    // Single item: full donut
    if (data.length === 1) {
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill={data[0].color}/>
          <circle cx={cx} cy={cy} r={rInner} fill={C.bg}/>
          <text x={cx} y={cy-6} textAnchor="middle" fontSize={11} fontWeight="700" fill="white">{data[0].name.split("/")[0]}</text>
          <text x={cx} y={cy+10} textAnchor="middle" fontSize={11} fill="white">100%</text>
        </svg>
      );
    }

    let cumAngle = -Math.PI/2;
    const slices = data.map(d => {
      const angle = Math.max((d.pct/100) * 2 * Math.PI, 0.001);
      const startAngle = cumAngle;
      cumAngle += angle;
      const midAngle = startAngle + angle/2;
      const labelR = (r + rInner) / 2; // mid-ring radius for label
      return { ...d, startAngle, endAngle: cumAngle, midAngle,
        lx: cx + labelR * Math.cos(midAngle),
        ly: cy + labelR * Math.sin(midAngle),
      };
    });

    function arcPath(startAngle, endAngle) {
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + rInner * Math.cos(endAngle);
      const iy1 = cy + rInner * Math.sin(endAngle);
      const ix2 = cx + rInner * Math.cos(startAngle);
      const iy2 = cy + rInner * Math.sin(startAngle);
      const large = (endAngle - startAngle) > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${rInner} ${rInner} 0 ${large} 0 ${ix2} ${iy2} Z`;
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s,i) => (
          <g key={i}>
            <path d={arcPath(s.startAngle, s.endAngle)} fill={s.color} stroke="white" strokeWidth={2}/>
            {/* Only show label if slice is big enough (>5%) */}
            {s.pct >= 5 && (
              <>
                <text x={s.lx} y={s.ly - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill="white" style={{ pointerEvents:"none" }}>
                  {s.name.split("/")[0].length > 4 ? s.name.split("/")[0].slice(0,4) : s.name.split("/")[0]}
                </text>
                <text x={s.lx} y={s.ly + 7} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.9)" style={{ pointerEvents:"none" }}>
                  {s.pct.toFixed(1)}%
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    );
  }

  const acctGrad = acctFilter==="全部" ? "linear-gradient(140deg,#E8C060,#C8A030)"
    : acctFilter==="baby" ? "linear-gradient(140deg,"+ACCOUNTS.baby.grad[0]+","+ACCOUNTS.baby.grad[1]+")"
    : acctFilter==="mom"  ? "linear-gradient(140deg,"+ACCOUNTS.mom.grad[0]+","+ACCOUNTS.mom.grad[1]+")"
    : "linear-gradient(140deg,"+ACCOUNTS.dad.grad[0]+","+ACCOUNTS.dad.grad[1]+")";
  const acctShadow = acctFilter==="全部" ? "rgba(200,160,48,0.3)"
    : acctFilter==="baby" ? "rgba(232,149,109,0.3)"
    : acctFilter==="mom"  ? "rgba(212,132,138,0.3)"
    : "rgba(122,174,196,0.3)";
  const activeColor = acctFilter==="全部"?"#D4A840":acctFilter==="baby"?ACCOUNTS.baby.color:acctFilter==="mom"?ACCOUNTS.mom.color:ACCOUNTS.dad.color;

  return (
    <Page title="全部支出" onBack={onBack} scrollRef={scrollRef}>
      <DateRangeBar hook={dateHook} accentColor={activeColor}/>

      <div style={{ background:acctGrad, borderRadius:20, padding:"18px 20px", color:"white", marginBottom:16, boxShadow:"0 6px 24px "+acctShadow, transition:"all 0.3s" }}>
        <div style={{ fontSize:12, opacity:0.8, marginBottom:2 }}>期間總支出</div>
        <div style={{ fontSize:32, fontWeight:800 }}>NT$ {total.toLocaleString()}</div>
      </div>

      {/* Account filter - big card + 3 cols */}
      <button onClick={() => setAcctFilter("全部")} style={{ width:"100%", background:acctFilter==="全部"?"linear-gradient(135deg,#E8C060,#D4A840)":"#FDF8E8", borderRadius:20, padding:"16px 20px", border:"2px solid "+(acctFilter==="全部"?"#D4A840":"transparent"), cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:16, marginBottom:10, boxShadow:acctFilter==="全部"?"0 4px 16px rgba(212,168,64,0.35)":"none", transition:"all 0.2s" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:acctFilter==="全部"?"rgba(255,255,255,0.3)":"#F5EAD8", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ImgOrEmoji src={IMGS["家"]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="家"/>
        </div>
        <div style={{ flex:1, textAlign:"left" }}>
          <div style={{ fontWeight:800, fontSize:15, color:acctFilter==="全部"?"white":"#5C4033" }}>全部帳戶</div>
          <div style={{ fontWeight:800, fontSize:22, color:acctFilter==="全部"?"white":"#B8860B", marginTop:2 }}>NT${total.toLocaleString()}</div>
        </div>
      </button>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {acctTotals.map(({k,a,t}) => (
          <button key={k} onClick={() => setAcctFilter(acctFilter===k?"全部":k)} style={{ background:acctFilter===k?"linear-gradient(135deg,"+a.grad[0]+","+a.grad[1]+")":a.light, borderRadius:16, padding:"14px 8px", border:"2px solid "+(acctFilter===k?a.grad[0]:"transparent"), cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:6, boxShadow:acctFilter===k?"0 4px 12px rgba(0,0,0,0.15)":"none", transition:"all 0.2s" }}>
            <div style={{ fontWeight:800, fontSize:14, color:acctFilter===k?"white":"#5C4033" }}>{a.label}</div>
            <div style={{ fontWeight:800, fontSize:14, color:acctFilter===k?"white":a.color }}>NT${t.toLocaleString()}</div>
          </button>
        ))}
      </div>

      {/* View toggle: 明細 / 分析 */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[["list","📋 明細"],["chart","📊 分析圖表"]].map(([k,l])=>(
          <button key={k} onClick={()=>setViewTab(k)} style={{ flex:1, padding:"10px 0", borderRadius:14, border:"none", fontFamily:"inherit", background:viewTab===k?acctGrad:C.card, color:viewTab===k?"white":C.sub, fontWeight:viewTab===k?800:500, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {/* ── CHART VIEW ── */}
      {viewTab==="chart" && (
        <div>
          {/* Pie chart */}
          <div style={{ background:C.card, borderRadius:20, padding:20, marginBottom:14, border:"1px solid #EFE2CA", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <PieChart data={catData} size={220}/>
            <div style={{ marginTop:8, fontSize:13, color:C.sub }}>
              合計 NT${total.toLocaleString()}　平均每天 NT${(total / Math.max(1, Math.ceil((new Date(dateHook.range.end)-new Date(dateHook.range.start))/86400000)+1)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,",")}
            </div>
          </div>
          {/* Category list */}
          {catData.length===0 && <div style={{ textAlign:"center", color:C.warm3, padding:20 }}>此期間沒有支出 🍃</div>}
          {catData.map((d,i)=>(
            <div key={d.name} onClick={()=>{ setViewTab("list"); setCatFilter(d.name); }} style={{ background:C.card, borderRadius:14, padding:"12px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12, border:"1px solid #EFE2CA", cursor:"pointer", transition:"box-shadow 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.10)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
              <div style={{ width:28, flexShrink:0, textAlign:"center", fontWeight:800, color:C.sub, fontSize:13 }}>#{i+1}</div>
              <div style={{ fontSize:20, flexShrink:0 }}>{d.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:C.text, fontSize:14 }}>{d.name}</div>
                <div style={{ marginTop:4, background:"#EFE2CA", borderRadius:6, height:6, overflow:"hidden" }}>
                  <div style={{ background:d.color, height:"100%", width:d.pct+"%", borderRadius:6, transition:"width 0.4s" }}/>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontWeight:800, color:d.color, fontSize:14 }}>NT${d.amount.toLocaleString()}</div>
                <div style={{ fontSize:11, color:C.sub }}>{d.pct.toFixed(1)}%</div>
                <div style={{ fontSize:10, color:"#CFBBA2", marginTop:2 }}>點擊看明細 →</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewTab==="list" && (<>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:14 }}>
          {["全部",...Object.keys(categoryIcons)].map(cat => {
            const activeColor = acctFilter==="全部" ? "#D4A840"
              : acctFilter==="baby" ? ACCOUNTS.baby.color
              : acctFilter==="mom"  ? ACCOUNTS.mom.color
              : ACCOUNTS.dad.color;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:20, border:"none", background:catFilter===cat?activeColor:"#FDF8F3", color:catFilter===cat?"white":"#A0856C", fontWeight:catFilter===cat?700:400, fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {cat === "全部" ? "全部分類" : (categoryIcons[cat] || "🏷️") + " " + cat.split("/")[0]}
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.length === 0 && <div style={{ textAlign:"center", color:"#CFBBA2", padding:28, fontSize:14 }}>此期間沒有記錄 🍃</div>}
          {filtered.map(exp => {
            const acct = ACCOUNTS[exp.account];
            return (
              <div key={exp.id} style={{ background:"#FDF8F3", borderRadius:16, padding:"13px 15px", display:"flex", alignItems:"center", gap:11, border:"1px solid #EFE2CA" }}>
                <div style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:(categoryColors[exp.category]||"#CFBBA2")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{categoryIcons[exp.category]||"🏷️"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:"#5C4033", fontSize:14 }}>{exp.desc}</div>
                  <div style={{ fontSize:11, color:"#A0856C", marginTop:2, display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                    <span>{exp.date}</span>
                    <span style={{ color:categoryColors[exp.category]||"#CFBBA2" }}>{exp.category}</span>
                    <span style={{ background:acct.light, color:acct.color, borderRadius:6, padding:"1px 7px", fontWeight:700 }}>{acct.label}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#8A6946" }}>NT${exp.amount.toLocaleString()}</div>
                  <button onClick={() => onDelete(exp.id)} style={{ background:"none", border:"none", color:"#CFBBA2", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>刪除</button>
                </div>
              </div>
            );
          })}
        </div>
      </>)}
      {showScrollTop && (
        <div style={{ position:"sticky", bottom:16, display:"flex", justifyContent:"flex-end", pointerEvents:"none" }}>
          <button onClick={()=>{ if(scrollRef.current) scrollRef.current.scrollTo({ top:0, behavior:"smooth" }); }}
            style={{ pointerEvents:"auto", width:46, height:46, borderRadius:"50%", background:"linear-gradient(135deg,#C8986A,#A87848)", border:"none", color:"white", fontSize:24, cursor:"pointer", boxShadow:"0 4px 16px rgba(140,80,40,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>↑</button>
        </div>
      )}
    </Page>
  );
}

function ExpensePage({ onBack, expenses, setExpenses, deposits, setDeposits, customCategories, setCustomCategories }) {
  const [detail, setDetail] = useState(null);
  const [showManageCat, setShowManageCat] = useState(false);
  const [catForm, setCatForm] = useState({ name:"", icon:"🏷️", color:"#A5C49A" });
  const grandTotal = expenses.reduce((s,e) => s+e.amount, 0);
  const grandDep = deposits.reduce((s,d) => s+d.amount, 0);

  // Merge built-in and custom categories
  const allCustom = [...(customCategories.baby||[]), ...(customCategories.mom||[]), ...(customCategories.dad||[])];
  const allCategoryIcons = { ...CATEGORY_ICONS, ...Object.fromEntries(allCustom.map(c=>[c.name, c.icon])) };
  const allCategoryColors = { ...CATEGORY_COLORS, ...Object.fromEntries(allCustom.map(c=>[c.name, c.color])) };

  if (detail === "all") return <AllExpensesPage expenses={expenses} onBack={() => setDetail(null)} onDelete={id => setExpenses(p => p.filter(e => e.id!==id))} categoryIcons={allCategoryIcons} categoryColors={allCategoryColors} />;
  if (detail) return (
    <AccountPage
      acctKey={detail}
      expenses={expenses}
      deposits={deposits}
      onBack={() => setDetail(null)}
      onAddExp={e => setExpenses(p => [...p, e])}
      onEditExp={(id, updated) => setExpenses(p => p.map(e => e.id===id ? {...e, ...updated} : e))}
      onAddDep={d => setDeposits(p => [...p, d])}
      onDelExp={id => setExpenses(p => p.filter(e => e.id!==id))}
      onDelDep={id => setDeposits(p => p.filter(d => d.id!==id))}
      categoryIcons={allCategoryIcons}
      categoryColors={allCategoryColors}
      customCategories={customCategories}
      setCustomCategories={setCustomCategories}
    />
  );

  return (
    <Page title="寶寶記帳" onBack={onBack}>

      {/* Category management button */}
      <button onClick={() => setDetail("all")} style={{ width:"100%", background:"linear-gradient(135deg,#EFE2CA,#E8D5B8)", borderRadius:20, padding:"16px 20px", marginBottom:14, border:"1.5px solid #CFBBA266", textAlign:"left", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"#F5EAD8", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ImgOrEmoji src={IMGS["家"]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="家"/>
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:"#5C4033" }}>全部支出</div>
            <div style={{ fontSize:11, color:"#A0856C" }}>三帳戶統計明細</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"#A0856C" }}>總支出</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#8A6946" }}>NT$ {grandTotal.toLocaleString()}</div>
        </div>
      </button>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {Object.entries(ACCOUNTS).map(([key,acct]) => {
          const exp = expenses.filter(e => e.account===key).reduce((s,e) => s+e.amount, 0);
          const dep = deposits.filter(d => d.account===key).reduce((s,d) => s+d.amount, 0);
          const isBaby = key === "baby";
          const recent = expenses.filter(e => e.account===key).slice().sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,2);
          return (
            <button key={key} onClick={() => setDetail(key)} style={{ background:acct.light, borderRadius:20, padding:"18px 20px", border:"1.5px solid "+acct.color+"44", cursor:"pointer", fontFamily:"inherit", width:"100%", textAlign:"left" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(255,255,255,0.6)", overflow:"hidden", flexShrink:0 }}>
                    <ImgOrEmoji src={IMGS[acct.imgKey]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={acct.label}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:17, color:"#5C4033" }}>{acct.label}</div>
                    <div style={{ fontSize:11, color:"#A0856C" }}>點擊查看明細</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#A0856C" }}>{isBaby?"結餘":"支出"}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:isBaby?((dep-exp)>=0?"#5A9A6F":"#D06060"):acct.color }}>NT$ {isBaby?(dep-exp).toLocaleString():exp.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginBottom:recent.length?12:0 }}>
                {isBaby && <div style={{ flex:1, background:"rgba(255,255,255,0.6)", borderRadius:10, padding:"8px 12px" }}><div style={{ fontSize:10, color:"#A0856C" }}>存入</div><div style={{ fontSize:14, fontWeight:700, color:"#4A9A6A" }}>+{dep.toLocaleString()}</div></div>}
                <div style={{ flex:1, background:"rgba(255,255,255,0.6)", borderRadius:10, padding:"8px 12px" }}><div style={{ fontSize:10, color:"#A0856C" }}>支出</div><div style={{ fontSize:14, fontWeight:700, color:acct.color }}>-{exp.toLocaleString()}</div></div>
              </div>
              {recent.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {recent.map(r => (
                    <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.55)", borderRadius:10, padding:"7px 12px" }}>
                      <span style={{ fontSize:13, color:"#5C4033" }}>{CATEGORY_ICONS[r.category]} {r.desc}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:acct.color }}>NT${r.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Page>
  );
}

function BackupPage({ onBack, onRestore, expenses, deposits, health, feedingRecords, diaperRecords, sleepRecords, growthRecords, vaccineRecords, tempRecords, tasks, otherTasks, achievePoints, rewards, badges, achieveTimeline, memoList, customCategories, dueDateStr, isBorn, babyName }) {
  const [status, setStatus] = useState(null);
  const fileRef = useRef(null);

  const totalRecords = feedingRecords.length + diaperRecords.length + sleepRecords.length + growthRecords.length + vaccineRecords.length + (tempRecords||[]).length + expenses.length;

  function handleExport() {
    const data = {
      version:3, exportedAt:new Date().toISOString(),
      babyName, dueDateStr, isBorn,
      health, expenses, deposits,
      feedingRecords, diaperRecords, sleepRecords,
      growthRecords, vaccineRecords, tempRecords,
      tasks, otherTasks, achievePoints, rewards, badges, achieveTimeline,
      memoList, customCategories,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "baby-backup-" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("exported");
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        onRestore(data);
        setStatus("success");
      } catch (err) {
        setStatus("error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <Page title="資料備份" onBack={onBack}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:"#FDF8F3", borderRadius:20, padding:20, border:"1px solid #EFE2CA" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:"#EAF3EC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>⬇️</div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:"#5C4033" }}>匯出備份</div>
              <div style={{ fontSize:12, color:"#A0856C" }}>下載 .json 備份檔案</div>
            </div>
          </div>
          <div style={{ background:"#F5EDE3", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontSize:13, color:"#A0856C", lineHeight:1.8 }}>
              <div>💰 支出 <strong style={{ color:"#5C4033" }}>{expenses.length}</strong> 筆 / 存款 <strong style={{ color:"#5C4033" }}>{deposits.length}</strong> 筆</div>
              <div>🍼 餵養 <strong style={{ color:"#5C4033" }}>{feedingRecords.length}</strong> 筆 / 🧷 尿布 <strong style={{ color:"#5C4033" }}>{diaperRecords.length}</strong> 筆 / 😴 睡眠 <strong style={{ color:"#5C4033" }}>{sleepRecords.length}</strong> 筆</div>
              <div>📏 生長 <strong style={{ color:"#5C4033" }}>{growthRecords.length}</strong> 筆 / 💉 疫苗 <strong style={{ color:"#5C4033" }}>{vaccineRecords.length}</strong> 筆 / 🌡️ 體溫 <strong style={{ color:"#5C4033" }}>{(tempRecords||[]).length}</strong> 筆</div>
              <div>🏅 任務 <strong style={{ color:"#5C4033" }}>{tasks.length+otherTasks.length}</strong> 項 / 點數 <strong style={{ color:"#5C4033" }}>{achievePoints}</strong> 點</div>
              <div>📝 備忘 <strong style={{ color:"#5C4033" }}>{(memoList||[]).length}</strong> 筆 / 🏷️ 自訂分類 <strong style={{ color:"#5C4033" }}>{Object.values(customCategories||{}).flat().length}</strong> 個</div>
            </div>
          </div>
          <button onClick={handleExport} style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:14, color:"white", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>下載備份檔案</button>
        </div>
        <div style={{ background:"#FDF8F3", borderRadius:20, padding:20, border:"1px solid #EFE2CA" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:"#FDEAE5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>⬆️</div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:"#5C4033" }}>還原備份</div>
              <div style={{ fontSize:12, color:"#A0856C" }}>從 .json 備份還原資料</div>
            </div>
          </div>
          {status === "success" && <div style={{ background:"#EAF3EC", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#4A9A6A", fontWeight:700 }}>還原成功！</div>}
          {status === "error" && <div style={{ background:"#FDEAE5", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:13, color:"#D4848A", fontWeight:700 }}>檔案格式錯誤</div>}
          <div style={{ background:"#FFF6E8", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
            <span style={{ fontSize:12, color:"#C8986A" }}>⚠️ 還原後目前資料將被覆蓋，請先備份！</span>
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleImport} />
          <button onClick={() => { setStatus(null); fileRef.current.click(); }} style={{ width:"100%", padding:"13px 0", background:"#FDEAE5", border:"1.5px solid #E8A0A6", borderRadius:14, color:"#D4848A", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>選擇備份檔案還原</button>
        </div>
        <div style={{ background:"#FDF8F3", borderRadius:20, padding:"18px 20px", border:"1px solid #EFE2CA" }}>
          <div style={{ fontWeight:700, color:"#5C4033", fontSize:14, marginBottom:10 }}>使用建議</div>
          <div style={{ fontSize:13, color:"#A0856C", lineHeight:2 }}>
            <div>- 定期備份，避免意外遺失資料</div>
            <div>- 換手機前先匯出，新手機匯入</div>
            <div>- 建議存到 iCloud 或 Google 雲端</div>
            <div>- 備份含所有支出、存款與健康數據</div>
          </div>
        </div>
      </div>
    </Page>
  );
}

// ── Memo Block ───────────────────────────────────────────────
function MemoBlock({ memoList, setMemoList }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [openMemo, setOpenMemo] = useState(null); // memo object for detail modal
  const [editMemo, setEditMemo] = useState(null); // memo object being edited in modal

  function addMemo() {
    if (!newTitle.trim()) return;
    setMemoList(p => [...p, { id:Date.now(), text:newTitle.trim(), detail:newDetail.trim(), done:false }]);
    setNewTitle(""); setNewDetail(""); setShowAdd(false);
  }

  function toggleDone(id) {
    setMemoList(p => p.map(m => m.id===id ? {...m, done:!m.done} : m));
    if (openMemo && openMemo.id === id) setOpenMemo(p => ({...p, done:!p.done}));
  }

  function deleteMemo(id) {
    setMemoList(p => p.filter(m => m.id!==id));
    if (openMemo && openMemo.id === id) setOpenMemo(null);
  }

  function saveEdit() {
    if (!editMemo || !editMemo.text.trim()) return;
    setMemoList(p => p.map(m => m.id===editMemo.id ? {...editMemo} : m));
    setOpenMemo(editMemo);
    setEditMemo(null);
  }

  const undone = memoList.filter(m=>!m.done).length;

  return (
    <div style={{ margin:"10px 16px 0" }}>
      <div style={{ background:"#FDF8F3", borderRadius:18, border:"1px solid #EFE2CA", overflow:"hidden" }}>
        {/* Header */}
        <div onClick={()=>setIsExpanded(e=>!e)} style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>📝</span>
            <span style={{ fontWeight:700, color:"#5C4033", fontSize:14 }}>備忘錄</span>
            {undone > 0 && <span style={{ background:"#C8986A", color:"white", borderRadius:20, fontSize:11, fontWeight:700, padding:"1px 8px" }}>{undone}</span>}
          </div>
          <span style={{ color:"#AF9273", fontSize:14 }}>{isExpanded?"▲":"▼"}</span>
        </div>

        {isExpanded && (
          <div style={{ padding:"0 16px 14px" }}>
            {memoList.length===0 && <div style={{ textAlign:"center", color:"#CFBBA2", fontSize:13, padding:"8px 0" }}>還沒有備忘事項 🌿</div>}
            {memoList.map(m=>(
              <div key={m.id} style={{ borderBottom:"1px solid #F5EDE3" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0" }}>
                  <button onClick={()=>toggleDone(m.id)} style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(m.done?"#C8986A":"#CFBBA2"), background:m.done?"#C8986A":"transparent", flexShrink:0, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {m.done && <span style={{ color:"white", fontSize:12, fontWeight:800 }}>✓</span>}
                  </button>
                  <span onClick={()=>setOpenMemo(m)} style={{ flex:1, fontSize:13, color:m.done?"#CFBBA2":"#5C4033", textDecoration:m.done?"line-through":"none", cursor:"pointer", fontWeight:600 }}>{m.text}</span>
                  {m.detail && <span style={{ fontSize:11, color:"#C8986A" }}>📄</span>}
                  <button onClick={()=>deleteMemo(m.id)} style={{ background:"none", border:"none", color:"#CFBBA2", fontSize:16, cursor:"pointer", padding:0, lineHeight:1 }}>×</button>
                </div>
              </div>
            ))}
            {/* Add new */}
            {!showAdd ? (
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={()=>setShowAdd(true)} style={{ flex:1, padding:"8px 12px", border:"1.5px dashed #EFE2CA", borderRadius:10, fontSize:13, fontFamily:"inherit", color:"#CFBBA2", background:"transparent", cursor:"pointer", textAlign:"left" }}>新增備忘事項...</button>
                <button onClick={()=>setShowAdd(true)} style={{ background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, padding:"8px 14px", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+</button>
              </div>
            ) : (
              <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
                <input type="text" placeholder="主標題（必填）" value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter") addMemo(); }}
                  style={{ padding:"8px 12px", border:"1.5px solid #C8986A", borderRadius:10, fontSize:13, fontFamily:"inherit", color:"#5C4033", background:"#FFFDF9", outline:"none" }}/>
                <textarea placeholder="細節內容（選填）..." value={newDetail} onChange={e=>setNewDetail(e.target.value)} rows={3}
                  style={{ padding:"8px 12px", border:"1.5px solid #EFE2CA", borderRadius:10, fontSize:13, fontFamily:"inherit", color:"#5C4033", background:"#FFFDF9", outline:"none", resize:"none" }}/>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{setShowAdd(false);setNewTitle("");setNewDetail("");}} style={{ flex:1, padding:"8px 0", background:"#EFE2CA", border:"none", borderRadius:10, color:"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>取消</button>
                  <button onClick={addMemo} style={{ flex:2, padding:"8px 0", background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:10, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>新增</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {openMemo && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={()=>{setOpenMemo(null);setEditMemo(null);}}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#FFFDF9", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:480, padding:"24px 20px 36px", boxShadow:"0 -8px 40px rgba(0,0,0,0.18)", maxHeight:"80vh", overflowY:"auto" }}>
            {/* Drag handle */}
            <div style={{ width:40, height:4, background:"#EFE2CA", borderRadius:4, margin:"0 auto 20px" }}/>

            {editMemo ? (<>
              <input value={editMemo.text} onChange={e=>setEditMemo(p=>({...p,text:e.target.value}))}
                style={{ width:"100%", fontSize:16, fontWeight:700, color:"#5C4033", border:"none", borderBottom:"2px solid #C8986A", background:"transparent", outline:"none", padding:"4px 0", marginBottom:14, fontFamily:"inherit", boxSizing:"border-box" }}/>
              <textarea value={editMemo.detail} onChange={e=>setEditMemo(p=>({...p,detail:e.target.value}))} rows={5}
                style={{ width:"100%", fontSize:14, color:"#7A5C44", border:"1.5px solid #EFE2CA", borderRadius:12, background:"#FFF8F0", outline:"none", padding:"10px 12px", fontFamily:"inherit", resize:"none", lineHeight:1.7, boxSizing:"border-box" }}/>
              <div style={{ display:"flex", gap:10, marginTop:14 }}>
                <button onClick={()=>setEditMemo(null)} style={{ flex:1, padding:"10px 0", background:"#EFE2CA", border:"none", borderRadius:12, color:"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>取消</button>
                <button onClick={saveEdit} style={{ flex:2, padding:"10px 0", background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>儲存</button>
              </div>
            </>) : (<>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontSize:17, fontWeight:800, color:openMemo.done?"#CFBBA2":"#5C4033", textDecoration:openMemo.done?"line-through":"none", flex:1, lineHeight:1.4 }}>{openMemo.text}</span>
                <button onClick={()=>setEditMemo({...openMemo})} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", padding:"0 0 0 12px", color:"#C8986A" }}>✏️</button>
              </div>
              {openMemo.detail ? (
                <div style={{ fontSize:14, color:"#7A5C44", background:"#FFF8F0", borderRadius:14, padding:"14px 16px", lineHeight:1.8, marginBottom:16, whiteSpace:"pre-wrap" }}>{openMemo.detail}</div>
              ) : (
                <div style={{ fontSize:13, color:"#CFBBA2", marginBottom:16, fontStyle:"italic" }}>沒有細節內容，點右上角鉛筆新增 ✏️</div>
              )}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>{ toggleDone(openMemo.id); }} style={{ flex:1, padding:"10px 0", background:openMemo.done?"#EFE2CA":"linear-gradient(135deg,#A5C49A,#8BB580)", border:"none", borderRadius:12, color:openMemo.done?"#A0856C":"white", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>{openMemo.done?"取消完成":"✅ 完成"}</button>
                <button onClick={()=>{ deleteMemo(openMemo.id); }} style={{ flex:1, padding:"10px 0", background:"#FDECEA", border:"none", borderRadius:12, color:"#E08080", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>🗑️ 刪除</button>
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}

function BabyApp() {
  const [page, setPage] = useState("home");
  const [babyPhoto, setBabyPhoto] = useState(null);
  const [babyName, setBabyName] = useState("小麥");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("小麥");
  const [health, setHealth] = useState({ height:"", weight:"861", head:"", weeks:"24" });
  const [editingHealth, setEditingHealth] = useState(false);
  const [healthForm, setHealthForm] = useState({ height:"", weight:"", head:"", weeks:"" });
  const [expenses, setExpenses] = useState([
  {
    "id": 2,
    "account": "mom",
    "date": "2026-05-06",
    "category": "孕期用品",
    "desc": "卵磷脂",
    "amount": 5760
  },
  {
    "id": 3,
    "account": "dad",
    "date": "2026-05-06",
    "category": "醫療",
    "desc": "糖水",
    "amount": 300
  },
  {
    "id": 1778166711523,
    "account": "mom",
    "date": "2026-05-06",
    "category": "醫療",
    "desc": "24w 產檢",
    "amount": 550
  }
]);
  const [deposits, setDeposits] = useState([
  {
    "id": 1778166644910,
    "account": "baby",
    "date": "2026-05-07",
    "desc": "媽媽贊助",
    "amount": 100000
  }
]);

  // ── Lifted state for all pages ──────────────────────────────
  const [feedingRecords, setFeedingRecords] = useState([
  {
    "id": 1,
    "date": "2026-05-05",
    "time": "07:30",
    "type": "母乳",
    "duration": 15,
    "amount": null,
    "side": "左"
  },
  {
    "id": 2,
    "date": "2026-05-05",
    "time": "10:15",
    "type": "配方奶",
    "duration": null,
    "amount": 120,
    "side": null
  },
  {
    "id": 3,
    "date": "2026-05-05",
    "time": "13:00",
    "type": "母乳",
    "duration": 20,
    "amount": null,
    "side": "右"
  },
  {
    "id": 4,
    "date": "2026-05-04",
    "time": "08:00",
    "type": "母乳",
    "duration": 18,
    "amount": null,
    "side": "左"
  },
  {
    "id": 5,
    "date": "2026-05-04",
    "time": "12:30",
    "type": "配方奶",
    "duration": null,
    "amount": 90,
    "side": null
  }
]);
  const [diaperRecords, setDiaperRecords] = useState([
  {
    "id": 1,
    "date": "2026-05-05",
    "time": "07:00",
    "type": "濕",
    "color": "淡黃",
    "note": ""
  },
  {
    "id": 2,
    "date": "2026-05-05",
    "time": "09:30",
    "type": "便便",
    "color": "黃色",
    "note": "正常"
  },
  {
    "id": 3,
    "date": "2026-05-05",
    "time": "12:00",
    "type": "濕",
    "color": "淡黃",
    "note": ""
  },
  {
    "id": 4,
    "date": "2026-05-05",
    "time": "15:30",
    "type": "混合",
    "color": "黃色",
    "note": ""
  },
  {
    "id": 5,
    "date": "2026-05-04",
    "time": "08:00",
    "type": "濕",
    "color": "淡黃",
    "note": ""
  },
  {
    "id": 6,
    "date": "2026-05-04",
    "time": "11:00",
    "type": "便便",
    "color": "黃色",
    "note": ""
  }
]);
  const [sleepRecords, setSleepRecords] = useState([
  {
    "id": 1,
    "date": "2026-05-04",
    "start": "22:30",
    "end": "06:30",
    "type": "夜眠",
    "note": ""
  },
  {
    "id": 2,
    "date": "2026-05-05",
    "start": "09:00",
    "end": "10:30",
    "type": "睡覺",
    "note": ""
  },
  {
    "id": 3,
    "date": "2026-05-05",
    "start": "13:00",
    "end": "14:45",
    "type": "睡覺",
    "note": ""
  },
  {
    "id": 4,
    "date": "2026-05-04",
    "start": "09:30",
    "end": "11:00",
    "type": "睡覺",
    "note": ""
  }
]);
  const [growthRecords, setGrowthRecords] = useState([
  {
    "id": 1,
    "date": "2026-05-01",
    "weight": 3.2,
    "height": 50,
    "head": 34
  },
  {
    "id": 2,
    "date": "2026-05-15",
    "weight": 3.8,
    "height": 52,
    "head": 35
  }
]);
  const [fetalRecords, setFetalRecords] = useState([]);
  const [vaccineRecords, setVaccineRecords] = useState([
  {
    "id": 1,
    "date": "2026-05-10",
    "name": "B型肝炎第一劑",
    "hospital": "台大醫院",
    "note": ""
  },
  {
    "id": 2,
    "date": "2026-06-01",
    "name": "卡介苗",
    "hospital": "台大醫院",
    "note": "正常"
  }
]);
  const [tempRecords, setTempRecords] = useState([
  {
    "id": 1,
    "date": "2026-05-05",
    "time": "08:00",
    "temp": 36.8,
    "note": "正常"
  }
]);
  const [tasks, setTasks] = useState([
  {
    "id": 1,
    "name": "每日喝水2000ml",
    "category": "健康",
    "points": 10,
    "count": 3
  },
  {
    "id": 2,
    "name": "陪寶寶說話15分鐘",
    "category": "親子",
    "points": 15,
    "count": 1
  },
  {
    "id": 3,
    "name": "散步30分鐘",
    "category": "運動",
    "points": 20,
    "count": 0
  },
  {
    "id": 4,
    "name": "記錄寶寶狀況",
    "category": "日常",
    "points": 5,
    "count": 8
  }
]);
  const [otherTasks, setOtherTasks] = useState([
  {
    "id": 101,
    "name": "完成胎教音樂100次",
    "category": "親子",
    "points": 50,
    "count": 12
  },
  {
    "id": 102,
    "name": "準備待產包",
    "category": "日常",
    "points": 100,
    "count": 1
  }
]);
  const [achievePoints, setAchievePoints] = useState(350);
  const [rewards, setRewards] = useState([
  {
    "id": 1,
    "name": "按摩30分鐘",
    "points": 200,
    "icon": "💆"
  },
  {
    "id": 2,
    "name": "吃大餐一次",
    "points": 500,
    "icon": "🍽"
  },
  {
    "id": 3,
    "name": "買件新衣服",
    "points": 300,
    "icon": "👗"
  },
  {
    "id": 4,
    "name": "睡到自然醒",
    "points": 150,
    "icon": "😴"
  },
  {
    "id": 5,
    "name": "老公包辦家事一天",
    "points": 400,
    "icon": "🧹"
  }
]);
  const [badges, setBadges] = useState([
  {
    "id": "b1",
    "icon": "😊",
    "name": "第一次微笑",
    "desc": "寶寶第一次對你微笑",
    "condition": "points",
    "target": 100,
    "unlocked": true,
    "date": "2026-05-03"
  },
  {
    "id": "b2",
    "icon": "💪",
    "name": "超級媽咪",
    "desc": "累積完成50個任務",
    "condition": "tasks",
    "target": 50,
    "unlocked": false,
    "date": null
  },
  {
    "id": "b3",
    "icon": "🌟",
    "name": "點數達人",
    "desc": "累積獲得500點",
    "condition": "points",
    "target": 500,
    "unlocked": false,
    "date": null
  },
  {
    "id": "b4",
    "icon": "🔥",
    "name": "七日連續打卡",
    "desc": "連續7天完成任務",
    "condition": "tasks",
    "target": 7,
    "unlocked": false,
    "date": null
  },
  {
    "id": "b5",
    "icon": "👨‍👩‍👧",
    "name": "幸福家庭",
    "desc": "累積100次陪伴記錄",
    "condition": "tasks",
    "target": 100,
    "unlocked": false,
    "date": null
  },
  {
    "id": "b6",
    "icon": "💰",
    "name": "點數千萬富翁",
    "desc": "累積獲得1000點",
    "condition": "points",
    "target": 1000,
    "unlocked": false,
    "date": null
  }
]);
  const [achieveTimeline, setAchieveTimeline] = useState([
  {
    "id": 1,
    "type": "task",
    "text": "完成任務「每日喝水2000ml」，獲得 10 點數",
    "time": "2026-05-05 08:30"
  },
  {
    "id": 2,
    "type": "redeem",
    "text": "兌換了獎勵：按摩30分鐘",
    "time": "2026-05-04 20:00"
  },
  {
    "id": 3,
    "type": "badge",
    "text": "解鎖成就徽章：第一次微笑",
    "time": "2026-05-03 15:22"
  }
]);
  const [customCategories, setCustomCategories] = useState({ baby:[], mom:[], dad:[] });
  const [memoList, setMemoList] = useState([
  {
    "id": 1778166585302,
    "text": "6/27婦幼展",
    "detail": "小獅王\n千元什麼的",
    "done": false
  },
  {
    "id": 1778166597655,
    "text": "6/5產檢",
    "detail": "",
    "done": false
  },
  {
    "id": 1778166614309,
    "text": "6/5 11:30果然匯",
    "detail": "",
    "done": false
  }
]); // per-account custom categories

  function handleRestore(data) {
    const CAT_MIGRATE = { "醫療/健康":"醫療", "寢具/推車":"其他" };
    if (data.expenses) setExpenses(data.expenses.map(e => ({ ...e, category: CAT_MIGRATE[e.category] || e.category })));
    if (data.deposits) setDeposits(data.deposits);
    if (data.health) setHealth(data.health);
    if (data.feedingRecords) setFeedingRecords(data.feedingRecords);
    if (data.diaperRecords) setDiaperRecords(data.diaperRecords);
    if (data.sleepRecords) setSleepRecords(data.sleepRecords);
    if (data.growthRecords) setGrowthRecords(data.growthRecords);
    if (data.fetalRecords) setFetalRecords(data.fetalRecords);
    if (data.vaccineRecords) setVaccineRecords(data.vaccineRecords);
    if (data.tempRecords) setTempRecords(data.tempRecords);
    if (data.tasks) setTasks(data.tasks);
    if (data.otherTasks) setOtherTasks(data.otherTasks);
    if (data.achievePoints != null) setAchievePoints(data.achievePoints);
    if (data.rewards) setRewards(data.rewards);
    if (data.badges) setBadges(data.badges);
    if (data.achieveTimeline) setAchieveTimeline(data.achieveTimeline);
    if (data.memoList) setMemoList(data.memoList);
    if (data.customCategories) setCustomCategories(data.customCategories);
    if (data.dueDateStr) setDueDateStr(data.dueDateStr);
    if (data.isBorn != null) setIsBorn(data.isBorn);
    if (data.babyName) setBabyName(data.babyName);
  }

  const fileRef = useRef(null);

  // Due date / Birthday state
  const [dueDateStr, setDueDateStr] = useState("2026-08-21");
  const [isBorn, setIsBorn] = useState(false);
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [editDateStr, setEditDateStr] = useState("2026-08-21");
  const [editIsBorn, setEditIsBorn] = useState(false);

  // ── Firebase 同步：讀取 ──────────────────────────────────────
  const [fbLoaded, setFbLoaded] = useState(false);
  useEffect(() => {
    const dbRef = ref(db, 'xiamai');
    const unsub = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const CAT_MIGRATE = { "醫療/健康":"醫療", "寢具/推車":"其他" };
        if (data.expenses) setExpenses(data.expenses.map(e => ({ ...e, category: CAT_MIGRATE[e.category] || e.category })));
        if (data.deposits) setDeposits(data.deposits);
        if (data.health) setHealth(data.health);
        if (data.feedingRecords) setFeedingRecords(data.feedingRecords);
        if (data.diaperRecords) setDiaperRecords(data.diaperRecords);
        if (data.sleepRecords) setSleepRecords(data.sleepRecords);
        if (data.growthRecords) setGrowthRecords(data.growthRecords);
        if (data.fetalRecords) setFetalRecords(data.fetalRecords);
        if (data.vaccineRecords) setVaccineRecords(data.vaccineRecords);
        if (data.tempRecords) setTempRecords(data.tempRecords);
        if (data.tasks) setTasks(data.tasks);
        if (data.otherTasks) setOtherTasks(data.otherTasks);
        if (data.achievePoints != null) setAchievePoints(data.achievePoints);
        if (data.rewards) setRewards(data.rewards);
        if (data.badges) setBadges(data.badges);
        if (data.achieveTimeline) setAchieveTimeline(data.achieveTimeline);
        if (data.memoList) setMemoList(data.memoList);
        if (data.customCategories) setCustomCategories(data.customCategories);
        if (data.dueDateStr) setDueDateStr(data.dueDateStr);
        if (data.isBorn != null) setIsBorn(data.isBorn);
        if (data.babyName) setBabyName(data.babyName);
      }
      setFbLoaded(true);
    }, { onlyOnce: true });
    return () => unsub();
  }, []);

  // ── Firebase 同步：寫入 ──────────────────────────────────────
  useEffect(() => {
    if (!fbLoaded) return;
    const data = {
      expenses, deposits, health, feedingRecords, diaperRecords,
      sleepRecords, growthRecords, fetalRecords, vaccineRecords, tempRecords,
      tasks, otherTasks, achievePoints, rewards, badges,
      achieveTimeline, memoList, customCategories, dueDateStr, isBorn, babyName
    };
    set(ref(db, 'xiamai'), data);
  }, [fbLoaded, expenses, deposits, health, feedingRecords, diaperRecords,
      sleepRecords, growthRecords, fetalRecords, vaccineRecords, tempRecords,
      tasks, otherTasks, achievePoints, rewards, badges,
      achieveTimeline, memoList, customCategories, dueDateStr, isBorn, babyName]);



  // Calculations
  const today = new Date();
  today.setHours(0,0,0,0);
  const targetDate = new Date(dueDateStr);
  targetDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((targetDate - today) / 86400000);

  // Pregnancy weeks (only when not born)
  const pregnancyStart = new Date(targetDate.getTime() - 280 * 24 * 60 * 60 * 1000);
  const pregnancyTotalDays = Math.floor((today - pregnancyStart) / 86400000);
  const pregWeeks = Math.floor(pregnancyTotalDays / 7);
  const pregDays = pregnancyTotalDays % 7;

  // Age calculation (when born)
  function calcAge(birthDate) {
    let y = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    let d = today.getDate() - birthDate.getDate();
    if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    return { y, m, d, totalDays: Math.floor((today - birthDate) / 86400000) };
  }
  const age = isBorn ? calcAge(targetDate) : null;

  const { weeks, days } = { weeks: pregWeeks, days: pregDays };
  const daysLeft = diffDays;

  if (page === "expense") return <ExpensePage onBack={() => setPage("home")} expenses={expenses} setExpenses={setExpenses} deposits={deposits} setDeposits={setDeposits} customCategories={customCategories} setCustomCategories={setCustomCategories} />;
  if (page === "backup") return <BackupPage onBack={() => setPage("home")} onRestore={handleRestore} expenses={expenses} deposits={deposits} health={health} feedingRecords={feedingRecords} diaperRecords={diaperRecords} sleepRecords={sleepRecords} growthRecords={growthRecords} vaccineRecords={vaccineRecords} tempRecords={tempRecords} tasks={tasks} otherTasks={otherTasks} achievePoints={achievePoints} rewards={rewards} badges={badges} achieveTimeline={achieveTimeline} memoList={memoList} customCategories={customCategories} dueDateStr={dueDateStr} isBorn={isBorn} babyName={babyName} />;
  if (page === "全部記錄") return <AllRecordsPage onBack={() => setPage("home")} onSwitch={setPage} feedingRecords={feedingRecords} diaperRecords={diaperRecords} sleepRecords={sleepRecords} tempRecords={tempRecords} />;
  if (page === "餵養") return <FeedingPage onBack={() => setPage("home")} onSwitch={setPage} records={feedingRecords} setRecords={setFeedingRecords} initialTypeFilter={null} />;
  if (page === "尿布") return <DiaperPage onBack={() => setPage("home")} onSwitch={setPage} records={diaperRecords} setRecords={setDiaperRecords} />;
  if (page === "睡眠") return <SleepPage onBack={() => setPage("home")} onSwitch={setPage} records={sleepRecords} setRecords={setSleepRecords} />;
  if (page === "健康") return <HealthPage onBack={() => setPage("home")} growthRecords={growthRecords} setGrowthRecords={setGrowthRecords} fetalRecords={fetalRecords} setFetalRecords={setFetalRecords} vaccineRecords={vaccineRecords} setVaccineRecords={setVaccineRecords} tempRecords={tempRecords} setTempRecords={setTempRecords} isBorn={isBorn} dueDateStr={dueDateStr} />;
  if (page === "badge") return <AchievementPage onBack={() => setPage("home")} tasks={tasks} setTasks={setTasks} otherTasks={otherTasks} setOtherTasks={setOtherTasks} points={achievePoints} setPoints={setAchievePoints} rewards={rewards} setRewards={setRewards} badges={badges} setBadges={setBadges} timeline={achieveTimeline} setTimeline={setAchieveTimeline} />;

  return (
    <div style={{ minHeight:"100vh", background:"#F9F0E6", fontFamily:"sans-serif", maxWidth:430, margin:"0 auto", display:"block", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>

      <div style={{ margin:"16px 16px 0", background:"linear-gradient(140deg,#C8986A,#B8845A)", borderRadius:24, padding:"20px 20px 22px", boxShadow:"0 6px 24px rgba(150,100,60,0.25)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }}></div>
        <div style={{ position:"absolute", bottom:-20, left:-20, width:90, height:90, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}></div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
          <div onClick={() => fileRef.current.click()} style={{ width:88, height:88, borderRadius:"50%", background:"#F5E8D0", border:"3px solid rgba(255,255,255,0.7)", overflow:"hidden", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {babyPhoto
              ? <img src={babyPhoto} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="baby" />
              : <ImgOrEmoji src={IMGS["小麥寶寶"]} style={{ width:"95%", height:"95%", objectFit:"cover" }}/>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setBabyPhoto(ev.target.result); r.readAsDataURL(f); }} />
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              {editingName
                ? <input autoFocus value={nameInput} onChange={e=>setNameInput(e.target.value)}
                    onBlur={()=>{ setBabyName(nameInput); setEditingName(false); }}
                    onKeyDown={e=>{ if(e.key==="Enter"){ setBabyName(nameInput); setEditingName(false); }}}
                    style={{ fontSize:22, fontWeight:800, color:"white", background:"rgba(255,255,255,0.25)", border:"none", borderRadius:10, padding:"2px 10px", outline:"none", width:100, fontFamily:"inherit" }}/>
                : <span style={{ fontSize:24, fontWeight:800, color:"white", cursor:"pointer" }} onClick={()=>{ setNameInput(babyName); setEditingName(true); }}>{babyName}</span>
              }
              <span style={{ fontSize:20 }}>💛</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:20, padding:"5px 14px", display:"inline-block" }}>
              {isBorn
                ? <span style={{ fontSize:14, fontWeight:700, color:"white" }}>{age.y>0?age.y+"歲":""}{age.m>0?age.m+"個月":""}{age.d}天</span>
                : <span style={{ fontSize:14, fontWeight:700, color:"white" }}>懷孕第 {weeks} 週 {days} 天</span>
              }
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center" }}>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginBottom:2 }}>
              {isBorn ? "出生至今" : "距離見面還有"}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"white" }}>
                {isBorn ? <>{age.totalDays}<span style={{ fontSize:16, fontWeight:700 }}> 天</span></> : <>{daysLeft}<span style={{ fontSize:16, fontWeight:700 }}> 天</span></>}
              </span>
              <span style={{ fontSize:22 }}></span>
            </div>
          </div>
          <div style={{ width:1, height:40, background:"rgba(255,255,255,0.3)" }}></div>
          <div style={{ flex:1, textAlign:"center" }} onClick={()=>{ setEditDateStr(dueDateStr); setEditIsBorn(isBorn); setShowDateEdit(true); }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginBottom:2 }}>{isBorn?"生日":"預產期"}</div>
            <span style={{ fontSize:28, fontWeight:800, color:"white" }}>
              {targetDate.getMonth()+1} / {targetDate.getDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Date edit modal */}
      {showDateEdit && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#FDF8F3", borderRadius:24, padding:28, width:300, textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:17, color:"#5C4033", marginBottom:20 }}>
              {editIsBorn ? "修改生日" : "修改預產期"}
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={()=>setEditIsBorn(false)} style={{ flex:1, padding:"9px 0", borderRadius:12, border:"none", background:!editIsBorn?"linear-gradient(135deg,#C8986A,#B8845A)":"#EFE2CA", color:!editIsBorn?"white":"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>預產期</button>
              <button onClick={()=>setEditIsBorn(true)} style={{ flex:1, padding:"9px 0", borderRadius:12, border:"none", background:editIsBorn?"linear-gradient(135deg,#C8986A,#B8845A)":"#EFE2CA", color:editIsBorn?"white":"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>🎉 已出生</button>
            </div>
            <div style={{ textAlign:"left", marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#A0856C", marginBottom:6 }}>{editIsBorn?"寶寶生日":"預產期日期"}</div>
              <input type="date" value={editDateStr} onChange={e=>setEditDateStr(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #CFBBA2", borderRadius:12, fontSize:15, fontFamily:"inherit", color:"#5C4033", boxSizing:"border-box", outline:"none" }}/>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowDateEdit(false)} style={{ flex:1, padding:12, background:"#EFE2CA", border:"none", borderRadius:12, color:"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>取消</button>
              <button onClick={()=>{ setDueDateStr(editDateStr); setIsBorn(editIsBorn); setShowDateEdit(false); }} style={{ flex:2, padding:12, background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>儲存</button>
            </div>
          </div>
        </div>
      )}

      {editingHealth ? (
        <div style={{ margin:"12px 16px 0", background:"#FDF8F3", borderRadius:18, padding:16, border:"1px solid #EFE2CA" }}>
          <div style={{ fontWeight:700, color:"#5C4033", fontSize:14, marginBottom:12 }}>更新健康數據</div>
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            {(isBorn
              ? [["weight","體重","kg"],["height","身高","cm"],["head","頭寬","cm"]]
              : [["weight","體重","g"],["head","頭寬","cm"],["weeks","週數","週"]]
            ).map(([k,label,unit]) => (
              <div key={k} style={{ flex:1 }}>
                <div style={{ fontSize:11, color:"#A0856C", marginBottom:4 }}>{label}({unit})</div>
                <input type="number" placeholder="--" value={healthForm[k]||""} onChange={e => setHealthForm(p => ({...p, [k]:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #CFBBA2", borderRadius:10, fontSize:14, fontFamily:"inherit", color:"#5C4033", background:"#FFFDF9", boxSizing:"border-box", outline:"none", textAlign:"center" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setEditingHealth(false)} style={{ flex:1, padding:"9px 0", background:"#EFE2CA", border:"none", borderRadius:12, color:"#A0856C", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>取消</button>
            <button onClick={() => { setHealth(healthForm); setEditingHealth(false); }} style={{ flex:2, padding:"9px 0", background:"linear-gradient(135deg,#C8986A,#B8845A)", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>儲存</button>
          </div>
        </div>
      ) : (
        <div onClick={() => { setHealthForm(health); setEditingHealth(true); }} style={{ margin:"12px 16px 0", background:"#FDF8F3", borderRadius:18, padding:"14px 16px", border:"1px solid #EFE2CA", cursor:"pointer" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontWeight:700, color:"#5C4033", fontSize:14 }}>健康數據</span>
            <span style={{ fontSize:12, color:"#AF9273" }}>點擊更新</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {(isBorn
              ? [["體重",health.weight,"kg","⚖️"],["身高",health.height,"cm","📏"],["頭寬",health.head,"cm","👶🏻"]]
              : [["體重",health.weight,"g","⚖️"],["頭寬",health.head,"cm","👶🏻"],["週數",health.weeks,"週","🤰"]]
            ).map(([label,val,unit,icon]) => (
              <div key={label} style={{ flex:1, background:"linear-gradient(135deg,#EFE2CA,#F0E0C8)", borderRadius:14, padding:"10px 8px", textAlign:"center" }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:val?18:14, fontWeight:800, color:val?"#8A6946":"#CFBBA2", marginBottom:2 }}>{val || "--"}</div>
                <div style={{ fontSize:10, color:"#A0856C" }}>{label}{val?" "+unit:""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 備忘錄 ── */}
      <MemoBlock memoList={memoList} setMemoList={setMemoList} />

      <div style={{ padding:"12px 16px 0", flex:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {MENU.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ background:"#FDF8F3", borderRadius:20, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", border:"1px solid #EFE2CA", fontFamily:"inherit", textAlign:"left" }}
              onTouchStart={e => e.currentTarget.style.transform="scale(0.96)"}
              onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
              onMouseDown={e => e.currentTarget.style.transform="scale(0.96)"}
              onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
            >
              <div style={{ width:62, height:62, borderRadius:"50%", background:item.bg, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <ImgOrEmoji src={IMGS[item.imgKey]} style={{ width:"52px", height:"52px", objectFit:"cover" }} alt={item.label}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:16, color:"#5C4033" }}>{item.label}</div>
              </div>
            </button>
          ))}
          <button onClick={() => setPage("backup")} style={{ background:"#FDF8F3", borderRadius:20, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", border:"1px solid #EFE2CA", fontFamily:"inherit", textAlign:"left", gridColumn:"1 / -1" }}
            onTouchStart={e => e.currentTarget.style.transform="scale(0.96)"}
            onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}
            onMouseDown={e => e.currentTarget.style.transform="scale(0.96)"}
            onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
          >
            <div style={{ width:62, height:62, borderRadius:"50%", background:"#EAF3EC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:30 }}>☁️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:16, color:"#5C4033" }}>資料備份</div>
              <div style={{ fontSize:12, color:"#A0856C", marginTop:2 }}>匯出 / 匯入記錄</div>
            </div>
          </button>
        </div>
      </div>

      <div style={{ height:24 }}></div>
    </div>
  );
}


export default BabyApp;