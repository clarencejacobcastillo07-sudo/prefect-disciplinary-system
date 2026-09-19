/**
 * Parent Notification & SMS Gateway Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 * Features: Live Semaphore API, Automated Event Trail, Delivery Tracking & Analytics
 */

window.renderNotificationsModule = async function(container) {
  let logs = [];
  let stats = null;
  let selectedStudent = null;
  let searchTimeout = null;
  let activeFilterStatus = '';
  let activeSearchQuery = '';

  async function loadData() {
    try {
      const [logsRes, statsRes] = await Promise.all([
        ApiClient.get('notifications', 'logs', null, { 
          status: activeFilterStatus, 
          search: activeSearchQuery 
        }),
        ApiClient.get('notifications', 'stats')
      ]);
      logs = logsRes.data || [];
      stats = statsRes.data || null;
    } catch (e) {
      console.error('Error fetching SMS data:', e);
      logs = [];
      stats = null;
    }
  }

  await loadData();

  function renderView() {
    const metrics = stats?.metrics || {
      total_dispatched: logs.length,
      total_successful: logs.filter(l => ['Delivered', 'Sent', 'Simulated'].includes(l.status)).length,
      total_delivered: logs.filter(l => l.status === 'Delivered').length,
      total_simulated: logs.filter(l => l.status === 'Simulated').length,
      total_queued: logs.filter(l => l.status === 'Queued').length,
      total_failed: logs.filter(l => l.status === 'Failed').length,
      success_rate: 100
    };

    const gateway = stats?.gateway || {
      balance: 500,
      status: 'Active (Sandbox Simulation)',
      sender_name: 'STAGNES',
      mode: 'sandbox'
    };

    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-sms" style="color: var(--primary);"></i> Parent Alerts SMS System &amp; Dispatch Trail
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted);">Real-time Semaphore SMS Gateway integration, automatic disciplinary alerts, and delivery receipts.</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:8px; background:var(--secondary-bg); padding:8px 16px; border-radius:var(--radius-full); border:1px solid rgba(255,255,255,0.1);">
            <span style="width:10px; height:10px; background:${gateway.mode === 'production' ? '#10B981' : '#3B82F6'}; border-radius:50%; display:inline-block;"></span>
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-light);">
              ${gateway.sender_name} &bull; ${gateway.status}
            </span>
          </div>
          <button class="btn btn-secondary" id="syncDeliveryBtn" onclick="handleSyncDelivery()">
            <i class="fas fa-sync-alt"></i> Sync Delivery Receipts
          </button>
          <button class="btn btn-primary" onclick="openSmsModal()">
            <i class="fas fa-paper-plane"></i> Dispatch Custom SMS
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:16px; margin-bottom:24px;">
        <div style="background:var(--secondary-bg); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-md); padding:16px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px;">Total Dispatched</div>
              <div style="font-size:1.8rem; font-weight:800; color:var(--text-light); margin-top:4px;">${metrics.total_dispatched}</div>
            </div>
            <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:rgba(99,102,241,0.15); color:#818CF8; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
              <i class="fas fa-paper-plane"></i>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">All parent alerts sent</div>
        </div>

        <div style="background:var(--secondary-bg); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-md); padding:16px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px;">Delivery Success</div>
              <div style="font-size:1.8rem; font-weight:800; color:#10B981; margin-top:4px;">${metrics.success_rate}%</div>
            </div>
            <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:rgba(16,185,129,0.15); color:#10B981; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
              <i class="fas fa-check-circle"></i>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">${metrics.total_delivered || metrics.total_successful} successful deliveries</div>
        </div>

        <div style="background:var(--secondary-bg); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-md); padding:16px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px;">Gateway Balance</div>
              <div style="font-size:1.8rem; font-weight:800; color:#3B82F6; margin-top:4px;">${gateway.balance} <span style="font-size:0.9rem; font-weight:500;">credits</span></div>
            </div>
            <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:rgba(59,130,246,0.15); color:#3B82F6; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
              <i class="fas fa-coins"></i>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Semaphore SMS pool balance</div>
        </div>

        <div style="background:var(--secondary-bg); border:1px solid rgba(255,255,255,0.08); border-radius:var(--radius-md); padding:16px; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px;">Pending / Queued</div>
              <div style="font-size:1.8rem; font-weight:800; color:#F59E0B; margin-top:4px;">${metrics.total_queued}</div>
            </div>
            <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:rgba(245,158,11,0.15); color:#F59E0B; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
              <i class="fas fa-clock"></i>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Awaiting telco confirmation</div>
        </div>
      </div>

      <!-- Filters and Table Container -->
      <div class="table-container">
        <div class="table-header" style="flex-wrap:wrap; gap:12px;">
          <div>
            <h3>Audit Dispatch Trail &amp; SMS Logs</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Detailed record of all automatic and manual parent notifications.</p>
          </div>
          
          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <!-- Status Filter -->
            <select id="smsStatusFilter" class="form-control" style="width:auto; padding:6px 12px; font-size:0.85rem;" onchange="handleStatusFilterChange(this.value)">
              <option value="" ${activeFilterStatus === '' ? 'selected' : ''}>All Statuses</option>
              <option value="Delivered" ${activeFilterStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Sent" ${activeFilterStatus === 'Sent' ? 'selected' : ''}>Sent</option>
              <option value="Simulated" ${activeFilterStatus === 'Simulated' ? 'selected' : ''}>Simulated</option>
              <option value="Queued" ${activeFilterStatus === 'Queued' ? 'selected' : ''}>Queued</option>
              <option value="Failed" ${activeFilterStatus === 'Failed' ? 'selected' : ''}>Failed</option>
            </select>

            <!-- Search input -->
            <div class="student-search-input-wrap" style="width:240px;">
              <i class="fas fa-search"></i>
              <input type="text" id="smsLogSearchInput" value="${activeSearchQuery}" placeholder="Search student, phone, or text..." oninput="handleLogSearch(this.value)" autocomplete="off" />
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Log Ref</th>
              <th>Student &amp; LRN</th>
              <th>Guardian Contact</th>
              <th>Message Preview</th>
              <th>Gateway</th>
              <th>Status</th>
              <th>Dispatched By</th>
              <th>Sent At</th>
              <th style="text-align:center;">Action</th>
            </tr>
          </thead>
          <tbody id="notificationsTableBody">
            ${logs.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align:center; color:var(--text-muted); padding:40px;">
                  <i class="fas fa-sms fa-2x" style="margin-bottom:12px; opacity:0.4; display:block;"></i>
                  No parent SMS notifications matched your filter criteria.<br>
                  Dispatches trigger automatically when logging incidents, hearings, sanctions, or clearance holds.
                </td>
              </tr>
            ` : logs.map(l => {
              let badgeClass = 'badge-primary';
              if (l.status === 'Delivered' || l.status === 'Sent') badgeClass = 'badge-success';
              else if (l.status === 'Simulated') badgeClass = 'badge-info';
              else if (l.status === 'Queued') badgeClass = 'badge-warning';
              else if (l.status === 'Failed') badgeClass = 'badge-danger';

              return `
                <tr>
                  <td><code>#SMS-${l.id}</code></td>
                  <td>
                    <strong>${l.first_name} ${l.last_name}</strong><br>
                    <small style="color:var(--text-muted); font-size:0.75rem;">LRN: ${l.lrn || 'N/A'}</small>
                  </td>
                  <td>
                    <code>${l.phone_number}</code>
                    ${l.guardian_name ? `<br><small style="color:var(--text-muted); font-size:0.75rem;">${l.guardian_name}</small>` : ''}
                  </td>
                  <td style="max-width:280px; font-size:0.82rem; line-height:1.4;">${l.message_content}</td>
                  <td><span class="badge badge-primary">${l.provider}</span></td>
                  <td><span class="badge ${badgeClass}">${l.status}</span></td>
                  <td style="font-size:0.8rem; color:var(--text-muted);">${l.sent_by_name || 'System Event'}</td>
                  <td style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">${l.created_at}</td>
                  <td style="text-align:center;">
                    <button class="btn btn-secondary btn-sm" onclick='viewPayloadModal(${JSON.stringify(l).replace(/'/g, "&apos;")})' title="View Payload &amp; Delivery Details">
                      <i class="fas fa-info-circle"></i>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Modal for Custom SMS -->
      <div class="modal-overlay" id="smsModal">
        <div class="modal-content" style="max-width:640px;">
          <div class="modal-header">
            <h3><i class="fas fa-paper-plane" style="color:var(--primary);"></i> Send Parent SMS Alert</h3>
            <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeSmsModal()">&times;</button>
          </div>
          <form id="smsForm" onsubmit="handleSmsSubmit(event)">
            
            <!-- Student Search & Selection -->
            <div class="form-group">
              <label>Select Student <span style="color:var(--danger);">*</span></label>
              <input type="hidden" id="sms_student_id" value="" />
              <input type="hidden" id="sms_parent_id" value="" />

              <div id="sms_student_search_container">
                <div class="student-lookup-box">
                  <div class="student-search-input-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" id="sms_student_search_query" placeholder="Search Student Name, LRN, or Grade Level..." oninput="handleSmsStudentSearch(this.value)" autocomplete="off" />
                  </div>
                  <button type="button" class="btn btn-secondary" onclick="triggerSmsStudentSearch()">Search</button>
                </div>
                <div id="sms_student_search_status" style="margin-top: 6px;"></div>
              </div>

              <!-- Selected Student Card with Auto-filled Guardian Phone -->
              <div id="sms_selected_student_display" style="display: none;" class="selected-student-card">
                <div class="selected-student-header">
                  <h4><i class="fas fa-user-check"></i> Selected Student &amp; Parent Record</h4>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="clearSmsStudent()">Change</button>
                </div>
                <div class="selected-student-grid">
                  <div class="selected-student-field">
                    <span class="label">ID / LRN</span>
                    <span class="value" id="sms_sel_lrn">-</span>
                  </div>
                  <div class="selected-student-field">
                    <span class="label">Name</span>
                    <span class="value" id="sms_sel_name">-</span>
                  </div>
                  <div class="selected-student-field">
                    <span class="label">Grade & Section</span>
                    <span class="value" id="sms_sel_grade">-</span>
                  </div>
                  <div class="selected-student-field">
                    <span class="label">Registered Guardian</span>
                    <span class="value" id="sms_sel_guardian">-</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Guardian Mobile Number <span style="color:var(--danger);">*</span></label>
              <input type="text" id="sms_phone" placeholder="09171234567" pattern="^(09|\\+639|639)[0-9]{9}$" required />
              <small style="color:var(--text-muted); font-size:0.75rem;">Philippine mobile numbers (Globe, Smart, TNT, TM, DITO) are automatically normalized.</small>
            </div>

            <div class="form-group">
              <label>Quick Message Templates</label>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('infraction')">Infraction Notice</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('hearing')">Hearing Summons</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('sanction')">Sanction Notice</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('clearance')">Clearance Hold</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('reformation')">Reformation Program</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('merit')">Merit Commendation</button>
              </div>
              <label>SMS Message Content <span style="color:var(--danger);">*</span></label>
              <textarea id="sms_message" rows="3" maxlength="160" placeholder="ST. AGNES ACADEMY NOTICE: Dear Guardian, ..." required oninput="updateSmsCharCount(this.value)"></textarea>
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                <span>1 Standard SMS Segment (160 characters max)</span>
                <span id="smsCharCount">0 / 160 characters</span>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
              <button type="button" class="btn btn-secondary" onclick="closeSmsModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" id="sendSmsSubmitBtn"><i class="fas fa-paper-plane"></i> Dispatch Parent Alert</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Payload & Delivery Details Modal -->
      <div class="modal-overlay" id="payloadModal">
        <div class="modal-content" style="max-width:580px;">
          <div class="modal-header">
            <h3><i class="fas fa-info-circle" style="color:var(--primary);"></i> SMS Delivery Details</h3>
            <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closePayloadModal()">&times;</button>
          </div>
          <div id="payloadModalBody" style="padding:10px 0;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:16px;">
            <button class="btn btn-secondary" onclick="closePayloadModal()">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  renderView();

  // Search & Filters
  window.handleStatusFilterChange = async (status) => {
    activeFilterStatus = status;
    await loadData();
    renderView();
  };

  window.handleLogSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      activeSearchQuery = query.trim();
      await loadData();
      renderView();
    }, 300);
  };

  // Sync Delivery Receipts
  window.handleSyncDelivery = async () => {
    const btn = document.getElementById('syncDeliveryBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Syncing...`;
    }

    try {
      const res = await ApiClient.post('notifications', 'sync', {});
      alert(`Synchronized ${res.data?.updated_count || 0} SMS delivery records with Semaphore gateway.`);
      await loadData();
      renderView();
    } catch (e) {
      alert('Failed to sync delivery receipts: ' + (e.message || 'Network error'));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-sync-alt"></i> Sync Delivery Receipts`;
      }
    }
  };

  // Student Search for SMS
  window.handleSmsStudentSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSmsStudentSearch(query), 300);
  };

  window.triggerSmsStudentSearch = () => {
    const q = document.getElementById('sms_student_search_query').value;
    performSmsStudentSearch(q);
  };

  window.performSmsStudentSearch = async (query) => {
    const area = document.getElementById('sms_student_search_status');
    if (!area) return;
    area.innerHTML = `<div style="padding:8px; font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Searching students...</div>`;

    try {
      const res = await ApiClient.get('students', 'list', null, { search: query.trim() });
      const found = res.data || [];
      if (found.length === 0) {
        area.innerHTML = `<div style="padding:6px; font-size:0.8rem; color:var(--warning);">No matching student found.</div>`;
      } else {
        area.innerHTML = `
          <div style="max-height:160px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-sm); margin-top:4px;">
            ${found.map(s => `
              <div style="padding:8px 12px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer;" 
                   onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'"
                   onclick='selectSmsStudent(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                <div>
                  <strong>${s.first_name} ${s.last_name}</strong> 
                  <span style="font-size:0.75rem; color:var(--text-muted);">(${s.lrn} — ${s.grade_level} - ${s.section})</span>
                  ${s.guardian_phone ? `<span style="font-size:0.75rem; color:#10B981; margin-left:6px;"><i class="fas fa-phone-alt"></i> ${s.guardian_phone}</span>` : '<span style="font-size:0.75rem; color:var(--danger); margin-left:6px;">No phone</span>'}
                </div>
                <button type="button" class="btn btn-primary btn-sm">Select</button>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (e) {
      area.innerHTML = `<div style="padding:6px; font-size:0.8rem; color:var(--danger);">Error searching students.</div>`;
    }
  };

  window.selectSmsStudent = (student) => {
    selectedStudent = student;
    document.getElementById('sms_student_id').value = student.id;
    document.getElementById('sms_parent_id').value = student.parent_id || '';
    document.getElementById('sms_sel_lrn').textContent = student.lrn || '-';
    document.getElementById('sms_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('sms_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('sms_sel_guardian').textContent = student.guardian_name ? `${student.guardian_name} (${student.relationship || 'Guardian'})` : 'No Guardian Listed';

    document.getElementById('sms_phone').value = student.guardian_phone || '';

    document.getElementById('sms_student_search_container').style.display = 'none';
    document.getElementById('sms_selected_student_display').style.display = 'block';
  };

  window.clearSmsStudent = () => {
    selectedStudent = null;
    document.getElementById('sms_student_id').value = '';
    document.getElementById('sms_parent_id').value = '';
    document.getElementById('sms_phone').value = '';
    document.getElementById('sms_student_search_container').style.display = 'block';
    document.getElementById('sms_selected_student_display').style.display = 'none';
    document.getElementById('sms_student_search_query').value = '';
    document.getElementById('sms_student_search_status').innerHTML = '';
  };

  window.applySmsTemplate = (type) => {
    const sName = selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'your student';
    let msg = '';
    if (type === 'infraction') {
      msg = `ST. AGNES ACADEMY NOTICE: An incident report was recorded for ${sName}. Please visit the Prefect Office for a conference.`;
    } else if (type === 'hearing') {
      msg = `ST. AGNES ACADEMY SUMMONS: Disciplinary hearing for ${sName} is scheduled. Guardian presence is required at the Prefect Board Room.`;
    } else if (type === 'sanction') {
      msg = `ST. AGNES ACADEMY NOTICE: Disciplinary sanction issued for ${sName}. Please coordinate with the Prefect Office for compliance guidelines.`;
    } else if (type === 'clearance') {
      msg = `ST. AGNES ACADEMY ALERT: ${sName} has an active clearance hold due to pending disciplinary requirements. Please settle at Prefect Office.`;
    } else if (type === 'reformation') {
      msg = `ST. AGNES ACADEMY NOTICE: ${sName} has been enrolled in Reformation Community Service. Please report to the Guidance Office.`;
    } else if (type === 'merit') {
      msg = `ST. AGNES ACADEMY COMMENDATION: We are pleased to recognize ${sName} for exemplary conduct and positive behavior points.`;
    }
    const txtArea = document.getElementById('sms_message');
    if (txtArea) {
      txtArea.value = msg.slice(0, 160);
      updateSmsCharCount(txtArea.value);
    }
  };

  window.updateSmsCharCount = (txt) => {
    const el = document.getElementById('smsCharCount');
    if (el) el.textContent = `${txt.length} / 160 characters`;
  };

  window.openSmsModal = () => {
    clearSmsStudent();
    document.getElementById('smsForm').reset();
    document.getElementById('smsModal').classList.add('active');
    performSmsStudentSearch('');
  };

  window.closeSmsModal = () => document.getElementById('smsModal').classList.remove('active');

  window.handleSmsSubmit = async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('sms_student_id').value;
    if (!studentId) {
      alert('Please search and select a student.');
      return;
    }

    const payload = {
      student_id: parseInt(studentId, 10),
      parent_id: document.getElementById('sms_parent_id').value ? parseInt(document.getElementById('sms_parent_id').value, 10) : null,
      phone: document.getElementById('sms_phone').value.trim(),
      message: document.getElementById('sms_message').value.trim()
    };

    const submitBtn = document.getElementById('sendSmsSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Dispatching...`;
    }

    try {
      await ApiClient.post('notifications', 'send', payload);
      alert('Parent SMS alert dispatched / logged via Semaphore abstraction layer!');
      closeSmsModal();
      await loadData();
      renderView();
    } catch (err) {
      alert('Error sending SMS: ' + (err.message || 'Server error'));
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Dispatch Parent Alert`;
      }
    }
  };

  // View Payload Modal
  window.viewPayloadModal = (log) => {
    const modalBody = document.getElementById('payloadModalBody');
    if (!modalBody) return;

    let payloadPretty = log.response_payload || 'No raw payload stored.';
    try {
      const parsed = JSON.parse(log.response_payload);
      payloadPretty = JSON.stringify(parsed, null, 2);
    } catch (e) {}

    modalBody.innerHTML = `
      <div style="background:var(--primary-bg); padding:12px; border-radius:var(--radius-sm); margin-bottom:12px; font-size:0.85rem;">
        <div><strong>Log Reference:</strong> <code>#SMS-${log.id}</code></div>
        <div><strong>Student:</strong> ${log.first_name} ${log.last_name} (${log.lrn || 'N/A'})</div>
        <div><strong>Recipient Phone:</strong> <code>${log.phone_number}</code></div>
        <div><strong>Provider / Status:</strong> ${log.provider} &bull; <span class="badge badge-success">${log.status}</span></div>
        <div><strong>Dispatched By:</strong> ${log.sent_by_name || 'Automated Event Trigger'}</div>
        <div><strong>Sent Timestamp:</strong> ${log.created_at}</div>
      </div>
      <div style="margin-bottom:8px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">Message Body</div>
      <div style="background:var(--primary-bg); padding:10px; border-radius:var(--radius-sm); font-size:0.82rem; margin-bottom:12px;">${log.message_content}</div>
      <div style="margin-bottom:8px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-muted);">Gateway Response Payload</div>
      <pre style="background:#0F172A; color:#38BDF8; padding:12px; border-radius:var(--radius-sm); font-size:0.75rem; overflow-x:auto; max-height:180px;">${payloadPretty}</pre>
    `;

    document.getElementById('payloadModal').classList.add('active');
  };

  window.closePayloadModal = () => document.getElementById('payloadModal').classList.remove('active');
};
