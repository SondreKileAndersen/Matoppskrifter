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
  if (!saveRecipe) return;
  saveRecipe.setAttribute("aria-pressed", String(isSaved));
  document.getElementById("saveLabel").textContent = isSaved ? "Oppskrift lagret" : "Lagre oppskrift";
}

function toggleFavorite() {
  isSaved = !isSaved;
  storeFavorite(isSaved);
  renderFavorite();
  showToast(isSaved ? "Oppskriften er lagret i denne nettleseren." : "Oppskriften er fjernet fra lagrede.");
}

async function shareRecipe() {
  const shareData = {
    title: "Krydret søtpotetgryte | Matoppskrifter",
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
  setupHeroImage();
  document.getElementById("minusServing").addEventListener("click", () => changeServings(-1));
  document.getElementById("plusServing").addEventListener("click", () => changeServings(1));
  document.getElementById("saveRecipe").addEventListener("click", toggleFavorite);
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
