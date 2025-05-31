const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // <-- Put your MySQL password here
  database: 'mini_ecommerce'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected!');
});

// Get all products (for grid)
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, products) => {
    if (err) return res.status(500).json({ error: err });
    res.json(products);
  });
});

// Get product details and variants
app.get('/api/product/:id', (req, res) => {
  const productId = req.params.id;
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, products) => {
    if (err) return res.status(500).json({ error: err });
    if (!products.length) return res.status(404).json({ error: 'Product not found' });

    db.query('SELECT * FROM variants WHERE product_id = ?', [productId], (err, variants) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ ...products[0], variants });
    });
  });
});

// Generate random order number
function generateOrderNumber() {
  return 'ORD-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Place order (Buy Now + user info)
app.post('/api/buy', (req, res) => {
  const {
    variant_id, quantity,
    fullName = '', email = '', phone = '', address = '', city = '', state = '', zip = '',
    cardNumber = '', expiry = '', cvv = ''
  } = req.body;

  // Basic validation
  if (!variant_id || !quantity) {
    return res.status(400).json({ error: 'Variant and quantity are required.' });
  }

  db.query(
    'SELECT v.*, p.price FROM variants v JOIN products p ON v.product_id = p.id WHERE v.id = ?',
    [variant_id],
    (err, variants) => {
      if (err || !variants.length) return res.status(400).json({ error: 'Variant not found' });
      const variant = variants[0];
      if (variant.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

      const total_price = Number(variant.price) * Number(quantity);
      const order_number = generateOrderNumber();
      const order_status = "order placed";

      // Save order with user info and status
      db.query(
        `INSERT INTO orders 
          (order_number, user_name, user_email, total_price, user_phone, user_address, user_city, user_state, user_zip, card_number, card_expiry, card_cvv, txn_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_number, fullName, email, total_price, phone, address, city, state, zip, cardNumber, expiry, cvv, order_status],
        (err, result) => {
          if (err) return res.status(500).json({ error: err });
          const order_id = result.insertId;
          db.query(
            'INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES (?, ?, ?, ?)',
            [order_id, variant_id, quantity, variant.price],
            (err) => {
              if (err) return res.status(500).json({ error: err });
              db.query(
                'UPDATE variants SET stock = stock - ? WHERE id = ?',
                [quantity, variant_id],
                (err) => {
                  if (err) return res.status(500).json({ error: err });
                  // Respond with order number and status
                  res.json({
                    order_id,
                    order_number,
                    txn_status: order_status
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

app.listen(5000, () => console.log('Server running on port 5000'));
