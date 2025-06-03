"use client";

import {useCallback, useState} from "react";
import {useRouter} from "next/navigation";

import {IconButton} from "@/src/components/common";
import {CloseIcon} from "@/meshwave-ui/icons";

import PreviewCreatePoolDialog, {
  CreatePoolPreviewData,
} from "@/src/components/pages/create-pool-page/components/CreatePool/PreviewCreatePoolDialog";
import CreatePoolDialog from "@/src/components/pages/create-pool-page/components/CreatePool/CreatePoolDialog";
import {ChevronLeft} from "lucide-react";

export default function Page() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<CreatePoolPreviewData | null>(
    null,
  );

  const handleBackClick = useCallback(() => {
    previewData ? setPreviewData(null) : router.back();
  }, [previewData, router]);

  const handleCloseClick = useCallback(() => {
    router.push("/liquidity");
  }, [router]);

  const showPreview = Boolean(previewData);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleBackClick}
        className="flex items-center text-base leading-5 text-content-grey hover:text-content-primary cursor-pointer"
      >
        <ChevronLeft className="size-5" />
        Back
      </button>

      <section className="flex flex-col gap-6 p-4 rounded-2xl w-full max-w-[524px] mx-auto bg-[var(--background-grey-dark)] z-[5]">
        <div className="flex items-center justify-between border-b border-[var(--background-grey-light)] pb-4 text-[var(--content-grey)] font-medium text-base leading-[19px] gap-2">
          <p className="flex-1 text-[var(--content-primary)]">Create Pool</p>
          {showPreview && (
            <IconButton onClick={handleCloseClick}>
              <CloseIcon />
            </IconButton>
          )}
        </div>

        {showPreview && previewData ? (
          <PreviewCreatePoolDialog previewData={previewData} />
        ) : (
          <CreatePoolDialog setPreviewData={setPreviewData} />
        )}
      </section>

      {showPreview && (
        <div className="fixed inset-0 backdrop-blur-sm z-[4] pointer-events-auto" />
      )}
    </div>
  );
}
