const express = require("express");
const cors = require("cors");
require("dotenv").config();

const transactionRoutes = require("./routes/transactions");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MoneyTrail API is running"
  });
});

app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MoneyTrail backend running on port ${PORT}`);
});