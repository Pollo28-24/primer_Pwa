const coffeeProducts = [
  {
    title: "Café Americano",
    description: "Café intenso y equilibrado.",
    details: "Preparado con espresso y agua caliente. Ideal para disfrutar un sabor fuerte y limpio en cualquier momento del día.",
    ingredients: "Espresso doble y agua caliente.",
    size: "350 ml",
    intensity: "★★★★☆",
    temperature: "Caliente",
    origin: "Granos Arábica de Chiapas.",
    calories: "10 kcal",
    recommendation: "Perfecto para acompañar pan dulce, galletas o un desayuno ligero.",
    price: 45.0,
    image: "../imagenes/cafe1.png",
    alt: "Café Americano"
  },
  {
    title: "Café Latte",
    description: "Suave, cremoso y aromático.",
    details: "Una combinación de espresso, leche vaporizada y una fina capa de espuma. Perfecto para acompañar algo dulce.",
    ingredients: "Espresso, leche vaporizada y espuma de leche.",
    size: "400 ml",
    intensity: "★★★☆☆",
    temperature: "Caliente",
    origin: "Granos Arábica de Veracruz.",
    calories: "180 kcal",
    recommendation: "Ideal para acompañar con un croissant, pastel de vainilla o galletas.",
    price: 55.0,
    image: "../imagenes/cafe2.png",
    alt: "Café Latte"
  },
  {
    title: "Cappuccino",
    description: "Espuma suave y sabor intenso.",
    details: "Equilibrio perfecto entre espresso, leche vaporizada y abundante espuma de leche.",
    ingredients: "Espresso, leche vaporizada y espuma.",
    size: "350 ml",
    intensity: "★★★★☆",
    temperature: "Caliente",
    origin: "Mezcla de granos mexicanos.",
    calories: "150 kcal",
    recommendation: "Excelente para iniciar el día acompañado de un muffin o pan artesanal.",
    price: 60.0,
    image: "../imagenes/cafe3.png",
    alt: "Cappuccino"
  },
  {
    title: "Café Mocha",
    description: "Café con un toque de chocolate.",
    details: "Espresso, leche vaporizada y chocolate se combinan para crear una bebida dulce y reconfortante.",
    ingredients: "Espresso, chocolate, leche vaporizada y crema batida.",
    size: "400 ml",
    intensity: "★★★☆☆",
    temperature: "Caliente",
    origin: "Granos seleccionados de Oaxaca.",
    calories: "290 kcal",
    recommendation: "Ideal para quienes disfrutan bebidas dulces y postres.",
    price: 65.0,
    image: "../imagenes/cafe4.png",
    alt: "Café Mocha"
  },
  {
    title: "Espresso",
    description: "Pequeño, concentrado y potente.",
    details: "Un shot de café concentrado con aroma intenso y una delicada capa de crema.",
    ingredients: "100% café espresso.",
    size: "60 ml",
    intensity: "★★★★★",
    temperature: "Caliente",
    origin: "Granos Arábica Premium.",
    calories: "5 kcal",
    recommendation: "Perfecto después de los alimentos o para un impulso de energía.",
    price: 50.0,
    image: "../imagenes/cafe5.png",
    alt: "Espresso"
  },
  {
    title: "Flat White",
    description: "Cremoso y balanceado.",
    details: "Espresso cubierto con leche texturizada y una fina capa de microespuma.",
    ingredients: "Espresso doble y leche texturizada.",
    size: "300 ml",
    intensity: "★★★★☆",
    temperature: "Caliente",
    origin: "Granos de altura de Chiapas.",
    calories: "170 kcal",
    recommendation: "Excelente con pan artesanal o tostadas.",
    price: 58.0,
    image: "../imagenes/cafe6.png",
    alt: "Flat White"
  },
  {
    title: "Macchiato",
    description: "Espresso con un toque de leche.",
    details: "Conserva toda la intensidad del espresso con una ligera espuma de leche.",
    ingredients: "Espresso y espuma de leche.",
    size: "90 ml",
    intensity: "★★★★★",
    temperature: "Caliente",
    origin: "Café mexicano de especialidad.",
    calories: "20 kcal",
    recommendation: "Ideal para amantes del café fuerte y aromático.",
    price: 52.0,
    image: "../imagenes/cafe7.png",
    alt: "Macchiato"
  },
  {
    title: "Cold Brew",
    description: "Frío, suave y refrescante.",
    details: "Extraído lentamente en frío durante varias horas para lograr un sabor menos ácido.",
    ingredients: "Café de extracción en frío, agua y hielo.",
    size: "450 ml",
    intensity: "★★★☆☆",
    temperature: "Frío",
    origin: "Granos Arábica seleccionados.",
    calories: "15 kcal",
    recommendation: "Perfecto para tardes calurosas y días de verano.",
    price: 62.0,
    image: "../imagenes/cafe8.png",
    alt: "Cold Brew"
  }
];

const coffeeList = document.getElementById("coffee-list");
const detailPage = document.getElementById("product-detail-page");
let deferredInstallPrompt;

function renderProducts() {
  if (!coffeeList) return;

  coffeeList.innerHTML = coffeeProducts.map((product, index) => `
    <article class="card">
      <img src="${product.image}" alt="${product.alt}" loading="lazy">

      <div class="card-info">
        <h2>${product.title}</h2>

        <p>${product.description}</p>

        <span>$${product.price.toFixed(2)}</span>

        <a class="view-more" href="./detalle.html?product=${index}">
          Ver más
        </a>
      </div>
    </article>
  `).join("");
}

function renderProductDetailPage() {

  if (!detailPage) return;

  const productIndex = Number(
    new URLSearchParams(window.location.search).get("product")
  );

  const product = coffeeProducts[productIndex];

  if (!product) {
    window.location.href = "./index.html";
    return;
  }

  detailPage.innerHTML = `
    <article class="detail-content">

      <a class="back-button" href="./index.html">
        ← Volver al menú
      </a>

      <img src="${product.image}" alt="${product.alt}">

      <div class="detail-info">

        <h2>${product.title}</h2>

        <span>$${product.price.toFixed(2)}</span>

        <p>${product.description}</p>

        <p>${product.details}</p>

        <div class="product-extra">

          <h3>Información del producto</h3>

          <p><strong>🥛 Ingredientes:</strong> ${product.ingredients}</p>

          <p><strong>📏 Tamaño:</strong> ${product.size}</p>

          <p><strong>☕ Intensidad:</strong> ${product.intensity}</p>

          <p><strong>🌡 Temperatura:</strong> ${product.temperature}</p>

          <p><strong>🌎 Origen:</strong> ${product.origin}</p>

          <p><strong>🔥 Calorías:</strong> ${product.calories}</p>

          <p><strong>🍰 Recomendación:</strong> ${product.recommendation}</p>

        </div>

      </div>

    </article>
  `;
}

renderProducts();
renderProductDetailPage();




if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./serviceworker.js")
      .then((registration) => {
        console.log("Service Worker registrado con éxito:", registration.scope);
      })
      .catch((error) => {
        console.error("Error al registrar el Service Worker:", error);
      });
  });
} else {
  console.log("Este navegador no soporta Service Workers.");
}