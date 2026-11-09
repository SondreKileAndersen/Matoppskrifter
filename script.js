"use strict";

const BASE_SERVINGS = 6;
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 16;
let servings = BASE_SERVINGS;
let toastTimeout;
const checkedIngredients = new Set();

const ingredientGroups = [
  {
    title: "Til gryten",
    items: [
      { id: "olje", amount: 2, unit: "ss", name: "olivenolje" },
      { id: "lok", amount: 1, unit: "stk", name: "gul løk" },
      { id: "hvitlok", amount: 3, unit: "fedd", name: "hvitløk" },
      { id: "sotpotet", amount: 900, unit: "g", name: "søtpotet" },
      { id: "spisskummen", amount: 2, unit: "ts", name: "malt spisskummen" },
      { id: "paprika", amount: 2, unit: "ts", name: "røkt paprikapulver" },
      { id: "chili", amount: 0.5, unit: "ts", name: "chiliflak (etter smak)" },
      { id: "tomatpure", amount: 2, unit: "ss", name: "tomatpuré" },
      { id: "tomater", amount: 2, unit: "bokser à 400 g", name: "hakkede tomater" },
      { id: "quinoa", amount: 150, unit: "g", name: "quinoa" },
      { id: "kraft", amount: 8, unit: "dl", name: "grønnsakskraft" },
      { id: "bonner", amount: 2, unit: "bokser à ca. 400 g", name: "kidneybønner" },
      { id: "gronnkal", amount: 100, unit: "g", name: "grønnkål" },
      { id: "salt", text: "salt og pepper, etter smak" }
    ]
  },
  {
    title: "Til servering",
    items: [
      { id: "avokado", amount: 2, unit: "stk", name: "avokado" },
      { id: "gronnchili", amount: 1, unit: "stk", name: "grønn chili" },
      { id: "rodlok", amount: 0.5, unit: "stk", name: "rødløk" },
      { id: "romme", amount: 2, unit: "dl", name: "rømme eller plantebasert alternativ" },
      { id: "chips", amount: 1, unit: "pose", name: "tortillachips" },
      { id: "koriander", text: "frisk koriander (valgfritt)" }
    ]
  }
];

const numberFormatter = new Intl.NumberFormat("nb-NO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

function scaledQuantity(item) {
  if (typeof item.amount !== "number") return item.text;
  const quantity = item.amount * servings / BASE_SERVINGS;
  return numberFormatter.format(quantity) + " " + item.unit + " " + item.name;
}

function renderIngredients() {
  const target = document.getElementById("ingredientGroups");
  if (!target) return;
  target.replaceChildren();

  for (const group of ingredientGroups) {
    const section = document.createElement("section");
    section.className = "ingredient-group";

    const heading = document.createElement("h3");
    heading.textContent = group.title;
    section.appendChild(heading);

    for (const item of group.items) {
      const label = document.createElement("label");
      label.className = "ingredient-item";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checkedIngredients.has(item.id);
      input.setAttribute("aria-label", scaledQuantity(item));
      input.addEventListener("change", () => {
        if (input.checked) checkedIngredients.add(item.id);
        else checkedIngredients.delete(item.id);
      });

      const description = document.createElement("span");
      description.textContent = scaledQuantity(item);
      label.append(input, description);
      section.appendChild(label);
    }

    target.appendChild(section);
  }

  const output = document.getElementById("servingsOutput");
  const fact = document.getElementById("factServings");
  if (output) output.textContent = String(servings);
  if (fact) fact.textContent = String(servings);
  document.getElementById("minusServing").disabled = servings <= MIN_SERVINGS;
  document.getElementById("plusServing").disabled = servings >= MAX_SERVINGS;
}

function changeServings(amount) {
  servings = Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, servings + amount));
  renderIngredients();
}

function getStoredFavorite() {
  try { return localStorage.getItem("gronn-kjokken-favorite") === "true"; }
  catch { return false; }
}

