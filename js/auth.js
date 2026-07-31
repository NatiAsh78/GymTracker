// Thin wrapper around Supabase Auth. There is no self-serve signup in this
// app — the single account is created once via the Supabase dashboard
// (Authentication -> Users -> Add user). See supabase/schema.sql.

async function getSession(){
  const {data,error}=await supabaseClient.auth.getSession();
  if(error)throw error;
  return data.session;
}

async function signIn(email,password){
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error)throw error;
}

async function signOut(){
  const {error}=await supabaseClient.auth.signOut();
  if(error)throw error;
}
