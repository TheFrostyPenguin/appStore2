import { renderShell } from './layout.js';
import { createCard, statusPill } from './components.js';
import { createSearchInput } from './search.js';
import { getAllApps, getAllCategories, createApp, updateApp, getAppById, uploadAppFile } from '../api.js';
import { navigateTo } from '../router.js';

export async function renderAdminAppsListPage() {
  await renderShell(async main => {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = `<div><p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Applications</h2></div>`;
    const addBtn = document.createElement('button');
    addBtn.className = 'px-3 py-1.5 rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-400';
    addBtn.textContent = 'Add New';
    addBtn.addEventListener('click', () => navigateTo('#/admin/apps/new'));
    header.appendChild(addBtn);
    main.appendChild(header);

    const searchWrap = document.createElement('div');
    searchWrap.className = 'mt-4';
    main.appendChild(searchWrap);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60';
    const table = document.createElement('table');
    table.className = 'min-w-full text-sm text-slate-200';
    table.innerHTML = `
      <thead class="bg-slate-900/80 text-xs uppercase text-slate-400">
        <tr>
          <th class="px-4 py-2 text-left">Name</th>
          <th class="px-4 py-2 text-left">Category</th>
          <th class="px-4 py-2 text-left">Version</th>
          <th class="px-4 py-2 text-left">Status</th>
          <th class="px-4 py-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody id="apps-table-body"></tbody>
    `;
    tableWrap.appendChild(table);
    main.appendChild(tableWrap);

    const { data: apps, error } = await getAllApps();
    if (error) {
      tableWrap.innerHTML = '<p class="text-red-500 text-sm p-4">Failed to load apps.</p>';
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
        tbody.innerHTML = '<tr><td class="px-4 py-3 text-slate-400" colspan="5">No applications found.</td></tr>';
        return;
      }
      list.forEach(app => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-4 py-3 font-medium text-white">${app.name}</td>
          <td class="px-4 py-3 text-slate-300">${app.category_slug || ''}</td>
          <td class="px-4 py-3 text-slate-300">${app.version || ''}</td>
          <td class="px-4 py-3">${statusPill(app.status || 'available').outerHTML}</td>
          <td class="px-4 py-3 text-right flex items-center justify-end gap-2">
            <button data-id="${app.id}" class="btn-edit text-xs px-2 py-1 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Edit</button>
            <button data-id="${app.id}" class="btn-versions text-xs px-2 py-1 rounded-md bg-sky-500 text-white">Versions</button>
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
  });
}

export async function renderAdminAppNewPage() {
  await renderShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Add Application</h2>`;
    main.appendChild(heading);

    const formCard = createCard();
    const form = document.createElement('form');
    form.className = 'grid gap-3 md:grid-cols-2';

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
      wrap.className = 'flex flex-col gap-1';
      wrap.innerHTML = `<label class="text-sm text-slate-300" for="${id}">${label}</label>`;
      const input = document.createElement('input');
      input.id = `app-${id}`;
      input.type = type;
      input.placeholder = placeholder || '';
      input.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
      wrap.appendChild(input);
      inputs[id] = input;
      form.appendChild(wrap);
    });

    const categoryWrap = document.createElement('div');
    categoryWrap.className = 'flex flex-col gap-1';
    categoryWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-category">Category</label>';
    const categorySelect = document.createElement('select');
    categorySelect.id = 'app-category';
    categorySelect.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    categoryWrap.appendChild(categorySelect);
    form.appendChild(categoryWrap);

    const descWrap = document.createElement('div');
    descWrap.className = 'md:col-span-2 flex flex-col gap-1';
    descWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-description">Description</label>';
    const descArea = document.createElement('textarea');
    descArea.id = 'app-description';
    descArea.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    descArea.rows = 3;
    descWrap.appendChild(descArea);
    form.appendChild(descWrap);

    const reqWrap = document.createElement('div');
    reqWrap.className = 'md:col-span-2 flex flex-col gap-1';
    reqWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-requirements">System Requirements</label>';
    const reqArea = document.createElement('textarea');
    reqArea.id = 'app-requirements';
    reqArea.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    reqArea.rows = 3;
    reqWrap.appendChild(reqArea);
    form.appendChild(reqWrap);

    const fileWrap = document.createElement('div');
    fileWrap.className = 'md:col-span-2 flex flex-col gap-1';
    fileWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-file">Application File</label>';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'app-file';
    fileInput.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    fileWrap.appendChild(fileInput);
    form.appendChild(fileWrap);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'md:col-span-2 px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold';
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
  });
}

export async function renderAdminAppEditPage(appId) {
  await renderShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Edit Application</h2>`;
    main.appendChild(heading);

    const { data: app, error } = await getAppById(appId);
    if (error || !app) {
      main.innerHTML += '<p class="text-red-500 text-sm">App not found.</p>';
      return;
    }

    const formCard = createCard();
    const form = document.createElement('form');
    form.className = 'grid gap-3 md:grid-cols-2';

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
      wrap.className = 'flex flex-col gap-1';
      wrap.innerHTML = `<label class="text-sm text-slate-300" for="${id}">${label}</label>`;
      const input = document.createElement('input');
      input.id = `app-${id}`;
      input.type = type;
      input.value = value || '';
      input.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
      wrap.appendChild(input);
      inputs[id] = input;
      form.appendChild(wrap);
    });

    const categoryWrap = document.createElement('div');
    categoryWrap.className = 'flex flex-col gap-1';
    categoryWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-category">Category</label>';
    const categorySelect = document.createElement('select');
    categorySelect.id = 'app-category';
    categorySelect.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    categoryWrap.appendChild(categorySelect);
    form.appendChild(categoryWrap);

    const descWrap = document.createElement('div');
    descWrap.className = 'md:col-span-2 flex flex-col gap-1';
    descWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-description">Description</label>';
    const descArea = document.createElement('textarea');
    descArea.id = 'app-description';
    descArea.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    descArea.rows = 3;
    descArea.value = app.description || '';
    descWrap.appendChild(descArea);
    form.appendChild(descWrap);

    const reqWrap = document.createElement('div');
    reqWrap.className = 'md:col-span-2 flex flex-col gap-1';
    reqWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-requirements">System Requirements</label>';
    const reqArea = document.createElement('textarea');
    reqArea.id = 'app-requirements';
    reqArea.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    reqArea.rows = 3;
    reqArea.value = app.system_requirements || '';
    reqWrap.appendChild(reqArea);
    form.appendChild(reqWrap);

    const fileWrap = document.createElement('div');
    fileWrap.className = 'md:col-span-2 flex flex-col gap-1';
    fileWrap.innerHTML = '<label class="text-sm text-slate-300" for="app-file">Application File</label>';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'app-file';
    fileInput.className = 'rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white';
    fileWrap.appendChild(fileInput);
    if (app.file_name) {
      const currentFile = document.createElement('p');
      currentFile.className = 'text-xs text-slate-400';
      currentFile.textContent = `Current file: ${app.file_name}`;
      fileWrap.appendChild(currentFile);
    }
    form.appendChild(fileWrap);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'md:col-span-2 px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold';
    submit.textContent = 'Save Changes';
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
  });
}
