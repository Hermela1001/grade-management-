const KEY = "gradeflow_students_v2";
const OLD_KEY = "gradeflow_students_v1";
const COURSES = ["Software Engineering", "Computer Science", "Information Technology"];
const PASS_MARK = 60;
const SEED = [
  { id: "STU-001", name: "Abel Tesfaye", course: "Software Engineering", email: "abel@example.com", grade: 92 },
  { id: "STU-002", name: "Mekdes Alemu", course: "Computer Science", email: "mekdes@example.com", grade: 84 },
  { id: "STU-003", name: "Samuel Bekele", course: "Information Technology", email: "samuel@example.com", grade: 72 },
  { id: "STU-004", name: "Hana Tadesse", course: "Software Engineering", email: "hana@example.com", grade: 48 }
];

const $ = id => document.getElementById(id);
const PAGES = { dashboard: "Dashboard", students: "Students", courses: "Courses", grades: "Grade Management", reports: "Reports" };
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);


function normalize(list) {
  return list.map(s => {
    if (!Array.isArray(s.grades)) {
      s.grades = typeof s.grade === "number" && s.grade > 0
        ? [{ id: uid(), title: "Overall mark", type: "Final", score: s.grade, max: 100, date: today() }] : [];
    }
    recompute(s);
    return s;
  });
}
function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    return normalize(raw ? JSON.parse(raw) : structuredClone(SEED));
  } catch { return normalize(structuredClone(SEED)); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(students)); } catch (e) { console.error(e); } }


const entryPct = g => g.max ? g.score / g.max * 100 : 0;
function recompute(s) {
  s.grade = s.grades.length ? Math.round(s.grades.reduce((t, g) => t + entryPct(g), 0) / s.grades.length * 10) / 10 : 0;
}
let students = load();

const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const initials = n => n.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase();
const letter = m => m >= 90 ? "A" : m >= 80 ? "B" : m >= 70 ? "C" : m >= 60 ? "D" : "F";
const graded = list => list.filter(s => s.grades.length);
const avg = list => { const g = graded(list); return g.length ? g.reduce((t, s) => t + s.grade, 0) / g.length : null; };
const pct = v => v === null ? "—" : v.toFixed(1) + "%";
const passRate = list => { const g = graded(list); return g.length ? Math.round(g.filter(s => s.grade >= PASS_MARK).length / g.length * 100) : null; };
const gradeBadge = s => s.grades.length ? `<span class="badge g-${letter(s.grade).toLowerCase()}">${letter(s.grade)} · ${s.grade}%</span>` : `<span class="badge none">No grades</span>`;
const statusBadge = s => !s.grades.length ? `<span class="badge none">—</span>` : `<span class="badge ${s.grade >= PASS_MARK ? "passed" : "failed"}">${s.grade >= PASS_MARK ? "Passed" : "Failed"}</span>`;
const nameCell = s => `<div class="student-name"><span class="student-avatar">${esc(initials(s.name))}</span>${esc(s.name)}</div>`;
const courseList = () => [...new Set([...COURSES, ...students.map(s => s.course)])];
const fmt = n => Math.round(n * 10) / 10;

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}


function showPage(name) {
  const page = PAGES[name] ? name : "dashboard";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(page + "Page").classList.add("active");
  document.querySelectorAll(".nav-link").forEach(l => l.classList.toggle("active", l.dataset.page === page));
  $("pageTitle").textContent = PAGES[page];
  if (location.hash !== "#" + page) history.replaceState(null, "", "#" + page);
  renderAll();
}
document.querySelectorAll(".nav-link").forEach(l => l.addEventListener("click", e => { e.preventDefault(); showPage(l.dataset.page); }));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.go)));


