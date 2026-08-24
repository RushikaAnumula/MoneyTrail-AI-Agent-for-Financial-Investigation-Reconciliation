import { createServerFn } from "@tanstack/react-start";
import { investigateTransaction } from "./investigation.server";

export const getInvestigation = createServerFn({ method: "POST" })
  .inputValidator((data: { transactionId: string }) => {
    if (!data || typeof data.transactionId !== "string" || !data.transactionId.trim()) {
      throw new Error("transactionId is required");
    }
    return { transactionId: data.transactionId.trim() };
  })
  .handler(async ({ data }) => investigateTransaction(data.transactionId));
