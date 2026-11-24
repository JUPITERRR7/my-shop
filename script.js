// ===== لیست محصولات =====
const clothSizes = ["S", "M", "L", "XL"];
const basicColors = [
  { name: "سفید", hex: "#ffffff" },
  { name: "مشکی", hex: "#222222" },
  { name: "آبی", hex: "#3b82f6" }
];

const products = [
  { id: 1, name: "تی‌شرت مردانه", price: 350000, emoji: "👕", cat: "men",
    desc: "تی‌شرت نخی با برش راحت، مناسب استفاده‌ی روزانه.",
    sizes: clothSizes, colors: basicColors },
  { id: 2, name: "شلوار جین", price: 750000, emoji: "👖", cat: "men",
    desc: "جین ضخیم و مقاوم با پاچه‌ی مستقیم.",
    sizes: ["30", "32", "34", "36"],
    colors: [{ name: "آبی تیره", hex: "#1e3a5f" }, { name: "مشکی", hex: "#222222" }] },
  { id: 3, name: "کت زنانه", price: 1200000, emoji: "🧥", cat: "women",
    desc: "کت فیت با آستر نرم، مناسب بهار و پاییز.",
    sizes: clothSizes,
    colors: [{ name: "کرم", hex: "#e8d8c3" }, { name: "مشکی", hex: "#222222" }, { name: "قرمز", hex: "#e63946" }] },
  { id: 4, name: "لباس مجلسی", price: 1800000, emoji: "👗", cat: "women",
    desc: "لباس بلند با پارچه‌ی روان و دامن پرحجم.",
    sizes: ["S", "M", "L"],
    colors: [{ name: "زرشکی", hex: "#7b1e3a" }, { name: "مشکی", hex: "#222222" }, { name: "سبز", hex: "#10b981" }] },
  { id: 5, name: "هودی زنانه", price: 680000, emoji: "🧶", cat: "women",
    desc: "هودی گرم و سبک با کلاه دوبل.",
    sizes: clothSizes,
    colors: [{ name: "صورتی", hex: "#f9a8d4" }, { name: "طوسی", hex: "#9ca3af" }, { name: "مشکی", hex: "#222222" }] },
  { id: 6, name: "کفش اسپرت", price: 950000, emoji: "👟", cat: "acc",
    desc: "کفش راحت با زیره‌ی ضدلغزش برای پیاده‌روی و ورزش.",
    sizes: ["40", "41", "42", "43", "44"],
    colors: [{ name: "سفید", hex: "#ffffff" }, { name: "مشکی", hex: "#222222" }] },
  { id: 7, name: "کلاه", price: 150000, emoji: "🧢", cat: "acc",
    desc: "کلاه کتان با قفل قابل تنظیم.",
    sizes: ["آزاد"], colors: basicColors },
  { id: 8, name: "کیف دستی", price: 520000, emoji: "👜", cat: "acc",
    desc: "کیف چرم مصنوعی با دو بخش جدا.",
    sizes: ["آزاد"],
    colors: [{ name: "قهوه‌ای", hex: "#8b5a2b" }, { name: "مشکی", hex: "#222222" }] }
];

// ===== عنصرهای صفحه =====
const $ = function (id) { return document.getElementById(id); };

const productList = $("product-list");
const noResults = $("no-results");
const cartCountEl = $("cart-count");
const cartItemsEl = $("cart-items");
const cartTotalEl = $("cart-total");
const drawerFooter = $("drawer-footer");
const overlay = $("overlay");
const drawer = $("cart-drawer");
const productModal = $("product-modal");
const checkoutModal = $("checkout-modal");
const panels = [drawer, productModal, checkoutModal];

// ===== تابع‌های کمکی =====
function toFa(n) { return Number(n).toLocaleString("fa-IR"); }
function formatPrice(n) { return toFa(n) + " تومان"; }

function toEnDigits(str) {
  return str
    .replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
    .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
}

function findProduct(id) {
  return products.find(function (p) { return p.id === id; });
}

// ===== پیام کوچک (Toast) =====
function showToast(text) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  $("toast-wrap").appendChild(el);

  setTimeout(function () {
    el.classList.add("out");
    setTimeout(function () { el.remove(); }, 300);
  }, 2400);
}