function renderDashboard() {
  $("totalStudents").textContent = students.length;
  $("totalCourses").textContent = courseList().length;
  $("averageGrade").textContent = pct(avg(students));
  const pr = passRate(students); $("passRate").textContent = pr === null ? "—" : pr + "%";

  $("courseChart").innerHTML = courseList().map(c => {
    const a = avg(students.filter(s => s.course === c));
    return `<div class="bar-col"><span class="bar-val">${a === null ? "—" : Math.round(a) + "%"}</span>
      <div class="bar" style="height:${a || 0}%"></div><span class="bar-label">${esc(c)}</span></div>`;
  }).join("");

  const g = graded(students);
  $("distribution").innerHTML = ["A", "B", "C", "D", "F"].map(L => {
    const n = g.filter(s => letter(s.grade) === L).length;
    const p = g.length ? Math.round(n / g.length * 100) : 0;
    return `<div class="dist-row"><span class="badge g-${L.toLowerCase()}">${L}</span>
      <div class="track"><span class="fill-${L.toLowerCase()}" style="width:${p}%"></span></div><strong>${p}%</strong></div>`;
  }).join("");

  $("recentBody").innerHTML = students.slice(-4).reverse().map(s =>
    `<tr><td>${nameCell(s)}</td><td>${esc(s.id)}</td><td>${esc(s.course)}</td><td>${gradeBadge(s)}</td><td>${statusBadge(s)}</td></tr>`).join("");
}

function renderStudents() {
  const term = $("studentSearch").value.trim().toLowerCase();
  const list = students.filter(s => [s.name, s.id, s.course, s.email].some(v => v.toLowerCase().includes(term)));
  $("studentBody").innerHTML = list.map(s => `<tr>
    <td>${nameCell(s)}</td><td>${esc(s.id)}</td><td>${esc(s.course)}</td><td>${esc(s.email)}</td>
    <td>${gradeBadge(s)}</td><td>${statusBadge(s)}</td>
    <td><div class="actions">
      <button class="icon-btn add" data-act="grade" data-id="${esc(s.id)}" aria-label="Add grade for ${esc(s.name)}">+ Grade</button>
      <button class="icon-btn" data-act="edit" data-id="${esc(s.id)}" aria-label="Edit ${esc(s.name)}">Edit</button>
      <button class="icon-btn danger" data-act="del" data-id="${esc(s.id)}" aria-label="Delete ${esc(s.name)}">Delete</button>
    </div></td></tr>`).join("");
  $("emptyState").classList.toggle("hidden", list.length > 0);
  $("studentCount").textContent = `${students.length} registered${term ? ` · ${list.length} shown` : ""}`;
}

function renderCourses() {
  $("courseCards").innerHTML = courseList().map(c => {
    const list = students.filter(s => s.course === c), pr = passRate(list);
    return `<div class="card course-card"><h3>${esc(c)}</h3><small>${list.length} student${list.length === 1 ? "" : "s"}</small>
      <div class="big">${pct(avg(list))}</div><small>Course average</small>
      <div class="meta"><span>Pass rate</span><strong>${pr === null ? "—" : pr + "%"}</strong></div></div>`;
  }).join("");
}

function renderGrades() {
  const sel = $("gradeCourse"), cur = sel.value || "all";
  sel.innerHTML = `<option value="all">All courses</option>` + courseList().map(c => `<option ${c === cur ? "selected" : ""}>${esc(c)}</option>`).join("");
  sel.value = cur;
  const term = $("gradeSearch").value.trim().toLowerCase();
  const rows = students
    .filter(s => cur === "all" || s.course === cur)
    .flatMap(s => s.grades.map(g => ({ s, g })))
    .filter(({ s, g }) => !term || s.name.toLowerCase().includes(term) || g.title.toLowerCase().includes(term))
    .sort((a, b) => b.g.date.localeCompare(a.g.date));

  $("gradeBody").innerHTML = rows.map(({ s, g }) => {
    const p = entryPct(g), L = letter(p).toLowerCase();
    return `<tr><td>${nameCell(s)}</td><td>${esc(g.title)}</td><td>${esc(g.type)}</td>
      <td>${fmt(g.score)} / ${fmt(g.max)}</td><td class="pct-cell">${fmt(p)}%</td>
      <td><span class="badge g-${L}">${L.toUpperCase()}</span></td><td>${esc(g.date)}</td>
      <td><div class="actions">
        <button class="icon-btn" data-act="edit" data-sid="${esc(s.id)}" data-gid="${g.id}" aria-label="Edit grade">Edit</button>
        <button class="icon-btn danger" data-act="del" data-sid="${esc(s.id)}" data-gid="${g.id}" aria-label="Delete grade">Delete</button>
      </div></td></tr>`;
  }).join("");
  $("gradeEmpty").classList.toggle("hidden", rows.length > 0);

  const ps = rows.map(r => entryPct(r.g));
  $("gradeSummary").innerHTML = ps.length
    ? `<span>Grades recorded <b>${ps.length}</b></span><span>Average <b>${fmt(ps.reduce((a, b) => a + b, 0) / ps.length)}%</b></span><span>Highest <b>${fmt(Math.max(...ps))}%</b></span><span>Lowest <b>${fmt(Math.min(...ps))}%</b></span>`
    : "";
}

