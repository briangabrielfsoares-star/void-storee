import { db, auth, FIREBASE_CONFIG_READY } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const fallbackProducts = [
  {
    id: "void-oversized-black",
    nome: "Camiseta Oversized VOID Black",
    preco: 129.9,
    categoria: "Camisetas",
    imagem: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000",
    descricao: "Camiseta oversized premium com caimento pesado, visual minimalista e estética streetwear.",
    tamanhos: ["P", "M", "G", "GG"],
    estoque: 24,
    destaque: true,
    ativo: true
  },
  {
    id: "void-moletom-graphite",
    nome: "Moletom VOID Graphite",
    preco: 269.9,
    categoria: "Moletons",
    imagem: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1000",
    descricao: "Moletom premium de toque macio, corte urbano e construção pensada para looks dark e clean.",
    tamanhos: ["P", "M", "G", "GG"],
    estoque: 16,
    destaque: true,
    ativo: true
  },
  {
    id: "void-cargo-stone",
    nome: "Calça Cargo VOID Stone",
    preco: 239.9,
    categoria: "Calças",
    imagem: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000",
    descricao: "Calça cargo com bolsos utilitários, cintura confortável e pegada streetwear moderna.",
    tamanhos: ["38", "40", "42", "44"],
    estoque: 18,
    destaque: false,
    ativo: true
  },
  {
    id: "void-sneaker-core",
    nome: "Tênis VOID Core White",
    preco: 499.9,
    categoria: "Tênis",
    imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000",
    descricao: "Tênis versátil para compor looks streetwear, clean e casual com acabamento premium.",
    tamanhos: ["38", "39", "40", "41", "42", "43"],
    estoque: 10,
    destaque: true,
    ativo: true
  },
  {
    id: "void-bone-black",
    nome: "Boné VOID Minimal",
    preco: 89.9,
    categoria: "Acessórios",
    imagem: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1000",
    descricao: "Boné minimalista para fechar o look com identidade VOID.",
    tamanhos: ["Único"],
    estoque: 30,
    destaque: false,
    ativo: true
  },
  {
    id: "void-jaqueta-night",
    nome: "Jaqueta VOID Night",
    preco: 349.9,
    categoria: "Jaquetas",
    imagem: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000",
    descricao: "Jaqueta statement para looks noturnos, com visual urbano e presença forte.",
    tamanhos: ["P", "M", "G", "GG"],
    estoque: 8,
    destaque: true,
    ativo: true
  }
];

let cachedProducts = [];
let currentAdminProducts = [];

