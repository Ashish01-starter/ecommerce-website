document.addEventListener('DOMContentLoaded', () => {
    const tableButtons = document.querySelectorAll('#table-list button');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    const emptyState = document.getElementById('no-data');
    const loader = document.getElementById('loading');
    const searchInput = document.getElementById('search-input');
    const addRecordBtn = document.getElementById('add-record-btn');
    const currentTableTitle = document.getElementById('current-table-title');

    const modalOverlay = document.getElementById('add-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const addForm = document.getElementById('add-form');
    const formFieldsContainer = document.getElementById('form-fields');

    let currentTable = '';
    let currentSchema = [];
    let currentData = [];

    // Table selection
    tableButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            tableButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentTable = btn.getAttribute('data-table');
            currentTableTitle.textContent = currentTable;
            addRecordBtn.style.display = 'inline-flex';
            searchInput.value = '';

            await loadTableData(currentTable);
        });
    });

    // Load data
    async function loadTableData(tableName) {
        showLoader();
        try {
            // ✅ Fetch schema safely
            const schemaRes = await fetch(`/api/schema/${tableName}`);
            if (!schemaRes.ok) throw new Error('Schema fetch failed');

            const schemaData = await schemaRes.json();

            // Normalize schema (MySQL safe)
            currentSchema = schemaData.map(col => ({
                COLUMN_NAME: col.COLUMN_NAME || col.column_name,
                DATA_TYPE: (col.DATA_TYPE || col.data_type || '').toUpperCase()
            }));

            // ✅ Fetch data
            const dataRes = await fetch(`/api/${tableName}`);
            if (!dataRes.ok) throw new Error('Data fetch failed');

            currentData = await dataRes.json();

            renderTable(currentData);

        } catch (error) {
            console.error('Error:', error);
            alert('Backend not responding or schema issue.');
        } finally {
            hideLoader();
        }
    }

    function renderTable(data) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!currentSchema.length) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = data.length ? 'none' : 'flex';

        // Headers
        const headerRow = document.createElement('tr');
        currentSchema.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.COLUMN_NAME;
            headerRow.appendChild(th);
        });

        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Actions';
        headerRow.appendChild(actionsTh);

        tableHead.appendChild(headerRow);

        // Rows
        data.forEach(row => {
            const tr = document.createElement('tr');

            currentSchema.forEach(col => {
                const td = document.createElement('td');
                let value = row[col.COLUMN_NAME];

                // Handle lowercase fallback
                if (value === undefined) {
                    value = row[col.COLUMN_NAME.toLowerCase()];
                }

                // Format dates
                if (col.DATA_TYPE.includes('DATE') && value) {
                    value = new Date(value).toLocaleDateString();
                }

                td.textContent = value ?? '';
                tr.appendChild(td);
            });

            // Delete button
            const actionsTd = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger';
            delBtn.textContent = 'Delete';

            delBtn.onclick = () => handleDelete(row);

            actionsTd.appendChild(delBtn);
            tr.appendChild(actionsTd);

            tableBody.appendChild(tr);
        });
    }

    async function handleDelete(rowData) {
        if (!confirm('Delete this record?')) return;

        let pkColumns = {
            PURCHASES: ['BUYERID', 'PRODUCTID'],
            MANAGES: ['SELLERID', 'EMPID'],
            TRANSACTION: ['TXNID'],
            PRODUCT: ['PRODUCTID'],
            SELLER: ['SELLERID'],
            BUYER: ['BUYERID'],
            EMPLOYEE: ['EMPID']
        }[currentTable] || [];

        const payload = {};
        pkColumns.forEach(col => {
            payload[col] = rowData[col] ?? rowData[col.toLowerCase()];
        });

        try {
            const res = await fetch(`/api/${currentTable}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await loadTableData(currentTable);
            } else {
                const err = await res.json();
                alert(err.error || 'Delete failed');
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Search
    searchInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();

        if (!q) return renderTable(currentData);

        const filtered = currentData.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(q)
            )
        );

        renderTable(filtered);
    });

    // Modal open/close
    addRecordBtn.addEventListener('click', async () => {
        await buildForm();
        modalOverlay.classList.add('active');
    });

    closeModalBtn.onclick = () => modalOverlay.classList.remove('active');

    modalOverlay.onclick = e => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    };

    addForm.addEventListener('submit', async e => {
        e.preventDefault();

        const formData = new FormData(addForm);
        const data = {};

        currentSchema.forEach(col => {
            data[col.COLUMN_NAME] = formData.get(col.COLUMN_NAME);
        });

        try {
            const res = await fetch(`/api/${currentTable}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                modalOverlay.classList.remove('active');
                await loadTableData(currentTable);
            } else {
                const err = await res.json();
                alert(err.error || 'Insert failed');
            }
        } catch (err) {
            console.error(err);
        }
    });

    async function buildForm() {
        formFieldsContainer.innerHTML = '';

        for (let col of currentSchema) {
            const group = document.createElement('div');
            const label = document.createElement('label');
            label.textContent = col.COLUMN_NAME;

            const input = document.createElement('input');
            input.name = col.COLUMN_NAME;
            input.required = true;

            if (col.DATA_TYPE.includes('DATE')) {
                input.type = 'date';
            } else if (col.DATA_TYPE.includes('INT')) {
                input.type = 'number';
            } else {
                input.type = 'text';
            }

            group.appendChild(label);
            group.appendChild(input);
            formFieldsContainer.appendChild(group);
        }
    }

    function showLoader() {
        loader.style.display = 'block';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }
});