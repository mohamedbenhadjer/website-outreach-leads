let leads = [];

const tbody = document.getElementById("tbody");
const statsEl = document.getElementById("stats");
const countEl = document.getElementById("count");
const qEl = document.getElementById("q");
const countryEl = document.getElementById("country");
const priorityEl = document.getElementById("priority");
const copyBtn = document.getElementById("copyEmails");

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filtered() {
  const q = qEl.value.trim().toLowerCase();
  const country = countryEl.value;
  const priority = priorityEl.value;

  return leads.filter((row) => {
    if (country && row.country !== country) return false;
    if (priority && row.priority !== priority) return false;
    if (!q) return true;
    const hay = [
      row.name,
      row.city,
      row.niche,
      row.email,
      row.phone,
      row.gap,
      row.country,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function renderStats(rows) {
  const countries = new Set(rows.map((r) => r.country)).size;
  const high = rows.filter((r) => r.priority === "High").length;
  const emails = rows.filter((r) => String(r.email).includes("@")).length;

  statsEl.innerHTML = [
    ["Prospects", rows.length],
    ["With email", emails],
    ["High priority", high],
    ["Countries", countries],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`,
    )
    .join("");
}

function renderTable(rows) {
  countEl.textContent = `Showing ${rows.length} of ${leads.length} leads`;

  tbody.innerHTML = rows
    .map((r) => {
      const pill = `<span class="pill ${esc(r.priority).toLowerCase()}">${esc(r.priority)}</span>`;
      const mail = String(r.email).includes("@")
        ? `<a class="mail" href="mailto:${esc(r.email)}">${esc(r.email)}</a>`
        : esc(r.email);
      return `<tr class="${r.priority === "High" ? "high" : ""}">
        <td><strong>${esc(r.name)}</strong></td>
        <td>${esc(r.country)}</td>
        <td>${esc(r.city)}</td>
        <td>${esc(r.niche)}</td>
        <td>${mail}</td>
        <td>${esc(r.phone)}</td>
        <td>${esc(r.gap)}</td>
        <td>${pill}</td>
      </tr>`;
    })
    .join("");
}

function refresh() {
  renderTable(filtered());
}

function fillCountries() {
  const countries = [...new Set(leads.map((r) => r.country))].sort();
  for (const c of countries) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    countryEl.appendChild(opt);
  }
}

copyBtn.addEventListener("click", async () => {
  const emails = filtered()
    .map((r) => r.email)
    .filter((e) => String(e).includes("@"));
  const text = emails.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = `Copied ${emails.length}`;
    setTimeout(() => {
      copyBtn.textContent = "Copy visible emails";
    }, 1600);
  } catch {
    copyBtn.textContent = "Copy failed";
  }
});

qEl.addEventListener("input", refresh);
countryEl.addEventListener("change", refresh);
priorityEl.addEventListener("change", refresh);

fetch("leads.json")
  .then((r) => {
    if (!r.ok) throw new Error("Failed to load leads.json");
    return r.json();
  })
  .then((data) => {
    leads = data;
    fillCountries();
    renderStats(leads);
    refresh();
  })
  .catch((err) => {
    countEl.textContent = String(err.message || err);
  });
