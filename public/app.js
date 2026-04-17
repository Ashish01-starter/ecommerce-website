document.addEventListener('DOMContentLoaded', () => {

const tableList = document.getElementById('table-list');
const tableTitle = document.getElementById('current-table-title');
const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const addRecordBtn = document.getElementById('add-record-btn');

const modalOverlay = document.getElementById('add-modal');
const modalTitle = document.getElementById('modal-title');
const formFields = document.getElementById('form-fields');
const addForm = document.getElementById('add-form');
const cancelBtn = document.getElementById('close-modal');

let currentTable = null;
let currentSchema = [];

/* =========================
   CLICK HANDLER
========================= */
tableList.addEventListener('click', async e => {
    const btn = e.target.closest('button');

    if (btn && btn.dataset.table) {
        loadTableData(btn.dataset.table);
    }
});

/* =========================
   LOAD DATA
========================= */
async function loadTableData(table) {
    currentTable = table;
    tableTitle.textContent = table;

    const res = await fetch(`/api/${table}`);
    const data = await res.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    addRecordBtn.style.display = 'inline-block';
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

    const cols = Object.keys(data[0]);

    const trHead = document.createElement('tr');
    cols.forEach(c => {
        const th = document.createElement('th');
        th.textContent = c;
        trHead.appendChild(th);
    });

    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    trHead.appendChild(actionTh);

    tableHead.appendChild(trHead);

    data.forEach(row => {
        const tr = document.createElement('tr');

        cols.forEach(c => {
            const td = document.createElement('td');
            td.textContent = row[c];
            tr.appendChild(td);
        });

        const td = document.createElement('td');

        const del = document.createElement('button');
        del.textContent = 'Delete';
        del.onclick = () => handleDelete(row);

        td.appendChild(del);
        tr.appendChild(td);

        tableBody.appendChild(tr);
    });
}

/* =========================
   DELETE
========================= */
function handleDelete(row) {
    if (!confirm('Delete?')) return;

    let pk = {
        PURCHASES: ['BuyerID','ProductID'],
        MANAGES: ['SellerID','EmpID'],
        TRANSACTION: ['TxnID'],
        PRODUCT: ['ProductID'],
        SELLER: ['SellerID'],
        BUYER: ['BuyerID'],
        EMPLOYEE: ['EmpID']
    }[currentTable];

    const keys = {};
    pk.forEach(k => keys[k] = row[k]);

    fetch(`/api/${currentTable}`, {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(keys)
    }).then(() => loadTableData(currentTable));
}

/* =========================
   ADD RECORD
========================= */
addRecordBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Add Record';

    const res = await fetch(`/api/schema/${currentTable}`);
    const schema = await res.json();

    currentSchema = schema;
    formFields.innerHTML = '';

    schema.forEach(col => {
        const input = document.createElement('input');
        input.name = col.COLUMN_NAME;
        input.placeholder = col.COLUMN_NAME;
        formFields.appendChild(input);
    });

    modalOverlay.style.display = 'flex';

    addForm.onsubmit = async e => {
        e.preventDefault();

        const fd = new FormData(addForm);
        const data = {};

        schema.forEach(c => data[c.COLUMN_NAME] = fd.get(c.COLUMN_NAME));

        await fetch(`/api/${currentTable}`, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });

        modalOverlay.style.display = 'none';
        loadTableData(currentTable);
    };
});

/* =========================
   CLOSE MODAL
========================= */
cancelBtn.onclick = () => {
    modalOverlay.style.display = 'none';
};

});