// ===== باز و بسته کردن پنل‌ها =====
function openPanel(panel) {
  panels.forEach(function (p) { p.classList.remove("open"); });
  panel.classList.add("open");
  overlay.classList.add("show");
}

function closeAll() {
  panels.forEach(function (p) { p.classList.remove("open"); });
  overlay.classList.remove("show");
}

overlay.addEventListener("click", closeAll);
document.querySelectorAll("[data-close]").forEach(function (btn) {
  btn.addEventListener("click", closeAll);
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeAll();
});

// ===== ذخیره و بازیابی سبد (localStorage) =====
const STORAGE_KEY = "styleshop-cart";

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) { /* اگر مرورگر اجازه نداد، فقط ذخیره نمی‌شود */ }
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    // فقط آیتم‌های معتبر نگه داشته می‌شن
    return saved.filter(function (i) {
      const p = findProduct(i.id);
      return p &&
        p.sizes.includes(i.size) &&
        p.colors.some(function (c) { return c.name === i.color; }) &&
        Number.isInteger(i.qty) && i.qty > 0;
    });
  } catch (e) {
    return [];
  }
}

// سبد: آرایه‌ای از { id, size, color, qty }
let cart = loadCart();
let newItemKey = null;

function itemKey(i) { return i.id + "|" + i.size + "|" + i.color; }

// ===== عملیات سبد خرید =====
function addToCart(id, size, color) {
  const key = id + "|" + size + "|" + color;
  const item = cart.find(function (i) { return itemKey(i) === key; });

  if (item) {
    item.qty++;
  } else {
    cart.push({ id: id, size: size, color: color, qty: 1 });
    newItemKey = key;
  }

  renderCart();
  bumpBadge();
  showToast(findProduct(id).name + " به سبد اضافه شد ✓");
}

function changeQty(key, amount) {
  const item = cart.find(function (i) { return itemKey(i) === key; });
  if (!item) return;

  item.qty += amount;
  if (item.qty <= 0) {
    removeFromCart(key);
    return;
  }
  renderCart();
}

function removeFromCart(key) {
  cart = cart.filter(function (i) { return itemKey(i) !== key; });
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function bumpBadge() {
  cartCountEl.classList.remove("bump");
  void cartCountEl.offsetWidth;
  cartCountEl.classList.add("bump");
}

function cartTotals() {
  let qty = 0;
  let price = 0;
  cart.forEach(function (i) {
    qty += i.qty;
    price += findProduct(i.id).price * i.qty;
  });
  return { qty: qty, price: price };
}

// ===== نمایش سبد خرید =====
function renderCart() {
  saveCart();
  cartItemsEl.innerHTML = "";

  const totals = cartTotals();
  cartCountEl.textContent = toFa(totals.qty);
  cartTotalEl.textContent = formatPrice(totals.price);

  if (cart.length === 0) {
    cartItemsEl.innerHTML =
      '<div class="empty-cart">' +
        '<span class="big">🛍️</span>' +
        "<p>سبد خریدت هنوز خالیه</p>" +
        "<p>یه چیز قشنگ انتخاب کن! ✨</p>" +
      "</div>";
    drawerFooter.classList.add("hidden");
    return;
  }

  drawerFooter.classList.remove("hidden");

  cart.forEach(function (item) {
    const product = findProduct(item.id);
    const key = itemKey(item);
    const colorHex = product.colors.find(function (c) { return c.name === item.color; }).hex;

    const el = document.createElement("div");
    el.className = "cart-item";
    if (key === newItemKey) el.classList.add("new");

    el.innerHTML =
      '<div class="item-emoji">' + product.emoji + "</div>" +
      '<div class="item-info">' +
        '<div class="item-name">' + product.name + "</div>" +
        '<div class="item-meta">سایز ' + item.size + ' · <span class="dot" style="background:' + colorHex + '"></span> ' + item.color + "</div>" +
        '<div class="item-price">' + formatPrice(product.price * item.qty) + "</div>" +
        '<div class="qty">' +
          '<button class="plus" aria-label="افزایش">+</button>' +
          "<span>" + toFa(item.qty) + "</span>" +
          '<button class="minus" aria-label="کاهش">−</button>' +
        "</div>" +
      "</div>" +
      '<button class="remove-btn" aria-label="حذف">🗑️</button>';

    el.querySelector(".plus").addEventListener("click", function () { changeQty(key, 1); });
    el.querySelector(".minus").addEventListener("click", function () { changeQty(key, -1); });
    el.querySelector(".remove-btn").addEventListener("click", function () { removeFromCart(key); });

    cartItemsEl.appendChild(el);
  });

  newItemKey = null;
}

$("cart-btn").addEventListener("click", function () { openPanel(drawer); });
$("cart-btn").addEventListener("keydown", function (e) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    openPanel(drawer);
  }
});
$("clear-cart").addEventListener("click", clearCart);

