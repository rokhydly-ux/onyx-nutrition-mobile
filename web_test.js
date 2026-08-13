const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const pin = 'central2026'; // this is 11 chars! Let's re-run this with the un-truncated pin
  const phone = '+221780000056';
  const cleanIdentifier = phone.replace(/\s+/g, '');
  const authEmail = cleanIdentifier.includes('@')
      ? cleanIdentifier
      : `${cleanIdentifier}@clients.onyxcrm.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: pin,
  });

  if (error) {
      console.error(error.message);
  } else {
      console.log("Success! Session:", data.session.user.id);
  }
}
test();
