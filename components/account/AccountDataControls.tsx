"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { accountDataDeleteConfirmation } from "@/services/account-data/account-data.types";

interface AccountDataDeleteCounts {
  clearedSelectedMentor: boolean;
  deletedConversations: number;
  deletedFeedback: number;
  deletedGoals: number;
  deletedJournalEntries: number;
  deletedMemories: number;
  deletedMessages: number;
  deletedReflections: number;
  deletedUsageEvents: number;
}

interface AccountDataDeleteResponse {
  counts: AccountDataDeleteCounts;
}

interface AccountDataErrorResponse {
  error?: string;
  errors?: Record<string, string>;
}

export function AccountDataControls() {
  const [confirmation, setConfirmation] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const trimmedConfirmation = confirmation.trim();

  async function handleExport() {
    setErrorMessage("");
    setExportMessage("");
    setIsExporting(true);

    try {
      const response = await fetch("/api/account/export");
      const responseBody = await response.json();

      if (!response.ok) {
        setErrorMessage(
          formatErrorResponse(responseBody as AccountDataErrorResponse),
        );
        return;
      }

      downloadJson(responseBody);
      setExportMessage("Your data export is ready.");
    } catch {
      setErrorMessage("Unable to export account data.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setDeleteMessage("");
    setErrorMessage("");

    if (trimmedConfirmation !== accountDataDeleteConfirmation) {
      setErrorMessage(
        `Type ${accountDataDeleteConfirmation} to confirm deletion.`,
      );
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/account/delete-data", {
        body: JSON.stringify({ confirmation: trimmedConfirmation }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseBody = (await response.json()) as
        | AccountDataDeleteResponse
        | AccountDataErrorResponse;

      if (!response.ok) {
        setErrorMessage(formatErrorResponse(responseBody));
        return;
      }

      const { counts } = responseBody as AccountDataDeleteResponse;

      setConfirmation("");
      setDeleteMessage(formatDeleteCounts(counts));
    } catch {
      setErrorMessage("Unable to delete account data.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-5" variant="bordered">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">
            Export my data
          </h2>
          <p className="text-sm leading-6 text-zinc-600">
            Download a JSON copy of your account, conversations, messages,
            memories, goals, reflections, journal entries, feedback, usage,
            subscription and credit records.
          </p>
        </div>

        {exportMessage ? (
          <p className="text-sm text-zinc-600" role="status">
            {exportMessage}
          </p>
        ) : null}

        <Button
          disabled={isExporting}
          onClick={handleExport}
          type="button"
          variant="secondary"
        >
          {isExporting ? "Exporting..." : "Export my data"}
        </Button>
      </Card>

      <Card className="space-y-5" variant="bordered">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">
            Delete my mentor data
          </h2>
          <p className="text-sm leading-6 text-zinc-600">
            This removes your conversations, messages, memories, goals,
            reflections, journal entries, feedback, usage events and saved
            mentor selection. Your sign-in, subscription, billing and credit
            records are not deleted.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleDelete}>
          <Input
            autoComplete="off"
            id="delete-mentor-data-confirmation"
            label={`Type ${accountDataDeleteConfirmation} to confirm`}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={accountDataDeleteConfirmation}
            value={confirmation}
          />
          <p className="text-sm leading-6 text-zinc-500">
            This action only runs after the confirmation text matches exactly.
          </p>

          {deleteMessage ? (
            <p className="text-sm text-zinc-600" role="status">
              {deleteMessage}
            </p>
          ) : null}

          <Button
            disabled={isDeleting || !trimmedConfirmation}
            type="submit"
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete my mentor data"}
          </Button>
        </form>
      </Card>

      {errorMessage ? (
        <p className="lg:col-span-2 text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `mentorandi-export-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatErrorResponse(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") {
    return "Unable to complete account data request.";
  }

  const errorResponse = responseBody as AccountDataErrorResponse;

  if (errorResponse.error) {
    return errorResponse.error;
  }

  if (errorResponse.errors) {
    return Object.values(errorResponse.errors).join(" ");
  }

  return "Unable to complete account data request.";
}

function formatDeleteCounts(counts: AccountDataDeleteCounts) {
  return [
    `${counts.deletedMessages} messages`,
    `${counts.deletedConversations} conversations`,
    `${counts.deletedMemories} memories`,
    `${counts.deletedGoals} goals`,
    `${counts.deletedReflections} reflections`,
    `${counts.deletedJournalEntries} journal entries`,
    `${counts.deletedFeedback} feedback entries`,
    `${counts.deletedUsageEvents} usage events`,
    counts.clearedSelectedMentor ? "saved mentor selection cleared" : null,
  ]
    .filter(Boolean)
    .join(", ");
}