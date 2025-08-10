/*
  Dental DMS - Single Page App (No build, No backend)
  - Data persisted via localStorage
  - Modules: Dashboard, Patients, Appointments, Billing, Inventory, Staff, Settings
  - Tailwind CDN used for styling
*/

const APP_STORAGE_KEY = "dental_dms_v1";

const APP = {
  state: {
    patients: [],
    appointments: [],
    staff: [],
    inventory: [],
    invoices: [],
    settings: { clinicName: "BrightSmile Dental", taxRatePercent: 7.5 },
  },
  routes: {
    "#/": { name: "Dashboard", render: renderDashboard },
    "#/patients": { name: "Patients", render: renderPatients },
    "#/appointments": { name: "Appointments", render: renderAppointments },
    "#/billing": { name: "Billing", render: renderBilling },
    "#/inventory": { name: "Inventory", render: renderInventory },
    "#/staff": { name: "Staff", render: renderStaff },
    "#/settings": { name: "Settings", render: renderSettings },
  },
  delegatesInstalled: false,
};

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}

function loadState() {
  const raw = localStorage.getItem(APP_STORAGE_KEY);
  const parsed = safeParse(raw, null);
  if (parsed && typeof parsed === "object") {
    APP.state = Object.assign(APP.state, parsed);
  }
}

function saveState() {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(APP.state));
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toCurrency(amount) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(amount || 0));
}

