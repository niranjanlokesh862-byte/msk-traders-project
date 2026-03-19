// ============================================
// MSK TRADERS - Node.js + PostgreSQL Backend
// ============================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000; // ✅ IMPORTANT for Render

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ============================================
// PostgreSQL Connection
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test DB connection
pool.connect()
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err.message));

// ============================================
// API — STATUS
// ============================================

app.get("/api/status", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// ============================================
// API — LOGIN
// ============================================

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM admin WHERE username=$1 AND password=$2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API — PRODUCTS
// ============================================

// GET products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY createdat DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Products error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD product
app.post("/api/products", async (req, res) => {
  const {
    name, batch_no, supplier, category,
    quantity, purchase_price, selling_price,
    purchase_date, expiry_date, status
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products 
      (name, batch_no, supplier, category, quantity,
       purchase_price, selling_price, purchase_date, expiry_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        name, batch_no, supplier, category,
        quantity, purchase_price, selling_price,
        purchase_date, expiry_date, status
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Insert product error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// API — SUPPLIERS
// ============================================

// GET suppliers
app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM suppliers ORDER BY createdat DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Suppliers error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD supplier
app.post("/api/suppliers", async (req, res) => {
  const { name, contact } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO suppliers (name, contact) VALUES ($1,$2) RETURNING *",
      [name, contact]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Insert supplier error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE supplier
app.delete("/api/suppliers/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query("DELETE FROM suppliers WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete supplier error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SERVE FRONTEND
// ============================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});