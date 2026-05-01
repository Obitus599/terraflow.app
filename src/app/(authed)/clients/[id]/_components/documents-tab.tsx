"use client";

import { format, parseISO } from "date-fns";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash,
  Upload,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDocumentSignedUrl,
  deleteDocument,
  uploadDocument,
} from "@/lib/client-documents/actions";
import {
  DOC_CATEGORIES,
  DOC_CATEGORY_DESCRIPTIONS,
  DOC_CATEGORY_LABELS,
  type DocCategory,
} from "@/lib/client-documents/schema";

export interface DocRow {
  id: string;
  category: string;
  name: string;
  size_bytes: number;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader_name: string | null;
}

interface DocumentsTabProps {
  clientId: string;
  documents: DocRow[];
  currentUserId: string;
  isAdmin: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string | null) {
  if (mime?.startsWith("image/")) return ImageIcon;
  return FileText;
}

export function DocumentsTab({
  clientId,
  documents,
  currentUserId,
  isAdmin,
}: DocumentsTabProps) {
  const [category, setCategory] = useState<DocCategory>("contracts");
  const [isPending, startTransition] = useTransition();

  async function onDownload(id: string, name: string) {
    const result = await createDocumentSignedUrl(id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const a = document.createElement("a");
    a.href = result.url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteDocument(id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Deleted ${name}`);
    });
  }

  const grouped = new Map<DocCategory, DocRow[]>();
  for (const c of DOC_CATEGORIES) grouped.set(c, []);
  for (const d of documents) {
    const list = grouped.get(d.category as DocCategory);
    if (list) list.push(d);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          formData.set("client_id", clientId);
          formData.set("category", category);

          const file = formData.get("file");
          if (!(file instanceof File) || file.size === 0) {
            toast.error("Pick a file to upload.");
            return;
          }

          startTransition(async () => {
            const result = await uploadDocument(formData);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            toast.success(`Uploaded ${file.name}`);
            form.reset();
          });
        }}
        className="rounded-xl border border-line bg-bg-2 p-5"
      >
        <p className="section-label mb-4">Upload</p>
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="doc-category" className="text-xs text-text-3">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DocCategory)}
            >
              <SelectTrigger id="doc-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {DOC_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file" className="text-xs text-text-3">
              File
            </Label>
            <input
              id="doc-file"
              type="file"
              name="file"
              required
              aria-label="File to upload"
              title="File to upload"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp,image/svg+xml,text/plain,text/csv"
              className="block w-full rounded-md border border-line bg-bg text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-bg-3 file:px-3 file:py-2 file:text-xs file:text-text-2 hover:file:bg-bg-4"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </>
            )}
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-text-4">
          {DOC_CATEGORY_DESCRIPTIONS[category]} Up to 25 MB. PDF, Office,
          images, CSV, TXT.
        </p>
      </form>

      <div className="space-y-5">
        {DOC_CATEGORIES.map((c) => {
          const list = grouped.get(c) ?? [];
          return (
            <section key={c}>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="section-label">
                  {DOC_CATEGORY_LABELS[c]}
                  <span className="ml-2 text-text-4">{list.length}</span>
                </p>
              </div>
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-bg-2 px-4 py-6 text-center text-xs text-text-4">
                  Nothing in {DOC_CATEGORY_LABELS[c].toLowerCase()} yet.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line bg-bg-2">
                  {list.map((d) => {
                    const Icon = iconFor(d.mime_type);
                    const canDelete = isAdmin || d.uploaded_by === currentUserId;
                    return (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0 text-text-3" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-text">
                              {d.name}
                            </p>
                            <p className="text-xs text-text-3">
                              {formatBytes(d.size_bytes)} ·{" "}
                              {format(parseISO(d.created_at), "d MMM yyyy")}
                              {d.uploader_name ? ` · ${d.uploader_name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onDownload(d.id, d.name)}
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onDelete(d.id, d.name)}
                              className="text-danger hover:text-danger"
                              disabled={isPending}
                              title="Delete"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