function money(value) {
  return window.VOIDStore?.formatMoney(value) || Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeProduct(id, data) {
  return {
    id,
    nome: data.nome || "Produto VOID",
    preco: Number(data.preco || 0),
    categoria: data.categoria || "Streetwear",
    imagem: data.imagem || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900",
    descricao: data.descricao || "Produto premium VOID.",
    tamanhos: Array.isArray(data.tamanhos) ? data.tamanhos : String(data.tamanhos || "Único").split(",").map((item) => item.trim()).filter(Boolean),
    estoque: Number(data.estoque || 0),
    destaque: Boolean(data.destaque),
    ativo: data.ativo !== false,
    createdAt: data.createdAt || null
  };
}

async function getProducts({ admin = false, onlyFeatured = false } = {}) {
  if (!FIREBASE_CONFIG_READY) {
    cachedProducts = fallbackProducts;
    return fallbackProducts;
  }

  try {
    const productsRef = collection(db, "products");
    const q = admin
      ? query(productsRef, orderBy("createdAt", "desc"))
      : query(productsRef, where("ativo", "==", true));

    const snapshot = await getDocs(q);
    let products = snapshot.docs.map((item) => normalizeProduct(item.id, item.data()));

    if (!admin) {
      products = products.sort((a, b) => Number(b.destaque) - Number(a.destaque));
    }

    if (onlyFeatured) {
      products = products.filter((product) => product.destaque);
    }

    cachedProducts = products.length ? products : fallbackProducts;
    return cachedProducts;
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    cachedProducts = fallbackProducts;
    return fallbackProducts;
  }
}

async function getProductById(id) {
  const fallback = fallbackProducts.find((item) => item.id === id);

  if (!FIREBASE_CONFIG_READY) return fallback || fallbackProducts[0];

  try {
    const snap = await getDoc(doc(db, "products", id));
    if (snap.exists()) return normalizeProduct(snap.id, snap.data());
    return fallback || fallbackProducts[0];
  } catch (error) {
    console.error("Erro ao abrir produto:", error);
    return fallback || fallbackProducts[0];
  }
}

function productCard(product) {
  const safeProduct = JSON.stringify(product).replaceAll("'", "&apos;");

  return `
    <article class="product">
      <a class="product-image-link" href="produto.html?id=${encodeURIComponent(product.id)}">
        <img src="${product.imagem}" alt="${product.nome}">
      </a>
      <div class="product-body">
        <span class="product-category">${product.categoria}</span>
        <h3>${product.nome}</h3>
        <strong>${money(product.preco)}</strong>
        <div class="product-card-actions">
          <a class="buy-btn" href="produto.html?id=${encodeURIComponent(product.id)}">Ver Produto</a>
          <button class="icon-btn" type="button" onclick='VOIDStore.addToFavorites(${safeProduct})'>♡</button>
        </div>
      </div>
    </article>
  `;
}

async function renderHomeProducts() {
  const latestGrid = document.getElementById("homeProductsGrid");
  const featuredGrid = document.getElementById("featuredLooksGrid");
  if (!latestGrid && !featuredGrid) return;

  const products = await getProducts();

  if (latestGrid) {
    latestGrid.innerHTML = products.slice(0, 4).map(productCard).join("");
  }

  if (featuredGrid) {
    const featured = products.filter((item) => item.destaque).slice(0, 4);
    featuredGrid.innerHTML = (featured.length ? featured : products.slice(0, 4)).map((product) => `
      <article class="card">
        <a href="produto.html?id=${encodeURIComponent(product.id)}">
          <img src="${product.imagem}" alt="${product.nome}">
        </a>
        <div class="card-info">
          <h3>${product.nome}</h3>
          <p>${product.categoria} · ${money(product.preco)}</p>
        </div>
      </article>
    `).join("");
  }
}

async function renderProductsPage() {
  const grid = document.getElementById("productsGrid");
  const searchInput = document.getElementById("productSearch");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const empty = document.getElementById("productsEmpty");

  if (!grid) return;

  const products = await getProducts();
  let activeFilter = "Todos";

  function render() {
    const term = (searchInput?.value || "").toLowerCase().trim();
    const filtered = products.filter((product) => {
      const matchesSearch = [product.nome, product.categoria, product.descricao].join(" ").toLowerCase().includes(term);
      const matchesCategory = activeFilter === "Todos" || product.categoria === activeFilter;
      return matchesSearch && matchesCategory;
    });

    grid.innerHTML = filtered.map(productCard).join("");
    if (empty) empty.style.display = filtered.length ? "none" : "block";
  }

  searchInput?.addEventListener("input", render);
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "Todos";
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      render();
    });
  });

  render();
}

