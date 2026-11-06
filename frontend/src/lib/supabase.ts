import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('supabaseUrl:', supabaseUrl);
console.log('supabasePublishableKey:', supabasePublishableKey);

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Не заданы VITE_SUPABASE_URL или VITE_SUPABASE_PUBLISHABLE_KEY. Проверьте .env и перезапустите dev-сервер.",
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
);