function formatDate(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function formatDateTime(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function ensureSeedData() {
  if (APP.state.patients.length === 0) {
    const p1 = { id: generateId(), firstName: "Emma", lastName: "Johnson", dob: "1989-05-10", phone: "(555) 555-0182", email: "emma.johnson@example.com", address: "123 Main St", insuranceProvider: "Delta Dental", policyNumber: "DD-12345", notes: "Allergic to penicillin", createdAt: new Date().toISOString() };
    const p2 = { id: generateId(), firstName: "Liam", lastName: "Smith", dob: "1990-11-22", phone: "(555) 555-0193", email: "liam.smith@example.com", address: "789 Pine Ave", insuranceProvider: "MetLife", policyNumber: "ML-78910", notes: "", createdAt: new Date().toISOString() };
    APP.state.patients.push(p1, p2);
  }
  if (APP.state.staff.length === 0) {
    APP.state.staff.push(
      { id: generateId(), name: "Dr. Alice Brown", role: "Dentist", email: "alice@brightsmile.com", phone: "(555) 222-1111", active: true },
      { id: generateId(), name: "Dr. Mark Davis", role: "Dentist", email: "mark@brightsmile.com", phone: "(555) 222-1112", active: true },
      { id: generateId(), name: "Sarah Wilson", role: "Hygienist", email: "sarah@brightsmile.com", phone: "(555) 222-2222", active: true },
      { id: generateId(), name: "Tom Lee", role: "Receptionist", email: "tom@brightsmile.com", phone: "(555) 222-3333", active: true }
    );
  }
  if (APP.state.inventory.length === 0) {
    APP.state.inventory.push(
      { id: generateId(), name: "Nitrile Gloves (M)", sku: "GLV-M-100", qty: 250, reorderLevel: 200, unitCost: 0.12, vendor: "MedSupplies Inc." },
      { id: generateId(), name: "Dental Floss", sku: "FLS-50", qty: 80, reorderLevel: 50, unitCost: 1.2, vendor: "ShineCo" },
      { id: generateId(), name: "Anesthetic Cartridges", sku: "AN-20", qty: 25, reorderLevel: 20, unitCost: 3.8, vendor: "MedSupplies Inc." }
    );
  }
  if (APP.state.appointments.length === 0) {
    const patientId = APP.state.patients[0].id;
    const providerId = APP.state.staff.find(s => s.role === "Dentist").id;
    APP.state.appointments.push(
      { id: generateId(), patientId, providerId, date: new Date(Date.now() + 86400000).toISOString(), type: "Cleaning", room: "1", status: "Scheduled", notes: "6-month recall" }
    );
  }
  if (APP.state.invoices.length === 0) {
    const patientId = APP.state.patients[0].id;
    const items = [ { description: "Exam & Cleaning", amount: 120 }, { description: "X-Ray", amount: 60 } ];
    const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const tax = subtotal * (APP.state.settings.taxRatePercent / 100);
    APP.state.invoices.push({ id: generateId(), patientId, date: new Date().toISOString(), items, subtotal, tax, total: subtotal + tax, status: "Unpaid", paidAmount: 0 });
  }
}

function init() {
  loadState();
  ensureSeedData();
  saveState();
  mountAppShell();
  routeTo(location.hash || "#/");
  window.addEventListener("hashchange", () => routeTo(location.hash));
}

function mountAppShell() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="h-full grid grid-cols-12">
      <aside class="hidden md:flex md:col-span-3 lg:col-span-2 bg-white border-r border-slate-200 min-h-screen flex-col">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
          <img src="./assets/logo.svg" alt="logo" class="h-8 w-8" />
          <div>
            <div class="text-slate-900 font-semibold leading-none">${APP.state.settings.clinicName}</div>
            <div class="text-slate-500 text-sm">Dental DMS</div>
          </div>
        </div>
        <nav id="sidebar" class="flex-1 overflow-y-auto p-3 space-y-1">
          ${navLinkMarkup("#/", "Dashboard", svgIcon("home"))}
          ${navLinkMarkup("#/patients", "Patients", svgIcon("users"))}
          ${navLinkMarkup("#/appointments", "Appointments", svgIcon("calendar"))}
          ${navLinkMarkup("#/billing", "Billing", svgIcon("cash"))}
          ${navLinkMarkup("#/inventory", "Inventory", svgIcon("box"))}
          ${navLinkMarkup("#/staff", "Staff", svgIcon("badge"))}
          ${navLinkMarkup("#/settings", "Settings", svgIcon("settings"))}
        </nav>
        <div class="px-5 py-4 text-xs text-slate-400 border-t border-slate-200">v1.0.0</div>
      </aside>
      <main class="col-span-12 md:col-span-9 lg:col-span-10 min-h-screen">
        <header class="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3 md:hidden">
              <button id="mobileMenuBtn" class="p-2 rounded hover:bg-slate-100">${svgIcon("menu")}</button>
              <div class="font-semibold">${APP.state.settings.clinicName}</div>
            </div>
            <div class="hidden md:block font-semibold" id="pageTitle">Dashboard</div>
            <div class="flex items-center gap-2">
              <input id="globalSearch" class="hidden md:block bg-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Search patients, invoices, appts..." />
              <button id="exportBtn" class="px-3 py-2 text-sm bg-slate-100 rounded hover:bg-slate-200">Export</button>
            </div>
          </div>
        </header>
        <section id="pageRoot" class="max-w-7xl mx-auto p-4"></section>
      </main>
    </div>
    <div id="modalRoot"></div>
  `;

  document.getElementById("mobileMenuBtn")?.addEventListener("click", openMobileMenu);
  document.getElementById("exportBtn")?.addEventListener("click", exportData);
  document.getElementById("globalSearch")?.addEventListener("input", handleGlobalSearch);
  highlightActiveNav(location.hash || "#/");

  if (!APP.delegatesInstalled) {
    const root = document.getElementById("pageRoot");
    root.addEventListener("click", handleRootClick);
    APP.delegatesInstalled = true;
  }
}

function openMobileMenu() {
  const nav = document.createElement("div");
  nav.className = "fixed inset-0 z-50 flex";
  nav.innerHTML = `
    <div class="flex-1 modal-backdrop" data-close></div>
    <div class="w-72 max-w-[80%] bg-white h-full shadow-xl p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="font-semibold">Menu</div>
        <button class="p-2 rounded hover:bg-slate-100" data-close>${svgIcon("x")}</button>
      </div>
      <nav class="space-y-1">
        ${navLinkMarkup("#/", "Dashboard", svgIcon("home"))}
        ${navLinkMarkup("#/patients", "Patients", svgIcon("users"))}
        ${navLinkMarkup("#/appointments", "Appointments", svgIcon("calendar"))}
        ${navLinkMarkup("#/billing", "Billing", svgIcon("cash"))}
        ${navLinkMarkup("#/inventory", "Inventory", svgIcon("box"))}
        ${navLinkMarkup("#/staff", "Staff", svgIcon("badge"))}
        ${navLinkMarkup("#/settings", "Settings", svgIcon("settings"))}
      </nav>
    </div>
  `;
  nav.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) nav.remove();
    if (e.target.closest("a[href^='#/']")) nav.remove();
  });
  document.body.appendChild(nav);
}

function navLinkMarkup(href, label, icon) {
  return `<a href="${href}" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary-50 text-slate-700">
    <span class="w-5 h-5 text-slate-500">${icon}</span>
    <span>${label}</span>
  </a>`;
}

function highlightActiveNav(hash) {
  const links = document.querySelectorAll("nav#sidebar a");
  links.forEach(a => {
    const active = a.getAttribute("href") === hash;
    a.classList.toggle("bg-primary-50", active);
    a.classList.toggle("text-primary-700", active);
    a.classList.toggle("font-medium", active);
  });
  const title = APP.routes[hash]?.name || "";
  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = title;
}

function routeTo(hash) {
  const route = APP.routes[hash] || APP.routes["#/"];
  highlightActiveNav(hash);
  const root = document.getElementById("pageRoot");
  root.innerHTML = "";
  route.render(root);
}

function handleGlobalSearch(e) {
  const q = (e.target.value || "").toLowerCase().trim();
  const root = document.getElementById("pageRoot");
  const hash = location.hash || "#/";
  if (hash === "#/patients") filterTable(root, q);
  if (hash === "#/billing") filterTable(root, q);
  if (hash === "#/appointments") filterTable(root, q);
  if (hash === "#/inventory") filterTable(root, q);
  if (hash === "#/staff") filterTable(root, q);
}

function filterTable(root, query) {
  const rows = root.querySelectorAll("table tbody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

// ------------- Dashboard -------------
function renderDashboard(root) {
  const upcoming = APP.state.appointments
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const overdueInvoices = APP.state.invoices.filter(inv => inv.status !== "Paid");
  const lowStock = APP.state.inventory.filter(i => Number(i.qty) <= Number(i.reorderLevel));

  root.innerHTML = `
    <div class="py-4">
      <h1 class="text-2xl font-semibold mb-4">Welcome back</h1>
      <div class="grid md:grid-cols-4 gap-4">
        ${statCard("Patients", APP.state.patients.length, "users")}
        ${statCard("Upcoming Appts", upcoming.length, "calendar")}
        ${statCard("Open Invoices", overdueInvoices.length, "cash")}
        ${statCard("Low Stock", lowStock.length, "box")}
      </div>
      <div class="grid lg:grid-cols-2 gap-4 mt-6">
        <div class="bg-white rounded-xl shadow-soft p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold">Next Appointments</h2>
            <a href="#/appointments" class="text-primary-600 text-sm">View all</a>
          </div>
          <div class="divide-y">
            ${upcoming.map(a => appointmentRowCompact(a)).join("") || emptyState("No upcoming appointments")}
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-soft p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold">Open Invoices</h2>
            <a href="#/billing" class="text-primary-600 text-sm">View all</a>
          </div>
          <div class="divide-y">
            ${overdueInvoices.map(inv => invoiceRowCompact(inv)).join("") || emptyState("All caught up!")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function statCard(label, value, icon) {
  return `
    <div class="bg-white rounded-xl shadow-soft p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">${svgIcon(icon)}</div>
        <div>
          <div class="text-slate-500 text-sm">${label}</div>
          <div class="text-xl font-semibold">${value}</div>
        </div>
      </div>
    </div>
  `;
}

function appointmentRowCompact(a) {
  const p = APP.state.patients.find(p => p.id === a.patientId);
  const s = APP.state.staff.find(s => s.id === a.providerId);
  return `
    <div class="py-3 flex items-center justify-between">
      <div>
        <div class="font-medium">${p ? p.firstName + " " + p.lastName : "Unknown"}</div>
        <div class="text-sm text-slate-500">${formatDateTime(a.date)} • ${a.type} • ${s ? s.name : ""}</div>
      </div>
      <a href="#/appointments" class="text-sm text-primary-600">Manage</a>
    </div>
  `;
}

function invoiceRowCompact(inv) {
  const p = APP.state.patients.find(p => p.id === inv.patientId);
  const balance = Number(inv.total) - Number(inv.paidAmount || 0);
  return `
    <div class="py-3 flex items-center justify-between">
      <div>
        <div class="font-medium">${p ? p.firstName + " " + p.lastName : "Unknown"}</div>
        <div class="text-sm text-slate-500">${formatDate(inv.date)} • Balance: ${toCurrency(balance)}</div>
      </div>
      <a href="#/billing" class="text-sm text-primary-600">Collect</a>
    </div>
  `;
}

function emptyState(text) {
  return `<div class="py-6 text-center text-slate-500">${text}</div>`;
}

// ------------- Patients -------------
function renderPatients(root) {
  const toolbar = toolbarLayout({
    title: "Patients",
    ctaLabel: "New Patient",
    onCta: () => openPatientModal(),
  });

  const table = document.createElement("div");
  table.innerHTML = `
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="text-left p-3">Name</th>
            <th class="text-left p-3">DOB</th>
            <th class="text-left p-3">Phone</th>
            <th class="text-left p-3">Email</th>
            <th class="text-left p-3">Insurance</th>
            <th class="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${APP.state.patients.map(p => patientRow(p)).join("")}
        </tbody>
      </table>
    </div>
  `;

  root.appendChild(toolbar);
  root.appendChild(table);
}

function patientRow(p) {
  return `
    <tr class="border-t">
      <td class="p-3">
        <div class="font-medium">${p.firstName} ${p.lastName}</div>
        <div class="text-sm text-slate-500">${p.address || ""}</div>
      </td>
      <td class="p-3">${p.dob || ""}</td>
      <td class="p-3">${p.phone || ""}</td>
      <td class="p-3">${p.email || ""}</td>
      <td class="p-3">${p.insuranceProvider || ""}</td>
      <td class="p-3 text-right">
        <button class="px-2 py-1 text-sm rounded hover:bg-slate-100" data-action="edit" data-id="${p.id}">Edit</button>
        <button class="px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50" data-action="delete" data-id="${p.id}">Delete</button>
      </td>
    </tr>
  `;
}

function openPatientModal(patient) {
  const isEdit = Boolean(patient);
  const id = patient?.id || generateId();
  const modal = createModal({ title: isEdit ? "Edit Patient" : "New Patient" });
  modal.body.innerHTML = `
    <form id="patientForm" class="grid md:grid-cols-2 gap-3">
      ${inputField("firstName", "First Name", patient?.firstName || "", true)}
      ${inputField("lastName", "Last Name", patient?.lastName || "", true)}
      ${inputField("dob", "DOB", patient?.dob || "", true, "date")}
      ${inputField("phone", "Phone", patient?.phone || "")}
      ${inputField("email", "Email", patient?.email || "", false, "email")}
      ${inputField("address", "Address", patient?.address || "")}
      ${inputField("insuranceProvider", "Insurance Provider", patient?.insuranceProvider || "")}
      ${inputField("policyNumber", "Policy #", patient?.policyNumber || "")}
      <div class="md:col-span-2">
        <label class="text-sm text-slate-600">Notes</label>
        <textarea name="notes" class="mt-1 w-full rounded border-slate-300 focus:ring-primary-500 focus:border-primary-500" rows="3">${patient?.notes || ""}</textarea>
      </div>
    </form>
  `;
  modal.onConfirm = () => {
    const form = modal.body.querySelector("#patientForm");
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.firstName || !data.lastName || !data.dob) {
      showToast("Please fill required fields");
      return false;
    }
    const payload = { id, ...patient, ...data, createdAt: patient?.createdAt || new Date().toISOString() };
    if (isEdit) {
      APP.state.patients = APP.state.patients.map(p => p.id === id ? payload : p);
    } else {
      APP.state.patients.push(payload);
    }
    saveState();
    routeTo("#/patients");
    return true;
  };
  modal.open();
}

// ------------- Appointments -------------
function renderAppointments(root) {
  const toolbar = toolbarLayout({
    title: "Appointments",
    ctaLabel: "New Appointment",
    onCta: () => openAppointmentModal(),
  });

  const table = document.createElement("div");
  table.innerHTML = `
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="text-left p-3">Patient</th>
            <th class="text-left p-3">Provider</th>
            <th class="text-left p-3">Date</th>
            <th class="text-left p-3">Type</th>
            <th class="text-left p-3">Room</th>
            <th class="text-left p-3">Status</th>
            <th class="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${APP.state.appointments.map(a => appointmentRow(a)).join("")}
        </tbody>
      </table>
    </div>
  `;

  root.appendChild(toolbar);
  root.appendChild(table);
}

function appointmentRow(a) {
  const p = APP.state.patients.find(p => p.id === a.patientId);
  const s = APP.state.staff.find(s => s.id === a.providerId);
  return `
    <tr class="border-t">
      <td class="p-3">${p ? p.firstName + " " + p.lastName : "Unknown"}</td>
      <td class="p-3">${s ? s.name : ""}</td>
      <td class="p-3">${formatDateTime(a.date)}</td>
      <td class="p-3">${a.type || ""}</td>
      <td class="p-3">${a.room || ""}</td>
      <td class="p-3">
        <span class="px-2 py-1 rounded text-xs ${badgeClass(a.status)}">${a.status}</span>
      </td>
      <td class="p-3 text-right">
        <button class="px-2 py-1 text-sm rounded hover:bg-slate-100" data-action="edit-appt" data-id="${a.id}">Edit</button>
        <button class="px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50" data-action="delete-appt" data-id="${a.id}">Delete</button>
      </td>
    </tr>
  `;
}

function badgeClass(status) {
  switch ((status || "").toLowerCase()) {
    case "scheduled": return "bg-primary-50 text-primary-700";
    case "completed": return "bg-emerald-50 text-emerald-700";
    case "cancelled": return "bg-red-50 text-red-700";
    case "no show": return "bg-amber-50 text-amber-700";
    default: return "bg-slate-100 text-slate-700";
  }
}

function openAppointmentModal(appt) {
  const isEdit = Boolean(appt);
  const id = appt?.id || generateId();

  const modal = createModal({ title: isEdit ? "Edit Appointment" : "New Appointment" });
  modal.body.innerHTML = `
    <form id="apptForm" class="grid md:grid-cols-2 gap-3">
      ${selectField("patientId", "Patient", APP.state.patients.map(p => ({ value: p.id, label: p.firstName + " " + p.lastName })), appt?.patientId)}
      ${selectField("providerId", "Provider", APP.state.staff.filter(s=>s.active).map(s => ({ value: s.id, label: s.name + " • " + s.role })), appt?.providerId)}
      ${inputField("date", "Date & Time", appt ? appt.date.substring(0,16) : "", true, "datetime-local")}
      ${inputField("type", "Type", appt?.type || "", true)}
      ${inputField("room", "Room", appt?.room || "")}
      ${selectField("status", "Status", ["Scheduled","Completed","Cancelled","No Show"].map(s=>({value:s,label:s})), appt?.status || "Scheduled")}
      <div class="md:col-span-2">
        <label class="text-sm text-slate-600">Notes</label>
        <textarea name="notes" class="mt-1 w-full rounded border-slate-300 focus:ring-primary-500 focus:border-primary-500" rows="3">${appt?.notes || ""}</textarea>
      </div>
    </form>
  `;
  modal.onConfirm = () => {
    const form = modal.body.querySelector("#apptForm");
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.patientId || !data.providerId || !data.date || !data.type) {
      showToast("Please fill required fields");
      return false;
    }
    const newDateIso = new Date(data.date).toISOString();
    if (!validateAppointmentSlot(id, data.providerId, newDateIso)) {
      showToast("Time conflict for provider. Choose a different time.");
      return false;
    }
    const payload = { id, ...appt, ...data, date: newDateIso };
    if (isEdit) {
      APP.state.appointments = APP.state.appointments.map(a => a.id === id ? payload : a);
    } else {
      APP.state.appointments.push(payload);
    }
    saveState();
    routeTo("#/appointments");
    return true;
  };
  modal.open();
}

function validateAppointmentSlot(apptId, providerId, dateIso) {
  const d = new Date(dateIso).getTime();
  const start = d;
  const end = d + 60 * 60 * 1000; // 1 hour duration
  return APP.state.appointments.every(a => {
    if (a.providerId !== providerId) return true;
    if (a.id === apptId) return true;
    if (a.status && ["Cancelled"].includes(a.status)) return true;
    const ad = new Date(a.date).getTime();
    const aStart = ad;
    const aEnd = ad + 60 * 60 * 1000;
    const overlap = Math.max(start, aStart) < Math.min(end, aEnd);
    return !overlap;
  });
}

// ------------- Billing -------------
function renderBilling(root) {
  const toolbar = toolbarLayout({
    title: "Billing",
    ctaLabel: "New Invoice",
    onCta: () => openInvoiceModal(),
  });

  const table = document.createElement("div");
  table.innerHTML = `
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="text-left p-3">Patient</th>
            <th class="text-left p-3">Date</th>
            <th class="text-left p-3">Total</th>
            <th class="text-left p-3">Status</th>
            <th class="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${APP.state.invoices.map(inv => invoiceRow(inv)).join("")}
        </tbody>
      </table>
    </div>
  `;

  root.appendChild(toolbar);
  root.appendChild(table);
}

function invoiceRow(inv) {
  const p = APP.state.patients.find(p => p.id === inv.patientId);
  const balance = Number(inv.total) - Number(inv.paidAmount || 0);
  return `
    <tr class="border-t">
      <td class="p-3">${p ? p.firstName + " " + p.lastName : "Unknown"}</td>
      <td class="p-3">${formatDate(inv.date)}</td>
      <td class="p-3">${toCurrency(inv.total)} <span class="text-slate-500">(${toCurrency(balance)} due)</span></td>
      <td class="p-3">${inv.status}</td>
      <td class="p-3 text-right">
        <button class="px-2 py-1 text-sm rounded hover:bg-slate-100" data-action="edit-inv" data-id="${inv.id}">Edit</button>
        <button class="px-2 py-1 text-sm rounded hover:bg-slate-100 text-emerald-700" data-action="collect-inv" data-id="${inv.id}">Collect</button>
        <button class="px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50" data-action="delete-inv" data-id="${inv.id}">Delete</button>
      </td>
    </tr>
  `;
}

function openInvoiceModal(inv) {
  const isEdit = Boolean(inv);
  const id = inv?.id || generateId();
  const modal = createModal({ title: isEdit ? "Edit Invoice" : "New Invoice" });
  const items = inv?.items || [ { description: "", amount: "" } ];
  const patientOptions = APP.state.patients.map(p => ({ value: p.id, label: p.firstName + " " + p.lastName }));
  modal.body.innerHTML = `
    <form id="invForm" class="grid gap-3">
      ${selectField("patientId", "Patient", patientOptions, inv?.patientId)}
      ${inputField("date", "Date", inv ? inv.date.substring(0,10) : new Date().toISOString().substring(0,10), true, "date")}
      <div>
        <label class="text-sm text-slate-600">Line Items</label>
        <div id="lineItems" class="mt-2 space-y-2"></div>
        <button type="button" id="addItem" class="mt-2 px-3 py-2 text-sm bg-slate-100 rounded hover:bg-slate-200">Add Item</button>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="col-span-2 text-right text-slate-600">Subtotal</div>
        <div id="subtotal" class="text-right font-medium">$0.00</div>
        <div class="col-span-2 text-right text-slate-600">Tax (${APP.state.settings.taxRatePercent}%)</div>
        <div id="tax" class="text-right font-medium">$0.00</div>
        <div class="col-span-2 text-right text-slate-600">Total</div>
        <div id="total" class="text-right font-semibold">$0.00</div>
      </div>
    </form>
  `;

  const itemsRoot = modal.body.querySelector("#lineItems");
  const addItemBtn = modal.body.querySelector("#addItem");

  function renderItems() {
    itemsRoot.innerHTML = items.map((it, idx) => `
      <div class="grid grid-cols-12 gap-2">
        <input name="desc-${idx}" placeholder="Description" value="${it.description || ""}" class="col-span-8 rounded border-slate-300 focus:ring-primary-500 focus:border-primary-500" />
        <input name="amt-${idx}" type="number" step="0.01" min="0" placeholder="Amount" value="${it.amount || ""}" class="col-span-3 rounded border-slate-300 text-right focus:ring-primary-500 focus:border-primary-500" />
        <button type="button" data-idx="${idx}" class="col-span-1 px-2 rounded text-red-600 hover:bg-red-50">${svgIcon("trash")}</button>
      </div>
    `).join("");
    recalcTotals();
  }

  function recalcTotals() {
    const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const tax = subtotal * (APP.state.settings.taxRatePercent / 100);
    const total = subtotal + tax;
    modal.body.querySelector("#subtotal").textContent = toCurrency(subtotal);
    modal.body.querySelector("#tax").textContent = toCurrency(tax);
    modal.body.querySelector("#total").textContent = toCurrency(total);
  }

  addItemBtn.addEventListener("click", () => {
    items.push({ description: "", amount: "" });
    renderItems();
  });

  itemsRoot.addEventListener("input", (e) => {
    const row = e.target.closest(".grid");
    const idx = Array.from(itemsRoot.children).indexOf(row);
    if (idx >= 0) {
      const desc = row.querySelector(`[name='desc-${idx}']`).value;
      const amt = row.querySelector(`[name='amt-${idx}']`).value;
      items[idx] = { description: desc, amount: amt };
      recalcTotals();
    }
  });
  itemsRoot.addEventListener("click", (e) => {
    if (e.target.closest("button")) {
      const idx = Number(e.target.closest("button").dataset.idx);
      items.splice(idx, 1);
      renderItems();
    }
  });

  renderItems();

  modal.onConfirm = () => {
    const form = modal.body.querySelector("#invForm");
    const formData = Object.fromEntries(new FormData(form).entries());
    if (!formData.patientId || !formData.date) {
      showToast("Please fill required fields");
      return false;
    }
    const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const tax = subtotal * (APP.state.settings.taxRatePercent / 100);
    const total = subtotal + tax;
    const payload = { id, ...inv, patientId: formData.patientId, date: new Date(formData.date).toISOString(), items: items.slice(), subtotal, tax, total, status: inv?.status || "Unpaid", paidAmount: inv?.paidAmount || 0 };
    if (isEdit) {
      APP.state.invoices = APP.state.invoices.map(i => i.id === id ? payload : i);
    } else {
      APP.state.invoices.push(payload);
    }
    saveState();
    routeTo("#/billing");
    return true;
  };
  modal.open();
}

function openCollectModal(inv) {
  const modal = createModal({ title: "Collect Payment" });
  const balance = Number(inv.total) - Number(inv.paidAmount || 0);
  modal.body.innerHTML = `
    <form id="collectForm" class="grid gap-3">
      <div>
        <div class="text-slate-600">Current Balance</div>
        <div class="text-xl font-semibold">${toCurrency(balance)}</div>
      </div>
      ${inputField("amount", "Amount to collect", balance.toFixed(2), true, "number", { min: 0, step: 0.01, max: balance })}
      ${selectField("method", "Payment Method", ["Cash","Card","Check"].map(m=>({value:m,label:m})), "Cash")}
    </form>
  `;
  modal.onConfirm = () => {
    const data = Object.fromEntries(new FormData(modal.body.querySelector("#collectForm")).entries());
    const collect = Number(data.amount || 0);
    if (collect <= 0) { showToast("Enter a valid amount"); return false; }
    inv.paidAmount = Number(inv.paidAmount || 0) + collect;
    inv.status = (Number(inv.paidAmount) >= Number(inv.total)) ? "Paid" : "Partial";
    APP.state.invoices = APP.state.invoices.map(i => i.id === inv.id ? inv : i);
    saveState();
    routeTo("#/billing");
    return true;
  };
  modal.open();
}

// ------------- Inventory -------------
function renderInventory(root) {
  const toolbar = toolbarLayout({
    title: "Inventory",
    ctaLabel: "New Item",
    onCta: () => openInventoryModal(),
  });
  const table = document.createElement("div");
  table.innerHTML = `
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="text-left p-3">Item</th>
            <th class="text-left p-3">SKU</th>
            <th class="text-left p-3">Qty</th>
            <th class="text-left p-3">Reorder</th>
            <th class="text-left p-3">Unit Cost</th>
            <th class="text-left p-3">Vendor</th>
            <th class="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${APP.state.inventory.map(i => inventoryRow(i)).join("")}
        </tbody>
      </table>
    </div>
  `;
  root.appendChild(toolbar);
  root.appendChild(table);
}

function inventoryRow(i) {
  const low = Number(i.qty) <= Number(i.reorderLevel);
  return `
    <tr class="border-t ${low ? 'bg-amber-50' : ''}">
      <td class="p-3">${i.name}</td>
      <td class="p-3">${i.sku || ""}</td>
      <td class="p-3">${i.qty}</td>
      <td class="p-3">${i.reorderLevel}</td>
      <td class="p-3">${toCurrency(i.unitCost)}</td>
      <td class="p-3">${i.vendor || ""}</td>
      <td class="p-3 text-right">
        <button class="px-2 py-1 text-sm rounded hover:bg-slate-100" data-action="edit-item" data-id="${i.id}">Edit</button>
        <button class="px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50" data-action="delete-item" data-id="${i.id}">Delete</button>
      </td>
    </tr>
  `;
}

function openInventoryModal(item) {
  const isEdit = Boolean(item);
  const id = item?.id || generateId();
  const modal = createModal({ title: isEdit ? "Edit Item" : "New Item" });
  modal.body.innerHTML = `
    <form id="invnForm" class="grid md:grid-cols-2 gap-3">
      ${inputField("name", "Item Name", item?.name || "", true)}
      ${inputField("sku", "SKU", item?.sku || "")}
      ${inputField("qty", "Quantity", item?.qty ?? 0, true, "number", { min: 0, step: 1 })}
      ${inputField("reorderLevel", "Reorder Level", item?.reorderLevel ?? 0, true, "number", { min: 0, step: 1 })}
      ${inputField("unitCost", "Unit Cost", item?.unitCost ?? 0, true, "number", { min: 0, step: 0.01 })}
      ${inputField("vendor", "Vendor", item?.vendor || "")}
    </form>
  `;
  modal.onConfirm = () => {
    const data = Object.fromEntries(new FormData(modal.body.querySelector("#invnForm")).entries());
    if (!data.name) { showToast("Item name required"); return false; }
    const payload = { id, ...item, name: data.name, sku: data.sku, qty: Number(data.qty || 0), reorderLevel: Number(data.reorderLevel || 0), unitCost: Number(data.unitCost || 0), vendor: data.vendor };
    if (isEdit) {
      APP.state.inventory = APP.state.inventory.map(i => i.id === id ? payload : i);
    } else {
      APP.state.inventory.push(payload);
    }
    saveState();
    routeTo("#/inventory");
    return true;
  };
  modal.open();
}

// ------------- Staff -------------
function renderStaff(root) {
  const toolbar = toolbarLayout({
    title: "Staff",
    ctaLabel: "New Staff",
    onCta: () => openStaffModal(),
  });
  const table = document.createElement("div");
  table.innerHTML = `
    <div class="bg-white rounded-xl shadow-soft overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 text-slate-600 text-sm">
          <tr>
            <th class="text-left p-3">Name</th>
            <th class="text-left p-3">Role</th>
            <th class="text-left p-3">Email</th>
            <th class="text-left p-3">Phone</th>
            <th class="text-left p-3">Status</th>
            <th class="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${APP.state.staff.map(s => staffRow(s)).join("")}
        </tbody>
      </table>
    </div>
  `;
  root.appendChild(toolbar);
  root.appendChild(table);
}

function staffRow(s) {
  return `
    <tr class="border-t">
      <td class="p-3">${s.name}</td>
      <td class="p-3">${s.role}</td>
      <td class="p-3">${s.email || ""}</td>
      <td class="p-3">${s.phone || ""}</td>
      <td class="p-3">${s.active ? 'Active' : 'Inactive'}</td>
      <td class="p-3 text-right">
        <button class="px-2 py-1 text-sm rounded hover:bg-slate-100" data-action="edit-staff" data-id="${s.id}">Edit</button>
        <button class="px-2 py-1 text-sm rounded text-red-600 hover:bg-red-50" data-action="delete-staff" data-id="${s.id}">Delete</button>
      </td>
    </tr>
  `;
}

function openStaffModal(s) {
  const isEdit = Boolean(s);
  const id = s?.id || generateId();
  const modal = createModal({ title: isEdit ? "Edit Staff" : "New Staff" });
  modal.body.innerHTML = `
    <form id="staffForm" class="grid md:grid-cols-2 gap-3">
      ${inputField("name", "Name", s?.name || "", true)}
      ${inputField("role", "Role", s?.role || "", true)}
      ${inputField("email", "Email", s?.email || "", false, "email")}
      ${inputField("phone", "Phone", s?.phone || "")}
      ${selectField("active", "Status", [{value: "true", label: "Active"}, {value: "false", label: "Inactive"}], s?.active ? "true" : "false")}
    </form>
  `;
  modal.onConfirm = () => {
    const data = Object.fromEntries(new FormData(modal.body.querySelector("#staffForm")).entries());
    if (!data.name || !data.role) { showToast("Name and role required"); return false; }
    const payload = { id, ...s, name: data.name, role: data.role, email: data.email, phone: data.phone, active: data.active === "true" };
    if (isEdit) {
      APP.state.staff = APP.state.staff.map(x => x.id === id ? payload : x);
    } else {
      APP.state.staff.push(payload);
    }
    saveState();
    routeTo("#/staff");
    return true;
  };
  modal.open();
}

// ------------- Settings -------------
function renderSettings(root) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-xl shadow-soft p-4 max-w-2xl";
  card.innerHTML = `
    <h2 class="font-semibold mb-3">Clinic Settings</h2>
    <form id="settingsForm" class="grid md:grid-cols-2 gap-3">
      ${inputField("clinicName", "Clinic Name", APP.state.settings.clinicName || "BrightSmile Dental", true)}
      ${inputField("taxRatePercent", "Tax Rate %", APP.state.settings.taxRatePercent ?? 7.5, true, "number", { step: 0.1, min: 0 })}
    </form>
    <div class="mt-4 flex gap-2">
      <button id="saveSettings" class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Save</button>
      <button id="importBtn" class="px-4 py-2 bg-slate-100 rounded hover:bg-slate-200">Import</button>
      <button id="clearBtn" class="px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100">Reset Data</button>
    </div>
  `;
  root.appendChild(card);

  card.querySelector("#saveSettings").addEventListener("click", () => {
    const data = Object.fromEntries(new FormData(card.querySelector("#settingsForm")).entries());
    APP.state.settings.clinicName = data.clinicName || APP.state.settings.clinicName;
    APP.state.settings.taxRatePercent = Number(data.taxRatePercent || 0);
    saveState();
    mountAppShell();
    routeTo(location.hash || "#/");
    showToast("Settings saved");
  });

  card.querySelector("#importBtn").addEventListener("click", importData);
  card.querySelector("#clearBtn").addEventListener("click", resetData);
}