// ===== فیلتر و جستجو =====
let activeCat = "all";
let searchText = "";

function renderProducts() {
  productList.innerHTML = "";

  const q = searchText.trim().toLowerCase();
  const list = products.filter(function (p) {
    const catOk = activeCat === "all" || p.cat === activeCat;
    const textOk = p.name.toLowerCase().includes(q);
    return catOk && textOk;
  });

  noResults.hidden = list.length > 0;

  list.forEach(function (product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.tabIndex = 0;

    card.innerHTML =
      '<div class="emoji">' + product.emoji + "</div>" +
      "<h3>" + product.name + "</h3>" +
      '<p class="price">' + formatPrice(product.price) + "</p>" +
      "<button>انتخاب سایز و رنگ</button>";

    card.addEventListener("click", function () { openProduct(product); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter") openProduct(product);
    });

    // افکت نور دنبال‌کننده‌ی موس
    card.addEventListener("mousemove", function (e) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", e.clientX - rect.left + "px");
      card.style.setProperty("--y", e.clientY - rect.top + "px");
    });

    productList.appendChild(card);
  });
}

$("filters").addEventListener("click", function (e) {
  const btn = e.target.closest(".filter");
  if (!btn) return;

  document.querySelectorAll(".filter").forEach(function (b) { b.classList.remove("active"); });
  btn.classList.add("active");
  activeCat = btn.dataset.cat;
  renderProducts();
});

$("search").addEventListener("input", function (e) {
  searchText = e.target.value;
  renderProducts();
});

// ===== پنجره‌ی جزئیات محصول =====
let selected = { product: null, size: null, color: null };

function renderOptions() {
  const p = selected.product;
  const sizesEl = $("pm-sizes");
  const colorsEl = $("pm-colors");
  sizesEl.innerHTML = "";
  colorsEl.innerHTML = "";

  p.sizes.forEach(function (size) {
    const b = document.createElement("button");
    b.className = "chip" + (size === selected.size ? " active" : "");
    b.textContent = size;
    b.addEventListener("click", function () {
      selected.size = size;
      renderOptions();
    });
    sizesEl.appendChild(b);
  });

  p.colors.forEach(function (c) {
    const b = document.createElement("button");
    b.className = "swatch" + (c.name === selected.color ? " active" : "");
    b.style.background = c.hex;
    b.title = c.name;
    b.setAttribute("aria-label", c.name);
    b.addEventListener("click", function () {
      selected.color = c.name;
      renderOptions();
    });
    colorsEl.appendChild(b);
  });

  $("pm-color-name").textContent = selected.color;
}

function openProduct(p) {
  selected = { product: p, size: p.sizes[0], color: p.colors[0].name };

  $("pm-emoji").textContent = p.emoji;
  $("pm-name").textContent = p.name;
  $("pm-price").textContent = formatPrice(p.price);
  $("pm-desc").textContent = p.desc;

  renderOptions();
  openPanel(productModal);
}

$("pm-add").addEventListener("click", function () {
  addToCart(selected.product.id, selected.size, selected.color);
  closeAll();
});

// ===== تسویه حساب =====
const checkoutForm = $("checkout-form");

