import React, { useEffect, useState } from 'react';
import axios from 'axios';

const USD_TO_INR = 82.5;

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(null);
  const [message, setMessage] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [thankYou, setThankYou] = useState(null);

  // Helper to format price in INR
  const formatINR = (usd) =>
    `₹${(usd * USD_TO_INR).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Fetch all products for grid view
  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]));
  }, []);

  // Fetch selected product details
  useEffect(() => {
    if (selectedProductId) {
      axios.get(`http://localhost:5000/api/product/${selectedProductId}`)
        .then(res => {
          setProduct(res.data);
          setVariants(res.data.variants);
          setSelectedColor('');
          setSelectedSize('');
          setQuantity(1);
          setVariantId(null);
          setMessage('');
        })
        .catch(() => {
          setProduct(null);
          setVariants([]);
          setSelectedColor('');
          setSelectedSize('');
          setQuantity(1);
          setVariantId(null);
          setMessage('Product not found.');
        });
    }
  }, [selectedProductId]);

  // Update variantId when color or size changes
  useEffect(() => {
    const variant = variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );
    setVariantId(variant ? variant.id : null);
  }, [selectedColor, selectedSize, variants]);

  // Get unique colors and sizes for selectors
  const colors = [...new Set(variants.map(v => v.color))];
  const sizes = [
    ...new Set(
      variants
        .filter(v => (selectedColor ? v.color === selectedColor : true))
        .map(v => v.size)
      ),
  ];

  // Open checkout form
  const handleBuyNow = () => {
    if (!variantId) {
      setMessage('Please select both color and size.');
      return;
    }
    if (quantity < 1) {
      setMessage('Quantity must be at least 1.');
      return;
    }
    setShowCheckout(true);
  };

  // Handle checkout form submission
  const handleCheckout = async (formData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/buy', {
        ...formData,
        variant_id: variantId,
        quantity,
      });
      setShowCheckout(false);
      setThankYou({
        order_number: res.data.order_number,
        txn_status: res.data.txn_status,
        product: product.title,
        quantity,
        price: product.price,
        total: (product.price * quantity),
      });
    } catch (err) {
      setShowCheckout(false);
      setMessage(
        err.response?.data?.error || 'Order failed. Please try again.'
      );
    }
  };

  // Helper to get unique values and total stock for a product
  const getProductInfo = (variants) => {
    const colors = [...new Set(variants.map(v => v.color))];
    const sizes = [...new Set(variants.map(v => v.size))];
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 40);
    return { colors, sizes, totalStock };
  };

  // Thank You Page
  if (thankYou) {
    return (
      <div style={{ maxWidth: 500, margin: '50px auto', padding: 32, border: '1px solid #ccc', borderRadius: 8, textAlign: 'center' }}>
        <h1>Thank You!</h1>
        <h3 style={{marginBottom:0}}>Order Number:</h3>
        <div style={{fontSize:24, fontWeight:'bold', marginBottom:10}}>{thankYou.order_number}</div>
        <h3 style={{marginBottom:0}}>Status:</h3>
        <div style={{fontSize:20, color:'green', marginBottom:20}}>{thankYou.txn_status}</div>
        <p>Product: <b>{thankYou.product}</b></p>
        <p>Quantity: <b>{thankYou.quantity}</b></p>
        <p>Total: <b>{formatINR(thankYou.total)}</b></p>
        <button style={{ marginTop: 20, padding: '8px 24px' }} onClick={() => { setThankYou(null); setSelectedProductId(null); }}>Back to Shop</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      <h1>Mini eCommerce</h1>
      {/* Product Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 32,
        }}
      >
        {products.map(prod => {
          const { colors, sizes, totalStock } = getProductInfo(prod.variants || []);
          return (
            <div
              key={prod.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 16,
                textAlign: 'center',
                boxShadow: selectedProductId === prod.id ? '0 0 10px #1976d2' : 'none',
                cursor: 'pointer',
                background: selectedProductId === prod.id ? '#f0f6ff' : '#fff',
                transition: 'box-shadow 0.2s, background 0.2s',
              }}
              onClick={() => setSelectedProductId(prod.id)}
            >
              <img
                src={prod.image_url}
                alt={prod.title}
                style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }}
              />
              <h3 style={{ margin: '10px 0 5px 0' }}>{prod.title}</h3>
              <p style={{ fontSize: 14, color: '#555', height: 40, overflow: 'hidden' }}>{prod.description}</p>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1976d2' }}>
                {formatINR(prod.price)}
              </div>
              {/* Colors, Sizes, Stock */}
              <div style={{ marginTop: 10, fontSize: 14 }}>
                <div><b>Colors:</b> {colors.join(', ')}</div>
                <div><b>Sizes:</b> {sizes.join(', ')}</div>
                <div><b>In Stock:</b> {totalStock}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Details and Buy Section */}
      {product && (
        <div style={{ maxWidth: 500, margin: '0 auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
          <img
            src={product.image_url}
            alt={product.title}
            style={{ width: '100%', borderRadius: 8, marginBottom: 10 }}
          />
          <h2>{product.title}</h2>
          <p>{product.description}</p>
          <h3>{formatINR(product.price)}</h3>

          {/* Variant Selectors */}
          <div style={{ marginBottom: 10 }}>
            <label>
              Color:&nbsp;
              <select
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
              >
                <option value="">Select</option>
                {colors.map(color => (
                  <option key={color}>{color}</option>
                ))}
              </select>
            </label>
            &nbsp;&nbsp;
            <label>
              Size:&nbsp;
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                disabled={!selectedColor && sizes.length > 1}
              >
                <option value="">Select</option>
                {sizes.map(size => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Quantity Selector */}
          <div style={{ marginBottom: 10 }}>
            <label>
              Quantity:&nbsp;
              <input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                style={{ width: 60 }}
              />
            </label>
          </div>

          {/* Buy Now Button */}
          {!showCheckout && (
            <button
              style={{
                marginTop: 10,
                padding: '10px 30px',
                fontSize: 18,
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          )}

          {/* Checkout Form Modal */}
          {showCheckout && (
            <CheckoutForm
              onSubmit={handleCheckout}
              onCancel={() => setShowCheckout(false)}
            />
          )}

          {/* Message */}
          {message && (
            <div
              style={{
                marginTop: 20,
                color: message.toLowerCase().includes('success') || message.toLowerCase().includes('order placed')
                  ? 'green'
                  : 'red',
              }}
            >
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------- Checkout Form Component -----------
function CheckoutForm({ onSubmit, onCancel }) {
  const [fields, setFields] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

  // Validation helpers
  const validate = () => {
    const errs = {};
    if (!fields.fullName.trim()) errs.fullName = 'Required';
    if (!/^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(fields.email)) errs.email = 'Invalid email';
    if (!/^[6-9]\d{9}$/.test(fields.phone)) errs.phone = 'Invalid phone (10 digits, starts with 6-9)';
    if (!fields.address.trim()) errs.address = 'Required';
    if (!fields.city.trim()) errs.city = 'Required';
    if (!fields.state.trim()) errs.state = 'Required';
    if (!/^\d{6}$/.test(fields.zip)) errs.zip = 'Invalid zip (6 digits)';
    if (!/^\d{16}$/.test(fields.cardNumber)) errs.cardNumber = 'Card must be 16 digits';
    if (!/^\d{2}\/\d{2}$/.test(fields.expiry)) errs.expiry = 'Format MM/YY';
    else {
      // Check if expiry is a future date
      const [mm, yy] = fields.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + yy, mm - 1, 1);
      if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
        errs.expiry = 'Card expired';
      }
    }
    if (!/^\d{3}$/.test(fields.cvv)) errs.cvv = 'CVV must be 3 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = e => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validate()) {
      onSubmit(fields);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <form
        style={{
          background: '#fff', padding: 24, borderRadius: 8, minWidth: 350, boxShadow: '0 2px 12px #0002'
        }}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <h2>Checkout</h2>
        <div>
          <label>Full Name</label><br />
          <input name="fullName" value={fields.fullName} onChange={handleChange} />
          {errors.fullName && <div style={{ color: 'red' }}>{errors.fullName}</div>}
        </div>
        <div>
          <label>Email</label><br />
          <input name="email" value={fields.email} onChange={handleChange} />
          {errors.email && <div style={{ color: 'red' }}>{errors.email}</div>}
        </div>
        <div>
          <label>Phone Number</label><br />
          <input name="phone" value={fields.phone} onChange={handleChange} />
          {errors.phone && <div style={{ color: 'red' }}>{errors.phone}</div>}
        </div>
        <div>
          <label>Address</label><br />
          <input name="address" value={fields.address} onChange={handleChange} />
          {errors.address && <div style={{ color: 'red' }}>{errors.address}</div>}
        </div>
        <div>
          <label>City</label><br />
          <input name="city" value={fields.city} onChange={handleChange} />
          {errors.city && <div style={{ color: 'red' }}>{errors.city}</div>}
        </div>
        <div>
          <label>State</label><br />
          <input name="state" value={fields.state} onChange={handleChange} />
          {errors.state && <div style={{ color: 'red' }}>{errors.state}</div>}
        </div>
        <div>
          <label>Zip Code</label><br />
          <input name="zip" value={fields.zip} onChange={handleChange} />
          {errors.zip && <div style={{ color: 'red' }}>{errors.zip}</div>}
        </div>
        <div>
          <label>Card Number</label><br />
          <input name="cardNumber" value={fields.cardNumber} onChange={handleChange} maxLength={16} />
          {errors.cardNumber && <div style={{ color: 'red' }}>{errors.cardNumber}</div>}
        </div>
        <div>
          <label>Expiry Date (MM/YY)</label><br />
          <input name="expiry" value={fields.expiry} onChange={handleChange} maxLength={5} placeholder="MM/YY" />
          {errors.expiry && <div style={{ color: 'red' }}>{errors.expiry}</div>}
        </div>
        <div>
          <label>CVV</label><br />
          <input name="cvv" value={fields.cvv} onChange={handleChange} maxLength={3} />
          {errors.cvv && <div style={{ color: 'red' }}>{errors.cvv}</div>}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>Pay & Place Order</button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default App;