async function renderProductPage() {
  const page = document.getElementById("productDetail");
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || fallbackProducts[0].id;
  const product = await getProductById(id);

  document.title = `${product.nome} | VOID`;

  page.innerHTML = `
    <div class="product-gallery">
      <img class="main-image" src="${product.imagem}" alt="${product.nome}">
      <div class="thumbs">
        <img src="${product.imagem}" alt="${product.nome}">
      </div>
    </div>

    <div class="product-details">
      <span class="product-badge">${product.estoque > 0 ? "DISPONÍVEL" : "ESGOTADO"}</span>
      <h1>${product.nome}</h1>
      <p class="product-price">${money(product.preco)}</p>
      <p class="product-description">${product.descricao}</p>

      <h3>Tamanho</h3>
      <div class="sizes" id="sizesBox">
        ${product.tamanhos.map((size, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-size="${size}">${size}</button>`).join("")}
      </div>

      <label class="qty-label" for="quantity">Quantidade</label>
      <input id="quantity" class="qty-input" type="number" min="1" max="${Math.max(product.estoque, 1)}" value="1">

      <div class="product-actions">
        <button class="primary-btn" id="buyNowBtn" type="button" ${product.estoque <= 0 ? "disabled" : ""}>Comprar Agora</button>
        <button class="secondary-btn" id="addCartBtn" type="button" ${product.estoque <= 0 ? "disabled" : ""}>Adicionar ao Carrinho</button>
        <button class="secondary-btn" id="favoriteBtn" type="button">Adicionar aos Favoritos</button>
      </div>
    </div>
  `;

  let selectedSize = product.tamanhos[0] || "Único";

  document.querySelectorAll("#sizesBox button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#sizesBox button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedSize = button.dataset.size;
    });
  });

  const add = () => {
    const quantity = Number(document.getElementById("quantity")?.value || 1);
    window.VOIDStore.addToCart(product, quantity, selectedSize);
  };

  document.getElementById("addCartBtn")?.addEventListener("click", add);
  document.getElementById("favoriteBtn")?.addEventListener("click", () => window.VOIDStore.addToFavorites(product));
  document.getElementById("buyNowBtn")?.addEventListener("click", () => {
    add();
    window.location.href = "checkout.html";
  });
}

function formValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function setMessage(id, text, type = "") {
  const message = document.getElementById(id);
  if (!message) return;
  message.textContent = text;
  message.className = `form-message ${type}`.trim();
}

async function renderAdminProducts() {
  const list = document.getElementById("adminProductsList");
  if (!list) return;

  if (!FIREBASE_CONFIG_READY) {
    list.innerHTML = `<p class="empty-state">Configure o Firebase em <strong>firebase-config.js</strong> para gerenciar produtos reais.</p>`;
    return;
  }

  currentAdminProducts = await getProducts({ admin: true });

  if (!currentAdminProducts.length) {
    list.innerHTML = `<p class="empty-state">Nenhum produto cadastrado ainda. Use o formulário ao lado ou clique em “Criar produtos exemplo”.</p>`;
    return;
  }

  list.innerHTML = currentAdminProducts.map((product) => `
    <article class="admin-list-item">
      <img src="${product.imagem}" alt="${product.nome}">
      <div>
        <h3>${product.nome}</h3>
        <p>${product.categoria} · ${money(product.preco)} · Estoque: ${product.estoque}</p>
        <small>${product.ativo ? "Ativo" : "Oculto"}${product.destaque ? " · Destaque" : ""}</small>
      </div>
      <div class="admin-item-actions">
        <button class="mini-btn" type="button" data-edit-product="${product.id}">Editar</button>
        <button class="mini-btn danger" type="button" data-delete-product="${product.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

