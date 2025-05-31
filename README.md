🛒 Mini eCommerce App

A full-stack mini eCommerce simulation built with **React.js** (frontend), **Node.js/Express** (backend), and **MySQL** (database).

Features
- Product grid with images, colors, sizes, and stock info
- Product detail view with variant and quantity selection
- “Buy Now” checkout with:
  - Full Name, Email, Phone, Address, City, State, Zip
  - Card Number, Expiry Date, CVV (with validation)
- Order number and status displayed after purchase
- Randomized inventory stock for each variant
- Order and inventory management in MySQL
- Clean, modern UI

Screenshots
![Grid View Example](docs/grid-view.png)
![Checkout Example](docs/checkout-form.png)
![Thank You Example](docs/thankyou.png)

---

Tech Stack
- Frontend: React.js, Axios
- Backend: Node.js, Express, MySQL2
- Database: MySQL

---

Getting Started

### 1. Clone the Repo

```
git clone https://github.com/your-username/mini-ecommerce.git
cd mini-ecommerce
```

### 2. Setup the Database

- Create a MySQL database:
  ```
  CREATE DATABASE mini_ecommerce;
- **Randomize stock** for all variants:
  ```
  UPDATE variants SET stock = FLOOR(5 + (RAND() * 46));
  ```

### 3. Backend Setup

```
cd backend
npm install
node app.js
```
- The backend runs on [http://localhost:5000](http://localhost:5000)

### 4. Frontend Setup

```
cd ../frontend
npm install
npm start
```
- The frontend runs on [http://localhost:3000](http://localhost:3000)

---

## Usage

1. Browse products in a grid (3 per row)
2. Click a product to see details, pick color/size/quantity
3. Click **Buy Now** to open the checkout form
4. Enter your info (all fields required, validations included)
5. Place your order to see the Thank You page with order number and status

---

## Project Structure

```
mini-ecommerce/
  ├── backend/
  │     └── app.js
  ├── frontend/
  │     └── src/
  │           └── App.js
  └── README.md
```

---

## Customization

- **Product images:** Update the `image_url` in the `products` table.
- **Stock randomization:** Use the SQL command above or the provided Node.js script.
- **Currency:** Prices are shown in ₹ (INR), converted from USD in the frontend.

## License
MIT
