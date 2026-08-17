window.renderUsersModule = async function(container) {
  let users = [];
  let roles = [
    { id: 1, name: 'Administrator' },
    { id: 2, name: 'Prefect Officer' },
    { id: 3, name: 'Guidance Counselor' },
    { id: 4, name: 'Principal' }
  ];

  try {
    const res = await ApiClient.get('auth', 'users');
    users = res.data || [];
  } catch (e) {
    users = [
      { id: 1, full_name: 'System Administrator',  email: 'admin@stagnes.edu.ph',     role_id: 1, role_name: 'Administrator',        is_active: true,  created_at: '2026-06-01' },
      { id: 2, full_name: 'Mr. Ricardo Santos',    email: 'prefect@stagnes.edu.ph',   role_id: 2, role_name: 'Prefect Officer',       is_active: true,  created_at: '2026-06-01' },
      { id: 3, full_name: 'Ms. Maria Teresa Cruz', email: 'guidance@stagnes.edu.ph',  role_id: 3, role_name: 'Guidance Counselor',    is_active: true,  created_at: '2026-06-01' },
      { id: 4, full_name: 'Sr. Agnes D. Reyes',    email: 'principal@stagnes.edu.ph', role_id: 4, role_name: 'Principal',             is_active: true,  created_at: '2026-06-01' }
    ];
  }

  const roleColorMap = {
    'Administrator':     'badge-danger',
    'Prefect Officer':   'badge-warning',
    'Guidance Counselor':'badge-primary',
    'Principal':         'badge-success'
  };

  const roleIconMap = {
    'Administrator':     'fa-user-shield',
    'Prefect Officer':   'fa-gavel',
    'Guidance Counselor':'fa-user-nurse',
    'Principal':         'fa-user-tie'
  };

  const initials = name => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  container.innerHTML = `
    <!-- Page Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-users-cog" style="color:var(--accent); margin-right:10px;"></i>User Management & RBAC
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          Manage system accounts for Administrator, Prefect Officers, Guidance Counselors, and Principal.
        </p>
      </div>
      <button class="btn btn-primary" id="openAddUserBtn" onclick="openAddUserModal()">
        <i class="fas fa-user-plus"></i> Add New User
      </button>
    </div>

    <!-- Role Summary Cards -->
    <div class="card-grid" style="margin-bottom:25px;">
      ${[
        { label: 'Administrators',      icon: 'fa-user-shield', color: 'var(--danger)',  count: users.filter(u => u.role_name === 'Administrator').length },
        { label: 'Prefect Officers',    icon: 'fa-gavel',       color: 'var(--warning)', count: users.filter(u => u.role_name === 'Prefect Officer').length },
        { label: 'Guidance Counselors', icon: 'fa-user-nurse',  color: 'var(--accent)',  count: users.filter(u => u.role_name === 'Guidance Counselor').length },
        { label: 'Principal Accounts',  icon: 'fa-user-tie',    color: 'var(--success)', count: users.filter(u => u.role_name === 'Principal').length }
      ].map(c => `
        <div class="card metric-card">
          <div class="metric-info">
            <h3 style="color:${c.color};">${c.count}</h3>
            <p>${c.label}</p>
          </div>
          <div class="metric-icon" style="background:${c.color}20; color:${c.color}; border-color:${c.color}40;">
            <i class="fas ${c.icon}"></i>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-list" style="color:var(--accent);"></i> System User Accounts</h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${users.length} user account(s) registered</p>
        </div>
        <div style="display:flex; gap:10px;">
          <div style="position:relative;">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.85rem;"></i>
            <input type="text" id="userSearchInput" placeholder="Search name or email..." oninput="filterUsersTable(this.value)"
              style="padding:8px 12px 8px 34px; border-radius:var(--radius-sm); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-light); font-size:0.85rem; width:220px; outline:none;" />
          </div>
        </div>
      </div>
      <table id="usersTable">
        <thead>
          <tr>
            <th>User</th>
            <th>Email Address</th>
            <th>Assigned Role</th>
            <th>Account Status</th>
            <th>Date Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="usersTableBody">
          ${users.map(u => `
            <tr data-name="${u.full_name.toLowerCase()}" data-email="${u.email.toLowerCase()}">
              <td>
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, var(--primary), #2D1424); border:2px solid var(--accent); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.78rem; color:#fff; flex-shrink:0;">
                    ${initials(u.full_name)}
                  </div>
                  <div>
                    <strong style="display:block;">${u.full_name}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted);">#USR-0${u.id}</span>
                  </div>
                </div>
              </td>
              <td><a href="mailto:${u.email}" style="color:var(--accent); text-decoration:none;">${u.email}</a></td>
              <td>
                <span class="badge ${roleColorMap[u.role_name] || 'badge-primary'}">
                  <i class="fas ${roleIconMap[u.role_name] || 'fa-user'}" style="margin-right:4px;"></i>${u.role_name}
                </span>
              </td>
              <td>
                <span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">
                  <i class="fas ${u.is_active ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right:4px;"></i>${u.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style="color:var(--text-muted); font-size:0.83rem;">${u.created_at || 'N/A'}</td>
              <td>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-secondary btn-sm" onclick="openEditUserModal(${u.id}, '${u.full_name.replace(/'/g,"\\'")}', '${u.email}', ${u.role_id}, ${u.is_active})" title="Edit User">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  ${u.id !== 1 ? `
                  <button class="btn btn-sm" style="background:rgba(239,68,68,0.1); color:var(--danger); border:1px solid rgba(239,68,68,0.3);"
                    onclick="confirmToggleUserStatus(${u.id}, '${u.full_name.replace(/'/g,"\\'")}', ${u.is_active})" title="${u.is_active ? 'Deactivate' : 'Activate'} Account">
                    <i class="fas ${u.is_active ? 'fa-user-slash' : 'fa-user-check'}"></i>
                  </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Add / Edit User Modal -->
    <div class="modal-overlay" id="userModal">
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
          <h3 id="userModalTitle"><i class="fas fa-user-plus" style="color:var(--accent);"></i> Add New User Account</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeUserModal()">&times;</button>
        </div>
        <form id="userForm" onsubmit="handleUserFormSubmit(event)">
          <input type="hidden" id="u_edit_id" value="" />

          <div class="form-group">
            <label>Full Name <span style="color:var(--danger);">*</span></label>
            <input type="text" id="u_full_name" placeholder="e.g. Mr. Juan Dela Cruz" required />
          </div>

          <div class="form-group">
            <label>Email Address <span style="color:var(--danger);">*</span></label>
            <input type="email" id="u_email" placeholder="name@stagnes.edu.ph" required />
          </div>

          <div class="form-group">
            <label>Assigned System Role <span style="color:var(--danger);">*</span></label>
            <select id="u_role_id" required>
              <option value="">-- Select Role --</option>
              ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
          </div>

          <div id="u_password_group" class="form-group">
            <label>Password <span style="color:var(--danger);" id="u_password_req">*</span></label>
            <input type="password" id="u_password" placeholder="Minimum 8 characters" />
            <p id="u_password_hint" style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Leave blank to keep existing password (edit mode only).</p>
          </div>

          <div class="form-group">
            <label>Account Status</label>
            <select id="u_is_active">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          <div style="background:rgba(255,95,162,0.06); border:1px solid rgba(255,95,162,0.2); border-radius:var(--radius-sm); padding:12px 14px; font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;">
            <i class="fas fa-info-circle" style="color:var(--accent);"></i>
            <strong>Default credentials:</strong> Password should meet St. Agnes Academy policy (min 8 characters, 1 uppercase, 1 number).
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--border-color); padding-top:16px;">
            <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveUserBtn">
              <i class="fas fa-save"></i> <span id="saveUserBtnText">Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // --- Filter ---
  window.filterUsersTable = (query) => {
    const q = query.toLowerCase();
    document.querySelectorAll('#usersTableBody tr').forEach(row => {
      const name  = row.getAttribute('data-name')  || '';
      const email = row.getAttribute('data-email') || '';
      row.style.display = (name.includes(q) || email.includes(q)) ? '' : 'none';
    });
  };

  // --- Modal helpers ---
  window.openAddUserModal = () => {
    document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-plus" style="color:var(--accent);"></i> Add New User Account';
    document.getElementById('saveUserBtnText').textContent = 'Create Account';
    document.getElementById('u_edit_id').value = '';
    document.getElementById('userForm').reset();
    document.getElementById('u_password_hint').style.display = 'none';
    document.getElementById('u_password').required = true;
    document.getElementById('userModal').classList.add('active');
  };

  window.openEditUserModal = (id, name, email, roleId, isActive) => {
    document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-edit" style="color:var(--accent);"></i> Edit User Account';
    document.getElementById('saveUserBtnText').textContent = 'Save Changes';
    document.getElementById('u_edit_id').value = id;
    document.getElementById('u_full_name').value = name;
    document.getElementById('u_email').value = email;
    document.getElementById('u_role_id').value = roleId;
    document.getElementById('u_is_active').value = isActive ? '1' : '0';
    document.getElementById('u_password').value = '';
    document.getElementById('u_password').required = false;
    document.getElementById('u_password_hint').style.display = 'block';
    document.getElementById('userModal').classList.add('active');
  };

  window.closeUserModal = () => document.getElementById('userModal').classList.remove('active');

  window.confirmToggleUserStatus = (id, name, isActive) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} account for "${name}"?`)) {
      ApiClient.post('auth', `users/${id}/toggle-status`, {}).then(() => {
        window.renderUsersModule(container);
      }).catch(() => {
        alert(`Status updated for ${name} (demo mode).`);
        window.renderUsersModule(container);
      });
    }
  };

  window.handleUserFormSubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveUserBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

    const editId = document.getElementById('u_edit_id').value;
    const payload = {
      full_name: document.getElementById('u_full_name').value,
      email:     document.getElementById('u_email').value,
      role_id:   document.getElementById('u_role_id').value,
      is_active: document.getElementById('u_is_active').value === '1',
      password:  document.getElementById('u_password').value || undefined
    };

    try {
      if (editId) {
        await ApiClient.post('auth', `users/${editId}`, payload);
        alert(`User account for "${payload.full_name}" updated successfully!`);
      } else {
        await ApiClient.post('auth', 'users', payload);
        alert(`New user account for "${payload.full_name}" created successfully!\nDefault role: ${roles.find(r => r.id == payload.role_id)?.name}`);
      }
      closeUserModal();
      window.renderUsersModule(container);
    } catch (err) {
      // Demo fallback
      alert(`Account ${editId ? 'updated' : 'created'} for "${payload.full_name}" (demo mode).`);
      closeUserModal();
      window.renderUsersModule(container);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> <span id="saveUserBtnText">' + (editId ? 'Save Changes' : 'Create Account') + '</span>';
    }
  };
};