function storeFavorite(saved) {
  try { localStorage.setItem("gronn-kjokken-favorite", String(saved)); }
  catch { /* Site still works without browser storage. */ }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("toast--visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("toast--visible"), 2600);
}

let isSaved = getStoredFavorite();

function renderFavorite() {
  const saveRecipe = document.getElementById("saveRecipe");
  const headerFavorite = document.getElementById("headerFavorite");
  saveRecipe.setAttribute("aria-pressed", String(isSaved));
  headerFavorite.setAttribute("aria-pressed", String(isSaved));
  headerFavorite.setAttribute("aria-label", isSaved ? "Fjern lagret oppskrift" : "Lagre oppskrift");
  document.getElementById("saveLabel").textContent = isSaved ? "Oppskrift lagret" : "Lagre oppskrift";
}

function toggleFavorite() {
  isSaved = !isSaved;
  storeFavorite(isSaved);
  renderFavorite();
  showToast(isSaved ? "Oppskriften er lagret i denne nettleseren." : "Oppskriften er fjernet fra lagrede.");
}

function setupMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  menuToggle.addEventListener("click", () => {
    mobileNav.hidden = !mobileNav.hidden;
    menuToggle.setAttribute("aria-expanded", String(!mobileNav.hidden));
    menuToggle.setAttribute("aria-label", mobileNav.hidden ? "Åpne meny" : "Lukk meny");
  });
  for (const link of mobileNav.querySelectorAll("a")) {
    link.addEventListener("click", () => {
      mobileNav.hidden = true;
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Åpne meny");
    });
  }
}

function setupSearch() {
  const toggle = document.getElementById("searchToggle");
  const panel = document.getElementById("searchPanel");
  const input = document.getElementById("siteSearch");
  const result = document.getElementById("searchResult");
  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) input.focus();
  });

  panel.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim().toLocaleLowerCase("nb-NO");
    if (!query) {
      result.textContent = "Skriv inn et søkeord.";
      return;
    }
    const candidates = document.querySelectorAll(".ingredient-item, .step, .hero__lead");
    const first = [...candidates].find(node => node.textContent.toLocaleLowerCase("nb-NO").includes(query));
    if (!first) {
      result.textContent = "Fant ingen treff på «" + input.value.trim() + "» i oppskriften.";
      return;
    }
    result.textContent = "Fant et treff! Viser hvor i oppskriften det står.";
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    first.classList.add("search-hit");
    setTimeout(() => first.classList.remove("search-hit"), 1900);
  });
}

async function shareRecipe() {
  const shareData = {
    title: "Krydret søtpotetgryte | Grønn Kjøkken",
    text: "Prøv denne varme, grønne søtpotetgryten!",
    url: location.href.split("#")[0]
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("Lenken er kopiert!");
  } catch {
    showToast("Kopier adressen fra nettleseren for å dele.");
  }
}

function setupHeroImage() {
  const img = document.getElementById("heroImage");
  img.addEventListener("error", () => {
    if (img.dataset.fallback) return;
    img.dataset.fallback = "true";
    img.src = "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85";
    img.alt = "Grønnsaksrett med friske råvarer";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderIngredients();
  renderFavorite();
  setupMenu();
  setupSearch();
  setupHeroImage();
  document.getElementById("minusServing").addEventListener("click", () => changeServings(-1));
  document.getElementById("plusServing").addEventListener("click", () => changeServings(1));
  document.getElementById("saveRecipe").addEventListener("click", toggleFavorite);
  document.getElementById("headerFavorite").addEventListener("click", toggleFavorite);
  document.getElementById("printIngredients").addEventListener("click", () => window.print());
  document.getElementById("printRecipe").addEventListener("click", () => window.print());
  document.getElementById("shareRecipe").addEventListener("click", shareRecipe);
  document.getElementById("resetChecklist").addEventListener("click", () => {
    checkedIngredients.clear();
    renderIngredients();
    showToast("Avkrysningene er fjernet.");
  });
  document.getElementById("year").textContent = String(new Date().getFullYear());
});