function fillProductForm(product) {
  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.nome;
  document.getElementById("productPrice").value = product.preco;
  document.getElementById("productCategory").value = product.categoria;
  document.getElementById("productImage").value = product.imagem;
  document.getElementById("productDescription").value = product.descricao;
  document.getElementById("productSizes").value = product.tamanhos.join(", ");
  document.getElementById("productStock").value = product.estoque;
  document.getElementById("productFeatured").checked = Boolean(product.destaque);
  document.getElementById("productActive").checked = product.ativo !== false;
  document.getElementById("productSubmitBtn").textContent = "Salvar alterações";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetProductForm() {
  document.getElementById("productForm")?.reset();
  const productId = document.getElementById("productId");
  if (productId) productId.value = "";
  const active = document.getElementById("productActive");
  if (active) active.checked = true;
  const submit = document.getElementById("productSubmitBtn");
  if (submit) submit.textContent = "Cadastrar produto";
}

async function initAdminProducts() {
  const form = document.getElementById("productForm");
  if (!form) return;

  await renderAdminProducts();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!FIREBASE_CONFIG_READY) {
      setMessage("productMessage", "Antes, configure o Firebase em firebase-config.js.", "error");
      return;
    }

    const productId = formValue("productId");
    const payload = {
      nome: formValue("productName"),
      preco: Number(formValue("productPrice")),
      categoria: formValue("productCategory"),
      imagem: formValue("productImage"),
      descricao: formValue("productDescription"),
      tamanhos: formValue("productSizes").split(",").map((item) => item.trim()).filter(Boolean),
      estoque: Number(formValue("productStock")),
      destaque: document.getElementById("productFeatured")?.checked || false,
      ativo: document.getElementById("productActive")?.checked || false,
      updatedAt: serverTimestamp()
    };

    if (!payload.nome || !payload.preco || !payload.imagem) {
      setMessage("productMessage", "Preencha pelo menos nome, preço e imagem.", "error");
      return;
    }

    try {
      if (productId) {
        await updateDoc(doc(db, "products", productId), payload);
        setMessage("productMessage", "Produto atualizado com sucesso.", "success");
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        setMessage("productMessage", "Produto cadastrado com sucesso.", "success");
      }

      resetProductForm();
      await renderAdminProducts();
    } catch (error) {
      console.error(error);
      setMessage("productMessage", "Erro ao salvar produto. Confira as regras do Firestore.", "error");
    }
  });

  document.getElementById("productResetBtn")?.addEventListener("click", resetProductForm);

  document.getElementById("adminProductsList")?.addEventListener("click", async (event) => {
    const editId = event.target.dataset.editProduct;
    const deleteId = event.target.dataset.deleteProduct;

    if (editId) {
      const product = currentAdminProducts.find((item) => item.id === editId);
      if (product) fillProductForm(product);
    }

    if (deleteId) {
      const confirmed = confirm("Tem certeza que deseja excluir este produto?");
      if (!confirmed) return;

      try {
        await deleteDoc(doc(db, "products", deleteId));
        setMessage("productMessage", "Produto excluído.", "success");
        await renderAdminProducts();
      } catch (error) {
        console.error(error);
        setMessage("productMessage", "Erro ao excluir produto.", "error");
      }
    }
  });

  document.getElementById("seedProductsBtn")?.addEventListener("click", async () => {
    if (!FIREBASE_CONFIG_READY) {
      setMessage("productMessage", "Configure o Firebase antes de criar exemplos.", "error");
      return;
    }

    try {
      for (const product of fallbackProducts) {
        const { id, ...payload } = product;
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setMessage("productMessage", "Produtos exemplo criados no Firestore.", "success");
      await renderAdminProducts();
    } catch (error) {
      console.error(error);
      setMessage("productMessage", "Erro ao criar produtos exemplo.", "error");
    }
  });
}

async function initCheckout() {
  const summary = document.getElementById("checkoutSummaryItems");
  const total = document.getElementById("checkoutTotal");
  const form = document.getElementById("checkoutForm");
  if (!summary || !total || !form) return;

  const render = () => {
    const cart = window.VOIDStore.getCart();

    if (!cart.length) {
      summary.innerHTML = `<p class="empty-state">Seu carrinho está vazio.</p>`;
      total.textContent = money(0);
      return;
    }

    summary.innerHTML = cart.map((item) => `
      <div class="summary-item">
        <span>${item.nome} <small>(${item.quantidade || 1}x)</small></span>
        <strong>${money(Number(item.preco) * Number(item.quantidade || 1))}</strong>
      </div>
    `).join("");

    total.textContent = money(window.VOIDStore.cartTotal());
  };

  render();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const email = document.getElementById("customerEmail");
      if (email && !email.value) email.value = user.email || "";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cart = window.VOIDStore.getCart();
    if (!cart.length) {
      setMessage("checkoutMessage", "Seu carrinho está vazio.", "error");
      return;
    }

    const order = {
      cliente: {
        nome: formValue("customerName"),
        email: formValue("customerEmail"),
        telefone: formValue("customerPhone")
      },
      endereco: {
        cep: formValue("customerCep"),
        rua: formValue("customerAddress"),
        numero: formValue("customerNumber"),
        complemento: formValue("customerComplement")
      },
      pagamento: document.querySelector("input[name='payment']:checked")?.value || "PIX",
      itens: cart,
      total: window.VOIDStore.cartTotal(),
      status: "Novo pedido",
      createdAt: serverTimestamp()
    };

    if (!order.cliente.nome || !order.cliente.email || !order.endereco.cep || !order.endereco.rua) {
      setMessage("checkoutMessage", "Preencha os dados principais para finalizar.", "error");
      return;
    }

    try {
      if (FIREBASE_CONFIG_READY) {
        const user = auth.currentUser;
        await addDoc(collection(db, "orders"), {
          ...order,
          userId: user?.uid || null,
          userEmail: user?.email || order.cliente.email
        });
      }

      window.VOIDStore.clearCart();
      render();
      form.reset();
      setMessage("checkoutMessage", "Pedido criado! Você receberá as instruções de pagamento por email/WhatsApp.", "success");
    } catch (error) {
      console.error(error);
      setMessage("checkoutMessage", "Não foi possível criar o pedido. Confira o Firestore.", "error");
    }
  });
}

