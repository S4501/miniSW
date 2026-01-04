// ===== STATE =====
let rooms = JSON.parse(localStorage.getItem("rooms") || "{}");
let currentRoom = null;
let data = { people: [], expenses: [] };
let expenseViewLimit = 3;

// ===== PAGES =====
const landingPage = document.getElementById("landingPage");
const roomPage = document.getElementById("roomPage");
const roomTitle = document.getElementById("roomTitle");
const roomListDiv = document.getElementById("roomList");

// ===== DARK MODE =====
const darkToggle = document.getElementById("darkModeToggle");
darkToggle.onchange = () => document.body.classList.toggle("dark", darkToggle.checked);

// ===== ROOM FLOW =====
function createRoom() {
    const name = document.getElementById("newRoomName").value.trim();
    if (!name) return alert("Enter room name");
    if (!rooms[name]) rooms[name] = { people: [], expenses: [] };
    openRoom(name);
    document.getElementById("newRoomName").value = "";
}

function openRoom(name) {
    currentRoom = name;
    data = JSON.parse(JSON.stringify(rooms[name])); // deep copy
    roomTitle.textContent = name;
    renderParticipants();
    renderExpenses();
    renderSummary();
    landingPage.classList.add("hidden");
    roomPage.classList.remove("hidden");
}

function goBack() {
    if (currentRoom) rooms[currentRoom] = data;
    localStorage.setItem("rooms", JSON.stringify(rooms));
    currentRoom = null;
    landingPage.classList.remove("hidden");
    roomPage.classList.add("hidden");
    renderRoomList();
}

// ===== ROOM LIST =====
function renderRoomList() {
    roomListDiv.innerHTML = "";
    Object.keys(rooms).forEach(r => {
        const div = document.createElement("div");
        div.style.marginBottom = "8px";

        const btn = document.createElement("button");
        btn.textContent = r;
        btn.onclick = () => openRoom(r);

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.style.marginLeft = "5px";
        del.onclick = () => { delete rooms[r]; localStorage.setItem("rooms", JSON.stringify(rooms)); renderRoomList(); };

        div.appendChild(btn);
        div.appendChild(del);
        roomListDiv.appendChild(div);
    });
}

// ===== PARTICIPANTS =====
const participantName = document.getElementById("participantName");
const participantList = document.getElementById("participantList");
const payerSelect = document.getElementById("payerSelect");
const participantCheckboxes = document.getElementById("participantCheckboxes");
const selectAll = document.getElementById("selectAllParticipants");

participantName.addEventListener("keydown", e => { if (e.key === "Enter") addParticipant(); });

function addParticipant() {
    const name = participantName.value.trim();
    if (!name || data.people.includes(name)) return;
    data.people.push(name);
    participantName.value = "";
    renderParticipants();
}

function renderParticipants() {
    participantList.innerHTML = "";

    data.people.forEach((p, idx) => {
        const li = document.createElement("li");
        const input = document.createElement("input");
        input.value = p;

        input.addEventListener("input", () => {
            const oldName = data.people[idx];
            data.people[idx] = input.value;

            // Update all existing expenses
            data.expenses.forEach(e => {
                if (e.payer === oldName) e.payer = input.value;
                e.participants = e.participants.map(part => part === oldName ? input.value : part);
            });

            renderExpenses();
            renderSummary();
            renderPayerSelect();
            renderParticipantCheckboxes();
        });

        li.appendChild(input);

        const span = document.createElement("span");
        const removeBtn = document.createElement("button");
        removeBtn.className = "removeBtn";
        removeBtn.onclick = () => { removeParticipant(idx); };
        span.appendChild(removeBtn);
        li.appendChild(span);

        participantList.appendChild(li);
    });

    renderPayerSelect();
    renderParticipantCheckboxes();

    selectAll.onchange = () => {
        participantCheckboxes.querySelectorAll("input").forEach(cb => cb.checked = selectAll.checked);
    };
}

