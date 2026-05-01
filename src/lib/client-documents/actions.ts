"use server";

import { revalidatePath } from "next/cache";

import {
  ALLOWED_MIME_TYPES,
  DOC_CATEGORIES,
  MAX_DOC_BYTES,
} from "@/lib/client-documents/schema";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "client-documents";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function safeFileName(name: string): string {
  // Keep the extension, sanitize the stem to avoid storage path quirks.
  const lastDot = name.lastIndexOf(".");
  const stem = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot) : "";
  const cleanedStem = stem
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return `${cleanedStem || "file"}${ext.toLowerCase()}`;
}

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const clientId = formData.get("client_id");
  const category = formData.get("category");
  const file = formData.get("file");

  if (typeof clientId !== "string" || !clientId) {
    return { ok: false, message: "Missing client_id." };
  }
  if (
    typeof category !== "string" ||
    !(DOC_CATEGORIES as readonly string[]).includes(category)
  ) {
    return { ok: false, message: "Invalid category." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pick a file to upload." };
  }
  if (file.size > MAX_DOC_BYTES) {
    return {
      ok: false,
      message: `File is too large (max ${Math.floor(MAX_DOC_BYTES / 1024 / 1024)} MB).`,
    };
  }
  if (
    file.type &&
    !(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return { ok: false, message: `Unsupported file type: ${file.type}` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated." };

  const cleaned = safeFileName(file.name);
  const path = `${clientId}/${category}/${crypto.randomUUID()}-${cleaned}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (uploadError) {
    return { ok: false, message: `Upload failed: ${uploadError.message}` };
  }

  const { data: row, error: insertError } = await supabase
    .from("client_documents")
    .insert({
      client_id: clientId,
      category,
      name: file.name,
      storage_path: path,
      size_bytes: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (insertError) {
    // Best-effort cleanup of the orphaned object.
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, message: insertError.message };
  }

  revalidatePath(`/clients/${clientId}`);
  return { ok: true, id: row.id };
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: doc, error: fetchError } = await supabase
    .from("client_documents")
    .select("id, client_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { ok: false, message: fetchError.message };
  if (!doc) return { ok: false, message: "Document not found." };

  const { error: deleteRowError } = await supabase
    .from("client_documents")
    .delete()
    .eq("id", id);
  if (deleteRowError) return { ok: false, message: deleteRowError.message };

  // Storage cleanup is best-effort — if the row is gone we no longer
  // surface the file, even if the object lingers.
  await supabase.storage.from(BUCKET).remove([doc.storage_path]);

  revalidatePath(`/clients/${doc.client_id}`);
  return { ok: true };
}

export async function createDocumentSignedUrl(
  id: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("client_documents")
    .select("storage_path, name")
    .eq("id", id)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!doc) return { ok: false, message: "Document not found." };

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60, { download: doc.name });
  if (signError || !data) {
    return { ok: false, message: signError?.message ?? "Failed to sign URL." };
  }
  return { ok: true, url: data.signedUrl };
}
