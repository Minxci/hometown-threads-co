// Hometown Threads Co. - Week 2 build
// Features: Story 1 (Browse Products + Product Detail) and Story 2 (Search)
// Data source: products.csv

var products = [];
var lastView = "homeView";

// ---------- Data layer: load and parse the CSV ----------

// Splits one CSV line into fields, respecting quoted text that contains commas
function parseCsvLine(line) {
    var fields = [];
    var current = "";
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            fields.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
}

// Turns the whole CSV text into an array of product objects
function parseProducts(csvText) {
    var lines = csvText.trim().split(/\r?\n/);
    var headers = parseCsvLine(lines[0]);
    var list = [];

    for (var i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue;
        var values = parseCsvLine(lines[i]);
        var row = {};
        for (var j = 0; j < headers.length; j++) {
            row[headers[j].trim()] = (values[j] || "").trim();
        }
        list.push({
            id: row.id,
            name: row.name,
            category: row.category,
            price: parseFloat(row.price),
            sizes: row.sizes.split("|"),
            colors: row.colors.split("|"),
            stock: parseInt(row.stock, 10),
            featured: row.featured.toLowerCase() === "yes",
            description: row.description
        });
    }
    return list;
}

function loadProducts() {
    fetch("products.csv")
        .then(function (response) {
            if (!response.ok) throw new Error("Could not load products.csv");
            return response.text();
        })
        .then(function (text) {
            products = parseProducts(text);
            showHome();
        })
        .catch(function () {
            var err = document.getElementById("loadError");
            err.innerHTML = "Products could not be loaded. Open this page with Live Server in VS Code so the CSV file can be read.";
            err.classList.remove("hidden");
        });
}

// ---------- Helpers ----------

function formatPrice(amount) {
    return "$" + amount.toFixed(2);
}

function getCategories() {
    var categories = [];
    products.forEach(function (p) {
        if (categories.indexOf(p.category) === -1) categories.push(p.category);
    });
    return categories;
}

function showView(viewId) {
    ["homeView", "searchView", "detailView"].forEach(function (id) {
        document.getElementById(id).classList.add("hidden");
    });
    document.getElementById(viewId).classList.remove("hidden");
    window.scrollTo(0, 0);
}

// Builds one product card (used on the home page and search results)
function createCard(product) {
    var card = document.createElement("div");
    card.className = "card";

    var stockLabel = product.stock === 0 ? '<span class="out-of-stock">Out of Stock</span>' : "";

    card.innerHTML =
        '<div class="card-image">' + product.name + '</div>' +
        '<h3>' + product.name + '</h3>' +
        '<span class="price">' + formatPrice(product.price) + '</span>' + stockLabel;

    card.onclick = function () {
        showDetail(product.id);
    };
    return card;
}

function renderGrid(gridId, list) {
    var grid = document.getElementById(gridId);
    grid.innerHTML = "";
    list.forEach(function (p) {
        grid.appendChild(createCard(p));
    });
}

function renderCategoryButtons(containerId, activeCategory) {
    var container = document.getElementById(containerId);
    container.innerHTML = "";

    var all = ["All"].concat(getCategories());
    all.forEach(function (cat) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML = cat;
        if (cat === activeCategory) btn.className = "active";
        btn.onclick = function () {
            showCategory(cat);
        };
        container.appendChild(btn);
    });
}

// ---------- Story 1: Browse Products ----------

function showHome() {
    var featured = products.filter(function (p) {
        return p.featured;
    });
    document.getElementById("gridTitle").innerHTML = "Featured Products";
    renderCategoryButtons("categoryButtons", "");
    renderGrid("productGrid", featured);
    lastView = "homeView";
    showView("homeView");
}

function showCategory(category) {
    var list = category === "All" ? products : products.filter(function (p) {
        return p.category === category;
    });
    document.getElementById("gridTitle").innerHTML = category === "All" ? "All Products" : category;
    renderCategoryButtons("categoryButtons", category);
    renderGrid("productGrid", list);
    lastView = "homeView";
    showView("homeView");
}

