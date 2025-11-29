import { renderAppShell } from './layout.js';
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
  await renderAppShell(async main => {
    const header = document.createElement('div');
    header.className = 'app-flex-between';
    header.innerHTML = `<div><p class="app-subtext">Admin</p><h2 class="app-section-title">Marketplaces</h2></div>`;
    const addBtn = document.createElement('button');
    addBtn.className = 'app-btn-primary';
    addBtn.textContent = 'Add New';
    addBtn.addEventListener('click', () => navigateTo('#/admin/marketplaces/new'));
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
          <th>Slug</th>
          <th>Visibility</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody id="categories-body"></tbody>
    `;
    tableWrap.appendChild(table);
    main.appendChild(tableWrap);

    const { data: categories, error } = await getAllCategories();
    if (error) {
      tableWrap.innerHTML = '<p class="app-note" style="color:#f87171">Failed to load marketplaces.</p>';
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
        tbody.innerHTML = '<tr><td class="app-note" colspan="4">No marketplaces found.</td></tr>';
        return;
      }
      list.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cat.name}</td>
          <td>${cat.slug}</td>
          <td>${cat.is_public === false ? 'Private' : 'Public'}</td>
          <td><div class="app-table-row-actions"><button data-id="${cat.id}" class="btn-edit app-btn-secondary" style="padding:8px 10px; font-size:0.85rem;">Edit</button></div></td>
        `;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(`#/admin/marketplaces/${btn.dataset.id}/edit`));
      });
    }

    renderRows(allCategories);
  }, { currentRoute: '#/admin/marketplaces' });
}

export async function renderAdminMarketplaceNewPage() {
  await renderAppShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="app-subtext">Admin</p><h2 class="app-section-title">Add Marketplace</h2>`;
    main.appendChild(heading);

    const card = createCard();
    const form = document.createElement('form');
    form.className = 'app-stack';
    form.innerHTML = `
      <div>
        <label class="app-label" for="mp-name">Name</label>
        <input id="mp-name" type="text" class="app-input" required />
      </div>
      <div>
        <label class="app-label" for="mp-slug">Slug</label>
        <input id="mp-slug" type="text" class="app-input" />
        <p class="app-note">Leave blank to auto-generate.</p>
      </div>
      <div>
        <label class="app-label" for="mp-description">Description</label>
        <textarea id="mp-description" rows="3" class="app-textarea"></textarea>
      </div>
      <label class="app-subtext" style="display:flex; align-items:center; gap:8px;">
        <input id="mp-public" type="checkbox" /> Public marketplace
      </label>
      <label class="app-subtext" style="display:flex; align-items:center; gap:8px;">
        <input id="mp-approval" type="checkbox" /> Require approval for new apps
      </label>
      <button type="submit" class="app-btn-primary" style="width:fit-content;">Save Marketplace</button>
    `;
    card.appendChild(form);
    main.appendChild(card);

    const nameInput = form.querySelector('#mp-name');
    const slugInput = form.querySelector('#mp-slug');
    const descInput = form.querySelector('#mp-description');
    const publicInput = form.querySelector('#mp-public');
    const approvalInput = form.querySelector('#mp-approval');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) {
        alert('Name is required');
        return;
      }
      const slug = slugInput.value.trim() || slugify(name);
      const payload = {
        name,
        slug,
        description: descInput.value.trim() || null,
        is_public: publicInput.checked,
        require_approval: approvalInput.checked
      };
      const { error } = await createCategory(payload);
      if (error) {
        alert('Failed to save marketplace');
        return;
      }
      navigateTo('#/admin/marketplaces');
    });
  }, { currentRoute: '#/admin/marketplaces' });
}

export async function renderAdminMarketplaceEditPage(id) {
  await renderAppShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="app-subtext">Admin</p><h2 class="app-section-title">Edit Marketplace</h2>`;
    main.appendChild(heading);

    const { data: category, error } = await getCategoryById(id);
    if (error || !category) {
      main.innerHTML = '<p class="app-note" style="color:#f87171">Marketplace not found.</p>';
      return;
    }

    const card = createCard();
    const form = document.createElement('form');
    form.className = 'app-stack';
    form.innerHTML = `
      <div>
        <label class="app-label" for="mp-name">Name</label>
        <input id="mp-name" type="text" class="app-input" required />
      </div>
      <div>
        <label class="app-label" for="mp-slug">Slug</label>
        <input id="mp-slug" type="text" class="app-input" />
        <p class="app-note">Leave blank to keep current slug.</p>
      </div>
      <div>
        <label class="app-label" for="mp-description">Description</label>
        <textarea id="mp-description" rows="3" class="app-textarea"></textarea>
      </div>
      <label class="app-subtext" style="display:flex; align-items:center; gap:8px;">
        <input id="mp-public" type="checkbox" /> Public marketplace
      </label>
      <label class="app-subtext" style="display:flex; align-items:center; gap:8px;">
        <input id="mp-approval" type="checkbox" /> Require approval for new apps
      </label>
      <button type="submit" class="app-btn-primary" style="width:fit-content;">Save Changes</button>
    `;
    card.appendChild(form);
    main.appendChild(card);

    const nameInput = form.querySelector('#mp-name');
    const slugInput = form.querySelector('#mp-slug');
    const descInput = form.querySelector('#mp-description');
    const publicInput = form.querySelector('#mp-public');
    const approvalInput = form.querySelector('#mp-approval');

    nameInput.value = category.name || '';
    descInput.value = category.description || '';
    publicInput.checked = category.is_public !== false;
    approvalInput.checked = category.require_approval === true;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) {
        alert('Name is required');
        return;
      }
      const slug = slugInput.value.trim() || category.slug;
      const payload = {
        name,
        slug,
        description: descInput.value.trim() || null,
        is_public: publicInput.checked,
        require_approval: approvalInput.checked
      };
      const { error: updateError } = await updateCategory(id, payload);
      if (updateError) {
        alert('Failed to update marketplace');
        return;
      }
      navigateTo('#/admin/marketplaces');
    });
  }, { currentRoute: '#/admin/marketplaces' });
}
