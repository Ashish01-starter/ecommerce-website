const tableList = document.getElementById('tableList'); // ✅ FIX
const tableTitle = document.getElementById('current-table-title'); // ✅ FIX
const tableHead = document.getElementById('table-head'); // ✅ FIX
const tableBody = document.getElementById('table-body'); // ✅ FIX
const addRecordBtn = document.getElementById('add-record-btn'); // ✅ FIX

const modalOverlay = document.getElementById('add-modal'); // ✅ FIX
const modalTitle = document.getElementById('modal-title'); // ✅ FIX
const formFields = document.getElementById('form-fields'); // ✅ FIX
const addForm = document.getElementById('add-form'); // ✅ FIX
const cancelBtn = document.getElementById('close-modal'); // ✅ FIX

let currentTable = null;
let currentSchema = [];
let editMode = false;

/* =========================
   LOAD TABLE (FIXED)
========================= */
tableList.addEventListener('click', async e => {
    const btn = e.target.closest('button');

    if (btn && btn.dataset.table) {
        const table = btn.dataset.table;
        loadTableData(table);
    }
});

async function loadTableData(table) {
    currentTable = table;
    tableTitle.textContent = table;

    const res = await fetch(`/api/${table}`);
    const data = await res.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    addRecordBtn.style.display = 'inline-block'; // ✅ show button
    renderTable(data);
}

/* =========================
   RENDER TABLE
========================= */
function renderTable(data) {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="100%">No data available</td></tr>`;
        return;
    }

    const columns = Object.keys(data[0]);

    const trHead = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        trHead.appendChild(th);
    });

    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    trHead.appendChild(actionTh);

    tableHead.appendChild(trHead);

    data.forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col];
            tr.appendChild(td);
        });

        const actionsTd = document.createElement('td');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => openEditModal(row);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => handleDelete(row);

        actionsTd.appendChild(editBtn);
        actionsTd.appendChild(delBtn);
        tr.appendChild(actionsTd);

        tableBody.appendChild(tr);
    });
}

/* =========================
   BUILD FORM
========================= */
async function buildForm() {
    formFields.innerHTML = '';

    const res = await fetch(`/api/schema/${currentTable}`);
    const schema = await res.json();

    currentSchema = schema;

    schema.forEach(col => {
        const input = document.createElement('input');
        input.name = col.COLUMN_NAME;
        input.placeholder = col.COLUMN_NAME;
        input.required = true;
        formFields.appendChild(input);
    });
}

/* =========================
   ADD RECORD
========================= */
addRecordBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Add Record';

    await buildForm();
    modalOverlay.style.display = 'flex';

    addForm.onsubmit = async e => {
        e.preventDefault();

        const formData = new FormData(addForm);
        const data = {};

        currentSchema.forEach(col => {
            data[col.COLUMN_NAME] = formData.get(col.COLUMN_NAME);
        });

        const res = await fetch(`/api/${currentTable}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Inserted successfully ✅');
            modalOverlay.style.display = 'none';
            loadTableData(currentTable);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    };
});

/* =========================
   DELETE
========================= */
function handleDelete(row) {
    if (!confirm('Delete this record?')) return;

    let pkColumns = {
        PURCHASES: ['BuyerID', 'ProductID'],
        MANAGES: ['SellerID', 'EmpID'],
        TRANSACTIONS: ['TxnID'],
        PRODUCT: ['ProductID'],
        SELLER: ['SellerID'],
        BUYER: ['BuyerID'],
        EMPLOYEE: ['EmpID']
    }[currentTable];

    const keys = {};
    pkColumns.forEach(pk => {
        keys[pk] = row[pk];
    });

    fetch(`/api/${currentTable}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys)
    }).then(() => {
        loadTableData(currentTable);
    });
}

/* =========================
   CLOSE MODAL
========================= */
cancelBtn.onclick = () => {
    modalOverlay.style.display = 'none';
};