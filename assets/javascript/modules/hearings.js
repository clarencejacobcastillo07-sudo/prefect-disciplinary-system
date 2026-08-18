/**
 * Disciplinary Hearings Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderHearingsModule = async function(container) {
  let hearings = [];
  let incidents = [];
  let selectedStudent = null;
  let searchTimeout = null;

  try {
    const [hRes, iRes] = await Promise.all([
      ApiClient.get('proceedings', 'hearings'),
      ApiClient.get('incidents')
    ]);
    hearings = hRes.data || [];
    incidents = iRes.data || [];
  } catch (e) {
    console.error('Error fetching hearings:', e);
    hearings = [];
    incidents = [];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-calendar-check" style="color: var(--primary);"></i> Disciplinary Hearing Schedule</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Schedule formal hearings for major and severe disciplinary proceedings.</p>
        </div>
        <button class="btn btn-primary" onclick="openHearingModal()">
          <i class="fas fa-plus-circle"></i> Schedule Hearing
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Incident Ref</th>
            <th>Student Name</th>
            <th>LRN</th>
            <th>Offense</th>
            <th>Date & Time</th>
            <th>Venue</th>
            <th>Committee Members</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="hearingsTableBody">
          ${hearings.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-calendar-times fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No hearings scheduled yet.<br>
                Click <strong>"Schedule Hearing"</strong> to set up a disciplinary board hearing.
              </td>
            </tr>
          ` : hearings.map(h => `
            <tr>
              <td><code><strong>${h.incident_number}</strong></code></td>
              <td><strong>${h.first_name} ${h.last_name}</strong></td>
              <td><code>${h.lrn || '-'}</code></td>
              <td>${h.violation_title}</td>
              <td><strong>${h.hearing_date}</strong> at ${h.hearing_time}</td>
              <td>${h.venue}</td>
              <td style="font-size:0.8rem;">${h.committee_members || 'Board Committee'}</td>
              <td>
                <span class="badge ${h.status === 'Completed' ? 'badge-success' : (h.status === 'Scheduled' ? 'badge-warning' : 'badge-danger')}">
                  ${h.status}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" title="Update Hearing / Decision" onclick='openUpdateHearingModal(${JSON.stringify(h).replace(/'/g, "&apos;")})'>
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Scheduling Hearing -->
    <div class="modal-overlay" id="hearingModal">
      <div class="modal-content" style="max-width:680px;">
        <div class="modal-header">
          <h3><i class="fas fa-calendar-plus" style="color:var(--accent);"></i> Schedule Disciplinary Hearing</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeHearingModal()">&times;</button>
        </div>
        <form id="hearingForm" onsubmit="handleHearingSubmit(event)">
          
          <!-- Student Search & Selection -->
          <div class="form-group">
            <label>Select Student <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="h_student_id" value="" />

            <div id="hearing_student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="hearing_student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handleHearingStudentSearch(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerHearingStudentSearch()">Search</button>
              </div>
              <div id="hearing_student_search_status" style="margin-top: 6px;"></div>
            </div>

            <!-- Selected Student Card -->
            <div id="hearing_selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student</h4>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearHearingStudent()">Change</button>
              </div>
              <div class="selected-student-grid">
                <div class="selected-student-field">
                  <span class="label">ID / LRN</span>
                  <span class="value" id="h_sel_lrn">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Name</span>
                  <span class="value" id="h_sel_name">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Grade & Section</span>
                  <span class="value" id="h_sel_grade">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Guardian</span>
                  <span class="value" id="h_sel_guardian">-</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Associated Incident Case -->
          <div class="form-group">
            <label>Associated Incident Case <span style="color:var(--danger);">*</span></label>
            <select id="h_incident_id" required>
              <option value="">-- Choose Incident Case --</option>
              ${incidents.map(inc => `<option value="${inc.id}">[${inc.incident_number}] ${inc.first_name} ${inc.last_name} — ${inc.violation_title} (${inc.incident_date})</option>`).join('')}
            </select>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>Hearing Date <span style="color:var(--danger);">*</span></label>
              <input type="date" id="h_date" required />
            </div>
            <div class="form-group">
              <label>Hearing Time <span style="color:var(--danger);">*</span></label>
              <input type="time" id="h_time" value="10:00" required />
            </div>
          </div>

          <div class="form-group">
            <label>Venue / Location <span style="color:var(--danger);">*</span></label>
            <input type="text" id="h_venue" value="Prefect Disciplinary Board Room" required />
          </div>

          <div class="form-group">
            <label>Committee Members / Presiding Panel</label>
            <input type="text" id="h_committee" placeholder="e.g. Mr. Ricardo Santos (Prefect), Ms. Maria Teresa Cruz (Guidance), Parent" />
          </div>

          <div class="form-group">
            <label>Agenda & Decision Notes</label>
            <textarea id="h_notes" rows="2" placeholder="Review incident evidence and hear student/parent statements..."></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeHearingModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveHearingBtn">
              <i class="fas fa-calendar-check"></i> Schedule Hearing
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal for Updating Hearing -->
    <div class="modal-overlay" id="updateHearingModal">
      <div class="modal-content" style="max-width:540px;">
        <div class="modal-header">
          <h3><i class="fas fa-edit" style="color:var(--accent);"></i> Update Hearing Status & Findings</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeUpdateHearingModal()">&times;</button>
        </div>
        <form id="updateHearingForm" onsubmit="handleUpdateHearingSubmit(event)">
          <input type="hidden" id="edit_hearing_id" value="" />
          <div class="form-group">
            <label>Hearing Status <span style="color:var(--danger);">*</span></label>
            <select id="edit_hearing_status" required>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>Hearing Date</label>
              <input type="date" id="edit_hearing_date" required />
            </div>
            <div class="form-group">
              <label>Hearing Time</label>
              <input type="time" id="edit_hearing_time" required />
            </div>
          </div>
          <div class="form-group">
            <label>Venue</label>
            <input type="text" id="edit_hearing_venue" required />
          </div>
          <div class="form-group">
            <label>Committee Members</label>
            <input type="text" id="edit_hearing_committee" />
          </div>
          <div class="form-group">
            <label>Decision Notes & Resolution</label>
            <textarea id="edit_hearing_notes" rows="3" placeholder="Record findings, agreements, and sanctions decided..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeUpdateHearingModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Hearing Update</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Student Search Handling
  window.handleHearingStudentSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performHearingStudentSearch(query), 300);
  };

  window.triggerHearingStudentSearch = () => {
    const q = document.getElementById('hearing_student_search_query').value;
    performHearingStudentSearch(q);
  };

  window.performHearingStudentSearch = async (query) => {
    const area = document.getElementById('hearing_student_search_status');
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
                   onclick='selectHearingStudent(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
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

  window.selectHearingStudent = (student) => {
    selectedStudent = student;
    document.getElementById('h_student_id').value = student.id;
    document.getElementById('h_sel_lrn').textContent = student.lrn;
    document.getElementById('h_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('h_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('h_sel_guardian').textContent = student.guardian_name ? `${student.guardian_name} (${student.guardian_phone || 'No phone'})` : 'None';

    document.getElementById('hearing_student_search_container').style.display = 'none';
    document.getElementById('hearing_selected_student_display').style.display = 'block';

    const incSelect = document.getElementById('h_incident_id');
    const matchedInc = incidents.find(i => i.student_id == student.id);
    if (matchedInc) {
      incSelect.value = matchedInc.id;
    }
  };

  window.clearHearingStudent = () => {
    selectedStudent = null;
    document.getElementById('h_student_id').value = '';
    document.getElementById('hearing_student_search_container').style.display = 'block';
    document.getElementById('hearing_selected_student_display').style.display = 'none';
    document.getElementById('hearing_student_search_query').value = '';
    document.getElementById('hearing_student_search_status').innerHTML = '';
  };

  window.openHearingModal = () => {
    clearHearingStudent();
    document.getElementById('hearingForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('h_date').value = today;
    document.getElementById('hearingModal').classList.add('active');
    performHearingStudentSearch('');
  };

  window.closeHearingModal = () => document.getElementById('hearingModal').classList.remove('active');

  window.openUpdateHearingModal = (h) => {
    document.getElementById('edit_hearing_id').value = h.id;
    document.getElementById('edit_hearing_status').value = h.status || 'Scheduled';
    document.getElementById('edit_hearing_date').value = h.hearing_date || '';
    document.getElementById('edit_hearing_time').value = h.hearing_time || '10:00';
    document.getElementById('edit_hearing_venue').value = h.venue || 'Prefect Disciplinary Board Room';
    document.getElementById('edit_hearing_committee').value = h.committee_members || '';
    document.getElementById('edit_hearing_notes').value = h.decision_notes || '';
    document.getElementById('updateHearingModal').classList.add('active');
  };

  window.closeUpdateHearingModal = () => document.getElementById('updateHearingModal').classList.remove('active');

  window.handleHearingSubmit = async (e) => {
    e.preventDefault();
    const incidentId = document.getElementById('h_incident_id').value;
    if (!incidentId) {
      alert('Please choose or create an incident case for this hearing.');
      return;
    }

    const payload = {
      incident_id: parseInt(incidentId, 10),
      hearing_date: document.getElementById('h_date').value,
      hearing_time: document.getElementById('h_time').value,
      venue: document.getElementById('h_venue').value,
      committee_members: document.getElementById('h_committee').value,
      decision_notes: document.getElementById('h_notes').value
    };

    try {
      await ApiClient.post('proceedings', 'hearings', payload);
      alert('Disciplinary hearing scheduled successfully!');
      closeHearingModal();
      window.renderHearingsModule(container);
    } catch (err) {
      alert('Error scheduling hearing: ' + (err.message || 'Server error'));
    }
  };

  window.handleUpdateHearingSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit_hearing_id').value;
    const payload = {
      hearing_date: document.getElementById('edit_hearing_date').value,
      hearing_time: document.getElementById('edit_hearing_time').value,
      venue: document.getElementById('edit_hearing_venue').value,
      committee_members: document.getElementById('edit_hearing_committee').value,
      status: document.getElementById('edit_hearing_status').value,
      decision_notes: document.getElementById('edit_hearing_notes').value
    };

    try {
      await ApiClient.post('proceedings', 'hearings', payload, { id: id });
      alert('Hearing status updated!');
      closeUpdateHearingModal();
      window.renderHearingsModule(container);
    } catch (err) {
      alert('Error updating hearing: ' + (err.message || 'Server error'));
    }
  };
};
