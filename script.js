const API_URL="https://rajkamal-medical-store-backend-1.onrender.com";

const PASSWORD="686807";
const CATEGORIES=["Skin Care","Tablets","Protein","General Items","Shampoo & Soap","All Items"];

let products=[];
let wishes=JSON.parse(localStorage.getItem("rajkamal_wishes")||"[]");

let selectedCategory="All Items",selectedProductId=null,editingId=null;
let token=localStorage.getItem("rajkamal_token")||"";

const $=id=>document.getElementById(id);

async function api(url,options={}){
  options.headers=options.headers||{};

  if(token){
    options.headers.Authorization="Bearer "+token;
  }

  const res=await fetch(API_URL+url,options);

  let data={};
  try{
    data=await res.json();
  }catch(e){}

  if(!res.ok){
    throw new Error(data.message||data.error||"Server error");
  }

  return data;
}

function save(){
  localStorage.setItem("rajkamal_wishes",JSON.stringify(wishes));
}

async function loadProducts(){
  try{
    const data=await api("/api/products");
    products=Array.isArray(data)?data:(data.products||[]);
    renderProducts();
  }catch(e){
    console.error(e);
    $("productGrid").innerHTML=
      `<div class="empty">Products load nahi ho rahe.</div>`;
  }
}

function renderCategories(){
  $("categories").innerHTML=CATEGORIES.map(c=>`
    <button class="category" onclick="openCategory('${c}')">${c}</button>
  `).join("");
}

function openCategory(c){
  selectedCategory=c;
  selectedProductId=null;

  $("homePage").classList.remove("active");
  $("productPage").classList.add("active");

  $("categoryTitle").textContent=c;
  $("searchInput").value="";

  renderProducts();
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

      <button class="wish ${wishes.includes(Number(p.id))?'active':''}" onclick="event.stopPropagation();toggleWish(${p.id})">
        ${wishes.includes(Number(p.id))?'♥ Wishlisted':'♡ Add to Wishlist'}
      </button>

    </div>
  </article>`;
}

function renderProducts(){

  const q=$("searchInput").value.toLowerCase().trim();

  let list=selectedCategory==="All Items"
    ?products
    :products.filter(p=>p.category===selectedCategory);

  if(q){
    list=list.filter(p=>
      (p.name+" "+p.desc).toLowerCase().includes(q)
    );
  }

  if(selectedProductId){

    const first=list.find(p=>Number(p.id)===Number(selectedProductId));

    list=first
      ?[first,...list.filter(p=>Number(p.id)!==Number(selectedProductId))]
      :list;
  }

  $("productGrid").innerHTML=list.length
    ?list.map(p=>productCard(p,Number(p.id)===Number(selectedProductId))).join("")
    :`<div class="empty">No products found.</div>`;
}

function selectProduct(id){
  selectedProductId=id;
  renderProducts();
  window.scrollTo({top:0,behavior:"smooth"});
}

function toggleWish(id){

  id=Number(id);

  wishes=wishes.includes(id)
    ?wishes.filter(x=>x!==id)
    :[...wishes,id];

  save();
  renderProducts();
}

function closeAll(){
  document.querySelectorAll(".modal").forEach(x=>x.classList.add("hidden"));
}

$("menuBtn").onclick=()=>{
  $("menuPanel").classList.toggle("show");
};

document.addEventListener("click",e=>{
  if(
    !e.target.closest(".actions") &&
    !e.target.closest(".menu-panel")
  ){
    $("menuPanel").classList.remove("show");
  }
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

  $("modal").classList.remove("hidden");
});

$("closeModal").onclick=closeAll;
$("closeOwner").onclick=closeAll;
$("closeForm").onclick=closeAll;
$("closeLocation").onclick=closeAll;
$("closeLocationForm").onclick=closeAll;

$("locationBtn").onclick=async()=>{

  try{
    const data=await api("/api/location");

    $("locationText").textContent=
      data.location||
      data.value||
      "Location not set by owner.";

  }catch(e){
    $("locationText").textContent="Location not set by owner.";
  }

  $("locationModal").classList.remove("hidden");
};

$("backBtn").onclick=()=>{
  $("productPage").classList.remove("active");
  $("homePage").classList.add("active");
  selectedProductId=null;
};

$("searchInput").addEventListener("input",()=>{
  selectedProductId=null;
  renderProducts();
});

$("ownerAccessBtn").onclick=()=>{
  $("menuPanel").classList.remove("show");
  $("ownerModal").classList.remove("hidden");
  $("loginView").classList.remove("hidden");
  $("dashboardView").classList.add("hidden");
  $("passwordInput").value="";
  $("loginMsg").textContent="";
};

$("loginBtn").onclick=async()=>{

  const password=$("passwordInput").value;

  if(!password){
    $("loginMsg").textContent="Enter password";
    return;
  }

  try{

    const data=await api("/api/login",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({password})
    });

    token=data.token;

    localStorage.setItem("rajkamal_token",token);

    $("loginView").classList.add("hidden");
    $("dashboardView").classList.remove("hidden");

    await loadProducts();
    renderOwnerProducts();

  }catch(e){

    $("loginMsg").textContent="Wrong password";
  }
};

$("setLocationBtn").onclick=async()=>{

  try{
    const data=await api("/api/location");

    $("storeLocationInput").value=
      data.location||
      data.value||
      "";
  }catch(e){
    $("storeLocationInput").value="";
  }

  $("locationFormModal").classList.remove("hidden");
};

$("saveLocationBtn").onclick=async()=>{

  const v=$("storeLocationInput").value.trim();

  if(!v)return;

  try{

    await api("/api/location",{
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        location:v,
        value:v
      })
    });

    closeAll();

  }catch(e){

    alert("Location save nahi hui.");
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
  `).join("");
}

