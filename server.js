const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Data
let users = [
    { id: 1, username: 'admin', password: '123' },
    { id: 2, username: 'ronald', password: 'password' }
];

let products = [
    { id: 1, codigo: '101', nombre: 'Alquiler Pelicula A', precio: 1500, cantidad: 10 },
    { id: 2, codigo: '102', nombre: 'Alquiler Pelicula B', precio: 1500, cantidad: 5 },
    { id: 3, codigo: '103', nombre: 'Snacks', precio: 500, cantidad: 50 },
];

let invoices = [];

// --- API Endpoints ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Products CRUD
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        ...req.body
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body, id };
        res.json(products[index]);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    products = products.filter(p => p.id !== id);
    res.json({ success: true });
});

// Billing (Facturas)
app.post('/api/invoices', (req, res) => {
    const newInvoice = {
        id: invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1,
        date: new Date(),
        ...req.body
    };
    invoices.push(newInvoice);
    res.status(201).json(newInvoice);
});

app.get('/api/invoices', (req, res) => {
    res.json(invoices);
});

// Fallback for SPA routing if needed
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
