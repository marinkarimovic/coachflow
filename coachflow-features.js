/* CoachFlow v1.8 — local-first attendance, youth development and tournament teams.
 * No personal data is sent by this module. Storage uses the existing CoachFlow
 * snapshot, and reaches Supabase only when the user triggers the existing cloud backup.
 */
(function(){
  'use strict';
  const ROOT_ID='cf-features-root';
  const LEVELS=[{id:'A',name:'A · Weit entwickelt',weight:4,color:'#bdf576'},
    {id:'B',name:'B · Fortgeschritten',weight:3,color:'#61bac1'},
    {id:'C',name:'C · In Entwicklung',weight:2,color:'#edc569'},
    {id:'D',name:'D · Mehr Begleitung',weight:1,color:'#b4a5d9'}];
  const GROUP_COLORS={Blau:'#49c9e0',Gelb:'#f3cc59',Weiß:'#e2e9eb',Schwarz:'#7d949a'};
  const ui={page:null,month:new Date().toISOString().slice(0,7),selected:null,manualDate:'',manualTitle:'',attendanceDraft:{},rosterFilter:'all',count:4,mode:'balanced',source:'present',proposal:null,teamDate:new Date().toISOString().slice(0,10),teamName:'Funino-Spieltag',teamSelection:null,participantOpen:false};
  const $=(q,root=document)=>root.querySelector(q);
  const $$=(q,root=document)=>Array.from(root.querySelectorAll(q));
  const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const bridge=()=>window.coachflowBridge;
  const read=()=>bridge()?.getState()||null;
  const items=d=>(d?.sessions||[]).concat(d?.current?[d.current]:[]).filter(x=>x?.date&&x.id).sort((a,b)=>b.date.localeCompare(a.date));
  const extras=d=>d?.extensionsV18||{};
  const entries=d=>extras(d).attendanceEntries||{};
  const assessment=d=>extras(d).development||{};
  const savedTeams=d=>extras(d).tournaments||[];
  const matchReports=d=>extras(d).matchdayReports||[];
  const recordedMinutes=(d,id)=>matchReports(d).reduce((sum,report)=>sum+(report.games||[]).reduce((t,g)=>t+Number(g.minutes?.[id]||0),0),0);
  const historicalPairs=d=>{const counts=new Map();for(const tournament of savedTeams(d))for(const team of tournament.teams||[]){const ids=[...new Set(team.members||[])];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const key=[ids[i],ids[j]].sort().join("|");counts.set(key,(counts.get(key)||0)+1)}}return counts};
  const commit=fn=>{const b=bridge();if(!b?.mutate)throw new Error('Die App muss aktualisiert werden.');b.mutate(d=>{if(!d.extensionsV18)d.extensionsV18={attendanceEntries:{},development:{},tournaments:[]};const x=d.extensionsV18;x.attendanceEntries||={};x.development||={};x.tournaments||=[];fn(d,x)});};
  const dateLabel=iso=>{const dt=new Date(`${iso}T12:00:00`);return isNaN(dt.getTime())?iso:new Intl.DateTimeFormat('de-AT',{day:'2-digit',month:'2-digit',year:'numeric'}).format(dt)};
  const playerName=(d,id)=>d.players.find(p=>p.id===id)?.name||'Nicht mehr im Kader';
  const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(new Date(x+'T12:00:00').getTime())&&new Date(x+'T12:00:00').toISOString().slice(0,10)===x;
  const notice=msg=>{const el=$('#cfx-notice');if(el){el.textContent=msg;el.hidden=false;setTimeout(()=>{if(el.textContent===msg)el.hidden=true},5500);}};
  const counts=(d,month)=>{
    const events=Object.values(entries(d)).filter(e=>e?.date?.slice(0,7)===month&&e.confirmed===true).sort((a,b)=>a.date.localeCompare(b.date));
    const people=d.players.map(p=>{
      let present=0,excused=0,absent=0,unknown=0;
      for(const e of events){if(!e.playerIds?.includes(p.id))continue;
        const s=e.statuses?.[p.id]||'unknown';
        if(s==='present')present++;else if(s==='excused')excused++;else if(s==='absent')absent++;else unknown++;
      }
      const assessed=present+absent+excused;
      return {id:p.id,name:p.name,baseGroup:p.baseGroup,present,absent,excused,unknown,assessed,percentage:assessed?Math.round(present/assessed*100):null,
        allPresent:events.length>0&&events.every(e=>e.playerIds?.includes(p.id)&&e.statuses?.[p.id]==='present')};
    });
    return {events,people,perfect:people.filter(p=>p.allPresent),presentSum:people.reduce((n,p)=>n+p.present,0),knownSum:people.reduce((n,p)=>n+p.assessed,0)};
  };
  function style(){if($('#coachflow-features-style'))return;let el=document.createElement('style');el.id='coachflow-features-style';el.textContent=`
  .cfx-shortcuts{display:flex;flex-wrap:wrap;gap:9px;margin:15px 0 18px}
  .cfx-shortcuts button{border:1px solid #385451;border-radius:12px;background:#17302d;color:#d5faaa;padding:12px 14px;font-weight:750;font-size:14px;line-height:1.2;min-height:44px}
  #${ROOT_ID}{position:fixed;inset:0;z-index:1200;display:none;align-items:flex-end;justify-content:center;background:#000c;box-sizing:border-box}
  #${ROOT_ID}.show{display:flex}
  #${ROOT_ID} *{box-sizing:border-box}
  .cfx-dialog{background:#102327;border:1px solid #3d5959;color:#f5f8f6;width:min(760px,100%);max-height:calc(100dvh - 16px);overflow-y:auto;overscroll-behavior:contain;border-radius:23px 23px 0 0;box-shadow:0 -8px 35px #0006;padding:20px 16px calc(20px + env(safe-area-inset-bottom))}
  .cfx-head{display:flex;align-items:start;gap:12px;justify-content:space-between;margin-bottom:15px}
  .cfx-head h2{font-size:clamp(22px,5vw,30px);margin:0;color:#f7fbf7;line-height:1.15}
  .cfx-head .close{flex:none;width:44px;height:44px;font-size:25px}
  .cfx-sub{color:#a5bbbb;line-height:1.48;font-size:13px;margin:7px 0 15px}
  .cfx-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:16px}
  .cfx-tabs button{min-width:0;padding:10px 3px;border:1px solid #385251;border-radius:11px;background:#192e31;color:#b9cdcc;font-size:clamp(11px,3vw,14px);font-weight:700;min-height:44px}
  .cfx-tabs button.active{background:#325147;color:#bef675;border-color:#678960}
  .cfx-btn{cursor:pointer;background:#baf47d;color:#102019;border:0;border-radius:12px;padding:11px 15px;min-height:44px;font-size:14px;font-weight:800;text-align:center}
  .cfx-btn.secondary{background:#1d3637;color:#d8edef;border:1px solid #385b5e}
  .cfx-btn.warn{color:#efccaa;background:#34271b;border:1px solid #836047}
  .cfx-btn:disabled{opacity:.47;cursor:not-allowed}
  .cfx-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0 15px}
  .cfx-label{display:grid;gap:5px;font-size:13px;font-weight:750;color:#b7cccc;min-width:0;flex:1 1 125px}
  .cfx-input{background:#08191c;color:#f8faf8;border:1px solid #375253;border-radius:11px;font-size:16px;padding:10px;max-width:100%;min-height:43px;width:100%;font-family:inherit}
  .cfx-box{border:1px solid #314b4a;border-radius:14px;padding:13px;background:#162a2c;margin-bottom:12px;min-width:0}
  .cfx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .cfx-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:13px 0}
  .cfx-stat{border:1px solid #36524e;border-radius:12px;padding:10px 8px;background:#18302d;min-width:0}
  .cfx-stat strong{display:block;font-size:clamp(17px,4.8vw,26px);line-height:1.2}
  .cfx-stat span{display:block;font-size:11px;color:#b0c6c2;line-height:1.2;margin-top:4px}
  .cfx-line{display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid #304547;min-width:0}
  .cfx-line:last-child{border-bottom:0}
  .cfx-line .grow{flex:1;min-width:0;overflow-wrap:anywhere}
  .cfx-line small{color:#aac3c4;display:block;font-size:12px;margin-top:2px}
  .cfx-chip{font-size:11px;border:1px solid #4c6763;border-radius:20px;padding:5px 9px;white-space:nowrap}
  .cfx-choice{flex:none;max-width:140px;font-size:13px}
  .cfx-name{font-weight:750;font-size:14px}
  .cfx-alert{border:1px solid #527a60;background:#1a312b;border-radius:11px;color:#d9f7d0;padding:10px 12px;font-size:12px;line-height:1.45;margin:8px 0 13px}
  .cfx-alert.warning{background:#332b1d;border-color:#70603c;color:#f1d8a6}
  .cfx-month-row{display:flex;gap:7px;align-items:center;justify-content:space-between}
  .cfx-month-row button{flex:none}
  .cfx-calendar{display:flex;flex-wrap:wrap;gap:5px}
  .cfx-date{border:1px solid #445c5b;color:#d8efea;border-radius:9px;background:#1a3434;padding:8px;font-size:12px;min-height:38px}
  .cfx-date.active{border-color:#bdf576;color:#bdf576}
  .cfx-date.unsaved{opacity:.75}
  .cfx-score{font-size:12px;color:#afc4c1;white-space:nowrap}
  .cfx-level-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}
  .cfx-footer{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
  .cfx-footer .cfx-btn{flex:1 1 175px}
  .cfx-divider{border-top:1px solid #345052;margin:15px 0}
  .cfx-empty{color:#acc3bf;padding:10px 0;font-size:13px;line-height:1.4}
  .cfx-note{min-height:61px;resize:vertical}
  #cfx-notice{position:sticky;top:0;padding:11px 13px;border:1px solid #b9eb79;background:#223c31;color:#e7ffca;border-radius:11px;margin:0 0 10px;z-index:4}

  /* v1.9: respect the installed iPhone safe area, prevent native input overflow */
  #${ROOT_ID}{align-items:flex-start;padding-top:calc(env(safe-area-inset-top, 0px) + 10px);overflow:hidden}
  .cfx-dialog{max-height:100%;height:100%;min-height:0;overflow-x:hidden;overflow-y:auto;scrollbar-gutter:stable;scroll-padding-top:100px;border-radius:20px 20px 0 0;padding:12px clamp(12px,4vw,20px) calc(24px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}
  .cfx-head{position:sticky;top:0;z-index:9;min-width:0;align-items:center;margin:0 0 12px;padding:12px 0 15px;background:linear-gradient(180deg,#102327 85%,rgba(16,35,39,.97));border-bottom:1px solid #304747}
  .cfx-head > div{min-width:0;flex:1}
  .cfx-head h2{font-size:clamp(25px,6.5vw,33px);line-height:1.13;overflow-wrap:anywhere}
  .cfx-head .close{width:44px;height:44px;min-width:44px;flex:none}
  .cfx-tabs{gap:7px;margin:0 0 18px;width:100%}
  .cfx-tabs button{border-radius:13px;padding:10px 6px;min-width:0;min-height:48px;white-space:normal;line-height:1.2;text-align:center;font-size:clamp(12px,3.35vw,16px)}
  .cfx-tabs button.active{box-shadow:inset 0 0 0 1px rgba(190,246,117,.22)}
  .cfx-box,.cfx-stat,.cfx-label,.cfx-line,.cfx-calendar,.cfx-month-row{min-width:0}
  .cfx-box{overflow-wrap:break-word}
  .cfx-grid > *, .cfx-stats > * {min-width:0}
  .cfx-input{min-width:0;max-width:100%;width:100%;font-size:16px;box-sizing:border-box}
  .cfx-input[type=date],.cfx-input[type=time]{-webkit-appearance:none;appearance:none;min-width:0}
  .cfx-date{white-space:normal;text-align:left;line-height:1.35;overflow-wrap:anywhere;max-width:100%}
  .cfx-month-row{gap:10px}
  .cfx-month-row > *{min-width:0}
  .cfx-month-row .cfx-btn{flex:none}
  .cfx-choice{min-width:0;max-width:min(41%,155px)}
  .cfx-sub{font-size:14px;line-height:1.45}
  .cfx-stats .cfx-stat span{overflow-wrap:anywhere}
  .cfx-label{overflow-wrap:anywhere}
  @media(min-width:650px){#${ROOT_ID}{align-items:center;padding:18px}.cfx-dialog{height:auto;max-height:calc(100dvh - 36px);border-radius:20px}.cfx-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:600px){.cfx-grid{grid-template-columns:minmax(0,1fr)}.cfx-calendar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cfx-date{width:100%;padding:10px;min-height:55px}.cfx-adhoc-toolbar{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.cfx-adhoc-toolbar .cfx-btn{width:100%}.cfx-month-row:has(.cfx-chip){flex-wrap:wrap}.cfx-month-row{flex-wrap:nowrap}.cfx-month-row .cfx-btn{min-width:42px}}
  @media(max-width:390px){.cfx-dialog{padding-inline:12px}.cfx-tabs{gap:5px}.cfx-tabs button{padding:10px 4px;font-size:12px}.cfx-head h2{font-size:26px}.cfx-stats{gap:5px}.cfx-stat{padding:9px 7px}.cfx-calendar{grid-template-columns:minmax(0,1fr)}}

  @media(max-width:360px){.cfx-dialog{padding-left:11px;padding-right:11px}.cfx-line{gap:5px}.cfx-choice{max-width:112px}.cfx-stat{padding:8px 5px}.cfx-chip{padding:4px 6px}}
  `;document.head.append(el)}
  function launch(){const b=bridge();if(!b?.getState||!b?.mutate)return;style();let screen=$('#screen');if(!screen)return;let row=$('#cfx-shortcuts',screen);if(row)return;row=document.createElement('div');row.id='cfx-shortcuts';row.className='cfx-shortcuts';row.innerHTML='<button type="button" data-cfx="open" data-page="attendance">📅 Monatsanwesenheit</button><button type="button" data-cfx="open" data-page="development">⚽ Entwicklung</button><button type="button" data-cfx="open" data-page="tournament">🏆 Teamgenerator</button>';const head=$('.headline',screen);if(head)head.insertAdjacentElement('afterend',row);else screen.insertAdjacentElement('afterbegin',row)}
  function makeRoot(){style();let root=document.getElementById(ROOT_ID);if(!root){root=document.createElement('div');root.id=ROOT_ID;root.setAttribute('role','presentation');root.innerHTML='<div class="cfx-dialog" role="dialog" aria-modal="true" aria-label="SpielfeldIQ Spieler und Turniere"><div id="cfx-content"></div></div>';document.body.append(root)}return root}
  function open(page){ui.page=page;ui.proposal=null;draw();makeRoot().classList.add('show');document.body.style.overflow='hidden';const dialog=$('.cfx-dialog');if(dialog)dialog.scrollTop=0}
  function close(){ui.page=null;makeRoot().classList.remove('show');document.body.style.overflow=''}
  function layout(body){const names={attendance:'Anwesenheit',development:'Spielerentwicklung',tournament:'Turnier-Teams'};makeRoot();$('#cfx-content').innerHTML=`<div class="cfx-head"><div><div style="color:#bdf576;letter-spacing:2px;font-size:11px;font-weight:800">${esc(read()?.team||'COACHFLOW')} · ${esc(read()?.age||'TRAINERBEREICH')}</div><h2>${names[ui.page]}</h2></div><button class="cfx-btn secondary close" data-cfx="close" aria-label="Schließen">×</button></div><div class="cfx-tabs">${[['attendance','Anwesenheit'],['development','Entwicklung'],['tournament','Teams']].map(([id,label])=>`<button class="${ui.page===id?'active':''}" data-cfx="open" data-page="${id}">${label}</button>`).join('')}</div><div id="cfx-notice" hidden></div>${body}`}
  function draw(){if(!ui.page)return;const d=read();if(!d)return;layout(ui.page==='attendance'?renderAttendance(d):ui.page==='development'?renderDevelopment(d):renderTournament(d))}
  function monthShift(offset){const [y,m]=ui.month.split('-').map(Number);let day=new Date(y,m-1+offset,1,12);ui.month=day.toISOString().slice(0,7);ui.selected=null;draw()}
  function chooseAttendance(id){const d=read(),rec=entries(d)[id],s=items(d).find(x=>x.id===id);if(!s&&!rec)return;ui.selected=id;ui.manualDate='';ui.attendanceDraft={...(rec?.statuses||{})};draw()}
  function renderAttendance(d){const m=counts(d,ui.month);const relevant=items(d).filter(s=>s.date.slice(0,7)===ui.month);const recordSet=entries(d);let selected=ui.selected&&(relevant.find(s=>s.id===ui.selected)||recordSet[ui.selected]?.date.slice(0,7)===ui.month)?ui.selected:null;
    const eventList=relevant.map(s=>({id:s.id,date:s.date,label:s.theme,planned:s.status!=='done',confirmed:!!recordSet[s.id]?.confirmed})).concat(m.events.filter(e=>!relevant.some(s=>s.id===e.id)).map(e=>({id:e.id,date:e.date,label:e.label,planned:false,confirmed:true}))).sort((a,b)=>a.date.localeCompare(b.date));
    // Keep a not-yet-saved additional date selectable until it is confirmed.
    if(ui.manualDate&&ui.manualDate.slice(0,7)===ui.month&&ui.selected==='ad-hoc-'+ui.manualDate&&
       !eventList.some(e=>e.id===ui.selected))eventList.push({id:ui.selected,date:ui.manualDate,label:'Zusätzlicher Trainingstag',planned:false,confirmed:false});
    eventList.sort((a,b)=>a.date.localeCompare(b.date));
    if(!selected&&eventList.length)selected=eventList[0].id;
    if(selected!==ui.selected){ui.selected=selected;ui.attendanceDraft={...(recordSet[selected]?.statuses||{})}}
    const every=m.perfect;const rate=m.knownSum?Math.round(m.presentSum/m.knownSum*100):null;
    let out=`<p class="cfx-sub">Jedes Training wird erst nach deiner Bestätigung in der Monatsstatistik gezählt. Die fünf alten Vorbereitungen enthalten keine gesicherten individuellen Anwesenheiten.</p><div class="cfx-box cfx-month-row"><button class="cfx-btn secondary" data-cfx="month-prev" aria-label="Vorheriger Monat">‹</button><strong>${new Intl.DateTimeFormat('de-AT',{month:'long',year:'numeric'}).format(new Date(ui.month+'-01T12:00:00'))}</strong><button class="cfx-btn secondary" data-cfx="month-next" aria-label="Nächster Monat">›</button></div><div class="cfx-stats"><div class="cfx-stat"><strong>${m.events.length}</strong><span>Erfasste Trainings</span></div><div class="cfx-stat"><strong>${rate===null?'–':rate+' %'}</strong><span>Dokumentierte Teilnahme</span></div><div class="cfx-stat"><strong>${every.length}</strong><span>Bei allen dabei</span></div></div>`;
    if(every.length)out+=`<div class="cfx-alert">🏅 ${every.length} ${every.length===1?'Kind war':'Kinder waren'} bei allen ${m.events.length} vollständig erfassten Trainingsterminen anwesend: ${every.map(p=>esc(p.name)).join(', ')}.</div>`;
    else if(!m.events.length)out+='<div class="cfx-alert warning">Noch keine bestätigten Anwesenheiten für diesen Monat. Die bisherigen Trainingsvorbereitungen werden nicht automatisch gezählt.</div>';
    out+=`<div class="cfx-box"><strong>Training auswählen</strong><div class="cfx-calendar" style="margin-top:10px">${eventList.map(e=>`<button class="cfx-date ${e.id===selected?'active':''} ${e.confirmed?'':'unsaved'}" data-cfx="attendance-pick" data-id="${esc(e.id)}">${dateLabel(e.date)} ${e.confirmed?'✓':'·'}<br>${esc(e.label)}</button>`).join('')||'<div class="cfx-empty">Für diesen Monat sind noch keine Trainingsvorbereitungen hinterlegt.</div>'}</div><div class="cfx-toolbar cfx-adhoc-toolbar"><label class="cfx-label">Weiteren Trainingstag erfassen<input type="date" class="cfx-input" id="cfx-ad-hoc-date" value="${esc(ui.manualDate)}"/></label><button type="button" class="cfx-btn secondary" data-cfx="adhoc">Datum übernehmen</button></div></div>`;
    const picked=selected&&(recordSet[selected]||items(d).find(s=>s.id===selected)||(selected.startsWith('ad-hoc-')?{id:selected,date:selected.slice(7),theme:'Zusätzlicher Trainingstag'}:null));if(picked){const rec=recordSet[selected];const statuses=ui.attendanceDraft;const playerIds=rec?.playerIds||d.players.map(p=>p.id);const present=playerIds.filter(id=>statuses[id]==='present').length;const marked=playerIds.filter(id=>['present','absent','excused'].includes(statuses[id])).length;
      out+=`<div class="cfx-box"><div class="cfx-month-row"><strong>${esc(picked.label||picked.theme||'Training')} · ${dateLabel(picked.date)}</strong>${rec?.confirmed?'<span class="cfx-chip">Erfasst ✓</span>':'<span class="cfx-chip">Noch nicht erfasst</span>'}</div><p class="cfx-sub">${marked} von ${playerIds.length} Kindern markiert · ${present} anwesend. Nicht markierte Kinder werden nicht als abwesend gewertet.</p><div class="cfx-toolbar"><button class="cfx-btn secondary" data-cfx="all-present">Alle anwesend</button><button class="cfx-btn secondary" data-cfx="clear-attendance">Zurücksetzen</button></div>${playerIds.map(pid=>{const p=d.players.find(x=>x.id===pid);return `<div class="cfx-line"><div class="grow"><div class="cfx-name">${esc(p?.name||'Ehemaliges Kind')} ${p?`<span class="cfx-chip">${esc(p.baseGroup)}</span>`:''}</div></div><select class="cfx-input cfx-choice" data-cfx-status="${esc(pid)}"><option value="unknown" ${!statuses[pid]||statuses[pid]==='unknown'?'selected':''}>Nicht erfasst</option><option value="present" ${statuses[pid]==='present'?'selected':''}>✓ Anwesend</option><option value="excused" ${statuses[pid]==='excused'?'selected':''}>Entschuldigt</option><option value="absent" ${statuses[pid]==='absent'?'selected':''}>Abwesend</option></select></div>`}).join('')}<div class="cfx-footer"><button class="cfx-btn" data-cfx="save-attendance">Anwesenheit bestätigen und speichern</button></div></div>`;
    }
    out+=`<div class="cfx-box"><strong>Monatsübersicht pro Kind</strong><p class="cfx-sub">100 % heißt: an jedem bestätigten Trainingstermin dieses Monats nachweislich anwesend. Unbekannte Teilnahmen werden nicht als Anwesenheit angenommen.</p>${m.people.map(p=>`<div class="cfx-line"><div class="grow"><div class="cfx-name">${esc(p.name)}</div><small>${p.present} dabei · ${p.excused} entschuldigt · ${p.absent} abwesend</small></div><strong class="cfx-score">${p.percentage===null?'–':p.percentage+' %'} ${p.allPresent?'🏅':''}</strong></div>`).join('')}</div>`;
    return out;
  }
  function addAdhoc(){const d=read(),field=$('#cfx-ad-hoc-date');const date=field?.value||ui.manualDate;if(!validDate(date)){notice('Bitte ein gültiges Kalenderdatum auswählen.');return}const existing=items(d).find(s=>s.date===date);if(existing){ui.month=date.slice(0,7);ui.selected=existing.id;ui.attendanceDraft={...(entries(d)[existing.id]?.statuses||{})};draw();return;}const id='ad-hoc-'+date;const rec=entries(d)[id];ui.month=date.slice(0,7);ui.selected=id;ui.attendanceDraft={...(rec?.statuses||{})};ui.manualDate=date;draw()}
  function saveAttendance(){const d=read();const key=ui.selected;if(!key)return;const base=items(d).find(s=>s.id===key);const prev=entries(d)[key];const date=base?.date||prev?.date||(key.startsWith('ad-hoc-')?key.slice(7):ui.manualDate);if(!validDate(date)){notice('Ungültiges Trainingsdatum.');return}const valid=new Set(['present','excused','absent']);const selectedStatuses=ui.attendanceDraft;const playerIds=prev?.playerIds||d.players.map(p=>p.id);const count=playerIds.filter(id=>valid.has(selectedStatuses[id])).length;if(!count){notice('Bitte mindestens ein Kind markieren. Unbekannte Kinder werden nicht mitgezählt.');return}if(!confirm(`Anwesenheit für ${dateLabel(date)} mit ${count} dokumentierten Kindern speichern?`))return;const label=base?.theme||prev?.label||'Zusätzlicher Trainingstag';commit((_state,x)=>{x.attendanceEntries[key]={id:key,date,label,playerIds:playerIds.slice(),statuses:Object.fromEntries(playerIds.map(id=>[id,valid.has(selectedStatuses[id])?selectedStatuses[id]:'unknown'])),confirmed:true,confirmedAt:new Date().toISOString()}});draw();notice('Anwesenheit gespeichert. Die Monatsübersicht wurde aktualisiert.')}
  function renderDevelopment(d){const dev=assessment(d);const assessed=d.players.filter(p=>LEVELS.some(l=>l.id===dev[p.id]?.level)).length;return `<p class="cfx-sub">Die sportliche Entwicklung ist eine vertrauliche Trainereinschätzung, kein dauerhaftes Urteil. Stammgruppen bleiben unverändert. Bitte alle 6–8 Wochen neu beurteilen und keine öffentlichen Rankings erstellen.</p><div class="cfx-stats"><div class="cfx-stat"><strong>${d.players.length}</strong><span>Kinder im Kader</span></div><div class="cfx-stat"><strong>${assessed}</strong><span>Eingeschätzt</span></div><div class="cfx-stat"><strong>${d.players.length-assessed}</strong><span>Noch offen</span></div></div><div class="cfx-box"><strong>Entwicklungsstufen (intern)</strong>${LEVELS.map(x=>`<div class="cfx-line"><span class="cfx-level-dot" style="background:${x.color}"></span><span class="grow">${esc(x.name)}</span></div>`).join('')}</div><div class="cfx-box"><div class="cfx-toolbar"><label class="cfx-label">Stammgruppe anzeigen<select id="cfx-group-filter" class="cfx-input"><option value="all">Alle Gruppen</option>${['Blau','Gelb','Weiß','Schwarz'].map(g=>`<option value="${g}" ${ui.rosterFilter===g?'selected':''}>${g}</option>`).join('')}</select></label></div>${d.players.filter(p=>ui.rosterFilter==='all'||p.baseGroup===ui.rosterFilter).map(p=>{const v=dev[p.id]||{};return `<div class="cfx-line"><div class="grow"><div class="cfx-name">${esc(p.name)}</div><small>${esc(p.baseGroup)} · ${v.updatedAt?'Stand '+dateLabel(v.updatedAt.slice(0,10)):'Noch nicht bewertet'}</small></div><select class="cfx-input cfx-choice" data-cfx-level="${esc(p.id)}" aria-label="Entwicklungsstand für ${esc(p.name)}"><option value="">Offen</option>${LEVELS.map(l=>`<option value="${l.id}" ${v.level===l.id?'selected':''}>${l.id} · ${esc(l.name.split(' · ')[1])}</option>`).join('')}</select></div>`}).join('')}</div><div class="cfx-alert">Eine Stufe dient ausschließlich zur Unterstützung bei Trainingsvarianten und einer fairen Teammischung. Sie erscheint nicht in den öffentlichen GitHub-Dateien.</div>`}
  function updateLevel(pid,level){const d=read();if(!d.players.some(p=>p.id===pid)||level&&!LEVELS.some(l=>l.id===level)){notice('Ungültige Auswahl.');return}commit((_d,x)=>{if(!level)delete x.development[pid];else x.development[pid]={level,updatedAt:new Date().toISOString()}});draw();notice('Entwicklungseinschätzung aktualisiert.')}
  const shuffle=a=>{const out=a.slice();for(let i=out.length-1;i>0;i--){const x=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[out[i],out[x]]=[out[x],out[i]]}return out};
  const levelScore=(p,d)=>LEVELS.find(x=>x.id===assessment(d)[p.id]?.level)?.weight??2.5;
  function proposalScore(team,mode,d){if(mode==='random')return team.members.length;return team.members.reduce((s,id)=>s+levelScore(d.players.find(p=>p.id===id)||{},d),0)}
  function createProposal(){const d=read();const defaultSource=ui.source==='present'?d.players.filter(p=>d.current.attendance?.[p.id]!==false):d.players.slice();const source=ui.teamSelection===null?defaultSource:defaultSource.filter(p=>ui.teamSelection.has(p.id));const k=Math.max(2,Math.min(8,Math.floor(ui.count)||4,source.length));if(source.length<4){notice('Mindestens vier Kinder benötigt.');return}let players=shuffle(source);let teams=Array.from({length:k},(_,i)=>({id:'t'+i,name:'Team '+(i+1),members:[]}));const averages=()=>teams.map(t=>t.members.length?proposalScore(t,ui.mode,d)/t.members.length:0);
    if(ui.mode==='similar'){
      players.sort((a,b)=>levelScore(b,d)-levelScore(a,d));const target=players.length/k;let cursor=0;for(let i=0;i<k;i++){const remaining=players.length-cursor,slots=k-i;const qty=Math.ceil(remaining/slots);teams[i].members=players.slice(cursor,cursor+qty).map(p=>p.id);cursor+=qty}
    }else if(ui.mode==='random'){
      players.forEach((p,i)=>teams[i%k].members.push(p.id));
    }else{
      // Start with high-to-low snake to mix development levels, then select a
      // least-full team with the fewest players from the same Stammgruppe.
      players.sort((a,b)=>levelScore(b,d)-levelScore(a,d));
      for(const p of players){
        const minSize=Math.min(...teams.map(t=>t.members.length));
        const choices=teams.filter(t=>t.members.length===minSize);
        const choose=choices.map(t=>({t,levelScore:proposalScore(t,'balanced',d),groupDup:t.members.filter(id=>d.players.find(x=>x.id===id)?.baseGroup===p.baseGroup).length}))
          .sort((a,b)=>a.levelScore-b.levelScore||a.groupDup-b.groupDup)[0];
        choose.t.members.push(p.id);
      }
      // Swaps across equally sized teams reduce variance while trying not to
      // concentrate the same Stammgruppe. All proposals remain editable.
      const avgScore=players.reduce((x,p)=>x+levelScore(p,d),0)/k;
      const pairHistory=historicalPairs(d);
      function cost(ts){return ts.reduce((score,t)=>{
        const sum=t.members.reduce((z,id)=>z+levelScore(d.players.find(p=>p.id===id)||{},d),0);
        const groupCounts={};t.members.forEach(id=>{const g=d.players.find(p=>p.id===id)?.baseGroup||'unknown';groupCounts[g]=(groupCounts[g]||0)+1});
        const repeat=Object.values(groupCounts).reduce((a,n)=>a+Math.max(0,n-2),0);
        let repeated=0;for(let i=0;i<t.members.length;i++)for(let j=i+1;j<t.members.length;j++){const h=pairHistory.get([t.members[i],t.members[j]].sort().join('|'))||0;repeated+=h*h;}return score+(sum-avgScore)**2+repeat*.65+repeated*.8;
      },0)}
      let best=cost(teams);
      for(let round=0;round<4;round++){let swapped=false;outer:for(let a=0;a<k;a++)for(let b=a+1;b<k;b++)for(let i=0;i<teams[a].members.length;i++)for(let j=0;j<teams[b].members.length;j++){
        [teams[a].members[i],teams[b].members[j]]=[teams[b].members[j],teams[a].members[i]];const result=cost(teams);
        if(result+0.001<best){best=result;swapped=true;break outer}
        [teams[a].members[i],teams[b].members[j]]=[teams[b].members[j],teams[a].members[i]];
      }if(!swapped)break}
    }
    ui.proposal={date:ui.teamDate,title:ui.teamName.trim()||'Funino-Spieltag',mode:ui.mode,source:ui.source,teams,createdAt:new Date().toISOString()};draw();notice('Vorschlag erstellt – du kannst jede Mannschaft manuell ändern.')}
  function renderTournament(d){const p=ui.proposal;const unassessed=d.players.filter(pl=>pl&&(!assessment(d)[pl.id]?.level));const saved=savedTeams(d);const eligible=ui.source==='present'?d.players.filter(p=>d.current.attendance?.[p.id]!==false):d.players.slice();const selected=ui.teamSelection===null?eligible:eligible.filter(p=>ui.teamSelection.has(p.id));let out=`<p class="cfx-sub">Erstelle ausgeglichene oder bewusst gemischte Mannschaften für einen Spieltag. Diese Teams ändern weder Stammgruppen noch die Tagesgruppen des Trainings.</p><div class="cfx-box"><div class="cfx-grid"><label class="cfx-label">Datum<input class="cfx-input" type="date" id="cfx-team-date" value="${esc(ui.teamDate)}"/></label><label class="cfx-label">Anzahl Teams<select class="cfx-input" id="cfx-team-count">${[2,3,4,5,6,7,8].map(n=>`<option value="${n}" ${ui.count===n?'selected':''}>${n} Teams</option>`).join('')}</select></label><label class="cfx-label">Spieltag / Turnier<input class="cfx-input" id="cfx-team-name" value="${esc(ui.teamName)}" maxlength="70"/></label><label class="cfx-label">Teilnehmende Kinder<select class="cfx-input" id="cfx-team-source"><option value="present" ${ui.source==='present'?'selected':''}>Heute anwesend</option><option value="all" ${ui.source==='all'?'selected':''}>Gesamter Kader</option></select></label></div><label class="cfx-label" style="margin-top:10px">Verteilungsmodus<select class="cfx-input" id="cfx-team-mode"><option value="balanced" ${ui.mode==='balanced'?'selected':''}>Fair durchmischen (empfohlen)</option><option value="similar" ${ui.mode==='similar'?'selected':''}>Ähnliche Entwicklungsstufen</option><option value="random" ${ui.mode==='random'?'selected':''}>Zufällig durchmischen</option></select></label><details class="cfx-box" ${ui.participantOpen?'open':''} style="margin-top:12px"><summary style="cursor:pointer;color:#bdf576;font-weight:750" data-cfx="participant-toggle">Teilnehmer für dieses Turnier auswählen (${selected.length}/${eligible.length})</summary><p class="cfx-sub">Die Auswahl gilt nur für diese Teamaufstellung, nicht für die Trainingsanwesenheit.</p><div class="cfx-grid">${eligible.map(player=>`<label class="cfx-line" style="cursor:pointer"><input type="checkbox" data-cfx-teamcheck="${esc(player.id)}" ${selected.some(p=>p.id===player.id)?'checked':''}/><span class="grow">${esc(player.name)}</span></label>`).join('')}</div></details><div class="cfx-footer"><button type="button" class="cfx-btn" data-cfx="generate">Teams vorschlagen (${selected.length})</button></div></div>`;
    if(unassessed.length)out+=`<div class="cfx-alert warning">${unassessed.length} Kinder haben noch keine Entwicklungseinschätzung. Sie werden bei der Durchmischung neutral gewichtet. Das ist kein Leistungsurteil.</div>`;
    if(p){const total=p.teams.reduce((n,t)=>n+t.members.length,0);out+=`<div class="cfx-box"><div class="cfx-month-row"><strong>${esc(p.title)} · ${dateLabel(p.date)}</strong><span class="cfx-chip">${total} Kinder</span></div><p class="cfx-sub">${p.teams.length} Teams · ${p.mode==='balanced'?'faire Durchmischung':p.mode==='similar'?'ähnliches Niveau':'zufällige Mischung'}. Zuteilungen sind Vorschläge und von dir änderbar.</p><div class="cfx-grid">${p.teams.map((t,ti)=>`<div class="cfx-box"><div class="cfx-month-row"><strong>${esc(t.name)}</strong><span class="cfx-chip">${t.members.length} Kinder</span></div>${t.members.map(pid=>{const p=d.players.find(pl=>pl.id===pid),l=LEVELS.find(x=>x.id===assessment(d)[pid]?.level);return `<div class="cfx-line" style="align-items:start"><div class="grow"><div class="cfx-name">${esc(p?.name||'Unbekannt')}</div><small>${esc(p?.baseGroup||'')} ${l?`· <span class="cfx-level-dot" style="background:${l.color}"></span>Stufe ${l.id}`:'· ohne Einstufung'}</small></div><select class="cfx-input cfx-choice" aria-label="${esc(p?.name||'Kind')} in anderes Team umteilen" data-cfx-move="${esc(pid)}"><option value="${esc(t.id)}">${esc(t.name)}</option>${p&&ui.proposal.teams.filter(x=>x.id!==t.id).map(x=>`<option value="${esc(x.id)}">→ ${esc(x.name)}</option>`).join('')}</select></div>`}).join('')}</div>`).join('')}</div><p class="cfx-sub">Bei U7-Funino mit 3 gegen 3 sind bei sechs Kindern pro Team Auswechslungen zu planen, damit alle regelmäßig spielen.</p><div class="cfx-footer"><button type="button" class="cfx-btn" data-cfx="save-tournament">Aufstellung speichern</button><button type="button" class="cfx-btn secondary" data-cfx="csv">CSV exportieren</button><button type="button" class="cfx-btn secondary" data-cfx="export-matchday">↗ Matchday-Datei</button><button type="button" class="cfx-btn secondary" data-cfx="regenerate">Neu mischen</button></div><p class="cfx-sub">Die Matchday-Datei enthält nur Datum, Teamnamen sowie IDs und Namen der ausgewählten Kinder – keine Entwicklungsbewertungen. In FUNiño Matchday kannst du anschließend eine Mannschaft auswählen und übernehmen.</p><a class="cfx-btn secondary" style="display:block;text-decoration:none" rel="noopener noreferrer" target="_blank" href="https://marinkarimovic.github.io/funino-matchday/">Funino Matchday öffnen ↗</a></div>`}
    out+=`<div class="cfx-box"><strong>Spielzeit & faire Teams</strong><p class="cfx-sub">Vergangene Teamkonstellationen fließen beim Modus „Fair durchmischen“ in die Auswahl ein. Nur ausdrücklich in Matchday eingetragene Spielminuten zählen als Einsatzzeit. Fehlende Werte sind unbekannt, nicht null.</p>${matchReports(d).length?`<div class="cfx-stats"><div class="cfx-stat"><strong>${matchReports(d).length}</strong><span>Importierte Spieltage</span></div><div class="cfx-stat"><strong>${d.players.filter(p=>recordedMinutes(d,p.id)>0).length}</strong><span>Kinder mit Minuten</span></div><div class="cfx-stat"><strong>${matchReports(d).reduce((sum,x)=>sum+(x.games||[]).length,0)}</strong><span>Erfasste Spiele</span></div></div>${d.players.map(player=>{const mins=recordedMinutes(d,player.id);return `<div class="cfx-line"><span class="grow cfx-name">${esc(player.name)}</span><strong class="cfx-score">${mins?mins+' min':'–'}</strong></div>`}).join('')}`:'<p class="cfx-empty">Noch keine Spielzeiten importiert. Exportiere eine Mannschaft nach Matchday, erfasse dort die tatsächlich gespielten Minuten und importiere die Ergebnisdatei hier.</p>'}<label class="cfx-btn secondary" style="display:block;text-align:center;cursor:pointer">↓ Matchday-Spielzeiten importieren<input id="cfx-import-matchday" type="file" accept=".json,application/json" style="display:none"/></label></div><div class="cfx-box"><strong>Gespeicherte Aufstellungen</strong>${saved.length?saved.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,10).map(t=>`<div class="cfx-line"><div class="grow"><div class="cfx-name">${esc(t.title)} · ${dateLabel(t.date)}</div><small>${t.teams.length} Teams · ${t.teams.reduce((n,x)=>n+x.members.length,0)} Kinder</small></div><button class="cfx-btn secondary" data-cfx="load-tournament" data-id="${esc(t.id)}">Öffnen</button></div>`).join(''):'<p class="cfx-empty">Noch keine Turniermannschaft gespeichert.</p>'}</div>`;
    return out;
  }
  function saveTournament(){if(!ui.proposal)return;const t=ui.proposal;if(!validDate(t.date)){notice('Bitte ein gültiges Datum eingeben.');return}if(!t.teams.every(team=>team.members.length>0)){notice('Mindestens ein Team ist leer. Bitte Kinder zuweisen.');return}if(!confirm('Diese Aufstellung speichern? Stamm- und Tagesgruppen bleiben unverändert.'))return;const newItem=JSON.parse(JSON.stringify({...t,id:t.id||('turnier-'+Date.now())}));commit((d,x)=>{const i=x.tournaments.findIndex(it=>it.id===newItem.id);if(i<0)x.tournaments.push(newItem);else x.tournaments[i]=newItem});ui.proposal=newItem;draw();notice('Turnieraufstellung lokal gespeichert. Für Cloud-Sicherung die Cloud-Funktion öffnen.')}

  function exportMatchday(){
    const d=read(),p=ui.proposal;if(!p||!p.teams?.length){notice('Zuerst Teams erstellen oder eine Aufstellung öffnen.');return;}
    const squads=p.teams.map(team=>({id:String(team.id),name:String(team.name),players:(team.members||[]).map(pid=>{const player=d.players.find(x=>x.id===pid);return player?{id:String(player.id),name:String(player.name)}:null}).filter(Boolean)}));
    const ids=squads.flatMap(t=>t.players.map(p=>p.id));
    if(!ids.length||new Set(ids).size!==ids.length){notice('Doppelte oder fehlende Spieler-IDs. Bitte Aufstellung überprüfen.');return;}
    const doc={schema:'sport-coach-bridge-v1',kind:'lineup',eventId:String(p.id||p.createdAt||'proposal-'+p.date),eventName:String(p.title),date:String(p.date),club:String(d.team||''),age:String(d.age||''),teams:squads,createdAt:new Date().toISOString()};
    if(!confirm('Matchday-Datei mit '+ids.length+' Spielernamen exportieren? Die Datei enthält personenbezogene Daten. Bitte nur privat weitergeben.'))return;
    const blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='SpielfeldIQ-Matchday-'+p.date+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);notice('Matchday-Aufstellung exportiert. Öffne FUNiño Matchday und importiere dort die Datei.');
  }
  async function importMatchday(file){
    if(!file||file.size>250000){notice('Ungültige Datei oder größer als 250 KB.');return;}
    try{
      const report=JSON.parse(await file.text()),d=read();
      if(report.schema!=='sport-coach-matchday-results-v1'||typeof report.eventId!=='string'||!Array.isArray(report.games))throw Error('Falsches Matchday-Format');
      if(report.eventId.length>140||report.games.length>100)throw Error('Datei nicht unterstützt');
      const ids=new Set(d.players.map(x=>x.id));let known=0;
      const games=report.games.map(game=>{
        if(!Number.isInteger(game.game)||game.game<1||game.game>100||!game.minutes||typeof game.minutes!=='object')throw Error('Ungültige Spielzeiten');
        const mins={};
        for(const [pid,value] of Object.entries(game.minutes)){
          if(!ids.has(pid))continue;
          if(!Number.isInteger(value)||value<0||value>180)throw Error('Spielzeit nicht plausibel');
          mins[pid]=value;known++;
        }
        return {game:game.game,minutes:mins,loggedAt:String(game.loggedAt||'')};
      });
      if(!known)throw Error('Keine zugeordneten Spieler-IDs aus diesem Kader vorhanden');
      const uniqueGames=new Set(games.map(x=>x.game));if(uniqueGames.size!==games.length)throw Error('Spiele doppelt vorhanden');
      const eventId=report.eventId;
      const existing=matchReports(d).find(x=>x.eventId===eventId);
      if(!confirm('Für '+games.length+' Spiele sind '+known+' bekannte Spieler-Minutenwerte enthalten.'+(existing?' Der bereits importierte Bericht dieses Spieltags wird ersetzt.':'')+' Importieren?'))return;
      commit((_state,x)=>{x.matchdayReports||=[];const next={eventId,eventName:String(report.eventName||'Spieltag').slice(0,100),date:String(report.date||'').slice(0,10),games,importedAt:new Date().toISOString()};const old=x.matchdayReports.findIndex(t=>t.eventId===eventId);if(old>=0)x.matchdayReports[old]=next;else x.matchdayReports.push(next)});
      draw();notice('Spielminuten übernommen. Unbekannte Spieler wurden ignoriert.');
    }catch(e){notice('Import nicht möglich: '+String(e.message||'Ungültige Datei'));}
  }
  function teamCSV(){const d=read(),p=ui.proposal;if(!p)return;const rows=[['Turnier','Datum','Mannschaft','Spieler','Stammgruppe']];for(const t of p.teams)for(const id of t.members){const x=d.players.find(y=>y.id===id);rows.push([p.title,p.date,t.name,x?.name||'',x?.baseGroup||''])}const csv='\ufeff'+rows.map(row=>row.map(s=>'"'+String(s||'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='SpielfeldIQ-Teams-'+p.date+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('CSV-Teamliste erstellt. Kein direkter Import in Matchday.')}
  function movePlayer(pid,dest){const t=ui.proposal?.teams.find(x=>x.id===dest);if(!t)return;for(const team of ui.proposal.teams)team.members=team.members.filter(id=>id!==pid);t.members.push(pid);draw();notice('Mannschaftswechsel übernommen. Bitte Aufstellung erneut speichern.')}
  document.addEventListener('click',e=>{const t=e.target.closest('[data-cfx]');if(!t)return;const act=t.dataset.cfx;if(act==='open'){open(t.dataset.page);return}if(act==='close'){close();return}if(!ui.page)return;
    if(act==='participant-toggle'){ui.participantOpen=!ui.participantOpen;return}
    if(act==='month-prev'){monthShift(-1);return}if(act==='month-next'){monthShift(1);return}
    if(act==='attendance-pick'){chooseAttendance(t.dataset.id);return}if(act==='adhoc'){addAdhoc();return}
    if(act==='all-present'){const d=read(),rec=entries(d)[ui.selected],ids=rec?.playerIds||d.players.map(p=>p.id);ui.attendanceDraft=Object.fromEntries(ids.map(id=>[id,'present']));draw();return}
    if(act==='clear-attendance'){ui.attendanceDraft={};draw();return}
    if(act==='save-attendance'){saveAttendance();return}
    if(act==='generate'||act==='regenerate'){readTeamControls();createProposal();return}
    if(act==='save-tournament'){saveTournament();return}
    if(act==='csv'){teamCSV();return}if(act==='export-matchday'){exportMatchday();return}
    if(act==='load-tournament'){const saved=savedTeams(read()).find(x=>x.id===t.dataset.id);if(saved){ui.proposal=JSON.parse(JSON.stringify(saved));ui.teamDate=saved.date;ui.teamName=saved.title;ui.count=saved.teams.length;ui.mode=saved.mode;ui.source=saved.source||'present';draw()}return}
  });
  function readTeamControls(){ui.count=Number($('#cfx-team-count')?.value||ui.count);ui.mode=$('#cfx-team-mode')?.value||ui.mode;ui.source=$('#cfx-team-source')?.value||ui.source;ui.teamDate=$('#cfx-team-date')?.value||ui.teamDate;ui.teamName=$('#cfx-team-name')?.value||ui.teamName}
  document.addEventListener('change',e=>{const t=e.target;if(!ui.page)return;
    if(t.id==='cfx-import-matchday'){const file=t.files?.[0];if(file)void importMatchday(file);t.value='';return}
    if(t.hasAttribute('data-cfx-status')){ui.attendanceDraft[t.dataset.cfxStatus]=t.value;return}
    if(t.hasAttribute('data-cfx-level')){updateLevel(t.dataset.cfxLevel,t.value);return}
    if(t.hasAttribute('data-cfx-teamcheck')){const d=read();const allowed=ui.source==='present'?d.players.filter(p=>d.current.attendance?.[p.id]!==false):d.players.slice();ui.teamSelection??=new Set(allowed.map(p=>p.id));if(t.checked)ui.teamSelection.add(t.dataset.cfxTeamcheck);else ui.teamSelection.delete(t.dataset.cfxTeamcheck);ui.participantOpen=true;const count=allowed.filter(p=>ui.teamSelection.has(p.id)).length;const summary=t.closest('details')?.querySelector('summary');if(summary)summary.textContent='Teilnehmer für dieses Turnier auswählen ('+count+'/'+allowed.length+')';const generate=$('[data-cfx="generate"]');if(generate)generate.textContent='Teams vorschlagen ('+count+')';if(ui.proposal){ui.proposal=null;draw();}return}
    if(t.id==='cfx-group-filter'){ui.rosterFilter=t.value;draw();return}
    if(t.hasAttribute('data-cfx-move')){movePlayer(t.dataset.cfxMove,t.value);return}
    if(['cfx-team-count','cfx-team-mode','cfx-team-source','cfx-team-date','cfx-team-name'].includes(t.id)){if(t.id==='cfx-team-source'){ui.teamSelection=null;ui.proposal=null;ui.participantOpen=true;}readTeamControls();if(t.id==='cfx-team-source')draw();}
  });
  document.addEventListener('keydown',e=>{if(ui.page&&e.key==='Escape')close()});
  document.addEventListener('click',e=>{const root=$("#"+ROOT_ID);if(root&&e.target===root)close()});
  window.CoachFlowFeatures=Object.freeze({mount:launch,open,stats:(month)=>{const d=read();return d?counts(d,month):null}});
  launch();
})();