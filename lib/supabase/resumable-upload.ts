"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/env";

type ResumableUploadInput = {
  bucket: string;
  objectPath: string;
  file: File;
  contentType?: string;
  onProgress?: (percentage: number) => void;
};

export async function uploadMediaResumably({
  bucket,
  objectPath,
  file,
  contentType = file.type || "application/octet-stream",
  onProgress,
}: ResumableUploadInput) {
  const supabase = createBrowserSupabaseClient();
  const config = getSupabaseConfig();
  if (!supabase || !config) throw new Error("supabase_not_configured");

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) throw new Error("missing_session");

  const projectId = new URL(config.url).hostname.split(".")[0];
  if (!projectId) throw new Error("invalid_supabase_url");

  const { Upload } = await import("tus-js-client");

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: objectPath,
        contentType,
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal <= 0) return;
        onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve(),
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch(reject);
  });
}
