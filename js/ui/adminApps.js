import { renderAppShell } from './layout.js';
import { createCard, statusPill, confirmDanger } from './components.js';
import { createSearchInput } from './search.js';
import { getAllApps, getAllCategories, createApp, updateApp, getAppById, uploadAppFile, deleteApp } from '../api.js';
import { navigateTo } from '../router.js';
import { isCurrentUserAdmin } from '../auth.js';

export async function renderAdminAppsListPage() {
  await renderAppShell(async main => {
    const header = document.createElement('div');
    header.className = 'app-flex-between';
    header.innerHTML = `<div><p class="app-subtext">Admin</p><h2 class="app-section-title">Applications</h2></div>`;
    const addBtn = document.createElement('button');
    addBtn.className = 'app-btn-primary';
    addBtn.textContent = 'Add New';
    addBtn.addEventListener('click', () => navigateTo('#/admin/apps/new'));
    header.appendChild(addBtn);
    main.appendChild(header);

    const searchWrap = document.createElement('div');
    main.appendChild(searchWrap);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'app-card';
    const table = document.createElement('table');
    table.className = 'app-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Version</th>
          <th>Status</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody id="apps-table-body"></tbody>
    `;
    tableWrap.appendChild(table);
    main.appendChild(tableWrap);

    const { data: apps, error } = await getAllApps();
    if (error) {
      tableWrap.innerHTML = '<p class="admin-help" style="color:#f87171">Failed to load apps.</p>';
      return;
    }
    const allApps = apps || [];
    const tbody = table.querySelector('#apps-table-body');

    const search = createSearchInput('Search applications…', value => {
      const q = (value || '').toLowerCase();
      const filtered = allApps.filter(app => `${app.name} ${app.category_slug}`.toLowerCase().includes(q));
      renderRows(filtered);
    });
    searchWrap.appendChild(search);

    function renderRows(list) {
      tbody.innerHTML = '';
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td class="admin-help" colspan="5">No applications found.</td></tr>';
        return;
      }
      list.forEach(app => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${app.name}</td>
          <td>${app.category_slug || ''}</td>
          <td>${app.version || ''}</td>
          <td>${statusPill(app.status || 'available').outerHTML}</td>
          <td>
            <div class="app-table-row-actions">
              <button data-id="${app.id}" class="btn-edit app-btn-secondary" style="padding:8px 10px; font-size:0.85rem;">Edit</button>
              <button data-id="${app.id}" class="btn-versions app-btn-primary" style="padding:8px 10px; font-size:0.85rem;">Versions</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(`#/admin/apps/${btn.dataset.id}/edit`));
      });
      tbody.querySelectorAll('.btn-versions').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(`#/admin/apps/${btn.dataset.id}/versions`));
      });
    }

    renderRows(allApps);
  }, { currentRoute: '#/admin/apps' });
}