function removeParticipant(idx) {
    const removed = data.people.splice(idx, 1)[0];
    data.expenses = data.expenses.map(e => ({
        ...e,
        participants: e.participants.filter(p => p !== removed),
        payer: e.payer === removed ? "" : e.payer
    }));
    renderParticipants();
    renderExpenses();
    renderSummary();
}

// ===== PAYER SELECT & CHECKBOXES =====
function renderPayerSelect() {
    payerSelect.innerHTML = "";
    data.people.forEach(p => {
        const option = new Option(p, p);
        payerSelect.add(option);
    });
}

function renderParticipantCheckboxes() {
    participantCheckboxes.innerHTML = "";
    data.people.forEach(p => {
        const label = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = p;
        label.appendChild(cb);
        label.appendChild(document.createTextNode(` ${p}`));
        participantCheckboxes.appendChild(label);
    });
}

// ===== EXPENSES =====
const expenseTitle = document.getElementById("expenseTitle");
const expenseAmount = document.getElementById("expenseAmount");
const expenseList = document.getElementById("expenseList");

expenseTitle.addEventListener("keydown", e => { if (e.key === "Enter") expenseAmount.focus(); });
expenseAmount.addEventListener("keydown", e => { if (e.key === "Enter") addExpense(); });

function addExpense() {
    const title = expenseTitle.value.trim();
    const amount = +expenseAmount.value;
    const payer = payerSelect.value;
    const participants = [...participantCheckboxes.querySelectorAll("input:checked")].map(cb => cb.value);

    if (!title || !amount || !payer || participants.length === 0) return;
    data.expenses.push({ title, amount, payer, participants });
    expenseTitle.value = "";
    expenseAmount.value = "";
    participantCheckboxes.querySelectorAll("input").forEach(cb => cb.checked = false);
    selectAll.checked = false;
    renderExpenses();
    renderSummary();
}

function renderExpenses() {
    expenseList.innerHTML = "";

    const expensesToShow = data.expenses
        .slice(-expenseViewLimit) // last N
        .reverse(); // newest on top

    expensesToShow.forEach((e, displayIdx) => {
        const realIdx = data.expenses.length - 1 - displayIdx;

        const li = document.createElement("li");
        const textSpan = document.createElement("span");
        textSpan.className = "expense-text";
        textSpan.textContent = `Paid by: ${e.payer} --> ${e.title} — ₹${e.amount}`;
        li.appendChild(textSpan);

        const span = document.createElement("span");

        const editBtn = document.createElement("button");
        editBtn.className = "editBtn";
        editBtn.onclick = () => editExpense(realIdx, li);
        span.appendChild(editBtn);


        const removeBtn = document.createElement("button");
        removeBtn.className = "removeBtn";
        removeBtn.onclick = () => {
            data.expenses.splice(realIdx, 1);
            renderExpenses();
            renderSummary();
        };
        span.appendChild(removeBtn);

        li.appendChild(span);
        expenseList.appendChild(li);
    });
}

