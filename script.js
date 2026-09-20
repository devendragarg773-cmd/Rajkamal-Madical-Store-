const API_URL = "https://rajkamal-medical-store-backend-1.onrender.com";

const CATEGORIES = [
  "Skin Care",
  "Tablets",
  "Protein",
  "General Items",
  "Shampoo & Soap",
  "All Items"
];

let products = [];

let wishes = JSON.parse(
  localStorage.getItem("rajkamal_wishes") || "[]"
);

let selectedCategory = "All Items";
let selectedProductId = null;
let editingId = null;

let token = localStorage.getItem("rajkamal_token") || "";

const $ = id => document.getElementById(id);


// ============================================
// API FUNCTION
// ============================================

async function api(url, options = {}) {

  options.headers = options.headers || {};

  if (token) {
    options.headers.Authorization = "Bearer " + token;
  }

  let res;

  try {

    res = await fetch(API_URL + url, options);

  } catch (error) {

    throw new Error(
      "Backend se connection nahi ho raha."
    );
  }

  let data = {};

  try {

    data = await res.json();

  } catch (error) {

    data = {};
  }

  if (!res.ok) {

    // Agar login/token expire ho gaya
    if (res.status === 401) {

      localStorage.removeItem("rajkamal_token");
      token = "";

      throw new Error(
        data.error ||
        data.message ||
        "Login expire ho gaya. Dobara login karo."
      );
    }

    throw new Error(
      data.error ||
      data.message ||
      data.details ||
      `Server error (${res.status})`
    );
  }

  return data;
}


// ============================================
// WISHLIST SAVE
// ============================================

function save() {

  localStorage.setItem(
    "rajkamal_wishes",
    JSON.stringify(wishes)
  );
}


// ============================================
// LOAD PRODUCTS
// ============================================

async function loadProducts() {

  try {

    const data = await api("/api/products");

    products =
      Array.isArray(data)
        ? data
        : (data.products || []);

    renderProducts();

  } catch (e) {

    console.error("LOAD PRODUCTS ERROR:", e);

    const grid = $("productGrid");

    if (grid) {

      grid.innerHTML = `
        <div class="empty">
          Products load nahi ho rahe.<br>
          ${e.message}
        </div>
      `;
    }
  }
}


// ============================================
// CATEGORIES
// ============================================

function renderCategories() {

  $("categories").innerHTML =
    CATEGORIES.map(c => `
      <button
        class="category"
        onclick="openCategory('${c}')"
      >
        ${c}
      </button>
    `).join("");
}


// ============================================
// OPEN CATEGORY
// ============================================

function openCategory(c) {

  selectedCategory = c;
  selectedProductId = null;

  $("homePage").classList.remove("active");

  $("productPage").classList.add("active");

  $("categoryTitle").textContent = c;

  $("searchInput").value = "";

  renderProducts();
}


// ============================================
// PRODUCT CARD
// ============================================

