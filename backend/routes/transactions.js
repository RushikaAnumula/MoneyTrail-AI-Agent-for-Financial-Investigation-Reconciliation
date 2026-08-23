const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { investigateTransaction } = require("../investigator");
const { reconcileTransaction } = require("../reconciliation");
const router = express.Router();

const csvPath = path.join(__dirname, "../data/transactions_100.csv");
router.get("/:id/investigate", (req, res) => {
  const transactions = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      delete row.ground_truth;
      transactions.push(row);
    })
    .on("end", () => {
      const transaction = transactions.find(
        (item) => item.transaction_id === req.params.id
      );

      if (!transaction) {
        return res.status(404).json({
          error: "Transaction not found"
        });
      }

      const reconciliation = reconcileTransaction(transaction);

      const investigation = investigateTransaction(
        transaction,
        reconciliation
      );

      res.json({
        reconciliation,
        investigation
      });
    })
    .on("error", (error) => {
      console.error(error);

      res.status(500).json({
        error: "Failed to investigate transaction"
      });
    });
});
router.get("/reconcile", (req, res) => {
  const transactions = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
  delete row.ground_truth;
  transactions.push(row);
})
    .on("end", () => {
      const results = transactions.map(reconcileTransaction);

      const total = results.length;
      const matched = results.filter(
        (item) => item.status === "RECONCILED"
      ).length;

      const exceptions = total - matched;

      const matchRate = total === 0
        ? 0
        : Number(((matched / total) * 100).toFixed(2));

      res.json({
        total_records: total,
        matched_records: matched,
        exception_records: exceptions,
        match_rate: `${matchRate}%`,
        results
      });
    })
    .on("error", (error) => {
      console.error(error);
      res.status(500).json({
        error: "Failed to reconcile transactions"
      });
    });
});

router.get("/", (req, res) => {
  const transactions = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      transactions.push(row);
    })
    .on("end", () => {
      res.json({
        count: transactions.length,
        transactions
      });
    })
    .on("error", (error) => {
      console.error(error);
      res.status(500).json({
        error: "Failed to read transaction data"
      });
    });
});

module.exports = router;