export async function renderAdminAppNewPage() {
  await renderAppShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="app-subtext">Admin</p><h2 class="app-section-title">Add Application</h2>`;
    main.appendChild(heading);

    const formCard = createCard();
    formCard.className = 'bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg';
    const form = document.createElement('form');
    form.className = 'app-form-grid';

    const fields = [
      { id: 'name', label: 'Name', type: 'text' },
      { id: 'developer', label: 'Developer', type: 'text' },
      { id: 'version', label: 'Version', type: 'text' },
      { id: 'status', label: 'Status', type: 'text', placeholder: 'available' },
      { id: 'image', label: 'Icon URL', type: 'text' }
    ];

    const inputs = {};

    fields.forEach(({ id, label, type, placeholder }) => {
      const wrap = document.createElement('div');
      wrap.className = 'app-stack';
      wrap.innerHTML = `<label class="admin-label" for="${id}">${label}</label>`;
      const input = document.createElement('input');
      input.id = `app-${id}`;
      input.type = type;
      input.placeholder = placeholder || '';
      input.className = 'admin-field';
      wrap.appendChild(input);
      inputs[id] = input;
      form.appendChild(wrap);
    });

    const categoryWrap = document.createElement('div');
    categoryWrap.className = 'app-stack';
    categoryWrap.innerHTML = '<label class="admin-label" for="app-category">Category</label>';
    const categorySelect = document.createElement('select');
    categorySelect.id = 'app-category';
    categorySelect.className = 'admin-field admin-select';
    categoryWrap.appendChild(categorySelect);
    form.appendChild(categoryWrap);

    const descWrap = document.createElement('div');
    descWrap.className = 'app-stack';
    descWrap.innerHTML = '<label class="admin-label" for="app-description">Description</label>';
    const descArea = document.createElement('textarea');
    descArea.id = 'app-description';
    descArea.className = 'admin-field';
    descArea.rows = 3;
    descWrap.appendChild(descArea);
    form.appendChild(descWrap);

    const reqWrap = document.createElement('div');
    reqWrap.className = 'app-stack';
    reqWrap.innerHTML = '<label class="admin-label" for="app-requirements">System Requirements</label>';
    const reqArea = document.createElement('textarea');
    reqArea.id = 'app-requirements';
    reqArea.className = 'admin-field';
    reqArea.rows = 3;
    reqWrap.appendChild(reqArea);
    form.appendChild(reqWrap);

    const fileWrap = document.createElement('div');
    fileWrap.className = 'app-stack';
    fileWrap.innerHTML = '<label class="admin-label" for="app-file">Application File</label>';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'app-file';
    fileInput.accept = '*/*';
    fileInput.className = 'admin-file';
    fileWrap.appendChild(fileInput);
    form.appendChild(fileWrap);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'app-btn-primary';
    submit.textContent = 'Save Application';
    form.appendChild(submit);

    formCard.appendChild(form);
    main.appendChild(formCard);

    const { data: categories } = await getAllCategories();
    categorySelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a category';
    categorySelect.appendChild(placeholder);
    (categories || []).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.slug;
      opt.textContent = cat.name;
      categorySelect.appendChild(opt);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        name: inputs.name.value.trim(),
        developer: inputs.developer.value.trim() || null,
        version: inputs.version.value.trim() || null,
        status: inputs.status.value.trim() || 'available',
        image: inputs.image.value.trim() || null,
        description: descArea.value.trim() || null,
        category_slug: categorySelect.value,
        system_requirements: reqArea.value.trim() || null
      };
      if (!payload.name || !payload.category_slug) {
        alert('Name and category are required');
        return;
      }
    const { data, error } = await createApp(payload);
    if (error) {
      alert('Failed to save application');
      return;
    }

    const createdApp = Array.isArray(data) ? data[0] : data;
    const selectedFile = fileInput.files?.[0];
    if (selectedFile && createdApp?.id) {
      const { error: uploadError } = await uploadAppFile(createdApp.id, selectedFile);
      if (uploadError) {
        alert('App created but file upload failed: ' + uploadError.message);
      }
    }
    navigateTo('#/admin/apps');
    });
  }, { currentRoute: '#/admin/apps' });
}

export async function renderAdminAppEditPage(appId) {
  await renderAppShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="app-subtext">Admin</p><h2 class="app-section-title">Edit Application</h2>`;
    main.appendChild(heading);

    const { data: app, error } = await getAppById(appId);
    if (error || !app) {
      main.innerHTML += '<p class="admin-help" style="color:#f87171">App not found.</p>';
      return;
    }

    const formCard = createCard();
    formCard.className = 'bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg';
    const form = document.createElement('form');
    form.className = 'app-form-grid';

    const inputs = {};
    const fields = [
      { id: 'name', label: 'Name', type: 'text', value: app.name },
      { id: 'developer', label: 'Developer', type: 'text', value: app.developer },
      { id: 'version', label: 'Version', type: 'text', value: app.version },
      { id: 'status', label: 'Status', type: 'text', value: app.status },
      { id: 'image', label: 'Icon URL', type: 'text', value: app.image }
    ];

    fields.forEach(({ id, label, type, value }) => {
      const wrap = document.createElement('div');
      wrap.className = 'app-stack';
      wrap.innerHTML = `<label class="admin-label" for="${id}">${label}</label>`;
      const input = document.createElement('input');
      input.id = `app-${id}`;
      input.type = type;
      input.value = value || '';
      input.className = 'admin-field';
      wrap.appendChild(input);
      inputs[id] = input;
      form.appendChild(wrap);
    });

    const categoryWrap = document.createElement('div');
    categoryWrap.className = 'app-stack';
    categoryWrap.innerHTML = '<label class="admin-label" for="app-category">Category</label>';
    const categorySelect = document.createElement('select');
    categorySelect.id = 'app-category';
    categorySelect.className = 'admin-field admin-select';
    categoryWrap.appendChild(categorySelect);
    form.appendChild(categoryWrap);

    const descWrap = document.createElement('div');
    descWrap.className = 'app-stack';
    descWrap.innerHTML = '<label class="admin-label" for="app-description">Description</label>';
    const descArea = document.createElement('textarea');
    descArea.id = 'app-description';
    descArea.className = 'admin-field';
    descArea.rows = 3;
    descArea.value = app.description || '';
    descWrap.appendChild(descArea);
    form.appendChild(descWrap);

    const reqWrap = document.createElement('div');
    reqWrap.className = 'app-stack';
    reqWrap.innerHTML = '<label class="admin-label" for="app-requirements">System Requirements</label>';
    const reqArea = document.createElement('textarea');
    reqArea.id = 'app-requirements';
    reqArea.className = 'admin-field';
    reqArea.rows = 3;
    reqArea.value = app.system_requirements || '';
    reqWrap.appendChild(reqArea);
    form.appendChild(reqWrap);

    const fileWrap = document.createElement('div');
    fileWrap.className = 'app-stack';
    fileWrap.innerHTML = '<label class="admin-label" for="app-file">Application File</label>';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'app-file';
    fileInput.accept = '*/*';
    fileInput.className = 'admin-file';
    fileWrap.appendChild(fileInput);
    if (app.file_name) {
      const currentFile = document.createElement('p');
      currentFile.className = 'mt-1 text-xs text-slate-400';
      currentFile.textContent = `Current file: ${app.file_name}`;
      fileWrap.appendChild(currentFile);
    }
    form.appendChild(fileWrap);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.alignItems = 'center';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'app-btn-primary';
    submit.textContent = 'Save Changes';
    actions.appendChild(submit);

    const canDelete = await isCurrentUserAdmin();
    if (canDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold';
      deleteBtn.textContent = 'Delete App';
      deleteBtn.addEventListener('click', async () => {
        const stillAdmin = await isCurrentUserAdmin();
        if (!stillAdmin) {
          alert('Only admins can delete apps.');
          return;
        }

        const confirmed = await confirmDanger({
          title: 'Delete app?',
          message: `Are you sure? This cannot be undone.\n\n"${app.name}" will be permanently deleted.`,
          confirmText: 'Confirm'
        });
        if (!confirmed) return;

        const { error: deleteError } = await deleteApp(app.id);
        if (deleteError) {
          console.error(deleteError);
          alert('Failed to delete app. Please try again.');
          return;
        }

        alert('Deleted successfully');
        navigateTo('#/admin/apps');
      });
      actions.appendChild(deleteBtn);
    }

    form.appendChild(actions);

    formCard.appendChild(form);
    main.appendChild(formCard);

    const { data: categories } = await getAllCategories();
    categorySelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a category';
    categorySelect.appendChild(placeholder);
    (categories || []).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.slug;
      opt.textContent = cat.name;
      if (app.category_slug === cat.slug) opt.selected = true;
      categorySelect.appendChild(opt);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        name: inputs.name.value.trim(),
        developer: inputs.developer.value.trim() || null,
        version: inputs.version.value.trim() || null,
        status: inputs.status.value.trim() || 'available',
        image: inputs.image.value.trim() || null,
        description: descArea.value.trim() || null,
        category_slug: categorySelect.value,
        system_requirements: reqArea.value.trim() || null
      };
      if (!payload.name || !payload.category_slug) {
        alert('Name and category are required');
        return;
      }
    const { error: updateError } = await updateApp(appId, payload);
    if (updateError) {
      alert('Failed to update application');
      return;
    }

    const selectedFile = fileInput.files?.[0];
    if (selectedFile) {
      const { error: uploadError } = await uploadAppFile(appId, selectedFile);
      if (uploadError) {
        alert('App updated but file upload failed: ' + uploadError.message);
      }
    }
    navigateTo('#/admin/apps');
    });
  }, { currentRoute: '#/admin/apps' });
}
