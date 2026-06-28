// --- LOCAL STORAGE DB INITIALIZATION ---
function initDB() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([
            { id: 1, username: 'admin', password: '123' },
            { id: 2, username: 'ronald', password: 'password' }
        ]));
    }
    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify([
            { id: 1, codigo: '101', nombre: 'Alquiler Pelicula A', precio: 1500, cantidad: 10 },
            { id: 2, codigo: '102', nombre: 'Alquiler Pelicula B', precio: 1500, cantidad: 5 },
            { id: 3, codigo: '103', nombre: 'Snacks', precio: 500, cantidad: 50 },
        ]));
    }
    if (!localStorage.getItem('invoices')) {
        localStorage.setItem('invoices', JSON.stringify([]));
    }
}

initDB(); // Run on load

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

// Export / Import Elements
const btnExportData = document.getElementById('btn-export-data');
const btnImportData = document.getElementById('btn-import-data');
const importFile = document.getElementById('import-file');

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
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        userDisplayName.textContent = currentUser.username;
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        showNotification('Inicio de sesión exitoso');
        loadDashboardData();
    } else {
        showNotification('Credenciales inválidas', 'error');
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
function loadDashboardData() {
    const prods = JSON.parse(localStorage.getItem('products'));
    const invs = JSON.parse(localStorage.getItem('invoices'));
    
    document.getElementById('stat-products').textContent = prods.length;
    document.getElementById('stat-invoices').textContent = invs.length;
    products = prods;
}

// --- DATA EXPORT/IMPORT ---
btnExportData.addEventListener('click', () => {
    const data = {
        users: JSON.parse(localStorage.getItem('users')),
        products: JSON.parse(localStorage.getItem('products')),
        invoices: JSON.parse(localStorage.getItem('invoices'))
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", "respaldo_facturacion_" + dateStr + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showNotification('Respaldo descargado con éxito');
});

btnImportData.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.users && data.products && data.invoices) {
                localStorage.setItem('users', JSON.stringify(data.users));
                localStorage.setItem('products', JSON.stringify(data.products));
                localStorage.setItem('invoices', JSON.stringify(data.invoices));
                showNotification('Respaldo cargado correctamente');
                loadDashboardData();
                if(!document.getElementById('products-view').classList.contains('hidden')) loadProducts();
                if(!document.getElementById('billing-view').classList.contains('hidden')) loadBillingProducts();
            } else {
                showNotification('Formato de archivo inválido', 'error');
            }
        } catch (error) {
            showNotification('Error al leer el archivo', 'error');
        }
    };
    reader.readAsText(file);
    // Reset file input
    importFile.value = '';
});


// --- PRODUCTS ---
function loadProducts() {
    products = JSON.parse(localStorage.getItem('products'));
    renderProductsTable();
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

productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const prodData = {
        codigo: document.getElementById('prod-codigo').value,
        nombre: document.getElementById('prod-nombre').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        cantidad: parseInt(document.getElementById('prod-stock').value)
    };

    let prods = JSON.parse(localStorage.getItem('products'));

    if (id) {
        const index = prods.findIndex(p => p.id === parseInt(id));
        if(index !== -1) {
            prods[index] = { ...prods[index], ...prodData };
        }
    } else {
        const newId = prods.length > 0 ? Math.max(...prods.map(p => p.id)) + 1 : 1;
        prods.push({ id: newId, ...prodData });
    }

    localStorage.setItem('products', JSON.stringify(prods));
    showNotification(id ? 'Producto actualizado' : 'Producto creado');
    productModal.classList.add('hidden');
    loadProducts();
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

window.deleteProduct = (id) => {
    if(confirm('¿Está seguro de eliminar este producto?')) {
        let prods = JSON.parse(localStorage.getItem('products'));
        prods = prods.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(prods));
        showNotification('Producto eliminado');
        loadProducts();
    }
};

// --- BILLING (FACTURACIÓN) ---
function loadBillingProducts() {
    products = JSON.parse(localStorage.getItem('products'));
    
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

btnProcessInvoice.addEventListener('click', () => {
    if(currentInvoice.length === 0) return;
    
    const total = currentInvoice.reduce((sum, item) => sum + (item.qty * item.product.precio), 0);
    const invoiceData = {
        items: currentInvoice.map(i => ({ productId: i.product.id, qty: i.qty, price: i.product.precio })),
        total: total,
        date: new Date().toISOString()
    };
    
    let invs = JSON.parse(localStorage.getItem('invoices'));
    const newId = invs.length > 0 ? Math.max(...invs.map(i => i.id)) + 1 : 1;
    invs.push({ id: newId, ...invoiceData });
    localStorage.setItem('invoices', JSON.stringify(invs));

    let prods = JSON.parse(localStorage.getItem('products'));
    currentInvoice.forEach(item => {
        const pIndex = prods.findIndex(p => p.id === item.product.id);
        if(pIndex !== -1) {
            prods[pIndex].cantidad -= item.qty;
        }
    });
    localStorage.setItem('products', JSON.stringify(prods));
    
    showNotification('Factura procesada con éxito!');
    currentInvoice = [];
    renderInvoice();
    loadDashboardData();
    if(!document.getElementById('billing-view').classList.contains('hidden')) {
        loadBillingProducts();
    }
});