function showDetail(id) {
    var product = products.find(function (p) {
        return p.id === id;
    });
    if (!product) return;

    var stockText = product.stock === 0
        ? '<span class="out-of-stock">Out of Stock</span>'
        : "In stock: " + product.stock;

    var sizeChips = product.sizes.map(function (s) {
        return '<span class="chip">' + s + '</span>';
    }).join("");

    var colorChips = product.colors.map(function (c) {
        return '<span class="chip">' + c + '</span>';
    }).join("");

    document.getElementById("productDetail").innerHTML =
        '<div class="detail-image">' + product.name + '</div>' +
        '<div>' +
            '<h1>' + product.name + '</h1>' +
            '<p class="price">' + formatPrice(product.price) + '</p>' +
            '<p>' + stockText + '</p>' +
            '<p>' + product.description + '</p>' +
            '<h3>Available Sizes</h3><div class="chips">' + sizeChips + '</div>' +
            '<h3>Available Colors</h3><div class="chips">' + colorChips + '</div>' +
            '<button type="button" disabled>Add to Cart</button>' +
            '<p class="note">Size selection and the shopping cart are coming in the next build.</p>' +
        '</div>';

    showView("detailView");
}

// ---------- Story 2: Search ----------

var currentResults = [];
var currentTerm = "";

function searchProducts(term) {
    var t = term.toLowerCase();
    return products.filter(function (p) {
        return p.name.toLowerCase().indexOf(t) !== -1 ||
               p.category.toLowerCase().indexOf(t) !== -1 ||
               p.description.toLowerCase().indexOf(t) !== -1;
    });
}

function runSearch() {
    var term = document.getElementById("searchInput").value.trim();
    if (term === "") return;

    currentTerm = term;
    currentResults = searchProducts(term);

    // Fill the category filter with categories found in the results
    var filter = document.getElementById("filterCategory");
    filter.innerHTML = '<option value="All">All</option>';
    currentResults.forEach(function (p) {
        if (filter.innerHTML.indexOf('value="' + p.category + '"') === -1) {
            filter.innerHTML += '<option value="' + p.category + '">' + p.category + '</option>';
        }
    });
    document.getElementById("sortPrice").value = "none";

    updateSearchResults();
    lastView = "searchView";
    showView("searchView");
}

// Applies the category filter and price sort to the current results
function updateSearchResults() {
    var category = document.getElementById("filterCategory").value;
    var sort = document.getElementById("sortPrice").value;

    var list = currentResults.filter(function (p) {
        return category === "All" || p.category === category;
    });

    if (sort === "low") {
        list.sort(function (a, b) { return a.price - b.price; });
    } else if (sort === "high") {
        list.sort(function (a, b) { return b.price - a.price; });
    }

    var count = list.length;
    document.getElementById("resultCount").innerHTML =
        count + (count === 1 ? " result" : " results") + ' for "' + currentTerm + '"';

    var noResults = document.getElementById("noResults");
    if (count === 0) {
        noResults.classList.remove("hidden");
        renderCategoryButtons("noResultsCategories", "");
    } else {
        noResults.classList.add("hidden");
    }

    renderGrid("searchGrid", list);
}

// ---------- Event wiring ----------

document.getElementById("searchForm").onsubmit = function (event) {
    event.preventDefault();
    runSearch();
};

document.getElementById("filterCategory").onchange = updateSearchResults;
document.getElementById("sortPrice").onchange = updateSearchResults;

document.getElementById("backButton").onclick = function () {
    showView(lastView);
};

document.getElementById("logo").onclick = function (event) {
    event.preventDefault();
    showHome();
};

loadProducts();

var cart = [];
var TAX_RATE = 0.07;

var cartButton = document.createElement("button");
cartButton.type = "button";
cartButton.id = "cartButton";
cartButton.onclick = showCart;
document.querySelector(".site-header").appendChild(cartButton);

var cartView = document.createElement("section");
cartView.id = "cartView";
cartView.className = "hidden";
document.querySelector("main").appendChild(cartView);

var oldShowView = showView;
showView = function (id) {
    cartView.classList.add("hidden");
    oldShowView(id);
};

