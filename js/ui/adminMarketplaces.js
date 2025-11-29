import { renderShell } from './layout.js';
import { createCard } from './components.js';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  getCategoryById
} from '../api.js';
import { createSearchInput } from './search.js';
import { navigateTo } from '../router.js';

function slugify(str) {
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function renderAdminMarketplacesListPage() {
  await renderShell(async main => {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = `<div><p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Marketplaces</h2></div>`;
    const addBtn = document.createElement('button');
    addBtn.className = 'px-3 py-1.5 rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-400';
    addBtn.textContent = 'Add New';
    addBtn.addEventListener('click', () => navigateTo('#/admin/marketplaces/new'));
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
          <th class="px-4 py-2 text-left">Slug</th>
          <th class="px-4 py-2 text-left">Visibility</th>
          <th class="px-4 py-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody id="categories-body"></tbody>
    `;
    tableWrap.appendChild(table);
    main.appendChild(tableWrap);

    const { data: categories, error } = await getAllCategories();
    if (error) {
      tableWrap.innerHTML = '<p class="text-red-500 text-sm p-4">Failed to load marketplaces.</p>';
      return;
    }
    const allCategories = categories || [];
    const tbody = table.querySelector('#categories-body');

    const search = createSearchInput('Search marketplaces…', value => {
      const q = (value || '').toLowerCase();
      const filtered = allCategories.filter(cat => `${cat.name} ${cat.slug}`.toLowerCase().includes(q));
      renderRows(filtered);
    });
    searchWrap.appendChild(search);

    function renderRows(list) {
      tbody.innerHTML = '';
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td class="px-4 py-3 text-slate-400" colspan="4">No marketplaces found.</td></tr>';
        return;
      }
      list.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-4 py-3 font-medium text-white">${cat.name}</td>
          <td class="px-4 py-3 text-slate-300">${cat.slug}</td>
          <td class="px-4 py-3 text-slate-300">${cat.is_public === false ? 'Private' : 'Public'}</td>
          <td class="px-4 py-3 text-right">
            <button data-id="${cat.id}" class="btn-edit text-xs px-2 py-1 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Edit</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(`#/admin/marketplaces/${btn.dataset.id}/edit`));
      });
    }

    renderRows(allCategories);
  });
}

export async function renderAdminMarketplaceNewPage() {
  await renderShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Add Marketplace</h2>`;
    main.appendChild(heading);

    const card = createCard();
    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.innerHTML = `
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-300" for="mp-name">Name</label>
        <input id="mp-name" type="text" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-300" for="mp-slug">Slug</label>
        <input id="mp-slug" type="text" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
        <p class="text-xs text-slate-500">Leave blank to auto-generate.</p>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-300" for="mp-description">Description</label>
        <textarea id="mp-description" rows="3" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white"></textarea>
      </div>
      <label class="inline-flex items-center gap-2 text-sm text-slate-200">
        <input id="mp-public" type="checkbox" class="rounded border-slate-700 bg-slate-900" checked />
        Public marketplace
      </label>
      <label class="inline-flex items-center gap-2 text-sm text-slate-200">
        <input id="mp-approval" type="checkbox" class="rounded border-slate-700 bg-slate-900" />
        Require approval for new apps
      </label>
      <button type="submit" class="w-full px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold">Save Marketplace</button>
    `;
    card.appendChild(form);
    main.appendChild(card);

    const nameInput = form.querySelector('#mp-name');
    const slugInput = form.querySelector('#mp-slug');
    const descInput = form.querySelector('#mp-description');
    const publicInput = form.querySelector('#mp-public');
    const approvalInput = form.querySelector('#mp-approval');

    nameInput.addEventListener('input', () => {
      if (!slugInput.value.trim()) {
        slugInput.value = slugify(nameInput.value);
      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const slug = (slugInput.value.trim() || slugify(name)).toLowerCase();
      if (!name || !slug) {
        alert('Name is required');
        return;
      }
      const { error } = await createCategory({
        name,
        slug,
        description: descInput.value.trim() || null,
        is_public: publicInput.checked,
        require_approval: approvalInput.checked
      });
      if (error) {
        alert('Failed to save marketplace');
        return;
      }
      navigateTo('#/admin/marketplaces');
    });
  });
}

export async function renderAdminMarketplaceEditPage(id) {
  await renderShell(async main => {
    const { data: category, error } = await getCategoryById(id);
    if (error || !category) {
      main.innerHTML = '<p class="text-red-500 text-sm">Marketplace not found.</p>';
      return;
    }

    const heading = document.createElement('div');
    heading.innerHTML = `<p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Edit Marketplace</h2>`;
    main.appendChild(heading);

    const card = createCard();
    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.innerHTML = `
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-300" for="mp-name">Name</label>
        <input id="mp-name" type="text" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-300" for="mp-slug">Slug</label>
        <input id="mp-slug" type="text" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-slate-300" for="mp-description">Description</label>
        <textarea id="mp-description" rows="3" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white"></textarea>
      </div>
      <label class="inline-flex items-center gap-2 text-sm text-slate-200">
        <input id="mp-public" type="checkbox" class="rounded border-slate-700 bg-slate-900" />
        Public marketplace
      </label>
      <label class="inline-flex items-center gap-2 text-sm text-slate-200">
        <input id="mp-approval" type="checkbox" class="rounded border-slate-700 bg-slate-900" />
        Require approval for new apps
      </label>
      <button type="submit" class="w-full px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold">Save Changes</button>
    `;
    card.appendChild(form);
    main.appendChild(card);

    const nameInput = form.querySelector('#mp-name');
    const slugInput = form.querySelector('#mp-slug');
    const descInput = form.querySelector('#mp-description');
    const publicInput = form.querySelector('#mp-public');
    const approvalInput = form.querySelector('#mp-approval');

    nameInput.value = category.name || '';
    slugInput.value = category.slug || '';
    descInput.value = category.description || '';
    publicInput.checked = category.is_public !== false;
    approvalInput.checked = !!category.require_approval;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const slug = slugInput.value.trim();
      if (!name || !slug) {
        alert('Name and slug are required');
        return;
      }
      const { error: updateError } = await updateCategory(id, {
        name,
        slug: slug.toLowerCase(),
        description: descInput.value.trim() || null,
        is_public: publicInput.checked,
        require_approval: approvalInput.checked
      });
      if (updateError) {
        alert('Failed to save marketplace');
        return;
      }
      navigateTo('#/admin/marketplaces');
    });
  });
}