function openCheckout() {
  if (cart.length === 0) return;

  // خلاصه‌ی سفارش
  const summary = $("co-summary");
  summary.innerHTML = "";

  cart.forEach(function (i) {
    const p = findProduct(i.id);
    const row = document.createElement("div");
    row.className = "co-row";
    row.innerHTML = "<span></span><span></span>";
    row.children[0].textContent = p.name + " (" + i.size + "، " + i.color + ") × " + toFa(i.qty);
    row.children[1].textContent = formatPrice(p.price * i.qty);
    summary.appendChild(row);
  });

  const total = document.createElement("div");
  total.className = "co-row co-total";
  total.innerHTML = "<span>جمع کل</span><span></span>";
  total.children[1].textContent = formatPrice(cartTotals().price);
  summary.appendChild(total);

  // نمایش فرم، مخفی کردن پیام موفقیت
  $("co-form-wrap").hidden = false;
  $("co-success").hidden = true;

  openPanel(checkoutModal);
}

$("checkout-open").addEventListener("click", openCheckout);

function setError(field, message) {
  field.classList.toggle("invalid", message !== "");
  field.parentElement.querySelector(".err").textContent = message;
}

checkoutForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const f = checkoutForm.elements;
  let ok = true;

  if (f.name.value.trim().length < 3) {
    setError(f.name, "نام و نام خانوادگی را کامل وارد کنید."); ok = false;
  } else { setError(f.name, ""); }

  const phone = toEnDigits(f.phone.value.trim());
  if (!/^09\d{9}$/.test(phone)) {
    setError(f.phone, "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد."); ok = false;
  } else { setError(f.phone, ""); }

  if (f.city.value.trim().length < 2) {
    setError(f.city, "نام شهر را وارد کنید."); ok = false;
  } else { setError(f.city, ""); }

  if (f.address.value.trim().length < 10) {
    setError(f.address, "آدرس را کامل‌تر بنویسید (حداقل ۱۰ حرف)."); ok = false;
  } else { setError(f.address, ""); }

  if (!ok) return;

  // ثبت سفارش (نمایشی)
  const code = "SS-" + Math.floor(100000 + Math.random() * 900000);
  $("co-code").textContent = toFa(code.replace("SS-", "")) + "-SS";

  $("co-form-wrap").hidden = true;
  $("co-success").hidden = false;

  checkoutForm.reset();
  clearCart();
});

// ===== خبرنامه =====
$("newsletter-form").addEventListener("submit", function (e) {
  e.preventDefault();
  this.reset();
  showToast("عضویت شما ثبت شد ✓");
});
// ===== حالت شناور هدر هنگام اسکرول =====
const header = document.querySelector(".header");

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 20);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
// ===== حرکت کارت‌های بنر با موس =====
const heroEl = document.querySelector(".hero");
const floaters = document.querySelectorAll(".float-card, .discount-badge");

heroEl.addEventListener("mousemove", function (e) {
  const rect = heroEl.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width - 0.5;
  const py = (e.clientY - rect.top) / rect.height - 0.5;

  floaters.forEach(function (el) {
    const depth = Number(el.dataset.depth);
    el.style.transform = "translate(" + px * depth + "px, " + py * depth + "px)";
  });
});

heroEl.addEventListener("mouseleave", function () {
  floaters.forEach(function (el) {
    el.style.transform = "";
  });
});
// ===== نوار متحرک بی‌انتها =====
const marqueeTrack = document.getElementById("marquee-track");
const marqueeHTML = marqueeTrack.firstElementChild.innerHTML;

function buildMarquee() {
  marqueeTrack.innerHTML = "";

  const group = document.createElement("div");
  group.className = "marquee-group";
  group.innerHTML = marqueeHTML;
  marqueeTrack.appendChild(group);

  // آیتم‌ها رو اون‌قدر تکرار کن که عرض صفحه کامل پر بشه
  let guard = 0;
  while (group.offsetWidth < window.innerWidth + 200 && guard < 30) {
    group.insertAdjacentHTML("beforeend", marqueeHTML);
    guard++;
  }

  // یه کپی کامل کنارش، برای حلقه‌ی بدون پرش
  marqueeTrack.appendChild(group.cloneNode(true));
}

buildMarquee();

// اگه اندازه‌ی پنجره عوض شد، دوباره بساز
let marqueeTimer;
window.addEventListener("resize", function () {
  clearTimeout(marqueeTimer);
  marqueeTimer = setTimeout(buildMarquee, 200);
});

// ===== شروع =====
renderProducts();
renderCart();
