const PASSWORD="123456";
const CATEGORIES=["Skin Care","Tablets","Protein","General Items","Shampoo & Soap","All Items"];

const defaultProducts=[
{id:1,name:"Paracetamol",qty:20,price:30,desc:"Common tablet",reviews:"",image:"",category:"Tablets",out:false},
{id:2,name:"Vitamin Protein",qty:10,price:499,desc:"Protein product",reviews:"",image:"",category:"Protein",out:false},
{id:3,name:"Face Cream",qty:8,price:199,desc:"Skin care product",reviews:"",image:"",category:"Skin Care",out:false},
{id:4,name:"Bath Soap",qty:15,price:55,desc:"General bathing soap",reviews:"",image:"",category:"Shampoo & Soap",out:false}
];

let products=JSON.parse(localStorage.getItem("rajkamal_products")||"null")||defaultProducts;
let wishes=JSON.parse(localStorage.getItem("rajkamal_wishes")||"[]");

let selectedCategory="All Items",selectedProductId=null,editingId=null;

const $=id=>document.getElementById(id);

function save(){
  localStorage.setItem("rajkamal_products",JSON.stringify(products));
  localStorage.setItem("rajkamal_wishes",JSON.stringify(wishes))
}

function renderCategories(){
  $("categories").innerHTML=CATEGORIES.map(c=>`
    <button class="category" onclick="openCategory('${c}')">${c}</button>
  `).join("")
}

function openCategory(c){
  selectedCategory=c;
  selectedProductId=null;
  $("homePage").classList.remove("active");
  $("productPage").classList.add("active");
  $("categoryTitle").textContent=c;
  $("searchInput").value="";
  renderProducts()
}

function productCard(p,selected=false){
  const unavailable=p.out||Number(p.qty)<=0;

  return `
  <article class="product-card ${selected?'selected-product':''} ${selected?'selected':''}" onclick="selectProduct(${p.id})">

    <img src="${p.image||'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#dff4ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#0754b5" font-size="28">Product Image</text></svg>')}" alt="${p.name}">

    <div class="product-info">

      <h3>${p.name}</h3>

      <div class="price">₹${p.price}</div>

      <div class="stock ${unavailable?'out':''}">
        ${unavailable?'OUT OF STOCK':'Available: '+p.qty}
      </div>

      <p>${p.desc||""}</p>

      <button class="wish ${wishes.includes(p.id)?'active':''}" onclick="event.stopPropagation();toggleWish(${p.id})">
        ${wishes.includes(p.id)?'♥ Wishlisted':'♡ Add to Wishlist'}
      </button>

    </div>
  </article>`
}

function renderProducts(){

  const q=$("searchInput").value.toLowerCase().trim();

  let list=selectedCategory==="All Items"
    ?products
    :products.filter(p=>p.category===selectedCategory);

  if(q)
    list=list.filter(p=>
      (p.name+" "+p.desc).toLowerCase().includes(q)
    );

  if(selectedProductId){
    const first=list.find(p=>p.id===selectedProductId);
    list=first
      ?[first,...list.filter(p=>p.id!==selectedProductId)]
      :list
  }

  $("productGrid").innerHTML=list.length
    ?list.map(p=>productCard(p,p.id===selectedProductId)).join("")
    :`<div class="empty">No products found.</div>`;
}

function selectProduct(id){
  selectedProductId=id;
  renderProducts();
  window.scrollTo({top:0,behavior:"smooth"})
}

function toggleWish(id){
  wishes=wishes.includes(id)
    ?wishes.filter(x=>x!==id)
    :[...wishes,id];

  save();
  renderProducts()
}

function closeAll(){
  document.querySelectorAll(".modal").forEach(x=>x.classList.add("hidden"))
}

$("menuBtn").onclick=()=>{
  $("menuPanel").classList.toggle("show")
};

document.addEventListener("click",e=>{
  if(
    !e.target.closest(".actions") &&
    !e.target.closest(".menu-panel")
  )
    $("menuPanel").classList.remove("show")
});

document.querySelectorAll("[data-info]").forEach(b=>b.onclick=()=>{
  $("modalTitle").textContent=
    b.dataset.info==="aboutShop"
      ?"About Shop"
      :"About Owner";

  $("modalText").textContent=
    b.dataset.info==="aboutShop"
      ?"Rajkamal Medical Store — quality products and helpful service."
      :"Vimal Singh Deora";

  $("modal").classList.remove("hidden")
});

$("closeModal").onclick=closeAll;
$("closeOwner").onclick=closeAll;
$("closeForm").onclick=closeAll;
$("closeLocation").onclick=closeAll;
$("closeLocationForm").onclick=closeAll;

