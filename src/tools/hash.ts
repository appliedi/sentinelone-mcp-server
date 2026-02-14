import { z } from "zod";
import { getHashReputation } from "../client/rest.js";

export const hashReputationSchema = z.object({
  hash: z
    .string()
    .describe("SHA1 (40 chars) or SHA256 (64 chars) hash to lookup"),
});

export async function handleHashReputation(
  params: z.infer<typeof hashReputationSchema>
) {
  try {
    // Validate hash format
    const hashLength = params.hash.length;
    if (hashLength !== 40 && hashLength !== 64) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Invalid hash format. Expected SHA1 (40 chars) or SHA256 (64 chars), got ${hashLength} chars`,
          },
        ],
        isError: true,
      };
    }
    if (!/^[a-fA-F0-9]+$/.test(params.hash)) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Invalid hash format. Hash must be hexadecimal characters only.",
          },
        ],
        isError: true,
      };
    }

    const result = await getHashReputation(params.hash);
    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No reputation data found for hash: ${params.hash}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result.data[0], null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting hash reputation: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
