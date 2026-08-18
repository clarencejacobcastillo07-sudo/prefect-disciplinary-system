/**
 * Parent Notification Module (SMS Gateway & Dispatch Trail)
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderNotificationsModule = async function(container) {
  let logs = [];
  let selectedStudent = null;
  let searchTimeout = null;

  try {
    const res = await ApiClient.get('notifications', 'logs');
    logs = res.data || [];
  } catch (e) {
    console.error('Error fetching SMS logs:', e);
    logs = [];
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
          <i class="fas fa-sms" style="color: var(--primary); margin-right:8px;"></i>Parent Notification Tool (SMS Alerts)
        </h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">Semaphore SMS API Abstraction & Audit Dispatch Trail</p>
      </div>
      <div style="display:flex; align-items:center; gap:10px; background:var(--secondary-bg); padding:8px 16px; border-radius:var(--radius-full); border:1px solid rgba(255,255,255,0.1);">
        <span style="width:10px; height:10px; background:#10B981; border-radius:50%; display:inline-block;"></span>
        <span style="font-size:0.8rem; font-weight:600; color:var(--text-light);">Semaphore Gateway Ready</span>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <div>
          <h3>Dispatch History &amp; SMS Log</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Automated and manual SMS notifications sent to registered parents and guardians.</p>
        </div>
        <button class="btn btn-primary" onclick="openSmsModal()">
          <i class="fas fa-paper-plane"></i> Send Custom SMS Alert
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Student</th>
            <th>LRN</th>
            <th>Guardian Contact</th>
            <th>Message Content</th>
            <th>Gateway</th>
            <th>Status</th>
            <th>Sent At</th>
          </tr>
        </thead>
        <tbody id="notificationsTableBody">
          ${logs.length === 0 ? `
            <tr>
              <td colspan="8" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-sms fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No parent SMS notifications recorded yet.<br>
                Click <strong>"Send Custom SMS Alert"</strong> or log an infraction to dispatch notices.
              </td>
            </tr>
          ` : logs.map(l => `
            <tr>
              <td><code>#SMS-${l.id}</code></td>
              <td><strong>${l.first_name} ${l.last_name}</strong></td>
              <td><code>${l.lrn || '-'}</code></td>
              <td><code>${l.phone_number}</code></td>
              <td style="max-width:320px; font-size:0.82rem;">${l.message_content}</td>
              <td><span class="badge badge-primary">${l.provider}</span></td>
              <td><span class="badge badge-success">${l.status}</span></td>
              <td style="font-size:0.8rem; color:var(--text-muted);">${l.created_at}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Custom SMS -->
    <div class="modal-overlay" id="smsModal">
      <div class="modal-content" style="max-width:640px;">
        <div class="modal-header">
          <h3><i class="fas fa-paper-plane" style="color:var(--accent);"></i> Send SMS Alert to Parent</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeSmsModal()">&times;</button>
        </div>
        <form id="smsForm" onsubmit="handleSmsSubmit(event)">
          
          <!-- Student Search & Selection -->
          <div class="form-group">
            <label>Select Student <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="sms_student_id" value="" />

            <div id="sms_student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="sms_student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handleSmsStudentSearch(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerSmsStudentSearch()">Search</button>
              </div>
              <div id="sms_student_search_status" style="margin-top: 6px;"></div>
            </div>

            <!-- Selected Student Card with Auto-filled Guardian Phone -->
            <div id="sms_selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student &amp; Contact</h4>
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
            <label>Guardian Phone Number <span style="color:var(--danger);">*</span></label>
            <input type="text" id="sms_phone" placeholder="09170000001" required />
            <small style="color:var(--text-muted); font-size:0.75rem;">Auto-populated from the student's parent/guardian record when selected.</small>
          </div>

          <div class="form-group">
            <label>Quick Message Templates</label>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('infraction')">Infraction Notice</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('hearing')">Hearing Summons</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="applySmsTemplate('clearance')">Clearance Hold</button>
            </div>
            <label>SMS Message Body (Max 160 chars) <span style="color:var(--danger);">*</span></label>
            <textarea id="sms_message" rows="3" maxlength="160" placeholder="ST. AGNES ACADEMY NOTICE: Dear Guardian, ..." required oninput="updateSmsCharCount(this.value)"></textarea>
            <div style="text-align:right; font-size:0.75rem; color:var(--text-muted);" id="smsCharCount">0 / 160 characters</div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeSmsModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="sendSmsBtn"><i class="fas fa-paper-plane"></i> Dispatch SMS</button>
          </div>
        </form>
      </div>
    </div>
  `;

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
    area.innerHTML = `<div style="padding:8px; font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Searching...</div>`;

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
                <div><strong>${s.first_name} ${s.last_name}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${s.lrn} — ${s.grade_level})</span></div>
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
    document.getElementById('sms_sel_lrn').textContent = student.lrn;
    document.getElementById('sms_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('sms_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('sms_sel_guardian').textContent = student.guardian_name ? `${student.guardian_name} (${student.relationship || 'Parent'})` : 'No Guardian Listed';

    // Auto-populate phone number from parent record
    document.getElementById('sms_phone').value = student.guardian_phone || '';

    document.getElementById('sms_student_search_container').style.display = 'none';
    document.getElementById('sms_selected_student_display').style.display = 'block';
  };

  window.clearSmsStudent = () => {
    selectedStudent = null;
    document.getElementById('sms_student_id').value = '';
    document.getElementById('sms_phone').value = '';
    document.getElementById('sms_student_search_container').style.display = 'block';
    document.getElementById('sms_selected_student_display').style.display = 'none';
    document.getElementById('sms_student_search_query').value = '';
    document.getElementById('sms_student_search_status').innerHTML = '';
  };

  window.applySmsTemplate = (type) => {
    const sName = selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'your child';
    let msg = '';
    if (type === 'infraction') {
      msg = `ST. AGNES ACADEMY NOTICE: An incident report was recorded for ${sName}. Please visit the Prefect Office for a conference.`;
    } else if (type === 'hearing') {
      msg = `ST. AGNES ACADEMY SUMMONS: A disciplinary hearing for ${sName} is scheduled. Your attendance is requested at the Prefect Board Room.`;
    } else if (type === 'clearance') {
      msg = `ST. AGNES ACADEMY ALERT: ${sName} has an active clearance hold due to pending disciplinary requirements.`;
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
      phone: document.getElementById('sms_phone').value.trim(),
      message: document.getElementById('sms_message').value.trim()
    };

    try {
      await ApiClient.post('notifications', 'send', payload);
      alert('SMS notification sent / logged via Semaphore abstraction layer!');
      closeSmsModal();
      window.renderNotificationsModule(container);
    } catch (err) {
      alert('Error sending SMS: ' + (err.message || 'Server error'));
    }
  };
};
