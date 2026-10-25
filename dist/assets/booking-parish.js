// Route appointments from the authenticated member profile, never a display default.
export async function resolveBookingParish(session, {readProfile,readRows}) {
 if(session?.role!=='user'||!session.userId||!session.accessToken) throw new Error('Please sign in again before submitting a booking.');
 const profile=await readProfile(session.email,session.accessToken,session.userId);
 if(!profile) throw new Error('Your member profile could not be loaded. Please try again before submitting.');
 if(profile.parish_id) {
  const rows=await readRows('parishes','select=id,parish_name&id=eq.'+encodeURIComponent(profile.parish_id)+'&limit=1',session.accessToken);
  const name=String(rows?.[0]?.parish_name||'').trim();
  if(name)return name;
  throw new Error('The parish linked to your profile could not be found. Please update your parish in Profile Settings.');
 }
 const name=String(profile.parish_name||'').trim();
 if(!name)throw new Error('Please link your member profile to a parish in Profile Settings before booking.');
 return name;
}
export async function resolveCertificateParish(session,selected,{readRows}) {
 if(session?.role!=='user'||!session.accessToken)throw new Error('Please sign in again before submitting a certificate request.');
 const name=String(selected||'').trim();
 if(!name)throw new Error('Please select the parish that will process your certificate.');
 const exact=name.replace(/[\\*%_]/g,'\\$&');
 const rows=await readRows('parishes','select=id,parish_name&parish_name=ilike.'+encodeURIComponent(exact)+'&limit=2',session.accessToken);
 if(rows?.length!==1||!String(rows[0].parish_name||'').trim())throw new Error('Please select a valid parish from the parish list before submitting.');
 return String(rows[0].parish_name).trim();
}