async function renderAdminOrders() {
  const list = document.getElementById("adminOrdersList");
  if (!list) return;

  if (!FIREBASE_CONFIG_READY) {
    list.innerHTML = `<p class="empty-state">Configure o Firebase para visualizar pedidos reais.</p>`;
    return;
  }

  try {
    const snapshot = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(30)));
    const orders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    if (!orders.length) {
      list.innerHTML = `<p class="empty-state">Nenhum pedido recebido ainda.</p>`;
      return;
    }

    list.innerHTML = orders.map((order) => `
      <article class="order-card">
        <div>
          <h3>${order.cliente?.nome || "Cliente"}</h3>
          <p>${order.cliente?.email || "Sem email"} · ${order.cliente?.telefone || "Sem telefone"}</p>
          <small>${order.status || "Novo pedido"} · ${order.pagamento || "PIX"}</small>
        </div>
        <strong>${money(order.total || 0)}</strong>
        <details>
          <summary>Ver itens</summary>
          <ul>
            ${(order.itens || []).map((item) => `<li>${item.quantidade || 1}x ${item.nome} - ${money(Number(item.preco) * Number(item.quantidade || 1))}</li>`).join("")}
          </ul>
        </details>
      </article>
    `).join("");
  } catch (error) {
    console.error(error);
    list.innerHTML = `<p class="empty-state">Erro ao carregar pedidos. Confira as regras do Firestore.</p>`;
  }
}

async function renderProfileOrders(user) {
  const list = document.getElementById("profileOrdersList");
  if (!list) return;

  if (!FIREBASE_CONFIG_READY || !user) {
    list.innerHTML = `<p>Nenhum pedido encontrado.</p>`;
    return;
  }

  try {
    const snapshot = await getDocs(query(collection(db, "orders"), where("userId", "==", user.uid)));
    const orders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    orders.sort((a, b) => Number(b.createdAt?.seconds || 0) - Number(a.createdAt?.seconds || 0));

    if (!orders.length) {
      list.innerHTML = `<p>Nenhum pedido encontrado.</p>`;
      return;
    }

    list.innerHTML = orders.map((order) => `
      <article class="profile-order">
        <div>
          <h3>Pedido ${order.id.slice(0, 6).toUpperCase()}</h3>
          <p>${order.status || "Novo pedido"}</p>
        </div>
        <strong>${money(order.total || 0)}</strong>
      </article>
    `).join("");
  } catch (error) {
    console.error(error);
    list.innerHTML = `<p>Não foi possível carregar seus pedidos.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHomeProducts();
  renderProductsPage();
  renderProductPage();
  initAdminProducts();
  initCheckout();
  renderAdminOrders();

  onAuthStateChanged(auth, (user) => {
    if (user) renderProfileOrders(user);
  });
});
