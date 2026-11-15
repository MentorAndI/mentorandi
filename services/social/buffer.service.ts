const BUFFER_API_URL = "https://api.buffer.com";

export interface BufferOrganization {
  id: string;
  name: string;
}

export interface BufferChannel {
  id: string;
  name: string;
  displayName: string | null;
  service: string;
  isQueuePaused: boolean;
}

export interface BufferCreatePostInput {
  channelId?: string;
  dueAt?: string;
  mode?: "addToQueue" | "customScheduled" | "shareNow";
  text: string;
}

export class BufferServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "BufferServiceError";
  }
}

export class BufferService {
  private readonly apiKey = process.env.BUFFER_API_KEY?.trim();
  private readonly defaultChannelId = process.env.BUFFER_X_CHANNEL_ID?.trim();

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async getOrganizations(): Promise<BufferOrganization[]> {
    const data = await this.request<{
      account?: { organizations?: BufferOrganization[] };
    }>(\`
      query MentorAndIBufferOrganizations {
        account {
          organizations {
            id
            name
          }
        }
      }
    \`);

    return data.account?.organizations ?? [];
  }

  async getChannels(organizationId: string): Promise<BufferChannel[]> {
    const data = await this.request<{ channels?: BufferChannel[] }>(
      \`
        query MentorAndIBufferChannels($organizationId: OrganizationId!) {
          channels(input: {
            organizationId: $organizationId
            filter: { isLocked: false }
          }) {
            id
            name
            displayName
            service
            isQueuePaused
          }
        }
      \`,
      { organizationId },
    );

    return data.channels ?? [];
  }

  async createPost(input: BufferCreatePostInput) {
    const text = input.text.trim();

    if (!text) {
      throw new BufferServiceError("Post text is required.", 400);
    }

    const channelId = input.channelId?.trim() || this.defaultChannelId;

    if (!channelId) {
      throw new BufferServiceError(
        "BUFFER_X_CHANNEL_ID is not configured.",
        503,
      );
    }

    const mode = input.mode ?? (input.dueAt ? "customScheduled" : "addToQueue");

    if (mode === "customScheduled" && !input.dueAt) {
      throw new BufferServiceError(
        "dueAt is required for customScheduled posts.",
        400,
      );
    }

    const data = await this.request<{
      createPost?:
        | {
            post?: {
              dueAt?: string | null;
              id: string;
              status?: string | null;
              text?: string | null;
            };
          }
        | { message?: string };
    }>(
      \`
        mutation MentorAndICreateBufferPost(
          $text: String!
          $channelId: ChannelId!
          $mode: ShareMode!
          $dueAt: DateTime
        ) {
          createPost(input: {
            text: $text
            channelId: $channelId
            schedulingType: automatic
            mode: $mode
            dueAt: $dueAt
            aiAssisted: true
          }) {
            ... on PostActionSuccess {
              post {
                id
                text
                dueAt
                status
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      \`,
      {
        channelId,
        dueAt: input.dueAt ?? null,
        mode,
        text,
      },
    );

    const result = data.createPost;

    if (!result) {
      throw new BufferServiceError("Buffer did not return a post result.");
    }

    if ("message" in result && result.message) {
      throw new BufferServiceError(result.message, 400);
    }

    if (!("post" in result) || !result.post) {
      throw new BufferServiceError("Buffer did not create the post.");
    }

    return result.post;
  }

  private async request<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new BufferServiceError(
        "BUFFER_API_KEY is not configured.",
        503,
      );
    }

    const response = await fetch(BUFFER_API_URL, {
      body: JSON.stringify({ query, variables }),
      headers: {
        Authorization: \`Bearer \${this.apiKey}\`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const body = (await response.json().catch(() => null)) as {
      data?: T;
      errors?: Array<{ message?: string }>;
    } | null;

    if (!response.ok) {
      throw new BufferServiceError(
        \`Buffer request failed with status \${response.status}.\`,
        502,
      );
    }

    if (body?.errors?.length) {
      throw new BufferServiceError(
        body.errors
          .map((error) => error.message)
          .filter(Boolean)
          .join(" ") || "Buffer API returned an error.",
        502,
      );
    }

    if (!body?.data) {
      throw new BufferServiceError("Buffer returned an invalid response.", 502);
    }

    return body.data;
  }
}
