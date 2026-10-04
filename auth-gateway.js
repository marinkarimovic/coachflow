/* User-first Supabase Auth & account-scoped autosave. No service-role key. */
(function(){
'use strict';
const URL_ = 'https://gzrstopdqsjdrrrzzhix.supabase.co';
const KEY_ = 'sb_publishable_X26Q5o8MAkS-QSTMYN-lYg_vyVpeag3';
const SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.min.js';
const REDIRECT=location.origin+location.pathname.replace(/(?:index\.html)?$/,'');
const PENDING_PREFIX='coachflow-pending-v2-';
const USER_PREFIX='coachflow-account-v2-';
const pendingKey=id=>PENDING_PREFIX+id;
const localKey=id=>USER_PREFIX+id;
const RECOVERY_PREFIX='coachflow-recovery-v1-';
const TIMER_PREFIX='coachflow-live-timer-v1-';
function clearPrivateLocal(id){
  if(!id)return true;
  let cleaned=true;
  for(const name of [localKey(id),pendingKey(id),RECOVERY_PREFIX+id,TIMER_PREFIX+id]){
    try{localStorage.removeItem(name)}catch(e){cleaned=false}
  }
  return cleaned;
}
function clearLegacyPrototype(){
  // Old prototype entries have no account identity. We do not migrate them to a signed-in user.
  let cleaned=true;
  for(const name of ['coachflow-prototype-v1','coachflow-recovery-v1','coachflow-live-timer-v1'])try{localStorage.removeItem(name)}catch(e){cleaned=false}
  return cleaned;
}
let client=null, user=null, revision=null, dirty=false, conflict=false, busy=false, connecting=false, sending=false, change=0, pending=null, run=0;
let status='Anmeldung wird geladen …', error='', stage='login';
const get=id=>document.getElementById(id);
const enc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bridge=()=>window.coachflowBridge;
const snapshot=()=>bridge()?.getState?.();
function displayStatus(text,failed){
  status=text;error=failed?text:'';
  const pill=get('cf-sync-pill');if(pill){pill.textContent=text;pill.title=text;pill.classList.toggle('error',!!failed)}
  const statusEl=get('cloud-indicator');
  if(statusEl){statusEl.textContent=text;statusEl.className='notice '+(failed?'red':'green')}
}
function gateNotice(msg,bad){const elem=get('cf-auth-message');if(elem){elem.textContent=msg;elem.hidden=!msg;elem.classList.toggle('error',!!bad)}}
function markup(){
const root=get('auth-root');if(!root)return;
const create=stage==='register';
root.innerHTML='<div class="cf-auth-card" role="region" aria-label="Anmelden">'+
'<div class="cf-auth-logo">Spielfeld<span>IQ</span>.</div>'+
'<p>Dein Team. Dein Training. Dein Spieltag. Ein Benutzerkonto für alles.</p>'+
'<h2>'+(create?'Konto erstellen':'Willkommen zurück')+'</h2>'+
'<div class="cf-auth-split"><button class="secondary" type="button" id="cf-google">Mit Google</button><button class="secondary" type="button" id="cf-microsoft">Mit Microsoft</button></div>'+
'<p style="text-align:center">Die Anbieter funktionieren nach Freischaltung im Supabase-Dashboard.</p>'+
'<div class="cf-auth-or">oder mit E-Mail</div>'+
'<form id="cf-auth-form"><label class="cf-auth-field">E-Mail<input name="email" type="email" autocomplete="email" required placeholder="name@example.com" maxlength="254"/></label>'+
'<label class="cf-auth-field" style="margin-top:11px">Passwort<input name="password" type="password" autocomplete="'+(create?'new-password':'current-password')+'" minlength="'+(create?'12':'1')+'" required placeholder="'+(create?'Mindestens 12 Zeichen':'Dein Passwort')+'"/></label>'+
'<button style="margin-top:14px" type="submit" id="cf-auth-submit">'+(create?'Konto erstellen':'Mit E-Mail anmelden')+'</button></form>'+
'<button class="secondary" type="button" id="cf-switch">'+(create?'Ich habe bereits ein Konto':'Neues Konto erstellen')+'</button>'+
'<button class="secondary" type="button" id="cf-magic">Alternativ: Anmeldelink per E-Mail senden</button>'+
'<p id="cf-auth-message" class="cf-auth-status" role="status" hidden></p>'+
'<p>Deine Spieler- und Trainingsdaten werden deinem angemeldeten Konto zugeordnet und automatisch synchronisiert.</p>'+
'<p class="cf-auth-status">⚠ Testsystem: Bitte vor dem Einsatz mit echten Kinderdaten Verantwortlichkeiten, Elterninformation, Löschfristen und das Sicherheitskonzept klären.</p>'+
'</div>';
gateNotice(status==='Anmeldung wird geladen …'?'':status,!!error);
}
function unlock(){document.body.classList.add('cf-authenticated');if(get('auth-root'))get('auth-root').hidden=true}
function lock(){document.body.classList.remove('cf-authenticated');if(get('auth-root'))get('auth-root').hidden=false;markup()}
function setBusy(value){busy=value;for(const button of document.querySelectorAll('#auth-root button'))button.disabled=value}
function ensureSdk(){
if(client)return Promise.resolve(client);
if(!window.__cfSupabaseLoading){
window.__cfSupabaseLoading=new Promise((resolve,reject)=>{
if(window.supabase?.createClient){resolve(window.supabase.createClient(URL_,KEY_,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}));return}
const script=document.createElement('script');script.src=SDK;script.async=true;
script.onload=()=>window.supabase?.createClient?resolve(window.supabase.createClient(URL_,KEY_,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})):reject(Error('Supabase konnte nicht initialisiert werden.'));
script.onerror=()=>reject(Error('Anmeldebibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen.'));document.head.appendChild(script);
}).catch(err=>{window.__cfSupabaseLoading=null;throw err});
}
return window.__cfSupabaseLoading.then(value=>{
  if(!client){
    client=value;
    client.auth.onAuthStateChange?.((event,session)=>{
      if(event==='SIGNED_OUT'){
        if(!user&&!document.body.classList.contains('cf-authenticated'))return;
        const previous=user?.id;
        document.body.classList.remove('cf-authenticated');
        bridge()?.clearAccount?.();clearPrivateLocal(previous);clearLegacyPrototype();
        user=null;revision=null;dirty=false;conflict=false;clearTimeout(pending);pending=null;
        displayStatus('Sitzung beendet. Bitte erneut anmelden.');lock();
      }else if(event==='SIGNED_IN'&&session?.user?.id&&session.user.id!==user?.id){
        const previous=user?.id;
        if(previous){
          document.body.classList.remove('cf-authenticated');
          bridge()?.clearAccount?.();clearPrivateLocal(previous);clearLegacyPrototype();
          user=null;revision=null;dirty=false;conflict=false;clearTimeout(pending);pending=null;lock();
        }
        setTimeout(()=>{void connect()},0);
      }
    });
  }
  return client;
});
}
async function record(id){const r=await client.from('coachflow_state').select('state,revision').eq('user_id',id).maybeSingle();if(r.error)throw r.error;return r.data}
function schedule(){clearTimeout(pending);pending=setTimeout(()=>{void flush()},700)}
async function flush(){
if(sending||!user||!dirty||conflict||!client)return;
const startedFor=user.id,version=change;
let state;try{state=snapshot()}catch(e){displayStatus('Speichern nicht möglich: '+e.message,true);return}
sending=true;displayStatus('☁ Änderungen werden gespeichert …');
try{
let result;
if(revision===null){
  result=await client.from('coachflow_state').insert({user_id:startedFor,state:state}).select('revision').single();
}else{
  result=await client.from('coachflow_state').update({state:state,revision:revision+1,updated_at:new Date().toISOString()}).eq('user_id',startedFor).eq('revision',revision).select('revision').maybeSingle();
}
if(startedFor!==user?.id)return;
if(result.error){
  if(result.error.code==='23505'){conflict=true;displayStatus('Versionskonflikt: Ein anderer Datensatz besteht bereits. Bitte Cloud-Version prüfen.',true)}
  else displayStatus('Lokal gespeichert; Cloud noch ausstehend: '+result.error.message,true);
  return;
}
if(!result.data){conflict=true;displayStatus('Versionskonflikt: anderes Gerät hat neuere Daten. Kein automatisches Überschreiben.',true);return;}
revision=Number(result.data.revision);
if(change===version){dirty=false;try{localStorage.removeItem(pendingKey(startedFor))}catch(e){}displayStatus('☁ Alles gespeichert · Version '+revision)}
else{dirty=true;displayStatus('Weitere Änderungen warten auf Synchronisierung');}
}catch(err){if(startedFor===user?.id)displayStatus('Lokal gespeichert; Cloud derzeit nicht erreichbar: '+err.message,true)}
finally{sending=false;if(user?.id===startedFor&&dirty&&!conflict&&change!==version)schedule()}
}
function saved(){if(!user||!document.body.classList.contains('cf-authenticated'))return;change++;dirty=true;try{const previous=JSON.parse(localStorage.getItem(pendingKey(user.id))||'null');localStorage.setItem(pendingKey(user.id),JSON.stringify({revision:previous?.revision??revision,at:new Date().toISOString()}))}catch(e){}displayStatus(navigator.onLine?'● Änderungen werden synchronisiert …':'Offline · Änderungen auf diesem Gerät gespeichert');if(navigator.onLine)schedule()}
async function connect(){
if(connecting)return;connecting=true;const generation=++run;
try{
await ensureSdk();
const session=await client.auth.getSession();if(session.error)throw session.error;
if(!session.data.session){
  const previous=user?.id;
  document.body.classList.remove('cf-authenticated');
  bridge()?.clearAccount?.();clearPrivateLocal(previous);clearLegacyPrototype();
  user=null;revision=null;dirty=false;conflict=false;clearTimeout(pending);pending=null;
  displayStatus('Bitte anmelden.');lock();return;
}
const verified=await client.auth.getUser();if(verified.error)throw verified.error;
const found=verified.data.user;if(!found)throw Error('Keine gültige Benutzersitzung');
if(user?.id===found.id){unlock();return}
if(user&&user.id!==found.id){
  // A provider/session switch must not display the preceding account while the new account hydrates.
  document.body.classList.remove('cf-authenticated');
  bridge()?.clearAccount?.();clearPrivateLocal(user.id);
  user=null;revision=null;dirty=false;conflict=false;clearTimeout(pending);pending=null;
}
lock();
const data=await record(found.id);if(generation!==run)return;
let localPending=null,localState=null;
try{localPending=JSON.parse(localStorage.getItem(pendingKey(found.id))||'null');localState=JSON.parse(localStorage.getItem(localKey(found.id))||'null')}catch(e){}
const localValid=localState&&Array.isArray(localState.players)&&Array.isArray(localState.exercises)&&localState.current&&Array.isArray(localState.sessions);
user=found;revision=data?Number(data.revision):null;dirty=false;conflict=false;change=0;
if(localPending&&localValid){
  bridge()?.setAccount?.(found.id,localState);dirty=true;change=1;
  if(localPending.revision!==revision){conflict=true;displayStatus('Lokale Änderungen und Cloud-Version unterscheiden sich. Keine Daten überschrieben. Bitte im Konto prüfen.',true)}
  else displayStatus('Lokal zwischengespeicherte Änderungen werden nachgeholt.');
}else{
  bridge()?.setAccount?.(found.id,data?.state||null);
}
unlock();
if(!conflict&&localPending&&localValid)schedule();
else if(!conflict&&!data){dirty=true;change++;schedule()}
else if(!conflict)displayStatus('Angemeldet: '+(found.email||'Konto')+' · Cloud-Version '+revision);
}catch(err){
  document.body.classList.remove('cf-authenticated');
  bridge()?.clearAccount?.();user=null;revision=null;dirty=false;conflict=false;clearTimeout(pending);pending=null;
  displayStatus('Anmeldung oder Datenabruf fehlgeschlagen: '+String(err?.message||err),true);lock();
}
finally{connecting=false}
}
async function signIn(email,password,register){
setBusy(true);
try{
await ensureSdk();
const res=register?await client.auth.signUp({email,password,options:{emailRedirectTo:REDIRECT}}):await client.auth.signInWithPassword({email,password});
if(res.error)throw res.error;
if(!res.data?.session){gateNotice('Registrierung angefordert. Bitte ggf. die Bestätigungs-E-Mail öffnen und danach anmelden.',false);return}
await connect();
}catch(err){gateNotice(String(err.message||err),true)}finally{setBusy(false)}
}
async function oauth(provider){
setBusy(true);
try{
await ensureSdk();
const opts={redirectTo:REDIRECT};if(provider==='azure')opts.scopes='email';
const res=await client.auth.signInWithOAuth({provider,options:opts});
if(res.error)throw res.error;
gateNotice('Weiterleitung zum Anbieter …',false);
}catch(err){gateNotice('Anmeldung über '+(provider==='azure'?'Microsoft':'Google')+' nicht verfügbar: '+err.message+'. OAuth muss im Supabase-Dashboard aktiviert sein.',true);setBusy(false)}
}
async function magic(){
const email=get('cf-auth-form')?.elements?.email?.value?.trim();
if(!email){gateNotice('Bitte zunächst die E-Mail-Adresse eintragen.',true);return}
setBusy(true);
try{await ensureSdk();const res=await client.auth.signInWithOtp({email,options:{emailRedirectTo:REDIRECT,shouldCreateUser:false}});if(res.error)throw res.error;gateNotice('Wenn das Konto existiert, wurde ein Anmeldelink angefordert. E-Mails können durch ein Versandlimit verzögert sein.',false)}
catch(e){gateNotice(e.message,true)}finally{setBusy(false)}
}
async function reloadCloud(){
if(!user)return;
if(!window.confirm('Die Cloud-Version auf dieses Gerät laden? Nicht synchronisierte lokale Änderungen werden verworfen.'))return;
try{const remote=await record(user.id);if(!remote){displayStatus('Noch kein Cloud-Datensatz für dieses Konto.');return}conflict=false;dirty=false;revision=Number(remote.revision);try{localStorage.removeItem(pendingKey(user.id))}catch(e){}bridge()?.setAccount(user.id,remote.state);displayStatus('Cloud-Version '+revision+' geladen.')}
catch(e){displayStatus('Cloud-Version konnte nicht geladen werden: '+e.message,true)}
}
async function logout(){
if(!client)return;
if((dirty||conflict)&&!window.confirm('Es gibt noch nicht synchronisierte oder widersprüchliche Änderungen. Wenn du dich abmeldest, kann die lokale Kopie verloren gehen. Trotzdem abmelden?'))return;
try{
const id=user?.id;
document.body.classList.remove('cf-authenticated');
clearTimeout(pending);pending=null;
const result=await client.auth.signOut();if(result?.error)throw result.error;
run++;user=null;revision=null;dirty=false;conflict=false;
bridge()?.clearAccount?.();
const localClean=clearPrivateLocal(id),legacyClean=clearLegacyPrototype();
displayStatus(localClean&&legacyClean?'Abgemeldet.':'Abgemeldet. Achtung: Einige lokale Daten konnten nicht entfernt werden. Bitte Websitedaten dieses Browsers löschen.',!(localClean&&legacyClean));lock();
}catch(e){displayStatus('Abmeldung fehlgeschlagen: '+e.message,true);if(user)document.body.classList.add('cf-authenticated')}
}
document.addEventListener('submit',e=>{if(e.target.id!=='cf-auth-form')return;e.preventDefault();if(busy)return;const form=e.target;const email=String(form.elements.email?.value||'').trim();const password=String(form.elements.password?.value||'');if(stage==='register'&&password.length<12){gateNotice('Bitte mindestens 12 Zeichen für dein Passwort wählen.',true);return}void signIn(email,password,stage==='register')});
document.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;switch(btn.id){
case'cf-switch':stage=stage==='login'?'register':'login';status='';markup();break;
case'cf-google':void oauth('google');break;
case'cf-microsoft':void oauth('azure');break;
case'cf-magic':void magic();break;
case'cloud-sync-now':if(conflict){displayStatus('Versionskonflikt: erst Cloud-Version überprüfen.',true)}else if(dirty){void flush()}else displayStatus('☁ Alles gespeichert · Version '+revision);break;
case'cloud-reload':void reloadCloud();break;
case'cloud-signout':void logout();break;
}});
window.addEventListener('online',()=>{if(user&&dirty&&!conflict)schedule();else if(!user)void connect()});
window.CoachFlowAuth=Object.freeze({onSaved:saved,connect:connect,status:()=>({authenticated:!!user,id:user?.id||null,revision,dirty,conflict}),paintStatus:()=>displayStatus(status,!!error),signOut:logout});
window.CoachFlowCloud=Object.freeze({refresh:()=>displayStatus(status,!!error)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{markup();void connect()});else{markup();void connect()}
})();