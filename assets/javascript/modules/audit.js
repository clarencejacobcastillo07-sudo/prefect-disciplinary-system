window.renderAuditModule = async function(container) {
  let logs = [];
  try {
    const res = await ApiClient.get('reports', 'audit');
    logs = res.data || [];
  } catch (e) {
    logs = [
      { id: 1,  user_name: 'Mr. Ricardo Santos',    action: 'CREATE_INCIDENT',    module: 'Incident Management',  description: 'Filed incident report INC-2026-0001 against Juan Dela Cruz (Grade 10) for Cutting Classes',         ip_address: '127.0.0.1', created_at: '2026-07-20 10:15:00' },
      { id: 2,  user_name: 'Mr. Ricardo Santos',    action: 'FLAG_CLEARANCE',     module: 'Clearance Hold',        description: 'Flagged clearance hold for Juan Dela Cruz pending parent acknowledgment slip',                      ip_address: '127.0.0.1', created_at: '2026-07-20 10:16:00' },
      { id: 3,  user_name: 'Mr. Ricardo Santos',    action: 'CREATE_SANCTION',    module: 'Disciplinary Hearings', description: 'Issued 1-Day In-School Suspension & Reflection Paper to Juan Dela Cruz (INC-2026-0001)',            ip_address: '127.0.0.1', created_at: '2026-07-20 10:18:00' },
      { id: 4,  user_name: 'Mr. Ricardo Santos',    action: 'SEND_SMS',           module: 'Parent Notification',   description: 'Sent SMS to parent Pedro Dela Cruz regarding INC-2026-0001 cutting classes incident',               ip_address: '127.0.0.1', created_at: '2026-07-20 10:19:00' },
      { id: 5,  user_name: 'Ms. Maria Teresa Cruz', action: 'CREATE_INCIDENT',    module: 'Incident Management',   description: 'Filed incident report INC-2026-0002 against Mark Anthony Bautista (Grade 9) for Bullying',         ip_address: '127.0.0.1', created_at: '2026-07-22 13:30:00' },
      { id: 6,  user_name: 'Mr. Ricardo Santos',    action: 'FLAG_CLEARANCE',     module: 'Clearance Hold',        description: 'Flagged clearance hold for Mark Anthony Bautista pending investigation and hearing',                 ip_address: '127.0.0.1', created_at: '2026-07-22 13:32:00' },
      { id: 7,  user_name: 'Mr. Ricardo Santos',    action: 'SCHEDULE_HEARING',   module: 'Disciplinary Hearings', description: 'Scheduled disciplinary hearing on 2026-08-05 for INC-2026-0002 (Bullying case)',                   ip_address: '127.0.0.1', created_at: '2026-07-22 13:45:00' },
      { id: 8,  user_name: 'Mr. Ricardo Santos',    action: 'SEND_SMS',           module: 'Parent Notification',   description: 'Sent SMS to parent Antonio Bautista regarding hearing on 2026-08-05',                              ip_address: '127.0.0.1', created_at: '2026-07-22 13:47:00' },
      { id: 9,  user_name: 'Ms. Maria Teresa Cruz', action: 'ASSIGN_REFORMATION', module: 'Reformation Program',   description: 'Assigned Campus Eco-Cleanliness & Reflection program to Juan Dela Cruz (10 hrs)',                   ip_address: '127.0.0.1', created_at: '2026-07-21 09:30:00' },
      { id: 10, user_name: 'Ms. Maria Teresa Cruz', action: 'ASSIGN_REFORMATION', module: 'Reformation Program',   description: 'Assigned Peer Sensitivity & Behavior Coaching to Mark Anthony Bautista (8 hrs)',                   ip_address: '127.0.0.1', created_at: '2026-07-23 10:00:00' },
      { id: 11, user_name: 'Mr. Ricardo Santos',    action: 'CREATE_INCIDENT',    module: 'Incident Management',   description: 'Filed incident report INC-2026-0003 against Christian Navarro (Grade 8) for Brawling',             ip_address: '127.0.0.1', created_at: '2026-07-25 15:45:00' },
      { id: 12, user_name: 'Mr. Ricardo Santos',    action: 'FLAG_CLEARANCE',     module: 'Clearance Hold',        description: 'Flagged clearance hold for Christian Navarro pending Disciplinary Board resolution',                ip_address: '127.0.0.1', created_at: '2026-07-25 15:47:00' },
      { id: 13, user_name: 'Mr. Ricardo Santos',    action: 'SCHEDULE_HEARING',   module: 'Disciplinary Hearings', description: 'Scheduled escalated hearing on 2026-08-10 for INC-2026-0003 (Brawling — Principal presiding)',     ip_address: '127.0.0.1', created_at: '2026-07-25 16:00:00' },
      { id: 14, user_name: 'Mr. Ricardo Santos',    action: 'SEND_SMS',           module: 'Parent Notification',   description: 'Sent urgent SMS to parent Roberto Navarro regarding brawling incident INC-2026-0003',               ip_address: '127.0.0.1', created_at: '2026-07-25 16:05:00' },
      { id: 15, user_name: 'System Administrator',  action: 'CREATE_USER',        module: 'User Management',       description: 'Created user accounts for all staff roles during initial system setup',                            ip_address: '127.0.0.1', created_at: '2026-06-01 08:00:00' }
    ];
  }

  const actionColorMap = {
    'CREATE_INCIDENT':    'badge-danger',
    'FLAG_CLEARANCE':     'badge-warning',
    'CREATE_SANCTION':    'badge-warning',
    'SEND_SMS':           'badge-primary',
    'SCHEDULE_HEARING':   'badge-primary',
    'ASSIGN_REFORMATION': 'badge-success',
    'CREATE_USER':        'badge-success',
    'LOGIN':              'badge-success',
    'LOGOUT':             'badge-primary',
    'UPDATE_SETTINGS':    'badge-primary',
    'DEDUCT_POINTS':      'badge-danger',
    'AWARD_POINTS':       'badge-success'
  };

  const actionIconMap = {
    'CREATE_INCIDENT':    'fa-file-alt',
    'FLAG_CLEARANCE':     'fa-lock',
    'CREATE_SANCTION':    'fa-gavel',
    'SEND_SMS':           'fa-sms',
    'SCHEDULE_HEARING':   'fa-calendar-check',
    'ASSIGN_REFORMATION': 'fa-hands-helping',
    'CREATE_USER':        'fa-user-plus',
    'LOGIN':              'fa-sign-in-alt',
    'LOGOUT':             'fa-sign-out-alt',
    'UPDATE_SETTINGS':    'fa-sliders-h',
    'DEDUCT_POINTS':      'fa-minus-circle',
    'AWARD_POINTS':       'fa-plus-circle'
  };

  const moduleColorMap = {
    'Incident Management':  'var(--danger)',
    'Clearance Hold':       'var(--warning)',
    'Disciplinary Hearings':'var(--warning)',
    'Parent Notification':  'var(--accent)',
    'Reformation Program':  'var(--success)',
    'User Management':      'var(--success)',
    'Behavior Points':      'var(--info)'
  };

  // Get unique modules and users for filters
  const modules = [...new Set(logs.map(l => l.module))];
  const userNames = [...new Set(logs.map(l => l.user_name))];

  container.innerHTML = `
    <!-- Page Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-clipboard-list" style="color:var(--accent); margin-right:10px;"></i>System Audit Trail
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          Immutable chronological record of all system operations, user actions, and data changes.
        </p>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-secondary" onclick="exportAuditCSV()">
          <i class="fas fa-file-csv" style="color:var(--success);"></i> Export CSV
        </button>
        <button class="btn btn-primary" onclick="window.print()">
          <i class="fas fa-print"></i> Print Log
        </button>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="card-grid" style="margin-bottom:25px;">
      <div class="card metric-card">
        <div class="metric-info">
          <h3>${logs.length}</h3>
          <p>Total Events Logged</p>
        </div>
        <div class="metric-icon"><i class="fas fa-clipboard-list"></i></div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color:var(--danger);">${logs.filter(l => l.action === 'CREATE_INCIDENT').length}</h3>
          <p>Incidents Created</p>
        </div>
        <div class="metric-icon" style="background:rgba(239,68,68,0.15); color:var(--danger);">
          <i class="fas fa-file-alt"></i>
        </div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color:var(--accent);">${logs.filter(l => l.action === 'SEND_SMS').length}</h3>
          <p>SMS Notifications Sent</p>
        </div>
        <div class="metric-icon" style="background:rgba(255,95,162,0.15); color:var(--accent);">
          <i class="fas fa-sms"></i>
        </div>
      </div>
      <div class="card metric-card">
        <div class="metric-info">
          <h3 style="color:var(--success);">${userNames.length}</h3>
          <p>Active Staff Operators</p>
        </div>
        <div class="metric-icon" style="background:rgba(16,185,129,0.15); color:var(--success);">
          <i class="fas fa-users"></i>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card card-dark" style="padding:16px 20px; margin-bottom:20px; display:flex; gap:14px; flex-wrap:wrap; align-items:center;">
      <div style="position:relative; flex:2; min-width:200px;">
        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.85rem;"></i>
        <input type="text" id="auditSearchInput" placeholder="Search descriptions, actions..." oninput="filterAuditLogs()"
          style="width:100%; padding:9px 12px 9px 34px; border-radius:var(--radius-sm); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-light); font-size:0.85rem; outline:none;" />
      </div>
      <div style="flex:1; min-width:160px;">
        <select id="auditModuleFilter" onchange="filterAuditLogs()"
          style="width:100%; padding:9px 12px; border-radius:var(--radius-sm); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-light); font-size:0.85rem; outline:none;">
          <option value="">All Modules</option>
          ${modules.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div style="flex:1; min-width:160px;">
        <select id="auditUserFilter" onchange="filterAuditLogs()"
          style="width:100%; padding:9px 12px; border-radius:var(--radius-sm); border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-light); font-size:0.85rem; outline:none;">
          <option value="">All Staff</option>
          ${userNames.map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="clearAuditFilters()" style="white-space:nowrap;">
        <i class="fas fa-times"></i> Clear
      </button>
      <span id="auditResultCount" style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">${logs.length} entries</span>
    </div>

    <!-- Audit Log Table -->
    <div class="table-container">
      <div class="table-header">
        <h3><i class="fas fa-history" style="color:var(--accent);"></i> Audit Event Log</h3>
        <span style="font-size:0.78rem; color:var(--text-muted); padding:4px 10px; background:rgba(239,68,68,0.1); border-radius:20px; border:1px solid rgba(239,68,68,0.2); color:var(--danger);">
          <i class="fas fa-lock" style="font-size:0.7rem;"></i> Immutable — Read Only
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Event ID</th>
            <th>Performed By</th>
            <th>Action</th>
            <th>Module</th>
            <th>Operation Description</th>
            <th>IP Address</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody id="auditTableBody">
          ${logs.map(l => `
            <tr
              data-desc="${l.description.toLowerCase()}"
              data-action="${(l.action || '').toLowerCase()}"
              data-module="${l.module}"
              data-user="${l.user_name}">
              <td>
                <code style="font-size:0.78rem; color:var(--accent);">#AUD-${String(l.id).padStart(3,'0')}</code>
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,var(--primary),#2D1424); border:1.5px solid var(--accent); display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800; color:#fff; flex-shrink:0;">
                    ${(l.user_name || 'SYS').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                  </div>
                  <strong style="font-size:0.83rem;">${l.user_name || 'System'}</strong>
                </div>
              </td>
              <td>
                <span class="badge ${actionColorMap[l.action] || 'badge-primary'}" style="white-space:nowrap;">
                  <i class="fas ${actionIconMap[l.action] || 'fa-circle'}" style="margin-right:4px;"></i>${l.action}
                </span>
              </td>
              <td>
                <span style="font-size:0.8rem; color:${moduleColorMap[l.module] || 'var(--text-muted)'}; font-weight:600;">
                  ${l.module}
                </span>
              </td>
              <td style="max-width:320px; font-size:0.8rem; color:var(--text-muted); line-height:1.5;">${l.description}</td>
              <td><code style="font-size:0.75rem;">${l.ip_address || '127.0.0.1'}</code></td>
              <td style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">${l.created_at}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div id="auditEmptyState" style="display:none; text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-search fa-2x" style="margin-bottom:10px; color:var(--border-color);"></i>
        <p>No audit log entries match your search filters.</p>
      </div>
    </div>
  `;

  // Filter logic
  window.filterAuditLogs = () => {
    const q      = (document.getElementById('auditSearchInput')?.value   || '').toLowerCase();
    const module = (document.getElementById('auditModuleFilter')?.value  || '');
    const user   = (document.getElementById('auditUserFilter')?.value    || '');
    const rows   = document.querySelectorAll('#auditTableBody tr');
    let visible  = 0;

    rows.forEach(row => {
      const desc   = row.getAttribute('data-desc')   || '';
      const action = row.getAttribute('data-action') || '';
      const mod    = row.getAttribute('data-module') || '';
      const usr    = row.getAttribute('data-user')   || '';

      const matchQ      = !q      || desc.includes(q)   || action.includes(q);
      const matchModule = !module || mod === module;
      const matchUser   = !user   || usr === user;

      const show = matchQ && matchModule && matchUser;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    const countEl = document.getElementById('auditResultCount');
    if (countEl) countEl.textContent = `${visible} entries`;
    const emptyEl = document.getElementById('auditEmptyState');
    if (emptyEl) emptyEl.style.display = visible === 0 ? 'block' : 'none';
  };

  window.clearAuditFilters = () => {
    const s = document.getElementById('auditSearchInput');
    const m = document.getElementById('auditModuleFilter');
    const u = document.getElementById('auditUserFilter');
    if (s) s.value = '';
    if (m) m.value = '';
    if (u) u.value = '';
    filterAuditLogs();
  };

  window.exportAuditCSV = () => {
    const headers = ['Log ID','Performed By','Action','Module','Description','IP Address','Timestamp'];
    const rows = [...document.querySelectorAll('#auditTableBody tr')]
      .filter(r => r.style.display !== 'none')
      .map(r => {
        const cells = r.querySelectorAll('td');
        return [
          cells[0]?.innerText.trim(),
          cells[1]?.innerText.trim(),
          cells[2]?.innerText.trim(),
          cells[3]?.innerText.trim(),
          '"' + (cells[4]?.innerText.trim().replace(/"/g,'""') || '') + '"',
          cells[5]?.innerText.trim(),
          cells[6]?.innerText.trim()
        ].join(',');
      });
    const csv = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'St_Agnes_Audit_Log_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};
