import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bucketName   = process.env.SUPABASE_STORAGE_BUCKET ?? "invoices";

// Server-side admin client — full storage access
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ─── Storage helpers ──────────────────────────────────────────────────────────

export interface UploadResult {
  url:   string;   // signed public URL
  path:  string;   // storage path (for deletion)
  error: null;
}
export interface UploadError {
  url:   null;
  path:  null;
  error: string;
}

/**
 * Upload an invoice file to Supabase Storage.
 * Returns the signed public URL stored in the DB.
 * Path pattern: invoices/{cuid}/{originalFileName}
 */
export async function uploadInvoiceFile(
  invoiceId: string,
  fileName:  string,
  buffer:    Buffer,
  mimeType:  string
): Promise<UploadResult | UploadError> {
  const path = `invoices/${invoiceId}/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(path, buffer, {
      contentType:  mimeType,
      upsert:       false,
      cacheControl: "3600",
    });

  if (error) {
    console.error("[Supabase Storage] Upload failed:", error.message);
    return { url: null, path: null, error: error.message };
  }

  // Create a signed URL valid for 10 years (hackathon simplicity)
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

  if (signError || !signedData?.signedUrl) {
    // Fallback: build public URL manually
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
    return { url: publicUrl, path, error: null };
  }

  return { url: signedData.signedUrl, path, error: null };
}

/**
 * Delete a stored invoice file (e.g. on record deletion).
 */
export async function deleteInvoiceFile(path: string): Promise<void> {
  await supabaseAdmin.storage.from(bucketName).remove([path]);
}
