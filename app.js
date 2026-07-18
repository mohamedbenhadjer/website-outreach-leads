(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    let leads = [];

    const listEl = document.getElementById("list");
    const statsEl = document.getElementById("stats");
    const countEl = document.getElementById("count");
    const qEl = document.getElementById("q");
    const countryEl = document.getElementById("country");
    const priorityEl = document.getElementById("priority");
    const copyBtn = document.getElementById("copyEmails");

    if (!listEl || !statsEl || !countEl || !qEl || !countryEl || !priorityEl) {
      console.error("Page markup is out of date. Hard-refresh (Ctrl+Shift+R).");
      if (countEl) {
        countEl.textContent =
          "Page failed to load controls. Hard-refresh this page (Ctrl+Shift+R).";
      }
      return;
    }

    function esc(s) {
      return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function mailtoHref(row) {
      const to = encodeURIComponent(row.email || "");
      const subject = encodeURIComponent(row.subject || "");
      const body = encodeURIComponent(row.outreach || "");
      return `mailto:${to}?subject=${subject}&body=${body}`;
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
          row.subject,
          row.outreach,
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

    function renderList(rows) {
      countEl.textContent = `Showing ${rows.length} of ${leads.length} leads`;

      listEl.innerHTML = rows
        .map((r, i) => {
          const pill = `<span class="pill ${esc(r.priority).toLowerCase()}">${esc(r.priority)}</span>`;
          const mail = String(r.email).includes("@")
            ? `<a class="mail" href="mailto:${esc(r.email)}">${esc(r.email)}</a>`
            : esc(r.email);

          return `<article class="lead-card ${r.priority === "High" ? "is-high" : ""}">
        <div class="lead-meta">
          <div class="lead-top">
            <h2>${esc(r.name)}</h2>
            ${pill}
          </div>
          <p class="lead-loc">${esc(r.niche)} · ${esc(r.city)} · ${esc(r.country)}</p>
          <dl class="lead-facts">
            <div><dt>To</dt><dd>${mail}</dd></div>
            <div><dt>Phone</dt><dd>${esc(r.phone)}</dd></div>
            <div><dt>Gap</dt><dd>${esc(r.gap)}</dd></div>
          </dl>
        </div>
        <div class="lead-draft">
          <div class="draft-head">
            <span>Email to send</span>
            <div class="draft-actions">
              <button type="button" class="btn tiny" data-copy="${i}">Copy email</button>
              <a class="btn tiny ghost" href="${mailtoHref(r)}">Open in mail</a>
            </div>
          </div>
          <p class="draft-subject"><strong>Subject:</strong> ${esc(r.subject)}</p>
          <pre class="draft-body">${esc(r.outreach)}</pre>
        </div>
      </article>`;
        })
        .join("");
    }

    function refresh() {
      renderList(filtered());
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

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const emails = filtered()
          .map((r) => r.email)
          .filter((e) => String(e).includes("@"));
        try {
          await navigator.clipboard.writeText(emails.join("\n"));
          copyBtn.textContent = `Copied ${emails.length}`;
          setTimeout(() => {
            copyBtn.textContent = "Copy visible addresses";
          }, 1600);
        } catch {
          copyBtn.textContent = "Copy failed";
        }
      });
    }

    listEl.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      const rows = filtered();
      const row = rows[Number(btn.dataset.copy)];
      if (!row) return;
      const text = `To: ${row.email}\nSubject: ${row.subject}\n\n${row.outreach}`;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = "Copy email";
        }, 1400);
      } catch {
        btn.textContent = "Failed";
      }
    });

    qEl.addEventListener("input", refresh);
    countryEl.addEventListener("change", refresh);
    priorityEl.addEventListener("change", refresh);

    fetch(`leads.json?v=2`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load leads.json");
        return r.json();
      })
      .then((data) => {
        leads = Array.isArray(data) ? data : [];
        fillCountries();
        renderStats(leads);
        refresh();
      })
      .catch((err) => {
        countEl.textContent = String(err.message || err);
      });
  });
})();
