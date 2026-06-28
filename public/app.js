const API_URL = 'http://localhost:3000/api';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const viewTitle = document.getElementById('current-view-title');
const userDisplayName = document.getElementById('user-display-name');

// Products Elements
const productsTableBody = document.querySelector('#products-table tbody');
const btnNewProduct = document.getElementById('btn-new-product');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const btnCloseModals = document.querySelectorAll('.btn-close-modal');

// Billing Elements
const billingProductList = document.getElementById('billing-product-list');
const invoiceItemsContainer = document.getElementById('invoice-items');
const invoiceSubtotal = document.getElementById('invoice-subtotal');
const invoiceTotal = document.getElementById('invoice-total');
const btnProcessInvoice = document.getElementById('btn-process-invoice');

// State
let currentUser = null;
let products = [];
let currentInvoice = [];

// --- UTILS ---
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification ${type}`;
    notif.classList.remove('hidden');
    setTimeout(() => {
        notif.classList.add('hidden');
    }, 3000);
}

function formatCurrency(amount) {
    return '₡' + parseFloat(amount).toLocaleString('es-CR');
}

// --- AUTH ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            userDisplayName.textContent = currentUser.username;
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            showNotification('Inicio de sesión exitoso');
            loadDashboardData();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Error al conectar con el servidor', 'error');
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// --- NAVIGATION ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const targetId = item.getAttribute('data-target');
        views.forEach(view => view.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        
        viewTitle.textContent = item.textContent.trim();

        if (targetId === 'products-view') loadProducts();
        if (targetId === 'billing-view') loadBillingProducts();
    });
});

// --- DASHBOARD ---
async function loadDashboardData() {
    try {
        const [prodRes, invRes] = await Promise.all([
            fetch(`${API_URL}/products`),
            fetch(`${API_URL}/invoices`)
        ]);
        const prods = await prodRes.json();
        const invs = await invRes.json();
        
        document.getElementById('stat-products').textContent = prods.length;
        document.getElementById('stat-invoices').textContent = invs.length;
        products = prods;
    } catch(err) {
        console.error(err);
    }
}

// --- PRODUCTS ---
async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        products = await res.json();
        renderProductsTable();
    } catch(err) {
        showNotification('Error al cargar productos', 'error');
    }
}

function renderProductsTable() {
    productsTableBody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${formatCurrency(p.precio)}</td>
            <td>${p.cantidad}</td>
            <td>
                <button class="btn-icon" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        productsTableBody.appendChild(tr);
    });
}

btnNewProduct.addEventListener('click', () => {
    productForm.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-title').textContent = 'Nuevo Producto';
    productModal.classList.remove('hidden');
});

btnCloseModals.forEach(btn => {
    btn.addEventListener('click', () => {
        productModal.classList.add('hidden');
    });
});

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const prodData = {
        codigo: document.getElementById('prod-codigo').value,
        nombre: document.getElementById('prod-nombre').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        cantidad: parseInt(document.getElementById('prod-stock').value)
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    try {
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prodData)
        });
        showNotification(id ? 'Producto actualizado' : 'Producto creado');
        productModal.classList.add('hidden');
        loadProducts();
    } catch(err) {
        showNotification('Error al guardar producto', 'error');
    }
});

window.editProduct = (id) => {
    const p = products.find(prod => prod.id === id);
    if(p) {
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-codigo').value = p.codigo;
        document.getElementById('prod-nombre').value = p.nombre;
        document.getElementById('prod-precio').value = p.precio;
        document.getElementById('prod-stock').value = p.cantidad;
        document.getElementById('modal-title').textContent = 'Editar Producto';
        productModal.classList.remove('hidden');
    }
};

window.deleteProduct = async (id) => {
    if(confirm('¿Está seguro de eliminar este producto?')) {
        try {
            await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
            showNotification('Producto eliminado');
            loadProducts();
        } catch(err) {
            showNotification('Error al eliminar', 'error');
        }
    }
};

// --- BILLING (FACTURACIÓN) ---
function loadBillingProducts() {
    billingProductList.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <h4>${p.nombre}</h4>
            <div class="price">${formatCurrency(p.precio)}</div>
            <div class="stock-small">Stock: ${p.cantidad}</div>
        `;
        div.addEventListener('click', () => addToInvoice(p));
        billingProductList.appendChild(div);
    });
}

function addToInvoice(product) {
    const existing = currentInvoice.find(item => item.product.id === product.id);
    if (existing) {
        if(existing.qty < product.cantidad) existing.qty++;
        else showNotification('No hay más stock disponible', 'error');
    } else {
        if(product.cantidad > 0) {
            currentInvoice.push({ product, qty: 1 });
        } else {
            showNotification('Producto sin stock', 'error');
            return;
        }
    }
    renderInvoice();
}

window.updateInvoiceQty = (id, change) => {
    const item = currentInvoice.find(i => i.product.id === id);
    if(item) {
        const newQty = item.qty + change;
        if(newQty <= 0) {
            currentInvoice = currentInvoice.filter(i => i.product.id !== id);
        } else if (newQty > item.product.cantidad) {
            showNotification('No hay más stock disponible', 'error');
        } else {
            item.qty = newQty;
        }
        renderInvoice();
    }
};

window.removeFromInvoice = (id) => {
    currentInvoice = currentInvoice.filter(i => i.product.id !== id);
    renderInvoice();
};

function renderInvoice() {
    invoiceItemsContainer.innerHTML = '';
    let total = 0;
    
    if(currentInvoice.length === 0) {
        invoiceItemsContainer.innerHTML = '<div class="empty-invoice">No hay productos en la factura.</div>';
        btnProcessInvoice.disabled = true;
    } else {
        currentInvoice.forEach(item => {
            const itemTotal = item.qty * item.product.precio;
            total += itemTotal;
            const row = document.createElement('div');
            row.className = 'invoice-item-row';
            row.innerHTML = `
                <div class="invoice-item-info">
                    <strong>${item.product.nombre}</strong><br>
                    <small>${formatCurrency(item.product.precio)} x ${item.qty}</small>
                </div>
                <div class="invoice-item-controls">
                    <button class="qty-btn" onclick="updateInvoiceQty(${item.product.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateInvoiceQty(${item.product.id}, 1)">+</button>
                    <strong style="margin-left: 10px">${formatCurrency(itemTotal)}</strong>
                    <button class="btn-icon delete" style="margin-left: 10px; font-size: 0.9rem;" onclick="removeFromInvoice(${item.product.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            invoiceItemsContainer.appendChild(row);
        });
        btnProcessInvoice.disabled = false;
    }
    
    invoiceSubtotal.textContent = formatCurrency(total);
    invoiceTotal.textContent = formatCurrency(total);
}

btnProcessInvoice.addEventListener('click', async () => {
    if(currentInvoice.length === 0) return;
    
    const invoiceData = {
        items: currentInvoice.map(i => ({ productId: i.product.id, qty: i.qty, price: i.product.precio })),
        total: currentInvoice.reduce((sum, item) => sum + (item.qty * item.product.precio), 0)
    };
    
    try {
        await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });
        
        showNotification('Factura procesada con éxito!');
        currentInvoice = [];
        renderInvoice();
        loadDashboardData(); // Update stats
    } catch(err) {
        showNotification('Error al procesar factura', 'error');
    }
});