function makeSelect(id, label, options) {
    var html = '<label>' + label + ' <select id="' + id + '"><option value="">Choose</option>';
    options.forEach(function (o) { html += '<option>' + o + '</option>'; });
    return html + '</select></label>';
}

var oldShowDetail = showDetail;
showDetail = function (id) {
    oldShowDetail(id);
    var product = products.find(function (p) { return p.id === id; });
    var box = document.getElementById("productDetail");
    var info = box.lastElementChild || box;
    var oldButton = box.querySelector("button");
    if (oldButton) oldButton.remove();
    var oldNote = box.querySelector(".note");
    if (oldNote) oldNote.remove();
    if (product.stock === 0) return;

    var form = document.createElement("div");
    form.className = "add-form";
    form.innerHTML = makeSelect("sizePick", "Size", product.sizes) +
        makeSelect("colorPick", "Color", product.colors) +
        '<label>Qty <input type="number" id="qtyPick" value="1" min="1" max="' + product.stock + '"></label>' +
        '<button type="button" id="addButton" disabled>Add to Cart</button>' +
        '<p id="addMessage"></p>';
    info.appendChild(form);

    var size = document.getElementById("sizePick");
    var color = document.getElementById("colorPick");
    size.onchange = color.onchange = function () {
        document.getElementById("addButton").disabled = size.value === "" || color.value === "";
    };
    document.getElementById("addButton").onclick = function () {
        addToCart(product, size.value, color.value, document.getElementById("qtyPick").value);
    };
};

function clampQty(value, stock) {
    var qty = parseInt(value) || 1;
    return Math.max(1, Math.min(qty, stock));
}

function addToCart(product, size, color, qty) {
    var item = cart.find(function (i) {
        return i.product.id === product.id && i.size === size && i.color === color;
    });
    if (item) {
        item.qty = clampQty(item.qty + clampQty(qty, product.stock), product.stock);
    } else {
        cart.push({ product: product, size: size, color: color, qty: clampQty(qty, product.stock) });
    }
    updateCartCount();
    document.getElementById("addMessage").innerHTML = "Added to cart!";
}

function updateCartCount() {
    var count = 0;
    cart.forEach(function (i) { count += i.qty; });
    cartButton.innerHTML = "Cart (" + count + ")";
}

function changeQty(index, value) {
    var item = cart[index];
    item.qty = clampQty(value, item.product.stock);
    updateCartCount();
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartCount();
    renderCart();
}

function renderCart() {
    var html = '<h1>Your Cart</h1>';
    if (cart.length === 0) {
        html += '<p>Your cart is empty.</p>';
    } else {
        var subtotal = 0;
        html += '<table><tr><th>Item</th><th>Size</th><th>Color</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>';
        cart.forEach(function (i, index) {
            var lineTotal = i.product.price * i.qty;
            subtotal += lineTotal;
            html += '<tr><td>' + i.product.name + '</td><td>' + i.size + '</td><td>' + i.color + '</td>' +
                '<td>' + formatPrice(i.product.price) + '</td>' +
                '<td><input type="number" min="1" max="' + i.product.stock + '" value="' + i.qty + '" onchange="changeQty(' + index + ', this.value)"></td>' +
                '<td>' + formatPrice(lineTotal) + '</td>' +
                '<td><button type="button" onclick="removeItem(' + index + ')">Remove</button></td></tr>';
        });
        var tax = subtotal * TAX_RATE;
        html += '</table>' +
            '<p>Subtotal: ' + formatPrice(subtotal) + '</p>' +
            '<p>Tax (7%): ' + formatPrice(tax) + '</p>' +
            '<p><strong>Total: ' + formatPrice(subtotal + tax) + '</strong></p>';
    }
    html += '<button type="button" onclick="showView(lastView)">Continue Shopping</button>';
    cartView.innerHTML = html;
}

function showCart() {
    showView(lastView);
    document.getElementById(lastView).classList.add("hidden");
    renderCart();
    cartView.classList.remove("hidden");
}

updateCartCount();