function productCard(p, selected = false) {

  const unavailable =
    p.out || Number(p.qty) <= 0;

  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="600"
        height="400"
      >
        <rect
          width="100%"
          height="100%"
          fill="#dff4ff"
        />

        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          fill="#0754b5"
          font-size="28"
        >
          Product Image
        </text>
      </svg>
    `);

  return `
    <article
      class="product-card
      ${selected ? "selected-product selected" : ""}"
      onclick="selectProduct(${p.id})"
    >

      <img
        src="${p.image || fallbackImage}"
        alt="${p.name || "Product"}"
      >

      <div class="product-info">

        <h3>${p.name || ""}</h3>

        <div class="price">
          ₹${p.price || 0}
        </div>

        <div class="stock ${unavailable ? "out" : ""}">
          ${
            unavailable
              ? "OUT OF STOCK"
              : "Available: " + (p.qty || 0)
          }
        </div>

        <p>
          ${p.desc || ""}
        </p>

        <button
          class="wish ${wishes.includes(Number(p.id)) ? "active" : ""}"
          onclick="event.stopPropagation();toggleWish(${p.id})"
        >
          ${
            wishes.includes(Number(p.id))
              ? "♥ Wishlisted"
              : "♡ Add to Wishlist"
          }
        </button>

      </div>

    </article>
  `;
}


// ============================================
// RENDER PRODUCTS
// ============================================

function renderProducts() {

  const q =
    $("searchInput").value
      .toLowerCase()
      .trim();

  let list =
    selectedCategory === "All Items"
      ? products
      : products.filter(
          p => p.category === selectedCategory
        );

  if (q) {

    list = list.filter(p =>
      (
        (p.name || "") +
        " " +
        (p.desc || "")
      )
        .toLowerCase()
        .includes(q)
    );
  }

  if (selectedProductId) {

    const first =
      list.find(
        p =>
          Number(p.id) ===
          Number(selectedProductId)
      );

    list = first
      ? [
          first,
          ...list.filter(
            p =>
              Number(p.id) !==
              Number(selectedProductId)
          )
        ]
      : list;
  }

  $("productGrid").innerHTML =
    list.length
      ? list
          .map(p =>
            productCard(
              p,
              Number(p.id) ===
              Number(selectedProductId)
            )
          )
          .join("")
      : `
        <div class="empty">
          No products found.
        </div>
      `;
}


// ============================================
// SELECT PRODUCT
// ============================================

function selectProduct(id) {

  selectedProductId = id;

  renderProducts();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ============================================
// WISHLIST
// ============================================

function toggleWish(id) {

  id = Number(id);

  wishes =
    wishes.includes(id)
      ? wishes.filter(x => x !== id)
      : [...wishes, id];

  save();

  renderProducts();
}


// ============================================
// CLOSE MODALS
// ============================================

function closeAll() {

  document
    .querySelectorAll(".modal")
    .forEach(x =>
      x.classList.add("hidden")
    );
}


// ============================================
// MENU
// ============================================

$("menuBtn").onclick = () => {

  $("menuPanel").classList.toggle("show");
};


document.addEventListener("click", e => {

  if (
    !e.target.closest(".actions") &&
    !e.target.closest(".menu-panel")
  ) {

    $("menuPanel").classList.remove("show");
  }
});


// ============================================
// INFO MODALS
// ============================================

document
  .querySelectorAll("[data-info]")
  .forEach(b => {

    b.onclick = () => {

      $("modalTitle").textContent =
        b.dataset.info === "aboutShop"
          ? "About Shop"
          : "About Owner";

      $("modalText").textContent =
        b.dataset.info === "aboutShop"
          ? "Rajkamal Medical Store — quality products and helpful service."
          : "Vimal Singh Deora";

      $("modal").classList.remove("hidden");
    };

  });


// ============================================
// CLOSE BUTTONS
// ============================================

$("closeModal").onclick = closeAll;
$("closeOwner").onclick = closeAll;
$("closeForm").onclick = closeAll;
$("closeLocation").onclick = closeAll;
$("closeLocationForm").onclick = closeAll;


// ============================================
// VIEW LOCATION
// ============================================

$("locationBtn").onclick = async () => {

  try {

    const data =
      await api("/api/location");

    $("locationText").textContent =
      data.location ||
      data.value ||
      "Location not set by owner.";

  } catch (e) {

    console.error(
      "LOCATION LOAD ERROR:",
      e
    );

    $("locationText").textContent =
      "Location load nahi hui: " +
      e.message;
  }

  $("locationModal")
    .classList
    .remove("hidden");
};


// ============================================
// BACK BUTTON
// ============================================

$("backBtn").onclick = () => {

  $("productPage")
    .classList
    .remove("active");

  $("homePage")
    .classList
    .add("active");

  selectedProductId = null;
};


// ============================================
// SEARCH
// ============================================

$("searchInput")
  .addEventListener("input", () => {

    selectedProductId = null;

    renderProducts();
  });


// ============================================
// OWNER ACCESS
// ============================================

$("ownerAccessBtn").onclick = () => {

  $("menuPanel")
    .classList
    .remove("show");

  $("ownerModal")
    .classList
    .remove("hidden");

  $("loginView")
    .classList
    .remove("hidden");

  $("dashboardView")
    .classList
    .add("hidden");

  $("passwordInput").value = "";

  $("loginMsg").textContent = "";
};


// ============================================
// OWNER LOGIN
// ============================================

$("loginBtn").onclick = async () => {

  const password =
    $("passwordInput").value;

  if (!password) {

    $("loginMsg").textContent =
      "Enter password";

    return;
  }

  try {

    const data =
      await api("/api/login", {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          password: password
        })
      });

    if (!data.token) {

      throw new Error(
        "Login token nahi mila."
      );
    }

    token = data.token;

    localStorage.setItem(
      "rajkamal_token",
      token
    );

    $("loginView")
      .classList
      .add("hidden");

    $("dashboardView")
      .classList
      .remove("hidden");

    await loadProducts();

    renderOwnerProducts();

  } catch (e) {

    console.error(
      "LOGIN ERROR:",
      e
    );

    $("loginMsg").textContent =
      e.message;
  }
};


// ============================================
// OPEN SET LOCATION
// ============================================

$("setLocationBtn").onclick = async () => {

  try {

    const data =
      await api("/api/location");

    $("storeLocationInput").value =
      data.location ||
      data.value ||
      "";

  } catch (e) {

    console.error(
      "LOCATION GET ERROR:",
      e
    );

    $("storeLocationInput").value = "";
  }

  $("locationFormModal")
    .classList
    .remove("hidden");
};


// ============================================
// SAVE LOCATION
// ============================================

$("saveLocationBtn").onclick = async () => {

  const v =
    $("storeLocationInput")
      .value
      .trim();

  if (!v) {

    alert("Location enter karo.");

    return;
  }

  try {

    await api("/api/location", {

      method: "PUT",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        location: v,
        value: v
      })
    });

    alert("Location save ho gayi.");

    closeAll();

  } catch (e) {

    console.error(
      "LOCATION SAVE ERROR:",
      e
    );

    alert(
      "Location save nahi hui:\n\n" +
      e.message
    );
  }
};


// ============================================
// OWNER PRODUCTS
// ============================================

function renderOwnerProducts() {

  $("ownerProducts").innerHTML =
    products.map(p => `

      <div class="owner-row">

        <div>
          <b>${p.name}</b>
          <br>
          ₹${p.price}
          • Qty ${p.qty}
          •
          ${
            p.out
              ? "OUT OF STOCK"
              : "In Stock"
          }
        </div>

        <button
          class="edit"
          onclick="editProduct(${p.id})"
        >
          Edit
        </button>

        <button
          class="stock-btn"
          onclick="toggleStock(${p.id})"
        >
          ${
            p.out
              ? "In Stock"
              : "Out of Stock"
          }
        </button>

        <button
          class="delete"
          onclick="deleteProduct(${p.id})"
        >
          Delete
        </button>

      </div>

    `).join("");
}


// ============================================
// ADD PRODUCT BUTTON
// ============================================

$("addProductBtn").onclick = () => {

  openForm();
};


// ============================================
// PRODUCT FORM
// ============================================

function openForm(id = null) {

  editingId = id;

  $("formTitle").textContent =
    id
      ? "Edit Product"
      : "Add Product";

  $("productForm").reset();

  $("imagePreview")
    .classList
    .add("hidden");

  $("productImage")
    .dataset
    .image = "";

  if (id) {

    const p =
      products.find(
        x =>
          Number(x.id) ===
          Number(id)
      );

    if (!p) return;

    $("productName").value =
      p.name || "";

    $("productQty").value =
      p.qty || 0;

    $("productPrice").value =
      p.price || 0;

    $("productCategory").value =
      p.category ||
      "General Items";

    $("productDesc").value =
      p.desc || "";

    $("productReviews").value =
      p.reviews || "";

    if (p.image) {

      $("imagePreview").src =
        p.image;

      $("imagePreview")
        .classList
        .remove("hidden");

      $("productImage")
        .dataset
        .image = p.image;
    }
  }

  $("productFormModal")
    .classList
    .remove("hidden");
}


// ============================================
// EDIT PRODUCT
// ============================================

function editProduct(id) {

  openForm(id);
}


// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(id) {

  if (
    !confirm(
      "Delete this product?"
    )
  ) return;

  try {

    await api(
      "/api/products/" + id,
      {
        method: "DELETE"
      }
    );

    products =
      products.filter(
        p =>
          Number(p.id) !==
          Number(id)
      );

    renderOwnerProducts();

    renderProducts();

  } catch (e) {

    console.error(
      "DELETE ERROR:",
      e
    );

    alert(
      "Product delete nahi hua:\n\n" +
      e.message
    );
  }
}


// ============================================
// TOGGLE STOCK
// ============================================

async function toggleStock(id) {

  try {

    const data =
      await api(
        "/api/products/" +
        id +
        "/stock",
        {
          method: "POST"
        }
      );

    const updated =
      data.product || data;

    products =
      products.map(p =>
        Number(p.id) ===
        Number(id)
          ? {
              ...p,
              ...updated
            }
          : p
      );

    renderOwnerProducts();

    renderProducts();

  } catch (e) {

    console.error(
      "STOCK UPDATE ERROR:",
      e
    );

    alert(
      "Stock update nahi hua:\n\n" +
      e.message
    );
  }
}


// ============================================
// IMAGE UPLOAD
// ============================================

$("productImage").onchange =
  async e => {

    const f =
      e.target.files[0];

    if (!f) return;

    try {

      const formData =
        new FormData();

      formData.append(
        "image",
        f
      );

      const data =
        await api(
          "/api/upload",
          {
            method: "POST",
            body: formData
          }
        );

      const imageUrl =
        data.url ||
        data.image ||
        data.publicUrl ||
        "";

      if (!imageUrl) {

        throw new Error(
          "Image URL missing"
        );
      }

      $("imagePreview").src =
        imageUrl;

      $("imagePreview")
        .classList
        .remove("hidden");

      $("productImage")
        .dataset
        .image = imageUrl;

    } catch (e) {

      console.error(
        "IMAGE UPLOAD ERROR:",
        e
      );

      alert(
        "Image upload nahi hui:\n\n" +
        e.message
      );
    }
  };


// ============================================
// SAVE PRODUCT
// ============================================

$("productForm").onsubmit =
  async e => {

    e.preventDefault();

    const old =
      editingId
        ? products.find(
            p =>
              Number(p.id) ===
              Number(editingId)
          )
        : null;

    const data = {

      name:
        $("productName")
          .value
          .trim(),

      qty:
        Number(
          $("productQty").value
        ),

      price:
        Number(
          $("productPrice").value
        ),

      desc:
        $("productDesc")
          .value
          .trim(),

      reviews:
        $("productReviews")
          .value
          .trim(),

      image:
        $("productImage")
          .dataset
          .image ||
        (old?.image || ""),

      category:
        $("productCategory").value,

      out:
        old?.out || false
    };


    // Basic validation

    if (!data.name) {

      alert(
        "Product name enter karo."
      );

      return;
    }


    if (
      Number.isNaN(data.qty) ||
      data.qty < 0
    ) {

      alert(
        "Quantity sahi enter karo."
      );

      return;
    }


    if (
      Number.isNaN(data.price) ||
      data.price < 0
    ) {

      alert(
        "Price sahi enter karo."
      );

      return;
    }


    try {

      let result;


      // EDIT PRODUCT

      if (editingId) {

        result =
          await api(
            "/api/products/" +
            editingId,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(data)
            }
          );


      // ADD PRODUCT

      } else {

        result =
          await api(
            "/api/products",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(data)
            }
          );
      }


      const saved =
        result.product ||
        result;


      if (!saved || !saved.id) {

        throw new Error(
          "Server ne product return nahi kiya."
        );
      }


      // UPDATE LOCAL PRODUCT

      if (editingId) {

        products =
          products.map(p =>
            Number(p.id) ===
            Number(editingId)
              ? saved
              : p
          );

      } else {

        products.push(saved);
      }


      alert(
        editingId
          ? "Product update ho gaya."
          : "Product save ho gaya."
      );


      closeAll();

      renderOwnerProducts();

      renderProducts();


      // Form reset

      editingId = null;

    } catch (e) {

      console.error(
        "PRODUCT SAVE ERROR:",
        e
      );

      // IMPORTANT:
      // Ab exact backend error dikhega

      alert(
        "Product save nahi hua:\n\n" +
        e.message
      );
    }
  };


// ============================================
// START
// ============================================

renderCategories();

loadProducts();
