require("dotenv").config();

const express = require("express");
const Razorpay = require("razorpay");
const cors = require('cors');

const app = express();


app.use(cors({
  origin: "*",   // allow all for now (to fix issue)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

app.use(express.json());

// ✅ MySQL (CREATE FIRST)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log("ENV CHECK:");
console.log("KEY:", process.env.RAZORPAY_KEY_ID);
console.log("DB HOST:", process.env.DB_HOST);
// ✅ THEN CONNECT (AFTER CREATION)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ DB ERROR:', err);
  } else {
    console.log('✅ DB CONNECTED');
  }
});


// ✅ Razorpay
console.log("KEY_ID:", process.env.RAZORPAY_KEY_ID);
let razorpay;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  console.log("✅ Razorpay keys found");

  razorpay = new (require("razorpay"))({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.log("❌ Razorpay keys missing");
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
app.post("/save-order", async (req, res) => {
  const { name, phone, address, items, amount, payment_id } = req.body;

  const query = `
    INSERT INTO orders (name, phone, address, items, amount, payment_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  try {
    await pool.query(query, [
      name,
      phone,
      address,
      JSON.stringify(items),
      amount,
      payment_id
    ]);

    res.send("Order saved successfully");
  } catch (err) {
    console.log("DB Error:", err);
    res.status(500).send("Error saving order");
  }
});


// ✅ Test route (important for checking live server)
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});


// ✅ Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});