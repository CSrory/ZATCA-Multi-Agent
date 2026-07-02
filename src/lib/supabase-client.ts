"use client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const bucket       = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "invoices";

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnon);

/** True when env vars are wired up */
export const isSupabaseConfigured =
  supabaseUrl.startsWith("https://") && supabaseAnon.length > 10;

/**
 * Upload a file from the browser directly to the Supabase Storage bucket.
 * Returns the signed URL (10-year expiry) or a local fallback.
 */
export async function uploadToStorageBucket(
  invoiceId: string,
  file: File
): Promise<{ url: string; path: string; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { url: `local://${invoiceId}/${file.name}`, path: "", error: null };
  }

  const path = `invoices/${invoiceId}/${file.name}`;

  const { error } = await supabaseBrowser.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { url: "", path, error: error.message };

  const { data } = await supabaseBrowser.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

  if (!data?.signedUrl) {
    const pub = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    return { url: pub, path, error: null };
  }

  return { url: data.signedUrl, path, error: null };
}