function exportData() {
  const data = JSON.stringify(APP.state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dental_dms_export_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const text = await file.text();
    const parsed = safeParse(text, null);
    if (!parsed) { showToast("Invalid file"); return; }
    APP.state = Object.assign(APP.state, parsed);
    saveState();
    mountAppShell();
    routeTo("#/settings");
    showToast("Data imported");
  };
  input.click();
}

function resetData() {
  if (!confirm("Reset demo data? This cannot be undone.")) return;
  localStorage.removeItem(APP_STORAGE_KEY);
  APP.state = { patients: [], appointments: [], staff: [], inventory: [], invoices: [], settings: { clinicName: "BrightSmile Dental", taxRatePercent: 7.5 } };
  ensureSeedData();
  saveState();
  mountAppShell();
  routeTo("#/");
}

// ------------- Shared UI -------------
function toolbarLayout({ title, ctaLabel, onCta }) {
  const div = document.createElement("div");
  div.className = "flex items-center justify-between mb-3";
  div.innerHTML = `
    <h1 class="text-xl font-semibold">${title}</h1>
    <button class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">${ctaLabel}</button>
  `;
  div.querySelector("button").addEventListener("click", onCta);

  return div;
}

function confirmDelete(onConfirm) {
  const modal = createModal({ title: "Confirm Delete", confirmText: "Delete", confirmClass: "bg-red-600 hover:bg-red-700" });
  modal.body.innerHTML = `<p>Are you sure you want to delete this record?</p>`;
  modal.onConfirm = () => { onConfirm(); return true; };
  modal.open();
}