$("locationBtn").onclick=()=>{
  $("locationText").textContent=
    localStorage.getItem("rajkamal_location")||
    "Location not set by owner.";

  $("locationModal").classList.remove("hidden")
};

$("backBtn").onclick=()=>{
  $("productPage").classList.remove("active");
  $("homePage").classList.add("active");
  selectedProductId=null
};

$("searchInput").addEventListener("input",()=>{
  selectedProductId=null;
  renderProducts()
});

$("ownerAccessBtn").onclick=()=>{
  $("menuPanel").classList.remove("show");
  $("ownerModal").classList.remove("hidden");
  $("loginView").classList.remove("hidden");
  $("dashboardView").classList.add("hidden");
  $("passwordInput").value=""
};

$("loginBtn").onclick=()=>{
  if($("passwordInput").value===PASSWORD){
    $("loginView").classList.add("hidden");
    $("dashboardView").classList.remove("hidden");
    renderOwnerProducts()
  }else{
    $("loginMsg").textContent="Wrong password"
  }
};

$("setLocationBtn").onclick=()=>{
  $("storeLocationInput").value=
    localStorage.getItem("rajkamal_location")||"";

  $("locationFormModal").classList.remove("hidden")
};

$("saveLocationBtn").onclick=()=>{
  const v=$("storeLocationInput").value.trim();

  if(v){
    localStorage.setItem("rajkamal_location",v);
    closeAll()
  }
};

function renderOwnerProducts(){

  $("ownerProducts").innerHTML=products.map(p=>`
    <div class="owner-row">

      <div>
        <b>${p.name}</b><br>
        ₹${p.price} • Qty ${p.qty} •
        ${p.out?"OUT OF STOCK":"In Stock"}
      </div>

      <button class="edit" onclick="editProduct(${p.id})">
        Edit
      </button>

      <button class="stock-btn" onclick="toggleStock(${p.id})">
        ${p.out?"In Stock":"Out of Stock"}
      </button>

      <button class="delete" onclick="deleteProduct(${p.id})">
        Delete
      </button>

    </div>
  `).join("")
}

$("addProductBtn").onclick=()=>{
  openForm()
};

function openForm(id=null){

  editingId=id;

  $("formTitle").textContent=
    id?"Edit Product":"Add Product";

  $("productForm").reset();

  $("imagePreview").classList.add("hidden");

  $("productImage").dataset.image="";

  if(id){

    let p=products.find(x=>x.id===id);

    $("productName").value=p.name;
    $("productQty").value=p.qty;
    $("productPrice").value=p.price;

    // CATEGORY
    $("productCategory").value=p.category||"General Items";

    $("productDesc").value=p.desc;
    $("productReviews").value=p.reviews||"";

    if(p.image){
      $("imagePreview").src=p.image;
      $("imagePreview").classList.remove("hidden")
    }
  }

  $("productFormModal").classList.remove("hidden")
}

function editProduct(id){
  openForm(id)
}

function deleteProduct(id){

  if(confirm("Delete this product?")){

    products=products.filter(p=>p.id!==id);

    save();

    renderOwnerProducts();
    renderProducts()
  }
}

function toggleStock(id){

  let p=products.find(x=>x.id===id);

  p.out=!p.out;

  save();

  renderOwnerProducts();
  renderProducts()
}

$("productImage").onchange=e=>{

  const f=e.target.files[0];

  if(!f)return;

  const r=new FileReader();

  r.onload=()=>{
    $("imagePreview").src=r.result;
    $("imagePreview").classList.remove("hidden");
    $("productImage").dataset.image=r.result
  };

  r.readAsDataURL(f)
};

$("productForm").onsubmit=e=>{

  e.preventDefault();

  const old=
    editingId
      ?products.find(p=>p.id===editingId)
      :null;

  const data={

    id:editingId||Date.now(),

    name:$("productName").value.trim(),

    qty:Number($("productQty").value),

    price:Number($("productPrice").value),

    desc:$("productDesc").value.trim(),

    reviews:$("productReviews").value.trim(),

    image:
      $("productImage").dataset.image||
      (old?.image||""),

    // SELECTED CATEGORY
    category:$("productCategory").value,

    out:old?.out||false
  };

  if(editingId){

    products=products.map(p=>
      p.id===editingId?data:p
    );

  }else{

    products.push(data);

  }

  save();

  closeAll();

  renderOwnerProducts();

  renderProducts()
};

renderCategories();
renderProducts();
