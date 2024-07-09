'use client'
import React, { useEffect, useRef, useCallback } from 'react'
import * as LR from '@uploadcare/blocks'
import { useRouter } from 'next/navigation'

type Props = {
  onUpload: (e: string) => any
}

LR.registerBlocks(LR)

const UploadCareButton = ({ onUpload }: Props) => {
  const router = useRouter()
  const ctxProviderRef = useRef<
    typeof LR.UploadCtxProvider.prototype & LR.UploadCtxProvider
  >(null)

  // Memoize the onUpload function
  const memoizedOnUpload = useCallback(onUpload, [onUpload])

  useEffect(() => {
    const handleUpload = async (e: any) => {
      const file = await memoizedOnUpload(e.detail.cdnUrl)
      if (file) {
        router.refresh()
      }
    }
  
    const currentRef = ctxProviderRef.current;
    if (currentRef) {
      currentRef.addEventListener('file-upload-success', handleUpload)
  
      return () => {
        // Cleanup function to remove the event listener
        currentRef.removeEventListener('file-upload-success', handleUpload)
      }
    }
  }, [memoizedOnUpload, router])

  return (
    <div>
      <lr-config
        ctx-name="my-uploader"
        pubkey="a9428ff5ff90ae7a64eb"
      />

      <lr-file-uploader-regular
        ctx-name="my-uploader"
        css-src={`${process.env.NEXT_PUBLIC_UPLOAD_CARE_CSS_SRC}${LR.PACKAGE_VERSION}${process.env.NEXT_PUBLIC_UPLOAD_CARE_SRC_PACKAGE}`}
      />

      <lr-upload-ctx-provider
        ctx-name="my-uploader"
        ref={ctxProviderRef}
      />
    </div>
  )
}

export default UploadCareButton