function inputField(name, label, value = "", required = false, type = "text", attrs = {}) {
  const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
  return `
    <div>
      <label class="text-sm text-slate-600">${label}${required ? ' <span class="text-red-600">*</span>' : ''}</label>
      <input name="${name}" type="${type}" value="${value ?? ''}" ${attrStr}
        class="mt-1 w-full rounded border-slate-300 focus:ring-primary-500 focus:border-primary-500" ${required ? 'required' : ''} />
    </div>
  `;
}

function selectField(name, label, options, value) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  return `
    <div>
      <label class="text-sm text-slate-600">${label}</label>
      <select name="${name}" class="mt-1 w-full rounded border-slate-300 focus:ring-primary-500 focus:border-primary-500">
        ${opts.map(o => `<option value="${o.value}" ${o.value == value ? 'selected' : ''}>${o.label}</option>`).join('')}
      </select>
    </div>
  `;
}

function createModal({ title, confirmText = "Save", confirmClass = "bg-primary-600 hover:bg-primary-700" }) {
  const container = document.getElementById("modalRoot");
  const wrapper = document.createElement("div");
  wrapper.className = "fixed inset-0 z-50 flex items-center justify-center";
  wrapper.innerHTML = `
    <div class="absolute inset-0 modal-backdrop"></div>
    <div class="relative bg-white rounded-xl shadow-soft w-[95%] max-w-2xl">
      <div class="flex items-center justify-between p-4 border-b border-slate-200">
        <div class="font-semibold">${title}</div>
        <button class="p-2 rounded hover:bg-slate-100" data-close>${svgIcon("x")}</button>
      </div>
      <div class="p-4" id="modalBody"></div>
      <div class="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
        <button class="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200" data-close>Cancel</button>
        <button class="px-4 py-2 rounded text-white ${confirmClass}" id="confirmBtn">${confirmText}</button>
      </div>
    </div>
  `;
  const modal = {
    wrapper,
    body: null,
    onConfirm: null,
    open() {
      wrapper.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => wrapper.remove()));
      wrapper.querySelector("#confirmBtn").addEventListener("click", () => {
        const shouldClose = typeof modal.onConfirm === "function" ? modal.onConfirm() : true;
        if (shouldClose) wrapper.remove();
      });
      container.appendChild(wrapper);
      modal.body = wrapper.querySelector("#modalBody");
    },
  };
  return modal;
}

