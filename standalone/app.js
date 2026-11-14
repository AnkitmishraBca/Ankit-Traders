/*!
 * Ankit Traders Billing — single-file offline app
 * All HTML, CSS and JS are inlined; data is stored in this browser (localStorage).
 * Invoice / market-collection print + PDF + JPG are always exact A5 (148 x 210 mm).
 */
(function () {
  "use strict";

  var SEED = window.__ANKIT_SEED__ || { doctors: [], medicines: [], invoices: [], collections: [] };
  var LOGO = window.__ANKIT_LOGO__ || "";
  var LS_KEY = "ankitTradersBilling.v1";
  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Credit"];
  var DISCOUNTS = Array.from({ length: 31 }, function (_, i) { return 30 + i; });
  var QUANTITIES = Array.from({ length: 300 }, function (_, i) { return i + 1; });
  var QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

  /* ------------------------------- helpers ------------------------------- */
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(v) { var n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
  function r2(n) { return Math.round((num(n) + Number.EPSILON) * 100) / 100; }
  var inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(v) { return "₹" + inr.format(r2(v)); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function todayISO(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function monthKeyOf(d) { return todayISO(d || new Date()).slice(0, 7); }
  function addMonths(m, delta) {
    var p = m.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1 + delta, 1);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }
  function monthLabel(m) {
    var p = String(m || "").split("-").map(Number);
    if (!p[0] || !p[1]) return String(m || "");
    return MONTH_NAMES[p[1] - 1] + " " + p[0];
  }
  function shortMonthLabel(m) {
    var p = String(m || "").split("-").map(Number);
    if (!p[0] || !p[1]) return String(m || "");
    return MONTH_NAMES[p[1] - 1].slice(0, 3) + " " + p[0];
  }
  function formatDay(iso) {
    if (!iso) return "";
    var p = String(iso).slice(0, 10).split("-").map(Number);
    if (!p[0] || !p[1] || !p[2]) return String(iso);
    return pad(p[2]) + " " + MONTH_NAMES[p[1] - 1].slice(0, 3) + " " + p[0];
  }
  function daysInMonth(m) {
    var p = String(m || "").split("-").map(Number);
    return new Date(p[0], p[1], 0).getDate() || 31;
  }
  function uid() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function nextId(list) { return list.reduce(function (max, r) { return Math.max(max, Number(r.id) || 0); }, 0) + 1; }
  function sum(list, get) { return r2(list.reduce(function (t, r) { return t + num(get(r)); }, 0)); }

  /* ------------------------------ persistence ---------------------------- */
  var memoryStore = null;
  function readStore() {
    try { return window.localStorage.getItem(LS_KEY); } catch (e) { return memoryStore; }
  }
  function writeStore(value) {
    try { window.localStorage.setItem(LS_KEY, value); } catch (e) { memoryStore = value; }
  }
  function normalize(raw) {
    var data = raw && typeof raw === "object" ? raw : {};
    return {
      doctors: Array.isArray(data.doctors) ? data.doctors : [],
      medicines: Array.isArray(data.medicines) ? data.medicines : [],
      invoices: (Array.isArray(data.invoices) ? data.invoices : []).map(function (i) {
        return Object.assign({}, i, { items: Array.isArray(i.items) ? i.items : [] });
      }),
      collections: Array.isArray(data.collections) ? data.collections : [],
      daySaves: data.daySaves && typeof data.daySaves === "object" ? data.daySaves : {}
    };
  }
  function seedState() {
    return normalize({
      doctors: SEED.doctors || [],
      medicines: SEED.medicines || [],
      invoices: SEED.invoices || [],
      collections: SEED.collections || [],
      daySaves: {}
    });
  }
  var state = (function () {
    var raw = readStore();
    if (raw) {
      try { return normalize(JSON.parse(raw)); } catch (e) { /* fall through */ }
    }
    return seedState();
  })();
  function save() { writeStore(JSON.stringify(state)); }

  /* ----------------------------- derived data ---------------------------- */
  function minMonth() {
    var list = [];
    state.collections.forEach(function (e) { if (e.collectionDate) list.push(String(e.collectionDate).slice(0, 7)); });
    state.invoices.forEach(function (i) { if (i.createdAt) list.push(String(i.createdAt).slice(0, 7)); });
    state.doctors.forEach(function (d) { if (d.createdAt) list.push(String(d.createdAt).slice(0, 7)); });
    list.push(monthKeyOf(new Date()));
    return list.sort()[0];
  }
  function monthWindow() {
    var out = [];
    var m = minMonth();
    for (var i = 0; i < 48; i += 1) { out.push(m); m = addMonths(m, 1); }
    var current = monthKeyOf(new Date());
    while (out[out.length - 1] < current && out.length < 120) out.push(addMonths(out[out.length - 1], 1));
    return out;
  }
  function doctorById(id) {
    return state.doctors.find(function (d) { return String(d.id) === String(id); }) || null;
  }
  function invoiceNoFor(date) {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    var suffix = "";
    for (var i = 0; i < 5; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    return "AT-" + todayISO(date).replace(/-/g, "") + "-" + suffix;
  }
  function monthCollectionTotal(month) {
    return sum(state.collections.filter(function (e) { return String(e.collectionDate).slice(0, 7) === month; }), function (e) { return e.amount; });
  }
  function monthInvoiceTotal(month) {
    var rows = state.invoices.filter(function (i) { return String(i.createdAt).slice(0, 7) === month; });
    return { total: sum(rows, function (i) { return i.grandTotal; }), count: rows.length };
  }

  /* ------------------------------- ui state ------------------------------ */
  var ui = {
    tab: "invoice",
    draft: { doctorId: "", discount: 30, backDues: "0", lines: [newLine(30)] },
    savedInvoiceId: null,
    modalInvoiceId: null,
    coll: {
      month: monthKeyOf(new Date()),
      date: todayISO(),
      eMonth: monthKeyOf(new Date()),
      eDay: pad(new Date().getDate()),
      eDoctor: "",
      amount: "",
      mode: "Cash",
      notes: "",
      statement: "daily",
      registerScope: "all",
      detailScope: "date",
      archiveOrder: "desc",
      archiveYear: "all",
      activeOnly: false
    },
    report: { month: monthKeyOf(new Date()), date: todayISO() },
    masterDoctor: { id: null, name: "", phone: "", address: "" },
    masterMedicine: { id: null, name: "", mrp: "" }
  };

  function newLine(discount) {
    return { uid: uid(), medicineId: "", qty: 1, disc: discount || 30 };
  }

  /* ------------------------------- toasts -------------------------------- */
  var toastTimer = null;
  function toast(message, tone) {
    var root = document.getElementById("toast-root");
    if (!root) return;
    root.innerHTML = '<div class="toast' + (tone === "error" ? " toast-error" : "") + '" role="status">' + esc(message) + "</div>";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ""; }, 4200);
  }

  /* ------------------------------ paper HTML ----------------------------- */
  function brandRow(docType, top, bottom) {
    return '<div class="paper-accent"></div><div class="paper-gold-line"></div>' +
      '<div class="paper-inner">' +
      '<div class="paper-brand-row">' +
      '<img alt="Ankit Traders logo" class="paper-logo" src="' + LOGO + '" />' +
      '<div class="paper-brand-text"><h2 class="paper-company-title">ANKIT TRADERS</h2>' +
      '<p class="paper-company-sub">HERBAL PRODUCTS</p>' +
      '<p class="paper-company-address">Barkagoan Mansingh Patti</p>' +
      '<p class="paper-company-phone">Phone: 8002408341, 7488400482</p></div>' +
      '<div class="paper-doc-meta"><div class="paper-doc-type">' + esc(docType) + "</div>" +
      '<div class="paper-doc-number">' + esc(top) + "<br>" + esc(bottom) + "</div></div></div>";
  }
  function paperFooter() {
    return '<div class="paper-footer premium-footer"><span>Thank you! Visit again.</span>' +
      "<span>Ankit Traders · Barkagoan Mansingh Patti</span></div></div></article>";
  }
  function paperLines(lines, emptyText) {
    if (!lines.length) return '<div class="paper-lines"><div class="paper-empty">' + esc(emptyText) + "</div></div>";
    return '<div class="paper-lines">' + lines.map(function (l) {
      return '<div class="paper-line premium-line"><span class="paper-line-main">' +
        '<span class="paper-medicine-title">' + esc(l.title) + "</span>" +
        (l.sub ? "<small>" + esc(l.sub) + "</small>" : "") +
        '</span><span class="paper-rupee-amount">' + money(l.amount) + "</span></div>";
    }).join("") + "</div>";
  }
  function invoicePaper(memo, a5) {
    return '<article class="invoice-paper premium-paper' + (a5 ? " a5-paper" : "") + '" aria-label="Cash Memo">' +
      brandRow("CASH / CREDIT MEMO", memo.invoiceNo || "Draft Bill", memo.dateLabel) +
      '<div class="paper-doctor-card"><p class="paper-billed-to">BILLED TO</p>' +
      '<p class="paper-doctor-name">' + esc(memo.doctorName || "Select a Doctor") + "</p>" +
      (memo.doctorAddress || memo.doctorPhone
        ? '<div class="paper-contact">' + esc(memo.doctorAddress || "") +
          (memo.doctorAddress && memo.doctorPhone ? "<br>" : "") +
          (memo.doctorPhone ? "Phone: " + esc(memo.doctorPhone) : "") + "</div>"
        : "") + "</div>" +
      '<div class="paper-table-head"><span>QTY &amp; MEDICINE</span><span>AMOUNT</span></div>' +
      paperLines(memo.lines, memo.emptyText || "Select medicines and quantities (1–300) to add them to this Cash Memo") +
      '<div class="paper-rule"></div>' +
      '<div class="paper-total-row"><span>Items Subtotal:</span><span class="paper-rupee-amount">' + money(memo.itemsTotal) + "</span></div>" +
      '<div class="paper-total-row"><span>Previous Back Dues:</span><span class="paper-rupee-amount">' + money(memo.backDues) + "</span></div>" +
      '<div class="paper-rule paper-rule-dashed"></div>' +
      '<div class="paper-total-row paper-grand-row"><span>Grand Total:</span><span class="paper-rupee-amount paper-rupee-grand">' + money(memo.grandTotal) + "</span></div>" +
      paperFooter();
  }
  function statementPaper(memo, a5) {
    return '<article class="invoice-paper premium-paper' + (a5 ? " a5-paper" : "") + '" aria-label="Market collection statement">' +
      brandRow(memo.docType, memo.numberTop, memo.numberBottom) +
      '<div class="paper-doctor-card collection-summary-strip"><div>' +
      '<p class="paper-billed-to">' + esc(memo.dateHeading) + "</p>" +
      '<p class="paper-doctor-name">' + esc(memo.dateLabel) + "</p>" +
      '<div class="paper-contact">' + esc(memo.metaLabel) + "</div></div>" +
      '<div class="collection-paper-total-badge"><span>FULL COLLECTION TOTAL</span><strong>' + money(memo.total) + "</strong></div></div>" +
      '<div class="paper-table-head collection-table-head"><span>DATE · DOCTOR NAME</span><span>COLLECTION</span></div>' +
      paperLines(memo.lines, memo.emptyText) +
      '<div class="paper-rule paper-rule-dashed"></div>' +
      '<div class="paper-total-row paper-grand-row"><span>' + esc(memo.totalLabel) + '</span><span class="paper-rupee-amount paper-rupee-grand">' + money(memo.total) + "</span></div>" +
      paperFooter();
  }

  /* ------------------------------- memos -------------------------------- */
  function lineCalc(line) {
    var medicine = state.medicines.find(function (m) { return String(m.id) === String(line.medicineId); }) || null;
    var mrp = num(medicine && medicine.mrp);
    var unit = r2(mrp * (1 - num(line.disc) / 100));
    return { medicine: medicine, mrp: mrp, unit: unit, total: r2(unit * num(line.qty)) };
  }
  function draftMemo() {
    var doctor = doctorById(ui.draft.doctorId);
    var itemsTotal = sum(ui.draft.lines, function (l) { return lineCalc(l).total; });
    var saved = state.invoices.find(function (i) { return i.id === ui.savedInvoiceId; });
    return {
      invoiceNo: saved ? saved.invoiceNo : null,
      dateLabel: formatDay(saved ? String(saved.createdAt).slice(0, 10) : todayISO()),
      doctorName: doctor ? doctor.name : "",
      doctorAddress: doctor ? doctor.address : "",
      doctorPhone: doctor ? doctor.phone : "",
      lines: ui.draft.lines.filter(function (l) { return l.medicineId; }).map(function (l) {
        var c = lineCalc(l);
        return {
          title: l.qty + " pcs · " + (c.medicine ? c.medicine.name : ""),
          sub: "MRP " + money(c.mrp) + " · " + l.disc + "% less · " + money(c.unit) + "/pc",
          amount: c.total
        };
      }),
      itemsTotal: itemsTotal,
      backDues: r2(num(ui.draft.backDues)),
      grandTotal: r2(itemsTotal + num(ui.draft.backDues))
    };
  }
  function savedInvoiceMemo(invoice) {
    return {
      invoiceNo: invoice.invoiceNo,
      dateLabel: formatDay(String(invoice.createdAt).slice(0, 10)),
      doctorName: invoice.doctorName,
      doctorAddress: invoice.doctorAddress,
      doctorPhone: invoice.doctorPhone,
      lines: invoice.items.map(function (it) {
        return {
          title: it.quantity + " pcs · " + it.medicineName,
          sub: "MRP " + money(it.mrp) + " · " + num(it.discountPercent) + "% less · " + money(it.unitRate) + "/pc",
          amount: num(it.lineTotal)
        };
      }),
      itemsTotal: num(invoice.itemsTotal),
      backDues: num(invoice.backDues),
      grandTotal: num(invoice.grandTotal)
    };
  }
  function collectionDayInfo(date) {
    var rows = state.collections.filter(function (e) { return e.collectionDate === date; });
    var saved = state.daySaves[date];
    return {
      rows: rows,
      total: sum(rows, function (e) { return e.amount; }),
      doctorCount: new Set(rows.map(function (e) { return e.doctorId || e.doctorName; })).size,
      isSaved: Boolean(saved),
      notes: saved ? saved.notes : ""
    };
  }
  function statementMemo() {
    var daily = ui.coll.statement === "daily";
    var info = collectionDayInfo(ui.coll.date);
    var rows = daily ? info.rows : state.collections.filter(function (e) { return String(e.collectionDate).slice(0, 7) === ui.coll.month; });
    var total = daily ? info.total : monthCollectionTotal(ui.coll.month);
    var doctors = new Set(rows.map(function (e) { return e.doctorId || e.doctorName; })).size;
    return {
      docType: daily ? "DAILY COLLECTION" : "MONTHLY COLLECTION",
      numberTop: daily ? formatDay(ui.coll.date) : monthLabel(ui.coll.month),
      numberBottom: rows.length + " Entries",
      dateHeading: daily ? "COLLECTION DATE" : "COLLECTION MONTH",
      dateLabel: daily ? formatDay(ui.coll.date) : monthLabel(ui.coll.month),
      metaLabel: doctors + " Doctors · " + rows.length + " Payments",
      total: total,
      lines: rows.map(function (e) {
        return {
          title: formatDay(e.collectionDate) + " · " + e.doctorName,
          sub: e.paymentMode + (e.notes ? " · " + e.notes : ""),
          amount: num(e.amount)
        };
      }),
      totalLabel: daily ? "Total (" + formatDay(ui.coll.date) + "):" : "Total (" + monthLabel(ui.coll.month) + "):",
      emptyText: daily
        ? "No market collections recorded for " + formatDay(ui.coll.date)
        : "No market collections recorded in " + monthLabel(ui.coll.month)
    };
  }

  /* ---------------------------- active sheet ----------------------------- */
  function activeSheet() {
    if (ui.modalInvoiceId) {
      var invoice = state.invoices.find(function (i) { return i.id === ui.modalInvoiceId; });
      if (invoice) {
        return {
          html: invoicePaper(savedInvoiceMemo(invoice), true),
          title: "Ankit Traders · " + invoice.invoiceNo,
          file: "Ankit-Traders-" + invoice.invoiceNo + "-A5"
        };
      }
    }
    if (ui.tab === "collection") {
      return {
        html: statementPaper(statementMemo(), true),
        title: "Ankit Traders · " + (ui.coll.statement === "daily" ? formatDay(ui.coll.date) : monthLabel(ui.coll.month)) + " Collection",
        file: "Ankit-Traders-Collection-" + (ui.coll.statement === "daily" ? ui.coll.date : ui.coll.month) + "-A5"
      };
    }
    var memo = draftMemo();
    var savedNo = memo.invoiceNo || "Draft-Bill";
    return {
      html: invoicePaper(memo, true),
      title: "Ankit Traders · " + savedNo,
      file: "Ankit-Traders-" + savedNo + "-A5"
    };
  }

  /* ------------------------------- export -------------------------------- */
  function waitImages(root) {
    var images = Array.from(root.querySelectorAll("img"));
    return Promise.all(images.map(function (img) {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(function (resolve) {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 2500);
      });
    }));
  }
  function busy(label) {
    var root = document.getElementById("busy-root");
    if (!root) return;
    root.innerHTML = label
      ? '<div class="export-busy" role="status"><div class="export-busy-card"><span class="spinner"></span>' + esc(label) + "</div></div>"
      : "";
  }
  function buildCanvas(html) {
    if (typeof window.html2canvas !== "function") {
      return Promise.reject(new Error("Export library not loaded — please check your internet connection"));
    }
    var stage = document.createElement("div");
    stage.className = "export-stage";
    stage.innerHTML = html;
    document.body.appendChild(stage);
    var paper = stage.querySelector(".invoice-paper");
    if (!paper) { stage.remove(); return Promise.reject(new Error("Sheet is not ready yet")); }
    paper.classList.add("a5-paper");
    paper.style.width = "148mm";
    paper.style.minHeight = "210mm";
    paper.style.margin = "0";
    paper.style.borderRadius = "0";
    paper.style.boxShadow = "none";
    return waitImages(paper)
      .then(function () {
        if (document.fonts && document.fonts.ready) return document.fonts.ready;
        return null;
      })
      .then(function () { return new Promise(function (resolve) { setTimeout(resolve, 140); }); })
      .then(function () {
        var rect = paper.getBoundingClientRect();
        var width = Math.max(rect.width, 559);
        var height = Math.max(rect.height, 794);
        return window.html2canvas(paper, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          imageSmoothing: true,
          imageSmoothingQuality: "high",
          width: width,
          height: height,
          scrollX: 0,
          scrollY: 0,
          windowWidth: Math.ceil(width) + 4,
          windowHeight: Math.ceil(height) + 4,
          onclone: function (doc, el) {
            el.style.transform = "none";
            el.style.boxShadow = "none";
          }
        });
      })
      .then(function (canvas) { stage.remove(); return flatten(canvas); })
      .catch(function (error) { stage.remove(); throw error; });
  }
  function flatten(canvas) {
    var out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    var ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0);
    return out;
  }
  function downloadHref(href, name) {
    var a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function exportPdf(html, file) {
    var Ctor = window.jspdf && window.jspdf.jsPDF;
    if (!Ctor) return Promise.reject(new Error("PDF library not loaded — please check your internet connection"));
    return buildCanvas(html).then(function (canvas) {
      var pdf = new Ctor({ orientation: "portrait", unit: "mm", format: "a5", compress: true });
      var pageHeightPx = Math.round(canvas.width * (210 / 148));
      var offset = 0;
      var page = 0;
      while (offset < canvas.height && page < 24) {
        var sliceHeight = Math.min(pageHeightPx, canvas.height - offset);
        var pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        var ctx = pageCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        if (page > 0) pdf.addPage("a5", "portrait");
        pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.96), "JPEG", 0, 0, 148, (sliceHeight / canvas.width) * 148, undefined, "FAST");
        offset += sliceHeight;
        page += 1;
      }
      pdf.save(file + ".pdf");
    });
  }
  function exportJpg(html, file) {
    return buildCanvas(html).then(function (canvas) {
      downloadHref(canvas.toDataURL("image/jpeg", 0.96), file + ".jpg");
    });
  }
  function printSheet() {
    var sheet = document.getElementById("print-sheet");
    var info = activeSheet();
    sheet.innerHTML = info.html;
    sheet.removeAttribute("aria-hidden");
    document.title = info.title;
    busy("Opening A5 print dialog…");
    setTimeout(function () {
      busy("");
      window.focus();
      window.print();
      sheet.setAttribute("aria-hidden", "true");
    }, 320);
  }
  function runExport(kind) {
    var info = activeSheet();
    busy(kind === "pdf" ? "Preparing A5 PDF · 300 DPI…" : "Preparing A5 JPG · 300 DPI…");
    var task = kind === "pdf" ? exportPdf(info.html, info.file) : exportJpg(info.html, info.file);
    task.then(function () {
      busy("");
      toast(kind === "pdf" ? "A5 PDF downloaded (300 DPI)" : "A5 JPG downloaded (300 DPI)");
    }).catch(function (error) {
      busy("");
      toast(error && error.message ? error.message : "Export failed", "error");
    });
  }

  /* -------------------------------- views -------------------------------- */
  var TABS = [
    { key: "invoice", label: "Create Invoice", eyebrow: "Welcome, MR · Fast Wholesale Herbal Billing", title: "Create New Invoice", subtitle: "Select a doctor and add herbal medicines — discounts and totals calculate automatically.", icon: "M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z M9 8h6M9 12h6M9 16h3" },
    { key: "collection", label: "Market Collection", eyebrow: "Daily Collection Ledger · 48-Month Archive & Statements", title: "Market Collection", subtitle: "Record daily collections using date and doctor dropdowns, inspect any month up to 48 months, and export A5 PDF or JPG statements.", icon: "M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z M4 8.5h16" },
    { key: "masters", label: "Doctors & Medicines", eyebrow: "Master Catalog · Configure Once, Bill Effortlessly", title: "Doctors & Medicines", subtitle: "Manage each doctor's details and every product's retail price.", icon: "M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H7.3A3.3 3.3 0 0 0 4 18.3V20 M10 7.5a3.5 3.5 0 1 1 0 .01" },
    { key: "history", label: "Invoice History", eyebrow: "Saved Records · Complete Billing Archive", title: "Invoice History", subtitle: "Inspect previously saved invoices and download A5 PDF or JPG copies anytime.", icon: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18 M12 7v5l3.5 2" },
    { key: "reports", label: "Billing Reports", eyebrow: "Billing Analytics · 48-Month Archive", title: "Billing Reports", subtitle: "Month-wise and date-wise billing totals with drill-down to every invoice.", icon: "M3.5 5h17v16h-17z M7.5 3v4M16.5 3v4M3.5 9.5h17" }
  ];
  function icon(paths, size) {
    return '<svg aria-hidden="true" width="' + (size || 17) + '" height="' + (size || 17) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
      paths.split(" M").map(function (d, i) { return '<path d="' + (i ? "M" + d : d) + '"></path>'; }).join("") + "</svg>";
  }
  var ICONS = {
    plus: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 12.2h9L17.5 7"/></svg>',
    download: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M12 3.8v10.4M8.2 10.6 12 14.4l3.8-3.8M4.8 19.4h14.4"/></svg>',
    image: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="m5.5 17 4.2-5 3 3.2 2.1-2 3.7 4.1"/><circle cx="9" cy="9.4" r="1.3"/></svg>',
    printer: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M7 9.2V4h10v5.2M5 9.2h14a2 2 0 0 1 2 2v4.4a2 2 0 0 1-2 2h-2M7 17.6H5a2 2 0 0 1-2-2v-4.4a2 2 0 0 1 2-2M7 14.2h10V20H7z"/></svg>',
    save: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M5 4.8h11L19.2 8v11.2H5z"/><path d="M8.4 4.8v4.4h6.4V4.8M8.4 19.2v-5h7.2v5"/></svg>',
    close: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6"/></svg>',
    pencil: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4.5 19.5h4L20 8l-4-4L4.5 15.5v4Z"/><path d="m14.5 5.5 4 4"/></svg>',
    wallet: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4 8.5h16"/></svg>',
    check: '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="m5 12.6 4.4 4.4L19 7.4"/></svg>'
  };

  function statCard(label, value, sub, onClick) {
    return '<div class="stat-card' + (onClick ? " stat-card-interactive" : "") + '"' +
      (onClick ? ' role="button" tabindex="0" onclick="' + onClick + '"' : "") + ">" +
      '<div class="stat-top"><p class="stat-label">' + esc(label) + '</p><span class="stat-icon">' + icon("M12 3a9 9 0 1 1 0 18") + "</span></div>" +
      '<p class="stat-value">' + value + (sub ? '<span class="stat-sub">' + esc(sub) + "</span>" : "") + "</p></div>";
  }
  function selectWrap(id, html, onchange, cls) {
    return '<div class="doctor-field"><select id="' + id + '" class="input-control ' + (cls || "") + '" ' +
      (onchange ? 'onchange="' + onchange + '"' : "") + ">" + html + "</select>" +
      '<span class="field-trailing"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg></span></div>';
  }
  function options(list, selected, labelFn) {
    return list.map(function (value) {
      return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? " selected" : "") + ">" +
        esc(labelFn ? labelFn(value) : value) + "</option>";
    }).join("");
  }

  function invoiceView() {
    var months = monthWindow();
    var currentMonth = monthKeyOf(new Date());
    var billing = monthInvoiceTotal(currentMonth);
    var doctor = doctorById(ui.draft.doctorId);
    var draft = ui.draft;
    var memo = draftMemo();
    var pieces = draft.lines.reduce(function (t, l) { return t + num(l.qty); }, 0);
    var canExport = Boolean(doctor) && draft.lines.some(function (l) { return l.medicineId; });

    var lineRows = draft.lines.map(function (line, index) {
      var c = lineCalc(line);
      return '<div class="line-row line-row-with-disc">' +
        '<div class="line-med-col"><label class="field-label" for="medicine-' + index + '">Medicine</label>' +
        '<select id="medicine-' + index + '" class="input-control" onchange="App.lineMed(\'' + line.uid + '\',this.value)">' +
        '<option value="">Select a medicine</option>' +
        state.medicines.map(function (m) {
          return '<option value="' + m.id + '"' + (String(m.id) === String(line.medicineId) ? " selected" : "") + ">" + esc(m.name) + "</option>";
        }).join("") + "</select></div>" +
        '<div class="line-qty-col"><label class="field-label" for="qty-' + index + '">Qty (1–300)</label>' +
        '<select id="qty-' + index + '" class="input-control qty-control" onchange="App.lineQty(\'' + line.uid + '\',this.value)">' +
        QUANTITIES.map(function (q) { return '<option value="' + q + '"' + (q === num(line.qty) ? " selected" : "") + ">" + q + "</option>"; }).join("") + "</select></div>" +
        '<div class="line-disc-col"><label class="field-label" for="disc-' + index + '">Less (%)</label>' +
        '<select id="disc-' + index + '" class="input-control qty-control" onchange="App.lineDisc(\'' + line.uid + '\',this.value)">' +
        DISCOUNTS.map(function (d) { return '<option value="' + d + '"' + (d === num(line.disc) ? " selected" : "") + ">" + d + "%</option>"; }).join("") + "</select></div>" +
        '<div class="row-price"><strong>' + money(c.total) + "</strong><span>" +
        (c.medicine ? "MRP " + money(c.mrp) + " · " + line.disc + "% · " + money(c.unit) + "/pc" : "Select medicine") + "</span></div>" +
        '<button class="remove-row" type="button" aria-label="Remove medicine row" onclick="App.removeLine(\'' + line.uid + '\')">' + ICONS.trash + "</button></div>";
    }).join("");

    return '<div class="page-stack">' +
      '<div class="stats-grid stats-grid-4">' +
      statCard("This Month's Billing", money(billing.total), billing.count + " invoices") +
      statCard("Market Collection", money(monthCollectionTotal(currentMonth)), monthLabel(currentMonth) + " →", "App.go('collection')") +
      statCard("Saved Doctors", String(state.doctors.length), "in master list") +
      statCard("Saved Medicines", String(state.medicines.length), "in catalog") +
      "</div>" +
      '<div class="sample-banner fresh-banner"><div class="sample-copy"><span class="sample-icon">' + icon("M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z", 18) + "</span><div>" +
      "<strong>Effortless Dropdown Billing · Select Doctor, Medicine &amp; Quantity Without Typing</strong>" +
      "<p>Choose quantities from <b>1 to 300</b> directly from the dropdown list, or open <b>Market Collection</b> to log daily doctor payments.</p></div></div>" +
      '<div class="fresh-banner-actions">' +
      '<button class="secondary-button" type="button" onclick="App.go(\'collection\')">' + ICONS.wallet + " Market Collection</button>" +
      '<button class="secondary-button" type="button" onclick="App.go(\'masters\')">' + ICONS.plus + " Add Masters</button>" +
      '<button class="secondary-button" type="button" onclick="App.share()">Share App Link</button></div></div>' +
      '<div class="invoice-layout">' +
      '<section class="panel-card builder-card"><div class="panel-heading"><div><h2>Invoice Details</h2>' +
      "<p>Choose a doctor first, then add medicines and select quantities.</p></div><span class=\"step-chip\">01</span></div>" +
      '<div class="invoice-top-selects"><div><label class="field-label" for="doctor-select">Doctor Name <small>· select from saved list</small></label>' +
      selectWrap("doctor-select", '<option value="">Select a doctor</option>' + state.doctors.map(function (d) {
        return '<option value="' + d.id + '"' + (String(d.id) === String(draft.doctorId) ? " selected" : "") + ">" + esc(d.name) + "</option>";
      }).join(""), "App.doctor(this.value)") + "</div>" +
      '<div><label class="field-label" for="invoice-discount-select">Discount (%) <small>· 30% to 60%</small></label>' +
      selectWrap("invoice-discount-select", options(DISCOUNTS, draft.discount, function (d) { return d + "% Less"; }), "App.discount(this.value)") + "</div></div>" +
      '<div class="doctor-picked"' + (doctor ? "" : ' style="border-style:dashed;background:rgb(251,252,250)"') + ">" +
      '<div class="doctor-picked-main"><p class="doctor-picked-name"' + (doctor ? "" : ' style="color:rgb(104,118,108)"') + ">" +
      esc(doctor ? doctor.name : "Doctor contact details will appear here") + "</p>" +
      '<div class="doctor-picked-detail">' + (doctor
        ? "<span>" + esc(doctor.address || "Address not saved") + "</span><span>· " + esc(doctor.phone || "No phone") + "</span>"
        : "<span>" + state.doctors.length + " doctors saved in Master</span>") + "</div></div>" +
      (doctor ? '<span class="discount-pill">' + draft.discount + "% Less Applied</span>"
        : '<button class="text-button" type="button" onclick="App.go(\'masters\')">+ Add Doctor</button>') + "</div>" +
      '<div class="divider"></div>' +
      '<div class="items-heading"><div><h3>Medicines</h3><p>Select medicine, quantity (1–300), and discount (30%–60%) from dropdowns.</p></div><span class="step-chip">02</span></div>' +
      '<div class="line-list">' + lineRows + "</div>" +
      '<button class="add-line" type="button" onclick="App.addLine()">' + ICONS.plus + " Add Another Medicine</button>" +
      '<div class="discount-note">Select any discount percentage from 30% to 60% directly from the dropdown — net amount calculates automatically.</div>' +
      '<div class="totals-box totals-main"><div class="totals-breakdown">' +
      '<div class="totals-breakdown-row"><span>Items Subtotal · ' + pieces + ' pcs</span><strong>' + money(memo.itemsTotal) + "</strong></div>" +
      '<div class="totals-breakdown-row"><label for="invoice-back-dues">Previous Back Dues (₹)</label>' +
      '<input id="invoice-back-dues" class="input-control back-dues-input" type="number" min="0" step="0.01" value="' + esc(draft.backDues) + '" oninput="App.backDues(this.value)"></div></div>' +
      '<div class="totals-meta"><span>Grand Total</span><strong id="draft-grand">' + money(memo.grandTotal) + "</strong></div></div>" +
      '<button class="primary-button save-invoice" type="button" ' + (doctor && canExport ? "" : "disabled ") + ' onclick="App.saveInvoice()">' +
      ICONS.save + " Save Invoice</button>" +
      '<p class="form-hint">' + (ui.savedInvoiceId
        ? "Invoice saved in Invoice History · A5 PDF, JPG and print ready."
        : "Once saved, the invoice is stored in Invoice History and ready for A5 PDF or JPG download.") + "</p></section>" +
      '<section class="panel-card preview-card"><div class="preview-heading"><h2>Invoice Preview</h2>' +
      '<span class="live-badge"><span class="live-dot"></span> Live Preview · A5</span></div>' +
      '<div class="a5-preview-frame">' + invoicePaper(memo, false) + "</div>" +
      '<div class="export-actions" style="margin-top:14px">' +
      '<button class="download-button" type="button" ' + (canExport ? "" : "disabled ") + ' onclick="App.export(\'pdf\')">' + ICONS.download + " Download PDF (A5)</button>" +
      '<button class="download-button" type="button" ' + (canExport ? "" : "disabled ") + ' onclick="App.export(\'jpg\')">' + ICONS.image + " Download JPG (A5)</button>" +
      '<button class="download-button" type="button" ' + (canExport ? "" : "disabled ") + ' onclick="App.printNow()">' + ICONS.printer + " Print Cash Memo (A5)</button></div>" +
      '<p class="export-help">Print uses <b>A5 paper (148 × 210 mm) with 10 mm margins</b>. PDF/JPG export uses <b>html2canvas scale 3</b> (≈ 300 DPI) so text stays sharp and never faded.</p></section></div>' +
      '<section class="panel-card share-card"><div class="share-copy"><span class="stat-icon">' + icon("M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z") + "</span><div>" +
      "<h2>This Is A Single-File App</h2><p>Save this HTML file and upload it to <b>Vercel, Netlify, GitHub Pages</b> or any static host — it runs forever without a sandbox. All doctors, medicines, invoices and collections are stored in this browser; use <b>Backup JSON</b> to move them.</p></div></div>" +
      '<div class="share-actions"><button class="primary-button" type="button" onclick="App.saveSelfFile()">' + ICONS.download + " Save This App File</button>" +
      '<button class="secondary-button" type="button" onclick="App.share()">Copy / Share App Link</button></div></section></div>';
  }

  function collectionView() {
    var months = monthWindow();
    var c = ui.coll;
    var info = collectionDayInfo(c.date);
    var monthRows = state.collections.filter(function (e) { return String(e.collectionDate).slice(0, 7) === c.month; });
    var monthTotal = sum(monthRows, function (e) { return e.amount; });
    var allTime = sum(state.collections, function (e) { return e.amount; });
    var activeDates = Array.from(new Set(state.collections.map(function (e) { return e.collectionDate; }))).sort();
    var dailySummaries = activeDates.map(function (date) {
      var dayInfo = collectionDayInfo(date);
      var grouped = {};
      dayInfo.rows.forEach(function (row) {
        var key = String(row.doctorId || row.doctorName);
        if (!grouped[key]) grouped[key] = { name: row.doctorName, amount: 0 };
        grouped[key].amount += num(row.amount);
      });
      return { date: date, total: dayInfo.total, doctors: Object.keys(grouped).map(function (k) { return grouped[k]; }), isSaved: dayInfo.isSaved };
    });
    var registerRows = c.registerScope === "all" ? dailySummaries : dailySummaries.filter(function (d) { return d.date.slice(0, 7) === c.month; });
    var detailRows = c.detailScope === "date" ? info.rows : monthRows;
    var monthTotalByMonth = months.map(function (m) {
      var rows = state.collections.filter(function (e) { return String(e.collectionDate).slice(0, 7) === m; });
      return { month: m, entries: rows.length, doctors: new Set(rows.map(function (e) { return e.doctorId || e.doctorName; })).size, total: sum(rows, function (e) { return e.amount; }) };
    });
    var years = Array.from(new Set(months.map(function (m) { return m.slice(0, 4); })));
    var archive = monthTotalByMonth
      .filter(function (r) { return c.archiveYear === "all" || r.month.indexOf(c.archiveYear) === 0; })
      .filter(function (r) { return c.activeOnly ? r.entries > 0 : true; })
      .sort(function (a, b) { return (c.archiveOrder === "desc" ? -1 : 1) * a.month.localeCompare(b.month); });
    var selectedDoctor = doctorById(c.eDoctor);
    var canSaveEntry = Boolean(selectedDoctor) && num(c.amount) > 0;
    var memo = statementMemo();

    return '<div class="page-stack">' +
      '<div class="stats-grid">' +
      statCard(monthLabel(c.month) + " Collection", money(monthTotal), monthRows.length + " payments · " + new Set(monthRows.map(function (e) { return e.doctorId || e.doctorName; })).size + " doctors") +
      statCard("Full Day Total (" + formatDay(c.date) + ")", money(info.total), info.doctorCount + " doctors · " + info.rows.length + " payments") +
      statCard("48-Month Total (" + shortMonthLabel(months[0]) + " – " + shortMonthLabel(months[months.length - 1]) + ")", money(allTime), activeDates.length + " active days") +
      "</div>" +
      '<div class="invoice-layout"><section class="panel-card builder-card">' +
      '<div class="panel-heading"><div><h2>Record Daily Collection</h2><p>Choose any Month (' + shortMonthLabel(months[0]) + " – " + shortMonthLabel(months[months.length - 1]) + '), Date (1–31), and Doctor from the dropdown lists — no manual typing required.</p></div><span class="step-chip">01</span></div>' +
      '<form onsubmit="event.preventDefault();App.saveEntry()">' +
      '<div class="collection-amount-grid"><div><label class="field-label" for="collection-entry-month">Month</label>' +
      selectWrap("collection-entry-month", options(months, c.eMonth, monthLabel), "App.entryMonth(this.value)") + "</div>" +
      '<div><label class="field-label" for="collection-entry-date">Date</label>' +
      selectWrap("collection-entry-date", options(Array.from({ length: daysInMonth(c.eMonth) }, function (_, i) { return pad(i + 1); }), c.eDay), "App.entryDay(this.value)") + "</div></div>" +
      '<div style="margin-top:14px"><label class="field-label" for="collection-entry-doctor">Doctor Name <small>· select from saved doctors</small></label>' +
      selectWrap("collection-entry-doctor", '<option value="">Select a doctor</option>' + state.doctors.map(function (d) {
        return '<option value="' + d.id + '"' + (String(d.id) === String(c.eDoctor) ? " selected" : "") + ">" + esc(d.name) + "</option>";
      }).join(""), "App.entryDoctor(this.value)") + "</div>" +
      '<div class="doctor-picked"' + (selectedDoctor ? "" : ' style="border-style:dashed;background:rgb(251,252,250)"') + ">" +
      '<div class="doctor-picked-main"><p class="doctor-picked-name"' + (selectedDoctor ? "" : ' style="color:rgb(104,118,108)"') + ">" +
      esc(selectedDoctor ? selectedDoctor.name : "Choose a doctor from the dropdown above") + "</p>" +
      '<div class="doctor-picked-detail">' + (selectedDoctor
        ? "<span>" + esc(selectedDoctor.address || "Address not saved") + "</span><span>· " + esc(selectedDoctor.phone || "No phone") + "</span>"
        : "<span>" + state.doctors.length + " doctors available in Master list</span>") + "</div></div>" +
      '<button class="text-button" type="button" onclick="App.go(\'masters\')">+ Add Doctor</button></div>' +
      '<div class="divider"></div>' +
      '<div class="collection-amount-grid"><div><label class="field-label" for="collection-entry-amount">Collection Amount (₹)</label>' +
      '<input id="collection-entry-amount" class="input-control" type="number" min="1" step="0.01" placeholder="Enter amount (e.g. 5000)" value="' + esc(c.amount) + '" oninput="App.entryAmount(this.value)"></div>' +
      '<div><label class="field-label" for="collection-entry-mode">Payment Mode</label>' +
      selectWrap("collection-entry-mode", options(PAYMENT_MODES, c.mode), "App.entryMode(this.value)") + "</div></div>" +
      '<div class="quick-amount-row">' + QUICK_AMOUNTS.map(function (a) {
        return '<button type="button" class="quick-amount-chip" onclick="App.quickAmount(' + a + ')">+' + money(a).replace(".00", "") + "</button>";
      }).join("") + '<button type="button" class="quick-amount-chip clear" onclick="App.clearAmount()">Clear</button></div>' +
      '<div style="margin-top:13px"><label class="field-label" for="collection-entry-notes">Remarks / Reference <small>· optional</small></label>' +
      '<input id="collection-entry-notes" class="input-control" maxlength="240" placeholder="Optional note (e.g. Against pending invoice)" value="' + esc(c.notes) + '" oninput="App.entryNotes(this.value)"></div>' +
      '<button id="save-entry-btn" class="primary-button save-invoice" type="submit" ' + (canSaveEntry ? "" : "disabled ") + ">" + ICONS.save + " Save Doctor Collection</button></form>" +
      '<div class="day-summary-box"><div class="day-summary-top"><div><span class="day-summary-eyebrow">FULL DAY COLLECTION SUMMARY · ' + formatDay(c.date).toUpperCase() + "</span>" +
      '<div class="day-summary-amount-row"><strong>' + money(info.total) + '</strong><span class="day-summary-meta">from ' + info.doctorCount + " doctors (" + info.rows.length + " entries)</span></div>" +
      (info.isSaved ? '<div class="day-summary-meta" style="margin-top:6px">Day saved ✓' + (info.notes ? " · " + esc(info.notes) : "") + "</div>" : "") +
      '</div></div><div class="day-summary-actions">' +
      '<button type="button" class="primary-button" ' + (info.rows.length ? "" : "disabled ") + ' onclick="App.saveDay()">' + ICONS.check + " " + (info.isSaved ? "Day Saved ✓" : "Save Full Day Collection") + "</button>" +
      '<button type="button" class="download-button" onclick="App.printNow()">' + ICONS.printer + " Print (A5)</button></div></div></section>" +
      '<section class="panel-card preview-card"><div class="preview-heading"><div><h2>Collection Statement Preview</h2></div>' +
      '<div class="statement-mode-pills">' +
      '<button type="button" class="mode-pill ' + (c.statement === "daily" ? "active" : "") + '" onclick="App.statement(\'daily\')">Daily (' + formatDay(c.date) + ")</button>" +
      '<button type="button" class="mode-pill ' + (c.statement === "monthly" ? "active" : "") + '" onclick="App.statement(\'monthly\')">Monthly (' + monthLabel(c.month) + ")</button></div></div>" +
      '<div class="a5-preview-frame">' + statementPaper(memo, false) + "</div>" +
      '<div class="export-actions-grid"><div class="export-group"><span class="export-group-label">Full Day Sheet (' + formatDay(c.date) + ')</span>' +
      '<div class="export-actions"><button class="download-button" type="button" onclick="App.exportDaily(\'pdf\')">' + ICONS.download + " Daily PDF</button>" +
      '<button class="download-button" type="button" onclick="App.exportDaily(\'jpg\')">' + ICONS.image + " Daily JPG</button></div></div>" +
      '<div class="export-group"><span class="export-group-label">Full Month Sheet (' + monthLabel(c.month) + ')</span>' +
      '<div class="export-actions"><button class="download-button" type="button" onclick="App.exportMonthly(\'pdf\')">' + ICONS.download + " Monthly PDF</button>" +
      '<button class="download-button" type="button" onclick="App.exportMonthly(\'jpg\')">' + ICONS.image + " Monthly JPG</button></div></div></div>" +
      '<p class="export-help">Downloads are exact <b>A5 (148 × 210 mm)</b>, rendered with <b>html2canvas scale 3</b> (≈300 DPI) — sharp, high-contrast text. Print uses A5 with 10 mm margins.</p></section></div>' +
      '<section class="panel-card report-filter-card"><div class="report-filter-copy"><span class="stat-icon">' + icon("M12 3a9 9 0 1 1 0 18") + '</span><div><h2>Inspect Collection by Month &amp; Date (' + shortMonthLabel(months[0]) + " – " + shortMonthLabel(months[months.length - 1]) + ')</h2>' +
      "<p>Select any month from the 48-month archive to view its total, then choose any date to see which doctor paid how much.</p></div></div>" +
      '<div class="collection-filter-controls">' +
      '<div><label class="field-label" for="collection-report-month">Select Month (48 Months)</label>' +
      selectWrap("collection-report-month", options(months, c.month, monthLabel), "App.filterMonth(this.value)") + "</div>" +
      '<div><label class="field-label" for="collection-report-date-select">Select Date in ' + monthLabel(c.month) + "</label>" +
      selectWrap("collection-report-date-select", options(Array.from({ length: daysInMonth(c.month) }, function (_, i) { return c.month + "-" + pad(i + 1); }), c.date, formatDay), "App.filterDate(this.value)") + "</div>" +
      '<div><label class="field-label" for="collection-report-date-picker">Or Jump to Any Date</label>' +
      '<input id="collection-report-date-picker" class="input-control" type="date" min="' + months[0] + '-01" max="' + months[months.length - 1] + "-" + daysInMonth(months[months.length - 1]) + '" value="' + c.date + '" onchange="App.filterDate(this.value)"></div></div></section>' +
      '<section class="panel-card history-card"><div class="history-toolbar"><div><h2>Daily Collection Register (Day-by-Day Totals &amp; Doctors)</h2>' +
      "<p>Inspect any day to see every doctor who paid and download that day's A5 sheet as PDF or JPG.</p></div>" +
      '<div class="statement-mode-pills"><button type="button" class="mode-pill ' + (c.registerScope === "all" ? "active" : "") + '" onclick="App.register(\'all\')">All Recorded Days (' + dailySummaries.length + ")</button>" +
      '<button type="button" class="mode-pill ' + (c.registerScope === "month" ? "active" : "") + '" onclick="App.register(\'month\')">' + monthLabel(c.month) + " (" + dailySummaries.filter(function (d) { return d.date.slice(0, 7) === c.month; }).length + ")</button></div></div>" +
      '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Date</th><th>Doctors &amp; Rupees Paid</th><th>Full Day Total</th><th>Status</th><th>Download / Inspect</th></tr></thead><tbody>' +
      (registerRows.length ? registerRows.map(function (row) {
        return '<tr class="' + (row.date === c.date ? "selected-table-row" : "") + '"><td class="invoice-number-cell">' + formatDay(row.date) + "</td>" +
          '<td class="day-doctors-cell"><div class="day-doctors-chips">' + row.doctors.map(function (d) {
            return '<span class="doctor-amt-pill">' + esc(d.name) + ": " + money(d.amount) + "</span>";
          }).join("") + '</div></td><td class="history-amount">' + money(row.total) + "</td>" +
          '<td><span class="mode-badge">' + (row.isSaved ? "Day Saved ✓" : "Recorded") + "</span></td>" +
          '<td><div class="row-action-buttons"><button class="view-link" type="button" onclick="App.viewDay(\'' + row.date + '\')">View</button>' +
          '<button type="button" class="download-button" onclick="App.daySheet(\'' + row.date + "','pdf')\">PDF</button>" +
          '<button type="button" class="download-button" onclick="App.daySheet(\'' + row.date + "','jpg')\">JPG</button></div></td></tr>";
      }).join("") : '<tr><td colspan="5" class="history-items">No collection recorded yet.</td></tr>') +
      "</tbody></table></div></section>" +
      '<div class="report-detail-grid"><section class="panel-card history-card"><div class="history-toolbar"><div><h2>' + monthLabel(c.month) + ' · Date-wise Summary</h2><p>Month Total: <strong>' + money(monthTotal) + "</strong> · Click any date to inspect who paid</p></div>" +
      '<span class="count-pill">' + dailySummaries.filter(function (d) { return d.date.slice(0, 7) === c.month; }).length + "</span></div>" +
      '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Date</th><th>Doctors</th><th>Full Day Total</th><th>Action</th></tr></thead><tbody>' +
      (dailySummaries.filter(function (d) { return d.date.slice(0, 7) === c.month; }).map(function (d) {
        return '<tr class="' + (d.date === c.date ? "selected-table-row" : "") + '"><td class="invoice-number-cell">' + formatDay(d.date) + "</td><td>" + d.doctors.length + ' doctor</td><td class="history-amount">' + money(d.total) + '</td><td><button class="view-link" type="button" onclick="App.viewDay(\'' + d.date + '\')">View Details →</button></td></tr>';
      }).join("") || '<tr><td colspan="4" class="history-items">No collection in this month.</td></tr>') +
      "</tbody></table></div></section>" +
      '<section class="panel-card history-card"><div class="history-toolbar"><div><h2>' + (c.detailScope === "date" ? formatDay(c.date) + " · Doctor Payments" : monthLabel(c.month) + " · Doctor Payments") + "</h2>" +
      "<p>Full Total: <strong>" + money(c.detailScope === "date" ? info.total : monthTotal) + "</strong> · Date, Doctor Name &amp; Rupees Paid</p></div>" +
      '<div class="statement-mode-pills"><button type="button" class="mode-pill ' + (c.detailScope === "date" ? "active" : "") + '" onclick="App.detail(\'date\')">Selected Date (' + info.rows.length + ")</button>" +
      '<button type="button" class="mode-pill ' + (c.detailScope === "month" ? "active" : "") + '" onclick="App.detail(\'month\')">Full Month (' + monthRows.length + ")</button></div></div>" +
      (detailRows.length ? '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Date</th><th>Doctor</th><th>Mode</th><th>Amount</th><th>Action</th></tr></thead><tbody>' +
        detailRows.map(function (row) {
          return '<tr><td class="invoice-number-cell">' + formatDay(row.collectionDate) + "</td><td>" + esc(row.doctorName) + '</td><td><span class="mode-badge">' + esc(row.paymentMode) + '</span></td><td class="history-amount">' + money(row.amount) + '</td><td><button class="view-link" type="button" onclick="App.deleteEntry(' + row.id + ')">Delete</button></td></tr>';
        }).join("") + "</tbody></table></div>"
        : '<div class="empty-state"><div><strong>No payments recorded</strong><p>Pick another date from the dropdown or record a new payment for this date.</p></div></div>') +
      "</section></div>" +
      '<section class="panel-card history-card"><div class="history-toolbar"><div><h2>48-Month Market Collection Schedule (' + shortMonthLabel(months[0]) + " – " + shortMonthLabel(months[months.length - 1]) + ")</h2>" +
      "<p>Browse monthly collection totals. Click any month to inspect its daily &amp; doctor-wise entries.</p></div>" +
      '<div class="archive-filter-controls"><button type="button" class="quiet-button" onclick="App.archiveOrder()">Order: ' + (c.archiveOrder === "desc" ? "Newest → Oldest" : "Oldest → Newest") + "</button>" +
      '<select aria-label="Filter 48 months by year" class="input-control compact-select" onchange="App.archiveYear(this.value)"><option value="all">All Years</option>' +
      years.map(function (y) { return '<option value="' + y + '"' + (c.archiveYear === y ? " selected" : "") + ">" + y + "</option>"; }).join("") + "</select>" +
      '<button type="button" class="quiet-button ' + (c.activeOnly ? "active" : "") + '" onclick="App.archiveActive()">Active Months Only</button></div></div>' +
      '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Month</th><th>Entries</th><th>Doctors</th><th>Total Collection</th><th>Action</th></tr></thead><tbody>' +
      archive.map(function (row) {
        return '<tr class="' + (row.month === c.month ? "selected-table-row" : "") + '"><td class="invoice-number-cell">' + monthLabel(row.month) + "</td><td>" + row.entries + "</td><td>" + row.doctors + '</td><td class="history-amount">' + money(row.total) + '</td><td><button class="view-link" type="button" onclick="App.filterMonth(\'' + row.month + '\')">' + (row.month === c.month ? "Active Month ✓" : "Inspect Month →") + "</button></td></tr>";
      }).join("") + "</tbody></table></div></section></div>";
  }

  function mastersView() {
    var md = ui.masterDoctor;
    var mm = ui.masterMedicine;
    return '<div class="master-grid"><section class="panel-card master-card"><div class="panel-heading"><div><h2>Doctor Master</h2>' +
      '<p>Save each doctor\'s name, phone number, and clinic address.</p></div><span class="step-chip">' + icon("M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H7.3A3.3 3.3 0 0 0 4 18.3V20") + "</span></div>" +
      '<form class="master-form" onsubmit="event.preventDefault();App.saveDoctor()"><div class="master-form-grid">' +
      '<div><label class="field-label" for="new-doctor-name">Doctor\'s Full Name</label><input id="new-doctor-name" class="input-control" required maxlength="140" placeholder="e.g. Dr. Anita Mehra" value="' + esc(md.name) + '" oninput="App.mdName(this.value)"></div>' +
      '<div><label class="field-label" for="new-doctor-phone">Phone Number</label><input id="new-doctor-phone" class="input-control" maxlength="30" placeholder="+91 98765 43210" value="' + esc(md.phone) + '" oninput="App.mdPhone(this.value)"></div>' +
      '<div class="full-span"><label class="field-label" for="new-doctor-address">Clinic / Delivery Address</label><textarea id="new-doctor-address" class="input-control" maxlength="1000" placeholder="Complete clinic or delivery address" oninput="App.mdAddress(this.value)">' + esc(md.address) + "</textarea></div></div>" +
      '<button class="primary-button" type="submit">' + (md.id ? ICONS.pencil + " Update Doctor" : ICONS.plus + " Save Doctor") + "</button>" +
      (md.id ? '<button class="secondary-button" type="button" onclick="App.resetDoctor()">Cancel Edit</button>' : "") + "</form>" +
      '<div class="master-list-title"><span>Saved Doctors</span><span class="count-pill">' + state.doctors.length + '</span></div><div class="master-list">' +
      state.doctors.map(function (d) {
        return '<div class="master-list-row"><div class="master-list-main"><strong>' + esc(d.name) + "</strong><span>" + esc(d.phone || "No phone") + " · " + esc(d.address || "No address") + "</span></div>" +
          '<div class="master-row-right"><button type="button" class="icon-mini-btn" title="Edit doctor" onclick="App.editDoctor(' + d.id + ')">' + ICONS.pencil + "</button>" +
          '<button type="button" class="icon-mini-btn danger" title="Delete doctor" onclick="App.deleteDoctor(' + d.id + ')">' + ICONS.trash + "</button></div></div>";
      }).join("") + "</div></section>" +
      '<section class="panel-card master-card"><div class="panel-heading"><div><h2>Medicine Master</h2>' +
      "<p>Save each product's MRP once to auto-calculate net rates in invoices.</p></div><span class=\"step-chip\">" + icon("M10.5 3.5H17a4 4 0 0 1 0 8h-6.5a4 4 0 0 1 0-8Z") + "</span></div>" +
      '<form class="master-form" onsubmit="event.preventDefault();App.saveMedicine()"><div class="master-form-grid">' +
      '<div class="full-span"><label class="field-label" for="new-medicine-name">Medicine Name</label><input id="new-medicine-name" class="input-control" required maxlength="160" placeholder="e.g. Ayur Care Tonic" value="' + esc(mm.name) + '" oninput="App.mmName(this.value)"></div>' +
      '<div><label class="field-label" for="new-medicine-mrp">MRP (₹)</label><input id="new-medicine-mrp" class="input-control" type="number" required min="0.01" step="0.01" placeholder="180.00" value="' + esc(mm.mrp) + '" oninput="App.mmMrp(this.value)"></div></div>' +
      '<button class="primary-button" type="submit">' + (mm.id ? ICONS.pencil + " Update Medicine" : ICONS.save + " Save Medicine") + "</button>" +
      (mm.id ? '<button class="secondary-button" type="button" onclick="App.resetMedicine()">Cancel Edit</button>' : "") + "</form>" +
      '<div class="master-list-title"><span>Saved Medicines</span><span class="count-pill">' + state.medicines.length + '</span></div><div class="master-list">' +
      state.medicines.map(function (m) {
        return '<div class="master-list-row"><div class="master-list-main"><strong>' + esc(m.name) + "</strong><span>MRP · Net rate adjusts from selected discount (30%–60%)</span></div>" +
          '<div class="master-row-right"><span class="master-list-value">' + money(m.mrp) + "</span>" +
          '<button type="button" class="icon-mini-btn" title="Edit medicine" onclick="App.editMedicine(' + m.id + ')">' + ICONS.pencil + "</button>" +
          '<button type="button" class="icon-mini-btn danger" title="Delete medicine" onclick="App.deleteMedicine(' + m.id + ')">' + ICONS.trash + "</button></div></div>";
      }).join("") + "</div></section></div>";
  }

  function historyView() {
    var rows = state.invoices.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    return '<section class="panel-card history-card"><div class="history-toolbar"><div><h2>Saved Invoices</h2>' +
      "<p>Recent invoices · Click View / Download to export A5 PDF or JPG</p></div><span class=\"count-pill\">" + rows.length + "</span></div>" +
      (rows.length ? '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Invoice No.</th><th>Date</th><th>Doctor</th><th>Items</th><th>Grand Total</th><th>Action</th></tr></thead><tbody>' +
        rows.map(function (i) {
          return '<tr><td class="invoice-number-cell">' + esc(i.invoiceNo) + "</td><td>" + formatDay(String(i.createdAt).slice(0, 10)) + "</td><td>" + esc(i.doctorName) + "</td>" +
            '<td class="history-items">' + i.items.length + " medicine" + (i.items.length === 1 ? "" : "s") + '</td><td class="history-amount">' + money(i.grandTotal) + "</td>" +
            '<td><button class="view-link" type="button" onclick="App.viewInvoice(' + i.id + ')">' + ICONS.download + " View / Download</button></td></tr>";
        }).join("") + "</tbody></table></div>"
        : '<div class="empty-state"><div><strong>No Invoices Saved Yet</strong><p>Create an invoice — it will appear here with A5 PDF, JPG and print downloads.</p></div></div>') +
      "</section>";
  }

  function reportsView() {
    var months = monthWindow();
    var r = ui.report;
    var monthInvoices = state.invoices.filter(function (i) { return String(i.createdAt).slice(0, 7) === r.month; });
    var dateInvoices = state.invoices.filter(function (i) { return String(i.createdAt).slice(0, 10) === r.date; });
    var activeDates = Array.from(new Set(state.invoices.map(function (i) { return String(i.createdAt).slice(0, 10); }))).sort();
    var daily = activeDates.filter(function (d) { return d.slice(0, 7) === r.month; });
    var monthTotals = months.map(function (m) {
      var rows = state.invoices.filter(function (i) { return String(i.createdAt).slice(0, 7) === m; });
      return { month: m, count: rows.length, total: sum(rows, function (i) { return i.grandTotal; }) };
    }).sort(function (a, b) { return -a.month.localeCompare(b.month); });

    return '<div class="page-stack"><section class="panel-card report-filter-card"><div class="report-filter-copy"><span class="stat-icon">' + icon("M3.5 5h17v16h-17z M7.5 3v4M16.5 3v4M3.5 9.5h17") + "</span><div>" +
      "<h2>Select Billing Period</h2><p>Records up to 48 months. Totals include invoice grand totals.</p></div></div>" +
      '<div class="report-filters"><div><label class="field-label" for="report-month">Month</label>' +
      '<select id="report-month" class="input-control" onchange="App.reportMonth(this.value)">' + options(months, r.month, monthLabel) + "</select></div>" +
      '<div><label class="field-label" for="report-date">Select Specific Date</label>' +
      '<input id="report-date" class="input-control" type="date" min="' + months[0] + '-01" max="' + months[months.length - 1] + "-" + daysInMonth(months[months.length - 1]) + '" value="' + r.date + '" onchange="App.reportDate(this.value)"></div></div></section>' +
      '<div class="stats-grid report-stats-grid">' +
      statCard(monthLabel(r.month) + " Billing", money(sum(monthInvoices, function (i) { return i.grandTotal; })), monthInvoices.length + " bills") +
      statCard(formatDay(r.date) + " Billing", money(sum(dateInvoices, function (i) { return i.grandTotal; })), dateInvoices.length + " bills") +
      statCard("Report Range", String(months.length), "months history") + "</div>" +
      '<section class="panel-card history-card"><div class="history-toolbar"><div><h2>48-Month Billing Summary</h2>' +
      "<p>Archive " + shortMonthLabel(months[0]) + " – " + shortMonthLabel(months[months.length - 1]) + ". Click any month to inspect its day-by-day billing breakdown.</p></div>" +
      '<span class="count-pill">' + months.length + '</span></div><div class="history-table-wrap"><table class="history-table">' +
      "<thead><tr><th>Month</th><th>Invoices</th><th>Total Billing</th><th>Action</th></tr></thead><tbody>" +
      monthTotals.map(function (row) {
        return '<tr class="' + (row.month === r.month ? "selected-table-row" : "") + '"><td class="invoice-number-cell">' + monthLabel(row.month) + "</td><td>" + row.count + '</td><td class="history-amount">' + money(row.total) + '</td><td><button class="view-link" type="button" onclick="App.reportMonth(\'' + row.month + '\')">View Daily →</button></td></tr>';
      }).join("") + "</tbody></table></div></section>" +
      '<div class="report-detail-grid"><section class="panel-card history-card"><div class="history-toolbar"><div><h2>' + monthLabel(r.month) + ' · Daily Billing</h2><p>Grand total billed on each active date.</p></div></div>' +
      (daily.length ? '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Date</th><th>Bills</th><th>Total</th><th></th></tr></thead><tbody>' +
        daily.map(function (date) {
          var rows = state.invoices.filter(function (i) { return String(i.createdAt).slice(0, 10) === date; });
          return '<tr class="' + (date === r.date ? "selected-table-row" : "") + '"><td>' + formatDay(date) + "</td><td>" + rows.length + '</td><td class="history-amount">' + money(sum(rows, function (i) { return i.grandTotal; })) + '</td><td><button class="view-link" type="button" onclick="App.reportDate(\'' + date + '\')">View Bills</button></td></tr>';
        }).join("") + "</tbody></table></div>"
        : '<div class="empty-state"><div><strong>No Billing in This Month</strong><p>Change the month filter to inspect other invoices.</p></div></div>') +
      '</section><section class="panel-card history-card"><div class="history-toolbar"><div><h2>Bills for ' + formatDay(r.date) + "</h2>" +
      "<p>Selected Date Total: <strong>" + money(sum(dateInvoices, function (i) { return i.grandTotal; })) + "</strong></p></div>" +
      '<span class="count-pill">' + dateInvoices.length + "</span></div>" +
      (dateInvoices.length ? '<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Invoice No.</th><th>Doctor</th><th>Items</th><th>Total</th><th>Action</th></tr></thead><tbody>' +
        dateInvoices.map(function (i) {
          return '<tr><td class="invoice-number-cell">' + esc(i.invoiceNo) + "</td><td>" + esc(i.doctorName) + '</td><td class="history-items">' + i.items.length + '</td><td class="history-amount">' + money(i.grandTotal) + '</td><td><button class="view-link" type="button" onclick="App.viewInvoice(' + i.id + ')">View / A5 Export</button></td></tr>';
        }).join("") + "</tbody></table></div>"
        : '<div class="empty-state"><div><strong>No Bills on Selected Date</strong><p>Change the month or date filter to inspect other invoices.</p></div></div>') +
      "</section></div></div>";
  }

  /* ------------------------------- render -------------------------------- */
  function renderNav() {
    document.getElementById("nav").innerHTML = TABS.map(function (t) {
      return '<button type="button" class="nav-button ' + (ui.tab === t.key ? "active" : "") + '" aria-pressed="' + (ui.tab === t.key) + '" onclick="App.go(\'' + t.key + '\')">' +
        '<span class="nav-icon">' + icon(t.icon) + "</span><span>" + esc(t.label) + "</span></button>";
    }).join("");
  }
  function renderShell() {
    var tab = TABS.find(function (t) { return t.key === ui.tab; }) || TABS[0];
    document.getElementById("topbar-eyebrow").textContent = tab.eyebrow;
    document.getElementById("topbar-title").textContent = tab.title;
    document.getElementById("topbar-subtitle").textContent = tab.subtitle;
    var actions = ui.tab === "invoice"
      ? '<button class="secondary-button" type="button" onclick="App.go(\'collection\')">' + ICONS.wallet + " Market Collection</button>" +
        '<button class="secondary-button" type="button" onclick="App.newBill()">' + ICONS.plus + " New Bill</button>"
      : '<button class="secondary-button" type="button" onclick="App.go(\'' + (ui.tab === "collection" ? "reports" : "collection") + '\')">' +
        (ui.tab === "collection" ? "Billing Reports" : ICONS.wallet + " Market Collection") + "</button>" +
        '<button class="primary-button" type="button" onclick="App.go(\'invoice\')">Create Invoice</button>';
    document.getElementById("topbar-actions").innerHTML = actions + '<div class="topbar-avatar" aria-label="Medical Representative">MR</div>';
  }
  function renderModal() {
    var root = document.getElementById("modal-root");
    if (!ui.modalInvoiceId) { root.innerHTML = ""; return; }
    var invoice = state.invoices.find(function (i) { return i.id === ui.modalInvoiceId; });
    if (!invoice) { root.innerHTML = ""; return; }
    root.innerHTML = '<div class="modal-backdrop" role="presentation" onclick="App.closeModal()">' +
      '<section class="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title" onclick="event.stopPropagation()">' +
      '<div class="modal-header"><div><h2 id="invoice-modal-title">Invoice ' + esc(invoice.invoiceNo) + "</h2>" +
      "<p>" + esc(invoice.doctorName) + " · " + formatDay(String(invoice.createdAt).slice(0, 10)) + " · A5 export</p></div>" +
      '<button class="icon-button" type="button" aria-label="Close" onclick="App.closeModal()">' + ICONS.close + "</button></div>" +
      '<div class="modal-body"><div class="a5-preview-frame">' + invoicePaper(savedInvoiceMemo(invoice), false) + "</div>" +
      '<div class="modal-actions"><button class="download-button" type="button" onclick="App.printNow()">' + ICONS.printer + " Print Cash Memo (A5)</button>" +
      '<button class="download-button" type="button" onclick="App.export(\'jpg\')">' + ICONS.image + " Download JPG (A5)</button>" +
      '<button class="primary-button" type="button" onclick="App.export(\'pdf\')">' + ICONS.download + " Download PDF (A5)</button></div>" +
      '<p class="export-help" style="text-align:center">A5 sheet · 148 × 210 mm · html2canvas scale 3 (≈300 DPI)</p></div></section></div>';
  }
  function renderPrintSheet() {
    var info = activeSheet();
    document.getElementById("print-sheet").innerHTML = info.html;
  }
  function render() {
    renderNav();
    renderShell();
    var main = document.getElementById("main");
    if (ui.tab === "invoice") main.innerHTML = invoiceView();
    else if (ui.tab === "collection") main.innerHTML = collectionView();
    else if (ui.tab === "masters") main.innerHTML = mastersView();
    else if (ui.tab === "history") main.innerHTML = historyView();
    else main.innerHTML = reportsView();
    renderPrintSheet();
    renderModal();
  }
  function patchInvoiceTotals() {
    var preview = document.querySelector(".preview-card .a5-preview-frame");
    if (preview) preview.innerHTML = invoicePaper(draftMemo(), false);
    var grand = document.getElementById("draft-grand");
    if (grand) grand.textContent = money(draftMemo().grandTotal);
    renderPrintSheet();
  }

  /* ------------------------------- actions ------------------------------- */
  var App = {
    go: function (tab) { ui.tab = tab; render(); window.scrollTo({ top: 0, behavior: "smooth" }); },
    doctor: function (value) {
      var doctor = doctorById(value);
      var discount = doctor ? Math.round(num(doctor.discountPercent)) : 0;
      ui.draft.doctorId = value;
      ui.draft.discount = discount >= 30 && discount <= 60 ? discount : 30;
      ui.draft.lines.forEach(function (l) { l.disc = ui.draft.discount; });
      ui.savedInvoiceId = null;
      render();
    },
    discount: function (value) {
      ui.draft.discount = num(value);
      ui.draft.lines.forEach(function (l) { l.disc = ui.draft.discount; });
      ui.savedInvoiceId = null;
      render();
    },
    backDues: function (value) { ui.draft.backDues = value; ui.savedInvoiceId = null; patchInvoiceTotals(); },
    lineMed: function (uid, value) { var l = ui.draft.lines.find(function (x) { return x.uid === uid; }); if (l) l.medicineId = value; ui.savedInvoiceId = null; render(); },
    lineQty: function (uid, value) { var l = ui.draft.lines.find(function (x) { return x.uid === uid; }); if (l) l.qty = num(value); ui.savedInvoiceId = null; render(); },
    lineDisc: function (uid, value) { var l = ui.draft.lines.find(function (x) { return x.uid === uid; }); if (l) l.disc = num(value); ui.savedInvoiceId = null; render(); },
    addLine: function () { ui.draft.lines.push(newLine(ui.draft.discount)); render(); },
    removeLine: function (uid) {
      ui.draft.lines = ui.draft.lines.length === 1 ? [newLine(ui.draft.discount)] : ui.draft.lines.filter(function (l) { return l.uid !== uid; });
      ui.savedInvoiceId = null;
      render();
    },
    newBill: function () { ui.savedInvoiceId = null; ui.draft = { doctorId: "", discount: 30, backDues: "0", lines: [newLine(30)] }; ui.tab = "invoice"; render(); toast("New bill started"); },
    saveInvoice: function () {
      var doctor = doctorById(ui.draft.doctorId);
      var usable = ui.draft.lines.filter(function (l) { return l.medicineId && num(l.qty) > 0; });
      if (!doctor) { toast("Please select a doctor first", "error"); return; }
      if (!usable.length) { toast("Select medicine and quantity for each row", "error"); return; }
      var itemsTotal = sum(usable, function (l) { return lineCalc(l).total; });
      var backDues = r2(ui.draft.backDues);
      var now = new Date();
      var invoice = {
        id: nextId(state.invoices),
        invoiceNo: invoiceNoFor(now),
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorAddress: doctor.address || "",
        doctorPhone: doctor.phone || "",
        discountPercent: ui.draft.discount.toFixed(2),
        itemsTotal: itemsTotal.toFixed(2),
        backDues: backDues.toFixed(2),
        grandTotal: r2(itemsTotal + backDues).toFixed(2),
        createdAt: now.toISOString(),
        items: usable.map(function (l) {
          var c = lineCalc(l);
          return {
            id: nextId([]) + Math.floor(Math.random() * 1000),
            invoiceId: invoice.id,
            medicineId: l.medicineId ? Number(l.medicineId) : null,
            medicineName: c.medicine ? c.medicine.name : "",
            mrp: c.mrp.toFixed(2),
            discountPercent: num(l.disc).toFixed(2),
            unitRate: c.unit.toFixed(2),
            quantity: num(l.qty),
            lineTotal: c.total.toFixed(2)
          };
        })
      };
      state.invoices.push(invoice);
      ui.savedInvoiceId = invoice.id;
      save();
      render();
      toast("Invoice " + invoice.invoiceNo + " saved · A5 PDF/JPG/print ready");
    },
    statement: function (mode) { ui.coll.statement = mode; render(); },
    register: function (scope) { ui.coll.registerScope = scope; render(); },
    detail: function (scope) { ui.coll.detailScope = scope; render(); },
    entryMonth: function (value) {
      ui.coll.eMonth = value;
      var max = daysInMonth(value);
      if (num(ui.coll.eDay) > max) ui.coll.eDay = pad(max);
      render();
    },
    entryDay: function (value) { ui.coll.eDay = value; render(); },
    entryDoctor: function (value) { ui.coll.eDoctor = value; render(); },
    entryMode: function (value) { ui.coll.mode = value; render(); },
    entryAmount: function (value) {
      ui.coll.amount = value;
      var btn = document.getElementById("save-entry-btn");
      if (btn) btn.disabled = !(doctorById(ui.coll.eDoctor) && num(value) > 0);
    },
    clearAmount: function () { ui.coll.amount = ""; render(); },
    entryNotes: function (value) { ui.coll.notes = value; },
    quickAmount: function (amount) { ui.coll.amount = String(r2(num(ui.coll.amount) + amount)); render(); },
    saveEntry: function () {
      var doctor = doctorById(ui.coll.eDoctor);
      if (!doctor) { toast("Please select a doctor", "error"); return; }
      if (num(ui.coll.amount) <= 0) { toast("Enter a collection amount", "error"); return; }
      var date = ui.coll.eMonth + "-" + pad(ui.coll.eDay);
      state.collections.push({
        id: nextId(state.collections),
        collectionDate: date,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorPhone: doctor.phone || "",
        doctorAddress: doctor.address || "",
        amount: r2(ui.coll.amount).toFixed(2),
        paymentMode: ui.coll.mode,
        notes: ui.coll.notes || "",
        createdAt: new Date().toISOString()
      });
      ui.coll.month = ui.coll.eMonth;
      ui.coll.date = date;
      ui.coll.amount = "";
      ui.coll.notes = "";
      save();
      render();
      toast("Collection saved for " + formatDay(date));
    },
    saveDay: function () {
      var date = ui.coll.date;
      if (!state.collections.some(function (e) { return e.collectionDate === date; })) {
        toast("No collection entries for this date", "error");
        return;
      }
      state.daySaves[date] = { notes: "", savedAt: new Date().toISOString() };
      save();
      render();
      toast("Full day collection saved for " + formatDay(date));
    },
    deleteEntry: function (id) {
      if (!window.confirm("Delete this collection entry?")) return;
      state.collections = state.collections.filter(function (e) { return e.id !== id; });
      save();
      render();
      toast("Collection entry deleted");
    },
    viewDay: function (date) {
      ui.coll.month = date.slice(0, 7);
      ui.coll.date = date;
      ui.coll.statement = "daily";
      ui.coll.detailScope = "date";
      ui.coll.eMonth = date.slice(0, 7);
      ui.coll.eDay = date.slice(8, 10);
      render();
    },
    filterMonth: function (month) {
      ui.coll.month = month;
      var max = daysInMonth(month);
      if (num(ui.coll.date.slice(8, 10)) > max) ui.coll.date = month + "-" + pad(max);
      else ui.coll.date = month + "-" + ui.coll.date.slice(8, 10);
      render();
    },
    filterDate: function (date) {
      if (!date) return;
      ui.coll.date = date;
      ui.coll.month = date.slice(0, 7);
      render();
    },
    archiveOrder: function () { ui.coll.archiveOrder = ui.coll.archiveOrder === "desc" ? "asc" : "desc"; render(); },
    archiveYear: function (value) { ui.coll.archiveYear = value; render(); },
    archiveActive: function () { ui.coll.activeOnly = !ui.coll.activeOnly; render(); },
    reportMonth: function (month) { ui.report.month = month; ui.report.date = month + "-" + pad(Math.min(num(ui.report.date.slice(8, 10)) || 1, daysInMonth(month))); render(); },
    reportDate: function (date) { if (!date) return; ui.report.date = date; ui.report.month = date.slice(0, 7); render(); },
    viewInvoice: function (id) { ui.modalInvoiceId = id; renderModal(); },
    closeModal: function () { ui.modalInvoiceId = null; renderModal(); renderPrintSheet(); },
    printNow: function () { printSheet(); },
    export: function (kind) { runExport(kind); },
    exportDaily: function (kind) { ui.coll.statement = "daily"; render(); setTimeout(function () { runExport(kind); }, 200); },
    exportMonthly: function (kind) { ui.coll.statement = "monthly"; render(); setTimeout(function () { runExport(kind); }, 200); },
    daySheet: function (date, kind) { ui.coll.statement = "daily"; ui.coll.date = date; ui.coll.month = date.slice(0, 7); render(); setTimeout(function () { runExport(kind); }, 220); },
    mdName: function (v) { ui.masterDoctor.name = v; },
    mdPhone: function (v) { ui.masterDoctor.phone = v; },
    mdAddress: function (v) { ui.masterDoctor.address = v; },
    resetDoctor: function () { ui.masterDoctor = { id: null, name: "", phone: "", address: "" }; render(); },
    editDoctor: function (id) {
      var d = doctorById(id);
      if (!d) return;
      ui.masterDoctor = { id: d.id, name: d.name, phone: d.phone || "", address: d.address || "" };
      render();
    },
    saveDoctor: function () {
      var md = ui.masterDoctor;
      if (!md.name.trim()) { toast("Doctor name is required", "error"); return; }
      if (md.id) {
        state.doctors = state.doctors.map(function (d) {
          return d.id === md.id ? Object.assign({}, d, { name: md.name.trim(), phone: md.phone, address: md.address }) : d;
        });
        toast("Doctor updated");
      } else {
        state.doctors.push({ id: nextId(state.doctors), name: md.name.trim(), phone: md.phone, address: md.address, discountPercent: "0", createdAt: new Date().toISOString() });
        toast("Doctor saved to Master");
      }
      ui.masterDoctor = { id: null, name: "", phone: "", address: "" };
      save();
      render();
    },
    deleteDoctor: function (id) {
      if (!window.confirm("Delete this doctor from Master?")) return;
      state.doctors = state.doctors.filter(function (d) { return d.id !== id; });
      save();
      render();
      toast("Doctor deleted");
    },
    mmName: function (v) { ui.masterMedicine.name = v; },
    mmMrp: function (v) { ui.masterMedicine.mrp = v; },
    resetMedicine: function () { ui.masterMedicine = { id: null, name: "", mrp: "" }; render(); },
    editMedicine: function (id) {
      var m = state.medicines.find(function (x) { return x.id === id; });
      if (!m) return;
      ui.masterMedicine = { id: m.id, name: m.name, mrp: String(m.mrp) };
      render();
    },
    saveMedicine: function () {
      var mm = ui.masterMedicine;
      if (!mm.name.trim() || num(mm.mrp) <= 0) { toast("Medicine name and MRP are required", "error"); return; }
      if (mm.id) {
        state.medicines = state.medicines.map(function (m) {
          return m.id === mm.id ? Object.assign({}, m, { name: mm.name.trim(), mrp: r2(mm.mrp).toFixed(2) }) : m;
        });
        toast("Medicine updated");
      } else {
        state.medicines.push({ id: nextId(state.medicines), name: mm.name.trim(), mrp: r2(mm.mrp).toFixed(2), createdAt: new Date().toISOString() });
        toast("Medicine saved to Master");
      }
      ui.masterMedicine = { id: null, name: "", mrp: "" };
      save();
      render();
    },
    deleteMedicine: function (id) {
      if (!window.confirm("Delete this medicine?")) return;
      state.medicines = state.medicines.filter(function (m) { return m.id !== id; });
      save();
      render();
      toast("Medicine deleted");
    },
    share: function () {
      var text = "Open Ankit Traders Billing & Market Collection App " + location.href;
      if (navigator.share) { navigator.share({ title: "Ankit Traders Billing", text: text, url: location.href }).catch(function () { }); return; }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { toast("App link copied to clipboard"); }).catch(function () { toast("Copy this link: " + location.href); });
      } else { toast("Copy this link: " + location.href); }
    },
    backupData: function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var href = URL.createObjectURL(blob);
      downloadHref(href, "ankit-traders-backup-" + todayISO() + ".json");
      setTimeout(function () { URL.revokeObjectURL(href); }, 3000);
      toast("Backup downloaded");
    },
    restoreData: function (input) {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          state = normalize(JSON.parse(String(reader.result)));
          save();
          render();
          toast("Data restored successfully");
        } catch (error) { toast("Invalid backup file", "error"); }
      };
      reader.readAsText(file);
      input.value = "";
    },
    saveSelfFile: function () {
      if (location.protocol === "file:") {
        toast("Press Ctrl + S to save this file");
        return;
      }
      fetch(location.href, { cache: "no-store" })
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var blob = new Blob([html], { type: "text/html;charset=utf-8" });
          var href = URL.createObjectURL(blob);
          downloadHref(href, "ankit-traders-billing.html");
          setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
          toast("Single-file app saved — upload it anywhere");
        })
        .catch(function () { toast("Use browser Save Page (Ctrl+S) instead", "error"); });
    }
  };
  window.App = App;

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && ui.modalInvoiceId) { ui.modalInvoiceId = null; renderModal(); }
  });
  document.addEventListener("beforeprint", renderPrintSheet);

  render();
})();
