(function () {
  "use strict";

  const STORAGE_KEYS = {
    CART: "sandino_emp_cart_v1",
    HISTORY: "sandino_emp_history_v1"
  };

  const PRODUCTS = [
    {
      id: "med-bandeja-2",
      name: "Medialunas Artesanales (Bandeja x2)",
      category: "panificados",
      price: 10000,
      description: "Presentación sellada ideal para consumo rápido o reventa individual."
    },
    {
      id: "med-caja-6",
      name: "Pack Medialunas x6 Unidades",
      category: "panificados",
      price: 28000,
      description: "Formato práctico para desayunos, meriendas y puntos de reventa."
    },
    {
      id: "med-docena-12",
      name: "Docena Medialunas (x12 Unidades)",
      category: "combos",
      price: 52000,
      description: "Ideal para comercios, oficinas, reuniones y eventos corporativos."
    },
    {
      id: "combo-reventa-24",
      name: "Lote Reventa Comercial (x24 Unidades)",
      category: "combos",
      price: 98000,
      description: "Lote surtido para reventa directa con margen competitivo."
    }
  ];

  let state = {
    activeTab: "catalogo",
    activeCategory: "todos",
    cart: [],
    history: []
  };

  function formatGs(amount) {
    const safeNum = Number(amount) || 0;
    return safeNum.toLocaleString("es-PY") + " Gs.";
  }

  function safeReadStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function safeWriteStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      // Ignora errores de cuota o modo restringido en WebView
    }
  }

  function showToast(message) {
    const toastEl = document.getElementById("toast");
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");

    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function () {
      toastEl.classList.add("hidden");
    }, 2200);
  }

  function setActiveTab(tabName) {
    const validTabs = ["catalogo", "carrito", "historial"];
    if (!validTabs.includes(tabName)) tabName = "catalogo";
    state.activeTab = tabName;

    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      const isMatch = btn.getAttribute("data-tab") === tabName;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === "tab-" + tabName);
    });

    if (tabName === "carrito") renderCart();
    if (tabName === "historial") renderHistory();
  }

  function renderCatalog() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const filtered = state.activeCategory === "todos"
      ? PRODUCTS
      : PRODUCTS.filter(function (p) { return p.category === state.activeCategory; });

    grid.innerHTML = "";
    filtered.forEach(function (product) {
      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div>
          <span class="product-tag">${product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${product.description}</p>
        </div>
        <div class="product-footer">
          <span class="product-price">${formatGs(product.price)}</span>
          <button type="button" class="btn btn-add" data-add-id="${product.id}">+ Agregar</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function addToCart(productId) {
    const product = PRODUCTS.find(function (p) { return p.id === productId; });
    if (!product) return;

    const existing = state.cart.find(function (item) { return item.id === productId; });
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      });
    }

    safeWriteStorage(STORAGE_KEYS.CART, state.cart);
    updateBadge();
    showToast("Agregado: " + product.name);
  }

  function changeQty(productId, delta) {
    const idx = state.cart.findIndex(function (item) { return item.id === productId; });
    if (idx === -1) return;

    const nextQty = state.cart[idx].qty + delta;
    if (nextQty <= 0) {
      state.cart.splice(idx, 1);
    } else {
      state.cart[idx].qty = nextQty;
    }

    safeWriteStorage(STORAGE_KEYS.CART, state.cart);
    updateBadge();
    renderCart();
  }

  function updateBadge() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const totalQty = state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    badge.textContent = String(totalQty);
  }

  function renderCart() {
    const container = document.getElementById("cartItemsContainer");
    const checkoutBox = document.getElementById("checkoutBox");
    const totalUnitsEl = document.getElementById("totalUnits");
    const totalAmountEl = document.getElementById("totalAmount");
    const errorEl = document.getElementById("formError");

    if (!container || !checkoutBox) return;
    if (errorEl) errorEl.classList.add("hidden");

    if (state.cart.length === 0) {
      container.innerHTML = '<div class="empty-state">Tu carrito está vacío. Agrega productos desde el Catálogo.</div>';
      checkoutBox.classList.add("hidden");
      return;
    }

    checkoutBox.classList.remove("hidden");
    container.innerHTML = "";

    let totalUnits = 0;
    let totalAmount = 0;

    state.cart.forEach(function (item) {
      const subtotal = item.price * item.qty;
      totalUnits += item.qty;
      totalAmount += subtotal;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <div class="subtitle" style="color:#475569">${formatGs(item.price)} c/u · Subtotal: <strong>${formatGs(subtotal)}</strong></div>
        </div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" data-qty-id="${item.id}" data-delta="-1" aria-label="Restar cantidad">−</button>
          <span class="qty-value">${item.qty}</span>
          <button type="button" class="qty-btn" data-qty-id="${item.id}" data-delta="1" aria-label="Sumar cantidad">+</button>
        </div>
      `;
      container.appendChild(row);
    });

    if (totalUnitsEl) totalUnitsEl.textContent = String(totalUnits);
    if (totalAmountEl) totalAmountEl.textContent = formatGs(totalAmount);
  }

  function handleOrderSubmit(event) {
    event.preventDefault();
    const errorEl = document.getElementById("formError");
    if (errorEl) errorEl.classList.add("hidden");

    if (state.cart.length === 0) {
      showToast("No hay productos en el pedido");
      return;
    }

    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");
    const addrInput = document.getElementById("deliveryAddress");
    const notesInput = document.getElementById("orderNotes");

    const customerName = nameInput ? nameInput.value.trim() : "";
    const customerPhone = phoneInput ? phoneInput.value.trim() : "";
    const deliveryAddress = addrInput ? addrInput.value.trim() : "";
    const notes = notesInput ? notesInput.value.trim() : "";

    if (!customerName || !customerPhone || !deliveryAddress) {
      if (errorEl) {
        errorEl.textContent = "Completa nombre, teléfono y dirección de entrega para guardar el pedido.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    const totalAmount = state.cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    const record = {
      id: "PED-" + Date.now().toString().slice(-6),
      date: new Date().toLocaleString("es-PY"),
      customerName: customerName,
      customerPhone: customerPhone,
      deliveryAddress: deliveryAddress,
      notes: notes,
      items: state.cart.map(function (i) { return { name: i.name, qty: i.qty, price: i.price }; }),
      total: totalAmount
    };

    state.history.unshift(record);
    safeWriteStorage(STORAGE_KEYS.HISTORY, state.history);

    state.cart = [];
    safeWriteStorage(STORAGE_KEYS.CART, state.cart);
    updateBadge();

    const form = document.getElementById("orderForm");
    if (form) form.reset();

    showToast("Pedido " + record.id + " guardado correctamente");
    setActiveTab("historial");
  }

  function renderHistory() {
    const container = document.getElementById("historyContainer");
    if (!container) return;

    if (state.history.length === 0) {
      container.innerHTML = '<div class="empty-state">Aún no hay pedidos guardados en el historial.</div>';
      return;
    }

    container.innerHTML = "";
    state.history.forEach(function (order) {
      const itemsText = order.items
        .map(function (i) { return i.qty + "x " + i.name; })
        .join(", ");

      const card = document.createElement("article");
      card.className = "history-card";
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <strong>${order.id} · ${order.customerName}</strong>
          <span style="font-size:0.8rem;color:#64748B;">${order.date}</span>
        </div>
        <div style="font-size:0.86rem;margin-top:6px;color:#334155;">${itemsText}</div>
        <div style="font-size:0.82rem;margin-top:6px;color:#475569;">
          Tel: ${order.customerPhone} · Entrega: ${order.deliveryAddress}
          ${order.notes ? " · Nota: " + order.notes : ""}
        </div>
        <div style="margin-top:8px;font-weight:800;color:#0F2942;">Total: ${formatGs(order.total)}</div>
      `;
      container.appendChild(card);
    });
  }

  function bindEvents() {
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveTab(btn.getAttribute("data-tab"));
      });
    });

    document.querySelectorAll(".filter-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        document.querySelectorAll(".filter-chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        state.activeCategory = chip.getAttribute("data-category") || "todos";
        renderCatalog();
      });
    });

    const productGrid = document.getElementById("productGrid");
    if (productGrid) {
      productGrid.addEventListener("click", function (event) {
        const target = event.target.closest("[data-add-id]");
        if (!target) return;
        addToCart(target.getAttribute("data-add-id"));
      });
    }

    const cartContainer = document.getElementById("cartItemsContainer");
    if (cartContainer) {
      cartContainer.addEventListener("click", function (event) {
        const btn = event.target.closest("[data-qty-id]");
        if (!btn) return;
        const id = btn.getAttribute("data-qty-id");
        const delta = Number(btn.getAttribute("data-delta")) || 0;
        changeQty(id, delta);
      });
    }

    const clearCartBtn = document.getElementById("clearCartBtn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", function () {
        state.cart = [];
        safeWriteStorage(STORAGE_KEYS.CART, state.cart);
        updateBadge();
        renderCart();
        showToast("Carrito vaciado");
      });
    }

    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
      orderForm.addEventListener("submit", handleOrderSubmit);
    }

    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", function () {
        state.history = [];
        safeWriteStorage(STORAGE_KEYS.HISTORY, state.history);
        renderHistory();
        showToast("Historial limpiado");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    state.cart = safeReadStorage(STORAGE_KEYS.CART, []);
    state.history = safeReadStorage(STORAGE_KEYS.HISTORY, []);
    bindEvents();
    renderCatalog();
    updateBadge();
  });
})();