function showToast(message) {
  const el = document.createElement("div");
  el.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded shadow-soft z-50";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function svgIcon(name) {
  switch (name) {
    case "home": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.44-.44V20.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-3.75h-3V20.5a.75.75 0 0 1-.75.75H5.5a.75.75 0 0 1-.75-.75v-7.35l-.44.44a.75.75 0 1 1-1.06-1.06l8.69-8.69Z"/></svg>`;
    case "users": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.75 20.1a8.25 8.25 0 0 1 16.5 0 .9.9 0 0 1-.9.9H4.65a.9.9 0 0 1-.9-.9Z"/></svg>`;
    case "calendar": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.75 3a.75.75 0 0 1 .75.75V5h9V3.75a.75.75 0 0 1 1.5 0V5h1.5A2.25 2.25 0 0 1 21 7.25v11.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V7.25A2.25 2.25 0 0 1 5.25 5h1.5V3.75A.75.75 0 0 1 6.75 3ZM5.25 8.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H5.25Z"/></svg>`;
    case "cash": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75Zm1.5 1.5v7.5A.75.75 0 0 0 4.5 16.5h15a.75.75 0 0 0 .75-.75V8.25A.75.75 0 0 0 19.5 7.5H4.5Z"/><path d="M12 15.75a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Z"/></svg>`;
    case "box": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.75 7.5a.75.75 0 0 0-.41-.66l-9-4.5a.75.75 0 0 0-.68 0l-9 4.5a.75.75 0 0 0-.41.66v9a.75.75 0 0 0 .41.66l9 4.5a.75.75 0 0 0 .68 0l9-4.5a.75.75 0 0 0 .41-.66v-9ZM12 3.69l7.06 3.53L12 10.75 4.94 7.22 12 3.69Zm-.75 16.62-7.5-3.75V8.55l7.5 3.75v8.01Zm1.5 0V12.3l7.5-3.75v8.01l-7.5 3.75Z"/></svg>`;
    case "badge": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.7 2.25a.75.75 0 0 1 .6 0l8.25 3.75c.27.12.45.39.45.69V12a9 9 0 1 1-18 0V6.69c0-.3.18-.57.45-.69L11.7 2.25ZM12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>`;
    case "settings": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.25 2.25a.75.75 0 0 1 1.5 0v1.313a8.999 8.999 0 0 1 3.03 1.257l.929-.929a.75.75 0 1 1 1.06 1.06l-.929.93A8.999 8.999 0 0 1 19.937 9h1.313a.75.75 0 0 1 0 1.5H19.937a8.999 8.999 0 0 1-1.257 3.03l.929.929a.75.75 0 1 1-1.06 1.06l-.93-.929A8.999 8.999 0 0 1 12.75 20.437V21.75a.75.75 0 0 1-1.5 0v-1.313a8.999 8.999 0 0 1-3.03-1.257l-.929.929a.75.75 0 1 1-1.06-1.06l.929-.93A8.999 8.999 0 0 1 4.063 10.5H2.75a.75.75 0 0 1 0-1.5h1.313a8.999 8.999 0 0 1 1.257-3.03l-.929-.929a.75.75 0 1 1 1.06-1.06l.93.929A8.999 8.999 0 0 1 11.25 3.563V2.25ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/></svg>`;
    case "menu": return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>`;
    case "x": return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`;
    case "trash": return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.75 3a.75.75 0 0 0-.75.75V4.5H5.25a.75.75 0 0 0 0 1.5H6v12.75A2.25 2.25 0 0 0 8.25 21h7.5A2.25 2.25 0 0 0 18 18.75V6h.75a.75.75 0 0 0 0-1.5h-3.75v-.75a.75.75 0 0 0-.75-.75h-4.5ZM9 6h6v12.75c0 .414-.336.75-.75.75h-4.5a.75.75 0 0 1-.75-.75V6Z"/></svg>`;
    default: return "";
  }
}

