require("dotenv").config();

const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(bodyParser.json());


// ✅ MySQL (CREATE FIRST)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
});


// ✅ THEN CONNECT (AFTER CREATION)
db.connect((err) => {
  if (err) {
    console.log("❌ DB ERROR:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});


// ✅ Razorpay
let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.log("⚠️ Razorpay keys missing");
}


// ✅ Create Order
app.post("/create-order", async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: "INR",
    receipt: "receipt_order_1"
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating order");
  }
});


// ✅ Save Order
app.post("/save-order", (req, res) => {
  const { name, phone, address, items, amount, payment_id } = req.body;

  const query = `
    INSERT INTO orders (name, phone, address, items, amount, payment_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      name,
      phone,
      address,
      JSON.stringify(items),
      amount,
      payment_id
    ],
    (err, result) => {
      if (err) {
        console.log("DB Error:", err);
        return res.status(500).send("Error saving order");
      }

      res.send("Order saved successfully");
    }
  );
});


// ✅ Test route (important for checking live server)
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});


// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});