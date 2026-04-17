const tableList = document.getElementById('tableList');
const tableTitle = document.getElementById('tableTitle');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const addRecordBtn = document.getElementById('addRecordBtn');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const formFields = document.getElementById('formFields');
const addForm = document.getElementById('addForm');
const cancelBtn = document.getElementById('cancelBtn');

let currentTable = null;
let currentSchema = [];
let editMode = false;

/* =========================
   LOAD TABLE
========================= */
tableList.addEventListener('click', async e => {
    if (e.target.tagName === 'LI') {
        const table = e.target.dataset.table;
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

    // header
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

    // rows
    data.forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col];
            tr.appendChild(td);
        });

        // ACTION BUTTONS
        const actionsTd = document.createElement('td');

        // EDIT
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn';
        editBtn.onclick = () => openEditModal(row);

        // DELETE
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn btn-danger';
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
    editMode = false;
    modalTitle.textContent = 'Add Record';

    await buildForm();
    modalOverlay.classList.add('active');

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
            modalOverlay.classList.remove('active');
            loadTableData(currentTable);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    };
});

/* =========================
   EDIT RECORD
========================= */
function openEditModal(rowData) {
    editMode = true;
    modalTitle.textContent = 'Edit Record';

    buildForm().then(() => {
        // Fill form
        currentSchema.forEach(col => {
            const input = document.querySelector(`[name="${col.COLUMN_NAME}"]`);
            if (input) {
                input.value = rowData[col.COLUMN_NAME] || '';
            }
        });

        modalOverlay.classList.add('active');

        addForm.onsubmit = async e => {
            e.preventDefault();

            const formData = new FormData(addForm);
            const data = {};

            currentSchema.forEach(col => {
                data[col.COLUMN_NAME] = formData.get(col.COLUMN_NAME);
            });

            const res = await fetch(`/api/${currentTable}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert('Updated successfully ✏️');
                modalOverlay.classList.remove('active');
                loadTableData(currentTable);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        };
    });
}

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
    }).then(async res => {
        if (res.ok) {
            alert('Deleted successfully ❌');
            loadTableData(currentTable);
        } else {
            const err = await res.json();
            alert(err.error);
        }
    });
}

/* =========================
   CLOSE MODAL
========================= */
cancelBtn.onclick = () => {
    modalOverlay.classList.remove('active');
};