"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SITE_URL } from "@/config/site";

export default function CopyThoughtLink({ id }: { id: number }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="quiet"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${SITE_URL}/thoughts/${id}`);
        } catch {
          return;
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "copied" : "copy link"}
    </Button>
  );
}
