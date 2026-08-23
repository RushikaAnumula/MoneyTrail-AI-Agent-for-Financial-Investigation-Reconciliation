function reconcileTransaction(transaction) {
  const grossAmount = Number(transaction.gross_amount);
  const processingFee = Number(transaction.processing_fee);
  const taxWithheld = Number(transaction.tax_withheld);
  const refundAmount = Number(transaction.refund_amount);

  const expectedNet = Number(transaction.expected_net);
  const receivedNet = Number(transaction.received_net);
  const ledgerAmount = Number(transaction.ledger_amount);

  const settlementVariance = expectedNet - receivedNet;
  const ledgerVariance = expectedNet - ledgerAmount;

  let status = "RECONCILED";
  let exceptionType = null;
  let severity = "NONE";
  let reason = "Gateway, settlement and ledger records agree.";

  // Missing settlement
  if (transaction.settlement_status === "missing") {
    status = "EXCEPTION";
    exceptionType = "Missing Settlement";
    severity = "HIGH";
    reason = "No settlement record was received for this transaction.";
  }

  // Refund mismatch
  else if (refundAmount > 0 && Math.abs(settlementVariance) > 1) {
    status = "EXCEPTION";
    exceptionType = "Refund Settlement Mismatch";
    severity = "HIGH";
    reason =
      "A refund exists, but the received settlement does not align with the expected amount after accounting for the refund.";
  }

  // Duplicate capture
  else if (
    receivedNet > expectedNet * 1.5
  ) {
    status = "EXCEPTION";
    exceptionType = "Duplicate Capture";
    severity = "HIGH";
    reason =
      "The received settlement is substantially greater than the expected net amount, indicating a possible duplicate capture.";
  }

  // Fee mismatch
  else if (
    Math.abs(settlementVariance) > 1 &&
    Math.abs(settlementVariance) <= 100 &&
    refundAmount === 0
  ) {
    status = "EXCEPTION";
    exceptionType = "Fee Mismatch";
    severity = "MEDIUM";
    reason =
      "The settlement variance is consistent with an unexpected processing fee or fee adjustment.";
  }

  // Settlement shortfall
  else if (settlementVariance > 1) {
    status = "EXCEPTION";
    exceptionType = "Settlement Shortfall";
    severity = settlementVariance > 250 ? "CRITICAL" : "HIGH";
    reason =
      `Received settlement is ₹${Math.abs(settlementVariance).toFixed(2)} lower than the expected net amount.`;
  }

  // Settlement overpayment
  else if (settlementVariance < -1) {
    status = "EXCEPTION";
    exceptionType = "Settlement Overpayment";
    severity = "MEDIUM";
    reason =
      `Received settlement is ₹${Math.abs(settlementVariance).toFixed(2)} higher than the expected net amount.`;
  }

  // Ledger mismatch
  else if (Math.abs(ledgerVariance) > 1) {
    status = "EXCEPTION";
    exceptionType = "Ledger Mismatch";
    severity = "MEDIUM";
    reason =
      `Ledger amount differs from expected net by ₹${Math.abs(ledgerVariance).toFixed(2)}.`;
  }

  return {
    transaction_id: transaction.transaction_id,
    status,
    exception_type: exceptionType,
    severity,

    gross_amount: grossAmount,
    processing_fee: processingFee,
    tax_withheld: taxWithheld,
    refund_amount: refundAmount,

    expected_net: expectedNet,
    received_net: receivedNet,
    ledger_amount: ledgerAmount,

    settlement_variance: Number(settlementVariance.toFixed(2)),
    ledger_variance: Number(ledgerVariance.toFixed(2)),

    reason
  };
}

module.exports = {
  reconcileTransaction
};