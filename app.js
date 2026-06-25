const VOID_CART_KEY = "voidCarrinho";
const VOID_FAVORITES_KEY = "voidFavoritos";

function parseStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeProduct(product = {}) {
  return {
    id: product.id || product.productId || String(Date.now()),
    nome: product.nome || product.name || "Produto VOID",
    preco: Number(product.preco || product.price || 0),
    imagem: product.imagem || product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",
    categoria: product.categoria || product.category || "Streetwear",
    tamanho: product.tamanho || product.size || "Único",
    quantidade: Number(product.quantidade || product.quantity || 1)
  };
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCart() {
  return parseStorage(VOID_CART_KEY);
}

function saveCart(cart) {
  saveStorage(VOID_CART_KEY, cart);
  updateCartBadge();
}

function addToCart(product, quantity = 1, size = "Único") {
  const normalized = normalizeProduct({ ...product, quantidade: quantity, tamanho: size });
  const cart = getCart();
  const existing = cart.find((item) => item.id === normalized.id && item.tamanho === normalized.tamanho);

  if (existing) {
    existing.quantidade = Number(existing.quantidade || 1) + Number(quantity || 1);
  } else {
    cart.push(normalized);
  }

  saveCart(cart);
  toast("Produto adicionado ao carrinho.");
}

function removeCartItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCartPage();
}

function clearCart() {
  saveCart([]);
}

function getFavorites() {
  return parseStorage(VOID_FAVORITES_KEY);
}

function saveFavorites(favorites) {
  saveStorage(VOID_FAVORITES_KEY, favorites);
}

function addToFavorites(product) {
  const normalized = normalizeProduct(product);
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.id === normalized.id);

  if (!exists) {
    favorites.push(normalized);
    saveFavorites(favorites);
    toast("Produto adicionado aos favoritos.");
  } else {
    toast("Esse produto já está nos favoritos.");
  }
}

function removeFavorite(index) {
  const favorites = getFavorites();
  favorites.splice(index, 1);
  saveFavorites(favorites);
  renderFavoritesPage();
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + Number(item.preco || 0) * Number(item.quantidade || 1), 0);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + Number(item.quantidade || 1), 0);
}

function updateCartBadge() {
  const badge = document.querySelector("[data-cart-count]");
  if (badge) badge.textContent = cartCount();
}

function toast(message) {
  const oldToast = document.querySelector(".void-toast");
  if (oldToast) oldToast.remove();

  const element = document.createElement("div");
  element.className = "void-toast";
  element.textContent = message;
  document.body.appendChild(element);

  setTimeout(() => element.classList.add("show"), 20);
  setTimeout(() => {
    element.classList.remove("show");
    setTimeout(() => element.remove(), 250);
  }, 2400);
}

function renderCartPage() {
  const container = document.getElementById("cart-container");
  const totalElement = document.getElementById("cart-total");
  const countElement = document.getElementById("cart-count");
  const emptyElement = document.getElementById("cart-empty");

  if (!container) return;

  const cart = getCart();

  if (!cart.length) {
    container.innerHTML = "";
    if (emptyElement) emptyElement.style.display = "block";
    if (countElement) countElement.textContent = "0";
    if (totalElement) totalElement.textContent = formatMoney(0);
    return;
  }

  if (emptyElement) emptyElement.style.display = "none";

  container.innerHTML = cart.map((item, index) => `
    <article class="cart-item">
      <img src="${item.imagem}" alt="${item.nome}">
      <div class="cart-item-info">
        <h3>${item.nome}</h3>
        <p>Tamanho: ${item.tamanho || "Único"}</p>
        <p>Quantidade: ${item.quantidade || 1}</p>
        <strong>${formatMoney(Number(item.preco) * Number(item.quantidade || 1))}</strong>
      </div>
      <button class="mini-btn danger" type="button" onclick="VOIDStore.removeCartItem(${index})">Remover</button>
    </article>
  `).join("");

  if (countElement) countElement.textContent = String(cartCount());
  if (totalElement) totalElement.textContent = formatMoney(cartTotal());
}

function renderFavoritesPage() {
  const container = document.getElementById("favorites-container");
  const emptyElement = document.getElementById("favorites-empty");

  if (!container) return;

  const favorites = getFavorites();

  if (!favorites.length) {
    container.innerHTML = "";
    if (emptyElement) emptyElement.style.display = "block";
    return;
  }

  if (emptyElement) emptyElement.style.display = "none";

  container.innerHTML = favorites.map((item, index) => `
    <article class="product">
      <a href="produto.html?id=${encodeURIComponent(item.id)}">
        <img src="${item.imagem}" alt="${item.nome}">
      </a>
      <div class="product-body">
        <span class="product-category">${item.categoria || "Streetwear"}</span>
        <h3>${item.nome}</h3>
        <strong>${formatMoney(item.preco)}</strong>
        <div class="product-card-actions">
          <button class="buy-btn" type="button" onclick='VOIDStore.addToCart(${JSON.stringify(item).replaceAll("'", "&apos;")})'>Adicionar ao Carrinho</button>
          <button class="icon-btn" type="button" onclick="VOIDStore.removeFavorite(${index})">Remover</button>
        </div>
      </div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartPage();
  renderFavoritesPage();

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
});

window.VOIDStore = {
  formatMoney,
  getCart,
  saveCart,
  addToCart,
  removeCartItem,
  clearCart,
  getFavorites,
  addToFavorites,
  removeFavorite,
  cartTotal,
  cartCount,
  toast,
  renderCartPage,
  renderFavoritesPage
};
