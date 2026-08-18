/**
 * Violation Categories Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 * 
 * Allows authorized users to:
 * - View offense classification taxonomy from database/API
 * - Add new violation categories
 * - Edit existing violation categories
 * - Activate/deactivate categories
 */

window.renderViolationsModule = async function(container) {
  let violations = [];
  try {
    const res = await ApiClient.get('incidents', 'violations', null, { all: 1 });
    violations = res.data || [];
  } catch (e) {
    console.error('Error loading violations:', e);
    violations = [];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-list-ul" style="color: var(--primary);"></i> Violation Offense Setup & Point Thresholds</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Define DepEd-prescribed offense classification taxonomy and standard demerit point penalties.</p>
        </div>
        <button class="btn btn-primary" onclick="openViolationModal()">
          <i class="fas fa-plus-circle"></i> Add Offense Category
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Title & Description</th>
            <th>Severity Category</th>
            <th>Demerit Penalty</th>
            <th>Recommended Sanction</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="violationsTableBody">
          ${violations.length === 0 ? `
            <tr>
              <td colspan="7" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-list-ul fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No violation categories configured yet.<br>
                Click <strong>"Add Offense Category"</strong> to define an offense.
              </td>
            </tr>
          ` : violations.map(v => {
            const isActive = v.is_active == 1 || v.is_active === true;
            return `
              <tr style="${isActive ? '' : 'opacity:0.6; background:rgba(0,0,0,0.1);'}">
                <td><code><strong>${v.code}</strong></code></td>
                <td>
                  <strong>${v.title}</strong>
                  ${v.description ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${v.description}</div>` : ''}
                </td>
                <td><span class="badge ${v.category === 'Severe' ? 'badge-danger' : (v.category === 'Major' ? 'badge-warning' : 'badge-primary')}">${v.category}</span></td>
                <td><strong style="color: var(--primary); font-size:1rem;">-${v.demerit_points} pts</strong></td>
                <td style="font-size:0.82rem;">${v.recommended_sanction || '—'}</td>
                <td>
                  <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
                    ${isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" title="Edit Category" onclick='openEditViolationModal(${JSON.stringify(v).replace(/'/g, "&apos;")})'>
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" style="${isActive ? 'color:var(--warning);' : 'color:var(--success);'}" 
                      title="${isActive ? 'Deactivate Category' : 'Activate Category'}" 
                      onclick="toggleViolationStatus(${v.id}, ${isActive ? 'false' : 'true'}, '${v.code}')">
                      <i class="fas ${isActive ? 'fa-ban' : 'fa-check-circle'}"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Adding / Editing Violation -->
    <div class="modal-overlay" id="violationModal">
      <div class="modal-content" style="max-width:580px;">
        <div class="modal-header">
          <h3 id="violationModalTitle"><i class="fas fa-gavel" style="color:var(--accent);"></i> Create Violation Offense Category</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeViolationModal()">&times;</button>
        </div>
        <form id="violationForm" onsubmit="handleViolationSubmit(event)">
          <input type="hidden" id="v_edit_id" value="" />

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>Offense Code <span style="color:var(--danger);">*</span></label>
              <input type="text" id="v_code" placeholder="e.g. V-MIN-001, V-MAJ-001" required />
            </div>
            <div class="form-group">
              <label>Severity Category <span style="color:var(--danger);">*</span></label>
              <select id="v_category" required>
                <option value="Minor">Minor Offense</option>
                <option value="Major">Major Offense</option>
                <option value="Severe">Severe Offense</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Offense Title <span style="color:var(--danger);">*</span></label>
            <input type="text" id="v_title" placeholder="e.g. Cutting Classes / Truancy" required />
          </div>

          <div class="form-group">
            <label>Detailed Description</label>
            <textarea id="v_desc" rows="2" placeholder="Policy definition and criteria for this offense..."></textarea>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 2fr; gap:14px;">
            <div class="form-group">
              <label>Demerit Penalty <span style="color:var(--danger);">*</span></label>
              <input type="number" id="v_points" min="1" max="100" value="5" required />
            </div>
            <div class="form-group">
              <label>Recommended Sanction</label>
              <input type="text" id="v_sanction" placeholder="e.g. Written Warning & Parent Conference" />
            </div>
          </div>

          <div class="form-group" id="v_status_group" style="display:none;">
            <label>Category Status</label>
            <select id="v_is_active">
              <option value="1">Active (Available for Infraction Logging)</option>
              <option value="0">Inactive / Archived</option>
            </select>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeViolationModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveViolationBtn">
              <i class="fas fa-save"></i> Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openViolationModal = () => {
    document.getElementById('v_edit_id').value = '';
    document.getElementById('violationModalTitle').innerHTML = `<i class="fas fa-plus-circle" style="color:var(--accent);"></i> Create Violation Offense Category`;
    document.getElementById('violationForm').reset();
    document.getElementById('v_status_group').style.display = 'none';
    document.getElementById('violationModal').classList.add('active');
  };

  window.openEditViolationModal = (v) => {
    document.getElementById('v_edit_id').value = v.id;
    document.getElementById('violationModalTitle').innerHTML = `<i class="fas fa-edit" style="color:var(--accent);"></i> Edit Category: ${v.code}`;
    document.getElementById('v_code').value = v.code;
    document.getElementById('v_title').value = v.title;
    document.getElementById('v_desc').value = v.description || '';
    document.getElementById('v_category').value = v.category;
    document.getElementById('v_points').value = v.demerit_points;
    document.getElementById('v_sanction').value = v.recommended_sanction || '';
    document.getElementById('v_is_active').value = (v.is_active == 1 || v.is_active === true) ? '1' : '0';
    document.getElementById('v_status_group').style.display = 'block';
    document.getElementById('violationModal').classList.add('active');
  };

  window.closeViolationModal = () => {
    const modal = document.getElementById('violationModal');
    if (modal) modal.classList.remove('active');
  };

  window.toggleViolationStatus = async (id, activate, code) => {
    try {
      await ApiClient.post('incidents', 'toggle-violation', { is_active: activate }, { id: id });
      alert(`Violation ${code} is now ${activate ? 'Active' : 'Inactive'}.`);
      window.renderViolationsModule(container);
    } catch (err) {
      alert('Unable to update violation status: ' + (err.message || 'Server error'));
    }
  };

  window.handleViolationSubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveViolationBtn');
    if (btn) btn.disabled = true;

    const editId = document.getElementById('v_edit_id').value;
    const payload = {
      code: document.getElementById('v_code').value.trim(),
      title: document.getElementById('v_title').value.trim(),
      description: document.getElementById('v_desc').value.trim(),
      category: document.getElementById('v_category').value,
      demerit_points: parseInt(document.getElementById('v_points').value, 10),
      recommended_sanction: document.getElementById('v_sanction').value.trim(),
      is_active: document.getElementById('v_is_active') ? parseInt(document.getElementById('v_is_active').value, 10) : 1
    };

    try {
      if (editId) {
        await ApiClient.post('incidents', 'violations', payload, { id: editId });
        alert('Violation category updated successfully!');
      } else {
        await ApiClient.post('incidents', 'violations', payload);
        alert('New violation category created successfully!');
      }
      closeViolationModal();
      window.renderViolationsModule(container);
    } catch (err) {
      alert('Error saving violation: ' + (err.message || 'Server error'));
      if (btn) btn.disabled = false;
    }
  };
};
