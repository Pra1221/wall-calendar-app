import { useState, useEffect, useRef } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const MONTH_CONFIGS = [
  { url:"https://images.unsplash.com/photo-1478719059408-592965723cbc?w=800&q=80", label:"Snowy Peaks",     p:["#c9d6df","#52616b","#1e2832"] },
  { url:"https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80", label:"Winter Bloom",   p:["#f7e6d3","#c0847a","#7a4c51"] },
  { url:"https://images.unsplash.com/photo-1490750967868-88df5691cc5e?w=800&q=80", label:"Spring Blossom", p:["#fce4ec","#e8789a","#880e4f"] },
  { url:"https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80", label:"April Meadow",   p:["#e8f5e9","#4caf50","#1b5e20"] },
  { url:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80", label:"Golden Hour",    p:["#fff8e1","#ffb300","#e65100"] },
  { url:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", label:"Summer Waves",   p:["#e0f7fa","#00acc1","#006064"] },
  { url:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", label:"Midsummer",      p:["#fff3e0","#fb8c00","#bf360c"] },
  { url:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", label:"Coastal Drift",  p:["#e3f2fd","#42a5f5","#0d47a1"] },
  { url:"https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80", label:"Harvest Light",  p:["#fbe9e7","#ff7043","#bf360c"] },
  { url:"https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&q=80", label:"Autumn Forest",  p:["#efebe9","#a1887f","#4e342e"] },
  { url:"https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80", label:"First Frost",    p:["#e8eaf6","#7986cb","#283593"] },
  { url:"https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&q=80", label:"Winter Solstice",p:["#e3f2fd","#90caf9","#0d47a1"] },
];

const HOLIDAYS = {
  "1-1":"New Year's Day","1-20":"MLK Jr. Day","2-17":"Presidents' Day",
  "5-26":"Memorial Day","6-19":"Juneteenth","7-4":"Independence Day",
  "9-1":"Labor Day","11-27":"Thanksgiving","12-25":"Christmas Day",
};

function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function firstDay(y,m){ return new Date(y,m,1).getDay(); }
function same(a,b){ return a&&b&&a.toDateString()===b.toDateString(); }
function inRange(d,s,e){
  if(!s||!e) return false;
  const [lo,hi]=s<=e?[s,e]:[e,s];
  return d>lo&&d<hi;
}
function fmt(d){ return d?`${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`:"";}
function hkey(d){ return `${d.getMonth()+1}-${d.getDate()}`; }

export default function WallCalendar(){
  const today=new Date();
  const [yr,setYr]=useState(today.getFullYear());
  const [mo,setMo]=useState(today.getMonth());
  const [rs,setRs]=useState(null);
  const [re,setRe]=useState(null);
  const [hover,setHover]=useState(null);
  const [picking,setPicking]=useState(false);
  const [notes,setNotes]=useState({});
  const [noteText,setNoteText]=useState("");
  const [noteTab,setNoteTab]=useState("month");
  const [theme,setTheme]=useState("warm");
  const [imgOk,setImgOk]=useState(false);
  const [animKey,setAnimKey]=useState(0);
  const [toast,setToast]=useState("");
  const [mobile,setMobile]=useState(window.innerWidth<660);

  useEffect(()=>{
    const handler=()=>setMobile(window.innerWidth<660);
    window.addEventListener("resize",handler);
    return ()=>window.removeEventListener("resize",handler);
  },[]);

  const cfg=MONTH_CONFIGS[mo];
  const [p0,p1,p2]=cfg.p;

  const themes={
    warm:{"--bg":"#fdf6ee","--surf":"#ffffff","--tx":"#2c2118","--mu":"#a08878","--acc":p1,"--acc2":p2,"--wire":"#a1887f","--hov":p0+"bb"},
    cool:{"--bg":"#f0f4f8","--surf":"#ffffff","--tx":"#1a2332","--mu":"#6b7f96","--acc":"#3b82f6","--acc2":"#1e40af","--wire":"#64748b","--hov":"#dbeafe"},
    dark:{"--bg":"#12121e","--surf":"#1e1e30","--tx":"#e0e0f0","--mu":"#7878a0","--acc":p1,"--acc2":p0,"--wire":"#383860","--hov":"#2a2a40"},
  };
  const tv=themes[theme];

  useEffect(()=>{ setImgOk(false); },[mo]);
  const showToast=msg=>{ setToast(msg); setTimeout(()=>setToast(""),2200); };

  const navigate=dir=>{
    setAnimKey(k=>k+1);
    setMo(prev=>{
      let nm=prev+dir;
      if(nm<0){setYr(y=>y-1);return 11;}
      if(nm>11){setYr(y=>y+1);return 0;}
      return nm;
    });
  };

  const clickDay=date=>{
    if(!picking){
      setRs(date); setRe(null); setPicking(true);
    } else {
      if(same(date,rs)){ setPicking(false); return; }
      const [s,e]=date>=rs?[rs,date]:[date,rs];
      setRs(s); setRe(e); setPicking(false);
      setNoteTab("range");
    }
  };

  const noteKey= noteTab==="month"
    ? `${yr}-${mo}`
    : rs?`${yr}-${mo}-${rs.getDate()}-${re?.getDate()??""}` :"";

  useEffect(()=>{ setNoteText(notes[noteKey]||""); },[noteKey, notes]);

  const saveNote=()=>{ setNotes(n=>({...n,[noteKey]:noteText})); showToast("Note saved ✓"); };

  const dim=daysInMonth(yr,mo);
  const fd=firstDay(yr,mo);
  const total=Math.ceil((fd+dim)/7)*7;
  const cells=Array.from({length:total},(_,i)=>{
    const d=i-fd+1;
    return d>=1&&d<=dim?new Date(yr,mo,d):null;
  });

  const monthHolidays=Object.entries(HOLIDAYS).filter(([k])=>+k.split("-")[0]===mo+1);

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"var(--bg)",padding:"clamp(10px,3vw,36px)",fontFamily:"'Playfair Display',Georgia,serif",
      transition:"background 0.4s",...tv}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .day{cursor:pointer;transition:transform 0.13s,background 0.13s;}
        .day:hover{transform:scale(1.12);}
        .fade-in{animation:fadein 0.38s ease both;}
        @keyframes fadein{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        .toast-anim{animation:tin 0.28s ease,tout 0.28s ease 1.9s forwards;}
        @keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        @keyframes tout{to{opacity:0;transform:translateX(-50%) translateY(10px);}}
        textarea{resize:vertical;font-family:'DM Sans',sans-serif;}
        textarea:focus,button:focus{outline:2px solid var(--acc);outline-offset:2px;}
        button{font-family:'DM Sans',sans-serif;}
      `}</style>

      <div style={{width:"100%",maxWidth:880}}>
        {/* Binding holes */}
        <div style={{display:"flex",gap:"clamp(50px,13vw,130px)",justifyContent:"center",position:"relative",zIndex:10,marginBottom:-13}}>
          {[0,1].map(i=>(
            <div key={i} style={{width:26,height:26,borderRadius:"50%",background:"var(--bg)",border:"3px solid var(--wire)",
              boxShadow:"inset 0 2px 4px rgba(0,0,0,0.22)"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:"var(--wire)",opacity:0.55,margin:"5px auto"}}/>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{background:"var(--surf)",borderRadius:14,
          boxShadow:"0 10px 48px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.07)",
          overflow:"hidden",position:"relative"}}>

          {/* Ring bar */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:10,
            background:"var(--wire)",zIndex:5,borderRadius:"14px 14px 0 0",
            boxShadow:"0 2px 6px rgba(0,0,0,0.25)"}}/>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"18px 22px 12px",borderBottom:"1px solid rgba(128,128,128,0.1)",
            flexWrap:"wrap",gap:10,marginTop:6}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>navigate(-1)} style={{background:"none",border:"none",cursor:"pointer",
                fontSize:24,color:"var(--mu)",padding:"2px 6px",lineHeight:1,borderRadius:6}}>‹</button>
              <div style={{textAlign:"center",minWidth:160}}>
                <div style={{fontSize:"clamp(1.5rem,4.5vw,2.1rem)",fontWeight:900,color:"var(--tx)",
                  letterSpacing:"-0.02em",lineHeight:1}}>{MONTHS[mo]}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--mu)",
                  fontWeight:300,letterSpacing:"0.14em"}}>{yr}</div>
              </div>
              <button onClick={()=>navigate(1)} style={{background:"none",border:"none",cursor:"pointer",
                fontSize:24,color:"var(--mu)",padding:"2px 6px",lineHeight:1,borderRadius:6}}>›</button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {[["warm","#d4845a"],["cool","#4a9af5"],["dark","#8b8bb8"]].map(([t,c])=>(
                <button key={t} onClick={()=>setTheme(t)} title={`${t} theme`}
                  style={{width:20,height:20,borderRadius:"50%",background:c,border:theme===t?"3px solid var(--tx)":"2px solid transparent",
                    cursor:"pointer",transition:"transform 0.18s"}}
                  onMouseEnter={e=>e.target.style.transform="scale(1.2)"}
                  onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
              ))}
              <button onClick={()=>{setYr(today.getFullYear());setMo(today.getMonth());setAnimKey(k=>k+1);}}
                style={{fontSize:11,fontWeight:500,background:"var(--acc)",color:"#fff",border:"none",
                  borderRadius:20,padding:"5px 13px",cursor:"pointer",letterSpacing:"0.06em"}}>TODAY</button>
            </div>
          </div>

          {/* Body */}
          <div style={{display:"flex",flexDirection:mobile?"column":"row",minHeight:420}}>

            {/* Hero */}
            <div style={{width:mobile?"100%":"clamp(170px,30%,260px)",minHeight:mobile?190:420,
              flexShrink:0,position:"relative",overflow:"hidden",background:p2,
              borderRadius:mobile?"0":"0"}}>
              {!imgOk&&(
                <div style={{position:"absolute",inset:0,background:`linear-gradient(145deg,${p2},${p1})`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",
                    border:"3px solid rgba(255,255,255,0.35)",borderTopColor:"rgba(255,255,255,0.9)",
                    animation:"spin 0.75s linear infinite"}}/>
                  <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
                </div>
              )}
              <img src={cfg.url} alt={cfg.label} onLoad={()=>setImgOk(true)}
                style={{width:"100%",height:"100%",objectFit:"cover",
                  display:imgOk?"block":"none",opacity:imgOk?1:0,transition:"opacity 0.5s"}}/>
              {/* Overlay */}
              <div style={{position:"absolute",bottom:0,left:0,right:0,
                padding:"40px 14px 14px",background:"linear-gradient(transparent,rgba(0,0,0,0.5))"}}>
                <div style={{color:"rgba(255,255,255,0.85)",fontSize:10,fontFamily:"'DM Sans',sans-serif",
                  letterSpacing:"0.15em",textTransform:"uppercase"}}>{cfg.label}</div>
              </div>
              {/* Watermark */}
              <div style={{position:"absolute",top:14,right:10,fontSize:"clamp(3rem,9vw,5.5rem)",
                fontWeight:900,fontStyle:"italic",color:"rgba(255,255,255,0.12)",
                lineHeight:1,pointerEvents:"none",userSelect:"none"}}>
                {String(mo+1).padStart(2,"0")}
              </div>
            </div>

            {/* Grid */}
            <div style={{flex:1,padding:"clamp(12px,2vw,20px)",display:"flex",flexDirection:"column",gap:8}}>
              {/* Selection bar */}
              {(rs||picking)&&(
                <div style={{padding:"8px 14px",background:"var(--hov)",borderRadius:8,
                  display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,
                  fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--tx)",flexWrap:"wrap"}}>
                  <span style={{fontWeight:500}}>
                    {picking?`📍 From ${fmt(rs)} — pick end date`:
                     re?`📅 ${fmt(rs)} → ${fmt(re)}`:
                     `📍 ${fmt(rs)} — click another date to set range`}
                  </span>
                  <button onClick={()=>{setRs(null);setRe(null);setPicking(false);setNoteTab("month");}}
                    style={{background:"none",border:"none",cursor:"pointer",color:"var(--mu)",fontSize:15}}>✕</button>
                </div>
              )}

              {/* Day headers */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
                {DAYS_SHORT.map(d=>(
                  <div key={d} style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",
                    fontSize:10,fontWeight:500,color:"var(--mu)",letterSpacing:"0.1em",
                    textTransform:"uppercase",padding:"2px 0"}}>{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div key={animKey} className="fade-in"
                style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",flex:1,gap:"2px 1px"}}>
                {cells.map((date,i)=>{
                  if(!date) return <div key={i}/>;
                  const isToday=same(date,today);
                  const isStart=same(date,rs);
                  const isEnd=re&&same(date,re);
                  const inR=inRange(date,rs,re||(picking?hover:null));
                  const weekend=date.getDay()===0||date.getDay()===6;
                  const holiday=HOLIDAYS[hkey(date)];
                  const hasNote=Object.keys(notes).some(k=>k.startsWith(`${yr}-${mo}-${date.getDate()}`));

                  let bg="transparent";
                  let tx=weekend?"var(--acc2)":"var(--tx)";
                  if(inR) bg=p0+"99";
                  if(isStart||isEnd){ bg="var(--acc)"; tx="#fff"; }
                  else if(isToday) bg="var(--hov)";

                  const bRadius=isStart?"50% 8px 8px 50%":isEnd?"8px 50% 50% 8px":inR?"0":8;

                  return (
                    <div key={i} className="day"
                      onClick={()=>clickDay(date)}
                      onMouseEnter={()=>picking&&setHover(date)}
                      onMouseLeave={()=>picking&&setHover(null)}
                      title={holiday||undefined}
                      style={{display:"flex",flexDirection:"column",alignItems:"center",
                        justifyContent:"center",borderRadius:bRadius,background:bg,color:tx,
                        fontFamily:"'DM Sans',sans-serif",fontWeight:isToday?700:400,
                        fontSize:"clamp(11px,2.2vw,14px)",minHeight:"clamp(32px,6.5vw,46px)",
                        userSelect:"none",position:"relative"}}>
                      <span>{date.getDate()}</span>
                      <div style={{display:"flex",gap:2,marginTop:1}}>
                        {isToday&&<span style={{width:4,height:4,borderRadius:"50%",
                          background:(isStart||isEnd)?"rgba(255,255,255,0.8)":"var(--acc)",display:"block"}}/>}
                        {holiday&&<span style={{width:4,height:4,borderRadius:"50%",
                          background:"#f97316",display:"block"}}/>}
                        {hasNote&&<span style={{width:4,height:4,borderRadius:"50%",
                          background:"#8b5cf6",display:"block"}}/>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{display:"flex",gap:14,flexWrap:"wrap",fontFamily:"'DM Sans',sans-serif",
                fontSize:10,color:"var(--mu)",letterSpacing:"0.05em"}}>
                {[["var(--acc)","Selected"],["#f97316","Holiday"],["#8b5cf6","Note"],["var(--hov)","Today"]].map(([c,l])=>(
                  <span key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block",flexShrink:0,border:"1px solid rgba(0,0,0,0.08)"}}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Notes section */}
          <div style={{borderTop:"1px solid rgba(128,128,128,0.1)",padding:"16px 22px 22px",
            background:theme==="dark"?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.015)"}}>

            {/* Tabs */}
            <div style={{display:"flex",marginBottom:12,background:"var(--hov)",borderRadius:8,padding:3,width:"fit-content"}}>
              {[["month",`📋 ${MONTHS[mo].slice(0,3)} Notes`],["range","📌 Selection Notes"]].map(([tab,label])=>(
                <button key={tab} onClick={()=>setNoteTab(tab)}
                  style={{fontSize:11,fontWeight:500,padding:"6px 13px",border:"none",borderRadius:6,
                    cursor:"pointer",background:noteTab===tab?"var(--surf)":"transparent",
                    color:noteTab===tab?"var(--tx)":"var(--mu)",
                    boxShadow:noteTab===tab?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all 0.18s"}}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
              {/* Textarea */}
              <div style={{flex:"1 1 240px"}}>
                {noteTab==="range"&&!rs&&(
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--mu)",
                    fontStyle:"italic",marginBottom:8}}>
                    Select a date range on the calendar to attach a note.
                  </p>
                )}
                <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                  disabled={noteTab==="range"&&!rs}
                  placeholder={noteTab==="month"
                    ?`Your ${MONTHS[mo]} plans & thoughts…`
                    :rs?`Notes for ${fmt(rs)}${re?" → "+fmt(re):""}…`
                    :"Select a range first…"}
                  style={{width:"100%",minHeight:78,padding:"10px 13px",borderRadius:10,
                    border:"1.5px solid rgba(128,128,128,0.18)",background:"var(--surf)",
                    color:"var(--tx)",fontSize:13,lineHeight:1.6,
                    opacity:(noteTab==="range"&&!rs)?0.5:1}}/>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={saveNote}
                    style={{fontSize:11,fontWeight:500,padding:"8px 20px",background:"var(--acc)",
                      color:"#fff",border:"none",borderRadius:20,cursor:"pointer",letterSpacing:"0.06em"}}>
                    Save Note
                  </button>
                  {noteText&&(
                    <button onClick={()=>setNoteText("")}
                      style={{fontSize:11,padding:"8px 14px",background:"transparent",color:"var(--mu)",
                        border:"1px solid var(--mu)",borderRadius:20,cursor:"pointer"}}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Holiday sidebar */}
              <div style={{flex:"1 1 180px"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:500,
                  color:"var(--mu)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>
                  Holidays this month
                </div>
                {monthHolidays.length===0
                  ?<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--mu)",fontStyle:"italic"}}>None</p>
                  :monthHolidays.map(([k,name])=>(
                    <div key={k} style={{display:"flex",gap:10,marginBottom:6,alignItems:"baseline"}}>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,
                        color:"var(--acc2)",minWidth:22,flexShrink:0}}>
                        {k.split("-")[1]}
                      </span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--tx)"}}>{name}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* Shadow under card */}
        <div style={{height:7,background:"linear-gradient(rgba(0,0,0,0.07),transparent)",
          borderRadius:"0 0 10px 10px",marginTop:-2}}/>
      </div>

      {/* Toast */}
      {toast&&(
        <div className="toast-anim" style={{position:"fixed",bottom:28,left:"50%",
          transform:"translateX(-50%)",background:"var(--tx)",color:"var(--bg)",
          padding:"9px 22px",borderRadius:22,fontFamily:"'DM Sans',sans-serif",
          fontSize:12,fontWeight:500,zIndex:9999,pointerEvents:"none",
          boxShadow:"0 4px 18px rgba(0,0,0,0.2)"}}>
          {toast}
        </div>
      )}
    </div>
  );
}