function renderReports() {
  $("reportBody").innerHTML = courseList().map(c => {
    const l = graded(students.filter(s => s.course === c)), n = students.filter(s => s.course === c).length;
    const m = l.map(s => s.grade), pr = passRate(l);
    return `<tr><td><strong>${esc(c)}</strong></td><td>${n}</td><td>${pct(avg(l))}</td>
      <td>${l.length ? Math.max(...m) + "%" : "—"}</td><td>${l.length ? Math.min(...m) + "%" : "—"}</td>
      <td>${pr === null ? "—" : pr + "%"}</td></tr>`;
  }).join("");
}

function renderAll() { renderDashboard(); renderStudents(); renderCourses(); renderGrades(); renderReports(); }

/* ---------- grade modal (add / edit / delete grades) ---------- */
function openGradeModal(studentId = "", grade = null) {
  if (!students.length) { toast("Add a student first."); return; }
  $("gradeForm").reset();
  $("gradeError").classList.add("hidden");
  $("gradeStudent").innerHTML = students.map(s => `<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.id)})</option>`).join("");
  $("gradeStudent").value = studentId || students[0].id;
  $("gradeStudent").disabled = !!grade;
  $("editingGradeId").value = grade ? grade.id : "";
  $("gradeModalTitle").textContent = grade ? "Edit grade" : "Add grade";
  $("saveGradeBtn").textContent = grade ? "Save changes" : "Save grade";
  $("gradeMax").value = grade ? grade.max : 100;
  $("gradeDate").value = grade ? grade.date : today();
  if (grade) { $("gradeTitle").value = grade.title; $("gradeType").value = grade.type; $("gradeScore").value = grade.score; }
  $("gradeModal").classList.remove("hidden");
  $("gradeTitle").focus();
}
const closeGradeModal = () => $("gradeModal").classList.add("hidden");

$("addGradeBtn").addEventListener("click", () => openGradeModal());
$("cancelGrade").addEventListener("click", closeGradeModal);
$("gradeModal").addEventListener("click", e => { if (e.target === $("gradeModal")) closeGradeModal(); });

$("gradeForm").addEventListener("submit", e => {
  e.preventDefault();
  const err = m => { $("gradeError").textContent = m; $("gradeError").classList.remove("hidden"); };
  const s = students.find(x => x.id === $("gradeStudent").value);
  const entry = {
    id: $("editingGradeId").value || uid(), title: $("gradeTitle").value.trim(), type: $("gradeType").value,
    score: Number($("gradeScore").value), max: Number($("gradeMax").value), date: $("gradeDate").value
  };
  if (!s) return err("Choose a student.");
  if (!entry.title) return err("Enter an assessment name.");
  if (!(entry.max > 0)) return err("“Out of” must be greater than 0.");
  if (!(entry.score >= 0 && entry.score <= entry.max)) return err(`Score must be between 0 and ${entry.max}.`);
  const i = s.grades.findIndex(g => g.id === entry.id);
  if (i >= 0) { s.grades[i] = entry; toast("Grade updated."); }
  else { s.grades.push(entry); toast("Grade added."); }
  recompute(s); save(); closeGradeModal(); renderAll();
});

