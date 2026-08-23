function investigateTransaction(transaction, reconciliation) {
  const expected = Number(transaction.expected_net);
  const received = Number(transaction.received_net);
  const ledger = Number(transaction.ledger_amount);

  const variance = Number(
    (expected - received).toFixed(2)
  );

  let finding;
  let cause;
  let action;
  let confidence;

  switch (reconciliation.exception_type) {

    case "Missing Settlement":
      finding = "Settlement has not been received.";
      cause =
        "The transaction has a captured payment but no corresponding settlement record.";
      action =
        "Check the gateway settlement batch and confirm whether the transaction is pending or delayed.";
      confidence = 98;
      break;

    case "Settlement Shortfall":
      finding =
        `Settlement is ₹${Math.abs(variance).toFixed(2)} lower than expected.`;
      cause =
        "The gateway settlement amount does not fully cover the expected net amount.";
      action =
        "Review the gateway settlement file and verify additional fees, adjustments or deductions.";
      confidence = 94;
      break;

    case "Settlement Overpayment":
      finding =
        `Settlement is ₹${Math.abs(variance).toFixed(2)} higher than expected.`;
      cause =
        "The received amount exceeds the expected settlement amount.";
      action =
        "Check for duplicate captures, prior-period adjustments or incorrect settlement entries.";
      confidence = 91;
      break;

    case "Fee Mismatch":
      finding = "Settlement variance appears related to fees.";
      cause =
        "The received settlement differs from the expected amount while no refund is present.";
      action =
        "Compare the gateway's actual processing fee with the contracted fee rate.";
      confidence = 88;
      break;

    case "Refund Settlement Mismatch":
      finding = "Refund-related settlement discrepancy detected.";
      cause =
        "A refund exists but the settlement amount does not align with the expected post-refund amount.";
      action =
        "Verify the refund reference and confirm how the gateway represented the refund in settlement.";
      confidence = 96;
      break;

    case "Ledger Mismatch":
      finding = "Ledger amount does not agree with the expected settlement.";
      cause =
        "The accounting ledger contains an amount different from the expected net value.";
      action =
        "Compare the ledger entry against the gateway settlement and correct the accounting entry if required.";
      confidence = 95;
      break;

    case "Duplicate Capture":
      finding = "Possible duplicate payment capture detected.";
      cause =
        "The received settlement is substantially higher than the expected net amount.";
      action =
        "Check gateway events for multiple capture operations against the same transaction.";
      confidence = 90;
      break;

    default:
      finding = "Unable to determine a reliable cause.";
      cause =
        "The available financial records contain conflicting or insufficient evidence.";
      action =
        "Escalate for manual investigation.";
      confidence = 45;
  }

  return {
    transaction_id: transaction.transaction_id,
    finding,
    likely_cause: cause,
    evidence: {
      expected_net: expected,
      received_net: received,
      ledger_amount: ledger,
      variance
    },
    recommended_action: action,
    confidence: `${confidence}%`
  };
}

module.exports = {
  investigateTransaction
};