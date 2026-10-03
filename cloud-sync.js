/* CoachFlow v1.4 – optional user-owned Supabase backup, loaded lazily. */
(function () {
  'use strict';
  const SUPABASE_URL = 'https://gzrstopdqsjdrrrzzhix.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_X26Q5o8MAkS-QSTMYN-lYg_vyVpeag3';
  const REDIRECT_TO = 'https://marinkarimovic.github.io/coachflow/';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.min.js';
  let clientPromise = null, cloudRevision = null, loggedUserId = null;
  let busy = false;

  function indicator(message, isError) {
    const el = document.getElementById('cloud-indicator');
    if (el) {
      el.textContent = message;
      el.className = 'notice ' + (isError ? 'red' : 'green');
    }
  }
  function showError(err) {
    indicator('Cloud-Fehler: ' + (err && err.message ? err.message : String(err)), true);
  }
  function blockButtons(value) {
    busy = value;
    ['cloud-mail','cloud-verify','cloud-login-password-btn','cloud-register','cloud-set-password','cloud-upload','cloud-download','cloud-signout'].forEach(function(id){
      const el = document.getElementById(id);
      if(el) el.disabled = value;
    });
  }
  async function loadClient() {
    if(!navigator.onLine) throw new Error('Keine Internetverbindung. CoachFlow bleibt lokal nutzbar.');
    if(!clientPromise){
      clientPromise = new Promise(function(resolve,reject) {
        if(window.supabase && window.supabase.createClient) {
          resolve(window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{
            auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
          }));
          return;
        }
        const script = document.createElement('script');
        script.src = SDK_URL;
        script.async = true;
        script.onload = function() {
          if(!window.supabase || !window.supabase.createClient) {
            reject(new Error('Supabase-Bibliothek konnte nicht geladen werden.'));
            return;
          }
          resolve(window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{
            auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
          }));
        };
        script.onerror = function(){reject(new Error('Supabase-Bibliothek konnte nicht geladen werden.'));};
        document.head.appendChild(script);
      }).catch(function(err){clientPromise=null;throw err;});
    }
    return await clientPromise;
  }
  async function verifiedUser(client){
    const session=await client.auth.getSession();
    if(session.error)throw session.error;
    if(!session.data?.session)throw new Error('Du bist hier noch nicht angemeldet. Bitte E-Mail und Passwort verwenden.');
    const auth = await client.auth.getUser();
    if(auth.error) throw auth.error;
    const user = auth.data && auth.data.user;
    if(!user) throw new Error('Bitte zuerst mit Passwort, E-Mail-Link oder Einmalcode anmelden.');
    if(loggedUserId && loggedUserId !== user.id) cloudRevision=null;
    loggedUserId=user.id;
    return user;
  }
  async function currentRecord(client,user,includeState){
    const columns=includeState?'state,revision,updated_at':'revision,updated_at';
    const response=await client.from('coachflow_state').select(columns).eq('user_id',user.id).maybeSingle();
    if(response.error) throw response.error;
    return response.data;
  }
  async function refresh(){
    if(!document.getElementById('cloud-indicator'))return;
    indicator('Verbinde mit Supabase …');
    try{
      const client=await loadClient();
      const session=await client.auth.getSession();
      if(session.error)throw session.error;
      if(!session.data?.session){
        cloudRevision=null;loggedUserId=null;
        indicator('Noch nicht angemeldet. Bitte mit E-Mail und Passwort anmelden. Lokale Trainingsdaten bleiben erhalten.');
        return;
      }
      const result=await client.auth.getUser();
      if(result.error)throw result.error;
      const user=result.data && result.data.user;
      if(!user) {
        cloudRevision=null;loggedUserId=null;
        indicator('Noch nicht angemeldet. Deine Daten sind weiterhin nur auf diesem Gerät.');
        return;
      }
      if(loggedUserId && loggedUserId!==user.id)cloudRevision=null;
      loggedUserId=user.id;
      const remote=await currentRecord(client,user,false);
      indicator('Angemeldet: '+user.email+' · '+(remote?'Cloud-Backup vorhanden (Version '+remote.revision+').':'Noch kein Cloud-Backup.')+' Lokale Daten werden nicht automatisch geändert.');
    }catch(e){showError(e);}
  }
  async function signIn(){
    if(busy)return;
    const email=(document.getElementById('cloud-email')?.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      indicator('Bitte eine gültige E-Mail-Adresse eingeben.',true);return;
    }
    blockButtons(true);
    try{
      const client=await loadClient();
      const response=await client.auth.signInWithOtp({
        email:email,
        options:{emailRedirectTo:REDIRECT_TO,shouldCreateUser:true}
      });
      if(response.error)throw response.error;
      indicator('Anmeldelink wurde angefordert. Prüfe dein E-Mail-Postfach und öffne den Link auf diesem Gerät. Hinweis: Die Redirect-Adresse muss in Supabase Auth freigeschaltet sein.');
    }catch(e){showError(e);}finally{blockButtons(false);}
  }
  async function verifyCode(){
    if(busy)return;
    const email=(document.getElementById('cloud-email')?.value||'').trim();
    const token=(document.getElementById('cloud-otp')?.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^\d{6}$/.test(token)){indicator('Bitte E-Mail-Adresse und 6-stelligen Code eingeben.',true);return;}
    blockButtons(true);
    try{
      const client=await loadClient();
      const response=await client.auth.verifyOtp({email:email,token:token,type:'email'});
      if(response.error)throw response.error;
      cloudRevision=null;
      indicator('E-Mail-Code bestätigt. Du kannst nun deine lokalen Daten in der Cloud sichern.');
      await refresh();
    }catch(e){showError(e);}finally{blockButtons(false);}
  }
  function getEmail(){
    const email=(document.getElementById('cloud-email')?.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
    return email;
  }
  function getNewPassword(){
    const password=document.getElementById('cloud-new-password')?.value||'';
    const confirmation=document.getElementById('cloud-confirm-password')?.value||'';
    if(password.length<12)throw new Error('Bitte ein Passwort mit mindestens 12 Zeichen wählen.');
    if(password!==confirmation)throw new Error('Die beiden Passwörter stimmen nicht überein.');
    return password;
  }
  function clearPasswordInputs(){
    ['cloud-login-password','cloud-new-password','cloud-confirm-password'].forEach(function(id){
      const element=document.getElementById(id);
      if(element)element.value='';
    });
  }
  async function signInPassword(){
    if(busy)return;
    blockButtons(true);
    try{
      const email=getEmail();
      const password=document.getElementById('cloud-login-password')?.value||'';
      if(!password)throw new Error('Bitte dein Passwort eingeben.');
      const client=await loadClient();
      const result=await client.auth.signInWithPassword({email:email,password:password});
      if(result.error)throw result.error;
      cloudRevision=null;loggedUserId=null;
      indicator('Anmeldung erfolgreich. Deine lokalen Trainingsdaten bleiben unverändert.');
      await refresh();
    }catch(err){showError(err);}finally{clearPasswordInputs();blockButtons(false);}
  }
  async function registerPassword(){
    if(busy)return;
    blockButtons(true);
    try{
      const email=getEmail();
      const password=getNewPassword();
      const client=await loadClient();
      const existing=await client.auth.getUser();
      if(existing.data?.user){
        indicator('Du bist bereits angemeldet. Bitte nutze „Passwort für mein angemeldetes Konto festlegen“, damit kein zweites Konto entsteht.',true);
        return;
      }
      const result=await client.auth.signUp({
        email:email,password:password,
        options:{emailRedirectTo:REDIRECT_TO}
      });
      if(result.error)throw result.error;
      cloudRevision=null;loggedUserId=null;
      if(result.data?.session){
        indicator('Registrierung und Anmeldung erfolgreich. Die lokalen Daten bleiben unverändert.');
        await refresh();
      }else{
        indicator('Registrierung angefordert. Falls eine Bestätigungs-E-Mail erforderlich ist, bitte diese zuerst öffnen. Der Supabase-Standardversand funktioniert nur für autorisierte Projektteam-Adressen.');
      }
    }catch(err){showError(err);}finally{clearPasswordInputs();blockButtons(false);}
  }
  async function setPassword(){
    if(busy)return;
    blockButtons(true);
    try{
      const client=await loadClient();
      const user=await verifiedUser(client);
      const emailField=(document.getElementById('cloud-email')?.value||'').trim();
      if(emailField && emailField.toLowerCase()!==String(user.email||'').toLowerCase()){
        throw new Error('Das E-Mail-Feld stimmt nicht mit deinem angemeldeten Konto überein ('+user.email+'). Bitte korrigieren.');
      }
      const password=getNewPassword();
      if(!window.confirm('Passwort für das derzeit angemeldete Supabase-Konto '+user.email+' setzen bzw. ändern?'))return;
      const result=await client.auth.updateUser({password:password});
      if(result.error)throw result.error;
      indicator('Passwort für '+user.email+' gespeichert. Beim nächsten Mal kannst du dich direkt mit E-Mail und Passwort anmelden. Deine Trainingsdaten bleiben erhalten.');
    }catch(err){showError(err);}finally{clearPasswordInputs();blockButtons(false);}
  }
  async function upload(){
    if(busy)return;
    blockButtons(true);
    try{
      const client=await loadClient();
      const user=await verifiedUser(client);
      const existing=await currentRecord(client,user,false);
      if(existing && cloudRevision===null){
        indicator('Cloud-Backup existiert bereits. Bitte zuerst Cloud-Daten laden und prüfen. Eine unbestätigte Überschreibung wird verhindert.',true);
        return;
      }
      if(existing && Number(existing.revision)!==cloudRevision){
        indicator('Cloud-Version wurde auf einem anderen Gerät verändert. Bitte erst ein lokales JSON-Backup erstellen und die Cloud-Daten prüfen.',true);
        return;
      }
      if(!existing && cloudRevision!==null){
        indicator('Cloud-Backup ist nicht mehr vorhanden. Bitte Verbindung prüfen, bevor du erneut sicherst.',true);
        return;
      }
      const snapshot=window.coachflowBridge.getState();
      const payload=JSON.stringify(snapshot);
      if(new TextEncoder().encode(payload).byteLength>1800000)throw new Error('Lokaler Datensatz über 1,8 MB. Bitte zuerst Bilder/Videos nur als Links speichern.');
      if(!window.confirm('Deine CoachFlow-Daten inklusive eventuell erfasster Spielernamen als private Cloud-Sicherung speichern? Änderungen werden NICHT automatisch synchronisiert.'))return;
      let saved;
      if(!existing){
        const response=await client.from('coachflow_state').insert({user_id:user.id,state:snapshot}).select('revision').single();
        if(response.error)throw response.error;
        saved=response.data;
      }else{
        const response=await client.from('coachflow_state')
          .update({state:snapshot,revision:cloudRevision+1,updated_at:new Date().toISOString()})
          .eq('user_id',user.id).eq('revision',cloudRevision)
          .select('revision').maybeSingle();
        if(response.error)throw response.error;
        saved=response.data;
        if(!saved){cloudRevision=null;indicator('Versionskonflikt: Cloud-Daten wurden zwischenzeitlich aktualisiert. Keine Daten überschrieben.',true);return;}
      }
      cloudRevision=Number(saved.revision);
      indicator('Cloud-Sicherung erfolgreich · Version '+cloudRevision+'. Lokal gespeicherte Daten bleiben erhalten.');
    }catch(e){showError(e);}finally{blockButtons(false);}
  }
  async function download(){
    if(busy)return;
    blockButtons(true);
    try{
      const client=await loadClient();
      const user=await verifiedUser(client);
      const remote=await currentRecord(client,user,true);
      if(!remote){indicator('In diesem Account ist noch keine Cloud-Sicherung vorhanden.');return;}
      if(!window.confirm('ACHTUNG: Die Cloud-Daten ersetzen die lokalen CoachFlow-Daten auf DIESEM Gerät. Sichere zuerst unter Einstellungen ein JSON-Backup. Jetzt wirklich ersetzen?'))return;
      window.coachflowBridge.replaceLocal(remote.state);
      cloudRevision=Number(remote.revision);
      window.coachflowBridge.message('Cloud-Daten auf diesem Gerät geladen · Version '+cloudRevision);
    }catch(e){showError(e);}finally{blockButtons(false);}
  }
  async function signOut(){
    if(busy)return;
    blockButtons(true);
    try{
      const client=await loadClient();
      const r=await client.auth.signOut();
      if(r.error)throw r.error;
      cloudRevision=null;loggedUserId=null;
      indicator('Abgemeldet. Deine lokalen Daten bleiben erhalten.');
    }catch(e){showError(e);}finally{blockButtons(false);}
  }
  document.addEventListener('click',function(event){
    const button=event.target.closest('button');
    if(!button)return;
    const id=button.id;
    if(!['cloud-mail','cloud-verify','cloud-login-password-btn','cloud-register','cloud-set-password','cloud-upload','cloud-download','cloud-signout'].includes(id))return;
    event.preventDefault();
    if(id==='cloud-mail')void signIn();
    if(id==='cloud-verify')void verifyCode();
    if(id==='cloud-login-password-btn')void signInPassword();
    if(id==='cloud-register')void registerPassword();
    if(id==='cloud-set-password')void setPassword();
    if(id==='cloud-upload')void upload();
    if(id==='cloud-download')void download();
    if(id==='cloud-signout')void signOut();
  });
  window.CoachFlowCloud=Object.freeze({refresh:refresh});
})();