$("addProductBtn").onclick=()=>{
  openForm();
};

function openForm(id=null){

  editingId=id;

  $("formTitle").textContent=
    id?"Edit Product":"Add Product";

  $("productForm").reset();

  $("imagePreview").classList.add("hidden");

  $("productImage").dataset.image="";

  if(id){

    const p=products.find(x=>Number(x.id)===Number(id));

    if(!p)return;

    $("productName").value=p.name;
    $("productQty").value=p.qty;
    $("productPrice").value=p.price;
    $("productCategory").value=p.category||"General Items";
    $("productDesc").value=p.desc||"";
    $("productReviews").value=p.reviews||"";

    if(p.image){

      $("imagePreview").src=p.image;
      $("imagePreview").classList.remove("hidden");

      $("productImage").dataset.image=p.image;
    }
  }

  $("productFormModal").classList.remove("hidden");
}

function editProduct(id){
  openForm(id);
}

async function deleteProduct(id){

  if(!confirm("Delete this product?"))return;

  try{

    await api("/api/products/"+id,{
      method:"DELETE"
    });

    products=products.filter(p=>Number(p.id)!==Number(id));

    renderOwnerProducts();
    renderProducts();

  }catch(e){

    alert("Product delete nahi hua.");
  }
}

async function toggleStock(id){

  try{

    const data=await api("/api/products/"+id+"/stock",{
      method:"POST"
    });

    const updated=data.product||data;

    products=products.map(p=>
      Number(p.id)===Number(id)
        ?{...p,...updated}
        :p
    );

    renderOwnerProducts();
    renderProducts();

  }catch(e){

    alert("Stock update nahi hua.");
  }
}

$("productImage").onchange=async e=>{

  const f=e.target.files[0];

  if(!f)return;

  try{

    const formData=new FormData();
    formData.append("image",f);

    const data=await api("/api/upload",{
      method:"POST",
      body:formData
    });

    const imageUrl=
      data.url||
      data.image||
      data.publicUrl||
      "";

    if(!imageUrl){
      throw new Error("Image URL missing");
    }

    $("imagePreview").src=imageUrl;
    $("imagePreview").classList.remove("hidden");

    $("productImage").dataset.image=imageUrl;

  }catch(e){

    alert("Image upload nahi hui.");
    console.error(e);
  }
};

$("productForm").onsubmit=async e=>{

  e.preventDefault();

  const old=
    editingId
      ?products.find(p=>Number(p.id)===Number(editingId))
      :null;

  const data={

    name:$("productName").value.trim(),

    qty:Number($("productQty").value),

    price:Number($("productPrice").value),

    desc:$("productDesc").value.trim(),

    reviews:$("productReviews").value.trim(),

    image:
      $("productImage").dataset.image||
      (old?.image||""),

    category:$("productCategory").value,

    out:old?.out||false
  };

  try{

    let result;

    if(editingId){

      result=await api("/api/products/"+editingId,{
        method:"PUT",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
      });

    }else{

      result=await api("/api/products",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
      });
    }

    const saved=result.product||result;

    if(editingId){

      products=products.map(p=>
        Number(p.id)===Number(editingId)
          ?saved
          :p
      );

    }else{

      products.push(saved);
    }

    closeAll();

    renderOwnerProducts();
    renderProducts();

  }catch(e){

    alert("Product save nahi hua.");
    console.error(e);
  }
};

renderCategories();
loadProducts();