// ===== EDIT EXPENSE =====
function editExpense(idx, li) {
    const e = data.expenses[idx];

    const editDiv = document.createElement("div");
    editDiv.className = "expenseEdit";

    const titleInput = document.createElement("input");
    titleInput.value = e.title;

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.value = e.amount;

    const payerSelectEdit = document.createElement("select");
    data.people.forEach(p => {
        const o = new Option(p, p);
        if (p === e.payer) o.selected = true;
        payerSelectEdit.add(o);
    });

    const participantDiv = document.createElement("div");
    participantDiv.className = "checkboxGroup";

    data.people.forEach(p => {
        const label = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = p;
        cb.checked = e.participants.includes(p);
        label.appendChild(cb);
        label.appendChild(document.createTextNode(` ${p}`));
        participantDiv.appendChild(label);
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾 Save";

    saveBtn.onclick = () => {
        e.title = titleInput.value.trim() || e.title;
        e.amount = +amountInput.value || e.amount;
        e.payer = payerSelectEdit.value;
        e.participants = [...participantDiv.querySelectorAll("input:checked")].map(cb => cb.value);

        renderExpenses();
        renderSummary();
    };

    editDiv.append(
        titleInput,
        amountInput,
        payerSelectEdit,
        participantDiv,
        saveBtn
    );

    li.innerHTML = "";
    li.appendChild(editDiv);
}


// ===== SUMMARY =====
const summaryList = document.getElementById("summaryList");
const debtTableBody = document.querySelector("#debtTable tbody");

function renderSummary() {
    summaryList.innerHTML = "";
    debtTableBody.innerHTML = "";

    const bal = {};
    data.people.forEach(p => bal[p] = 0);

    data.expenses.forEach(e => {
        const share = e.amount / e.participants.length;
        e.participants.forEach(p => {
            if (p !== e.payer) { bal[p] -= share; bal[e.payer] += share; }
        });
    });

    Object.entries(bal).forEach(([p, v]) => summaryList.innerHTML += `<li>${p}: ₹${v.toFixed(2)}</li>`);

    const creditors = [], debtors = [];
    for (let [p, amt] of Object.entries(bal)) {
        if (amt > 0) creditors.push({ name: p, amount: amt });
        else if (amt < 0) debtors.push({ name: p, amount: -amt });
    }

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtAmount = Math.min(debtors[i].amount, creditors[j].amount);
        debtTableBody.innerHTML += `<tr><td>${debtors[i].name}</td><td>${creditors[j].name}</td><td>₹${debtAmount.toFixed(2)}</td></tr>`;
        debtors[i].amount -= debtAmount;
        creditors[j].amount -= debtAmount;
        if (debtors[i].amount === 0) i++;
        if (creditors[j].amount === 0) j++;
    }
}

// ===== EXPORT TO CSV =====
function exportToExcel() {
    let csv = "Sheet1: All Expenses\nTitle,Amount,Payer,Participants\n";
    data.expenses.forEach(e => {
        csv += `"${e.title}",${e.amount},"${e.payer}","${e.participants.join(";")}"\n`;
    });

    csv += "\nSheet2: Individual Summary\nName,Total Paid,Total Owed,Net\n";
    const bal = {};
    data.people.forEach(p => bal[p] = 0);
    data.expenses.forEach(e => {
        const share = e.amount / e.participants.length;
        e.participants.forEach(p => {
            if (p !== e.payer) { bal[p] -= share; bal[e.payer] += share; }
        });
    });
    Object.entries(bal).forEach(([p, v]) => {
        const totalPaid = data.expenses.filter(e => e.payer === p).reduce((a, e) => a + e.amount, 0);
        const totalOwe = data.expenses.reduce((sum, e) => e.participants.includes(p) ? sum + e.amount / e.participants.length : sum, 0);
        csv += `"${p}",${totalPaid},${totalOwe},${(totalPaid - totalOwe).toFixed(2)}\n`;
    });

    csv += "\nSheet3: Who Owes Whom\nFrom,To,Amount\n";
    const creditors = [], debtors = [];
    Object.entries(bal).forEach(([p, amt]) => { if (amt > 0) creditors.push({ name: p, amount: amt }); else if (amt < 0) debtors.push({ name: p, amount: -amt }); });
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtAmount = Math.min(debtors[i].amount, creditors[j].amount);
        csv += `${debtors[i].name},${creditors[j].name},${debtAmount.toFixed(2)}\n`;
        debtors[i].amount -= debtAmount; creditors[j].amount -= debtAmount;
        if (debtors[i].amount === 0) i++; if (creditors[j].amount === 0) j++;
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "expenses.csv";
    a.click();
}

// ===== EXPENSE VIEW FILTER =====
document.getElementById("show5").onclick = (e) => setExpenseLimit(3, e);
document.getElementById("show10").onclick = (e) => setExpenseLimit(5, e);
document.getElementById("showAll").onclick = (e) => setExpenseLimit(Infinity, e);

function setExpenseLimit(limit, event) {
    expenseViewLimit = limit;
    document.querySelectorAll(".expense-filter button").forEach(b => b.classList.remove("active"));
    event.target.classList.add("active");
    renderExpenses();
}

// ===== INITIALIZE =====
renderRoomList();