$("gradeBody").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const s = students.find(x => x.id === b.dataset.sid), g = s && s.grades.find(x => x.id === b.dataset.gid);
  if (!g) return;
  if (b.dataset.act === "edit") return openGradeModal(s.id, g);
  if (confirm(`Delete “${g.title}” for ${s.name}? This cannot be undone.`)) {
    s.grades = s.grades.filter(x => x.id !== g.id); recompute(s); save(); renderAll(); toast("Grade deleted.");
  }
});
$("gradeCourse").addEventListener("change", renderGrades);
$("gradeSearch").addEventListener("input", renderGrades);


function openModal(s = null) {
  $("studentForm").reset();
  $("studentCourse").innerHTML = courseList().map(c => `<option>${esc(c)}</option>`).join("");
  $("formError").classList.add("hidden");
  $("editingId").value = s ? s.id : "";
  $("modalTitle").textContent = s ? "Edit student" : "Add student";
  $("saveBtn").textContent = s ? "Save changes" : "Save student";
  if (s) { $("studentName").value = s.name; $("studentId").value = s.id; $("studentCourse").value = s.course; $("studentEmail").value = s.email; }
  $("studentModal").classList.remove("hidden");
  $("studentName").focus();
}
const closeModal = () => $("studentModal").classList.add("hidden");

$("addStudentBtn").addEventListener("click", () => openModal());
$("cancelModal").addEventListener("click", closeModal);
$("studentModal").addEventListener("click", e => { if (e.target === $("studentModal")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeGradeModal(); } });

$("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const oldId = $("editingId").value;
  const old = students.find(x => x.id === oldId);
  const s = {
    id: $("studentId").value.trim(), name: $("studentName").value.trim(), course: $("studentCourse").value,
    email: $("studentEmail").value.trim(), grades: old ? old.grades : [], grade: old ? old.grade : 0
  };
  const err = msg => { $("formError").textContent = msg; $("formError").classList.remove("hidden"); };
  if (!s.name || !s.id || !s.email) return err("Fill in name, ID and email.");
  if (students.some(x => x.id.toLowerCase() === s.id.toLowerCase() && x.id !== oldId)) return err("That student ID is already used. Choose a unique ID.");
  if (oldId) { students = students.map(x => x.id === oldId ? s : x); toast("Student updated."); }
  else { students.push(s); toast("Student added."); }
  save(); closeModal(); renderAll();
});

$("studentBody").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const s = students.find(x => x.id === b.dataset.id); if (!s) return;
  if (b.dataset.act === "grade") return openGradeModal(s.id);
  if (b.dataset.act === "edit") return openModal(s);
  if (confirm(`Delete ${s.name} (${s.id}) and all their grades? This cannot be undone.`)) {
    students = students.filter(x => x.id !== s.id); save(); renderAll(); toast("Student deleted.");
  }
});

$("studentSearch").addEventListener("input", renderStudents);
$("globalSearch").addEventListener("input", e => {
  if (!$("studentsPage").classList.contains("active")) showPage("students");
  $("studentSearch").value = e.target.value; renderStudents();
});

$("exportBtn").addEventListener("click", () => {
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Student ID", "Name", "Course", "Assessment", "Type", "Score", "Out of", "Percent", "Date", "Final grade"]];
  students.forEach(s => {
    if (!s.grades.length) rows.push([s.id, s.name, s.course, "", "", "", "", "", "", ""]);
    s.grades.forEach(g => rows.push([s.id, s.name, s.course, g.title, g.type, g.score, g.max, fmt(entryPct(g)), g.date, s.grade]));
  });
  const url = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(",")).join("\n")], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "gradeflow-report.csv" });
  a.click(); URL.revokeObjectURL(url); toast("Report exported.");
});
$("printBtn").addEventListener("click", () => window.print());


save();
showPage(location.hash.slice(1));