function handleRootClick(e) {
  const targetBtn = e.target.closest("button[data-action]");
  if (!targetBtn) return;
  const id = targetBtn.dataset.id;
  const action = targetBtn.dataset.action;
  if (!action) return;
  if (action === "edit") openPatientModal(APP.state.patients.find(p => p.id === id));
  if (action === "delete") confirmDelete(() => {
    APP.state.patients = APP.state.patients.filter(p => p.id !== id);
    saveState(); routeTo("#/patients");
  });

  if (action === "edit-appt") openAppointmentModal(APP.state.appointments.find(a => a.id === id));
  if (action === "delete-appt") confirmDelete(() => {
    APP.state.appointments = APP.state.appointments.filter(a => a.id !== id);
    saveState(); routeTo("#/appointments");
  });

  if (action === "edit-inv") openInvoiceModal(APP.state.invoices.find(i => i.id === id));
  if (action === "collect-inv") openCollectModal(APP.state.invoices.find(i => i.id === id));
  if (action === "delete-inv") confirmDelete(() => {
    APP.state.invoices = APP.state.invoices.filter(i => i.id !== id);
    saveState(); routeTo("#/billing");
  });

  if (action === "edit-item") openInventoryModal(APP.state.inventory.find(i => i.id === id));
  if (action === "delete-item") confirmDelete(() => {
    APP.state.inventory = APP.state.inventory.filter(i => i.id !== id);
    saveState(); routeTo("#/inventory");
  });

  if (action === "edit-staff") openStaffModal(APP.state.staff.find(s => s.id === id));
  if (action === "delete-staff") confirmDelete(() => {
    APP.state.staff = APP.state.staff.filter(s => s.id !== id);
    saveState(); routeTo("#/staff");
  });
}

// Initialize
init();