const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ✅ MySQL

db.connect((err) => {
    if (err) console.log("❌ DB ERROR:", err);
    else console.log("✅ MySQL Connected");
});

// ✅ Razorpay (FIXED)
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

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

    db.query(query, [
        name,
        phone,
        address,
        JSON.stringify(items),
        amount,
        payment_id
    ], (err, result) => {
        if (err) {
            console.log("DB Error:", err);
            return res.status(500).send("Error saving order");
        }

        res.send("Order saved successfully");
    });
});

// ✅ Start server
aconst PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
// db.connect((err) => {
//   if (err) {
//     console.log("DB Error:", err);
//   } else {
//     console.log("MySQL Connected");
//   }
// });