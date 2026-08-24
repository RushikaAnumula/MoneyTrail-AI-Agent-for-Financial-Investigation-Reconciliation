import { createServerFn } from "@tanstack/react-start";
import { fetchTransactionsFromBackend } from "./transactions.server";

export const getTransactions = createServerFn({ method: "GET" }).handler(async () => {
  return fetchTransactionsFromBackend();
});

export const getTransactionById = createServerFn({ method: "GET" })
  .inputValidator((data: { transactionId: string }) => {
    if (!data || typeof data.transactionId !== "string" || !data.transactionId.trim()) {
      throw new Error("transactionId is required");
    }
    return { transactionId: data.transactionId.trim() };
  })
  .handler(async ({ data }) => {
    const all = await fetchTransactionsFromBackend();
    return all.find((t) => t.id === data.transactionId) ?? null;
  });
