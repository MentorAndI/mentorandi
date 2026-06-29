"use client";

import { useId, useState } from "react";

import { CharacterCounter } from "@/components/mentor/CharacterCounter";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export interface FirstConversationFormProps {
  characterLimit?: number;
}

export function FirstConversationForm({
  characterLimit = 1200,
}: FirstConversationFormProps) {
  const textareaId = useId();
  const [reflection, setReflection] = useState("");

  return (
    <div className="mt-10 space-y-5">
      <Textarea
        id={textareaId}
        label="What brought you here today?"
        maxLength={characterLimit}
        onChange={(event) => setReflection(event.target.value)}
        placeholder="Write whatever feels true right now."
        textareaClassName="min-h-48 resize-y rounded-xl border-zinc-300 px-4 py-4 text-base leading-7"
        value={reflection}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CharacterCounter current={reflection.length} max={characterLimit} />
        <Button className="sm:min-w-36" href="/reflection">
          Continue
        </Button>
      </div>
    </div>
  );
}
