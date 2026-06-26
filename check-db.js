import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yuqhyjgunpgchuoltjho.supabase.co";
const SUPABASE_KEY = "sb_publishable_0WWX3UG0sYKBHGZly2TuMg_SF-1fQhO";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("Checking hotels...");
  const { data: hotels, error: hErr } = await supabase.from("hotels").select("*");
  if (hErr) console.error("Hotels Error:", hErr);
  else console.log("Hotels:", hotels);

  console.log("Checking rooms...");
  const { data: rooms, error: rErr } = await supabase.from("rooms").select("*, hotels(name, slug)");
  if (rErr) console.error("Rooms Error:", rErr);
  else console.log("Rooms:", rooms);
}

check();
