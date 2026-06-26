import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yuqhyjgunpgchuoltjho.supabase.co";
const SUPABASE_KEY = "sb_publishable_0WWX3UG0sYKBHGZly2TuMg_SF-1fQhO";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data: rooms, error } = await supabase.from('rooms').select('*').limit(1);
  if (error) {
    console.error(error);
  } else if (rooms.length > 0) {
    console.log(Object.keys(rooms[0]));
  } else {
    // try to insert an empty record to get the schema error
    const { error: insertError } = await supabase.from('rooms').insert({ id: '00000000-0000-0000-0000-000000000000' });
    console.log("Insert Error Details:", insertError);
  }
}

check();
