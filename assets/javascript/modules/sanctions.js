/**
 * Sanction Management Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderSanctionsModule = async function(container) {
  let sanctions = [];
  let incidents = [];
  let selectedStudent = null;
  let searchTimeout = null;

  try {
    const [sRes, iRes] = await Promise.all([
      ApiClient.get('proceedings', 'sanctions'),
      ApiClient.get('incidents')
    ]);
    sanctions = sRes.data || [];
    incidents = iRes.data || [];
  } catch (e) {
    console.error('Error fetching sanctions:', e);
    sanctions = [];
    incidents = [];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-gavel" style="color: var(--primary);"></i> Sanction Management & Compliance</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Track warning letters, suspensions, community service, and disciplinary penalties.</p>
        </div>
        <button class="btn btn-primary" onclick="openSanctionModal()">
          <i class="fas fa-plus-circle"></i> Issue New Sanction
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Incident Ref</th>
            <th>Student Name</th>
            <th>LRN</th>
            <th>Offense</th>
            <th>Sanction Penalty</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="sanctionsTableBody">
          ${sanctions.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-gavel fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No disciplinary sanctions issued yet.<br>
                Click <strong>"Issue New Sanction"</strong> to record a sanction for a student's disciplinary case.
              </td>
            </tr>
          ` : sanctions.map(s => `
            <tr>
              <td><code><strong>${s.incident_number}</strong></code></td>
              <td><strong>${s.first_name} ${s.last_name}</strong></td>
              <td><code>${s.lrn}</code></td>
              <td>${s.violation_title}</td>
              <td><strong>${s.sanction_type}</strong></td>
              <td>${s.start_date}</td>
              <td>${s.end_date || 'N/A'}</td>
              <td>
                <span class="badge ${s.status === 'Served' ? 'badge-success' : (s.status === 'Ongoing' ? 'badge-warning' : 'badge-danger')}">
                  ${s.status}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" title="Update Status / Remarks" onclick='openUpdateSanctionModal(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Issuing Sanction -->
    <div class="modal-overlay" id="sanctionModal">
      <div class="modal-content" style="max-width:680px;">
        <div class="modal-header">
          <h3><i class="fas fa-gavel" style="color:var(--accent);"></i> Issue Disciplinary Sanction</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeSanctionModal()">&times;</button>
        </div>
        <form id="sanctionForm" onsubmit="handleSanctionSubmit(event)">
          
          <!-- Student Search & Selection -->
          <div class="form-group">
            <label>Select Student <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="s_student_id" value="" />

            <div id="sanction_student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="sanction_student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handleSanctionStudentSearch(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerSanctionStudentSearch()">Search</button>
              </div>
              <div id="sanction_student_search_status" style="margin-top: 6px;"></div>
            </div>

            <!-- Selected Student Card -->
            <div id="sanction_selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student</h4>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearSanctionStudent()">Change</button>
              </div>
              <div class="selected-student-grid">
                <div class="selected-student-field">
                  <span class="label">ID / LRN</span>
                  <span class="value" id="s_sel_lrn">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Name</span>
                  <span class="value" id="s_sel_name">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Grade & Section</span>
                  <span class="value" id="s_sel_grade">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Guardian</span>
                  <span class="value" id="s_sel_guardian">-</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Associated Incident Selection -->
          <div class="form-group">
            <label>Associated Incident Case <span style="color:var(--danger);">*</span></label>
            <select id="s_incident_id" required>
              <option value="">-- Choose Incident Case --</option>
              ${incidents.map(inc => `<option value="${inc.id}">[${inc.incident_number}] ${inc.first_name} ${inc.last_name} — ${inc.violation_title} (${inc.incident_date})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>Sanction Penalty Type <span style="color:var(--danger);">*</span></label>
            <select id="s_type" required>
              <option value="Verbal Warning">Verbal Warning</option>
              <option value="Written Warning & Notice">Written Warning & Notice</option>
              <option value="Campus Detention (1-3 Hours)">Campus Detention (1-3 Hours)</option>
              <option value="In-School Suspension (1-3 Days)">In-School Suspension (1-3 Days)</option>
              <option value="Out-of-School Suspension">Out-of-School Suspension</option>
              <option value="Community / Campus Service">Community / Campus Service</option>
            </select>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="form-group">
              <label>Start Date <span style="color:var(--danger);">*</span></label>
              <input type="date" id="s_start_date" required />
            </div>
            <div class="form-group">
              <label>End Date (Optional)</label>
              <input type="date" id="s_end_date" />
            </div>
          </div>

          <div class="form-group">
            <label>Remarks & Compliance Conditions</label>
            <textarea id="s_remarks" rows="2" placeholder="Specify conditions for completion or reflection paper submission..."></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeSanctionModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveSanctionBtn">
              <i class="fas fa-gavel"></i> Confirm & Issue Sanction
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal for Updating Sanction Status -->
    <div class="modal-overlay" id="updateSanctionModal">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3><i class="fas fa-edit" style="color:var(--accent);"></i> Update Sanction Status</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeUpdateSanctionModal()">&times;</button>
        </div>
        <form id="updateSanctionForm" onsubmit="handleUpdateSanctionSubmit(event)">
          <input type="hidden" id="edit_sanction_id" value="" />
          <div class="form-group">
            <label>Status <span style="color:var(--danger);">*</span></label>
            <select id="edit_sanction_status" required>
              <option value="Ongoing">Ongoing</option>
              <option value="Served">Served (Completed)</option>
              <option value="Waived">Waived / Excused</option>
              <option value="Violated">Violated (Failed to Comply)</option>
            </select>
          </div>
          <div class="form-group">
            <label>End / Completion Date</label>
            <input type="date" id="edit_sanction_end_date" />
          </div>
          <div class="form-group">
            <label>Updated Remarks</label>
            <textarea id="edit_sanction_remarks" rows="3"></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeUpdateSanctionModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Status</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Sanction Student Search
  window.handleSanctionStudentSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSanctionStudentSearch(query), 300);
  };

  window.triggerSanctionStudentSearch = () => {
    const q = document.getElementById('sanction_student_search_query').value;
    performSanctionStudentSearch(q);
  };

  window.performSanctionStudentSearch = async (query) => {
    const area = document.getElementById('sanction_student_search_status');
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
                   onclick='selectSanctionStudent(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
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

  window.selectSanctionStudent = (student) => {
    selectedStudent = student;
    document.getElementById('s_student_id').value = student.id;
    document.getElementById('s_sel_lrn').textContent = student.lrn;
    document.getElementById('s_sel_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('s_sel_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('s_sel_guardian').textContent = student.guardian_name ? `${student.guardian_name} (${student.guardian_phone || 'No phone'})` : 'None';

    document.getElementById('sanction_student_search_container').style.display = 'none';
    document.getElementById('sanction_selected_student_display').style.display = 'block';

    // Auto-filter incident dropdown for this student if available
    const incSelect = document.getElementById('s_incident_id');
    const matchedInc = incidents.find(i => i.student_id == student.id);
    if (matchedInc) {
      incSelect.value = matchedInc.id;
    }
  };

  window.clearSanctionStudent = () => {
    selectedStudent = null;
    document.getElementById('s_student_id').value = '';
    document.getElementById('sanction_student_search_container').style.display = 'block';
    document.getElementById('sanction_selected_student_display').style.display = 'none';
    document.getElementById('sanction_student_search_query').value = '';
    document.getElementById('sanction_student_search_status').innerHTML = '';
  };

  window.openSanctionModal = () => {
    clearSanctionStudent();
    document.getElementById('sanctionForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('s_start_date').value = today;
    document.getElementById('sanctionModal').classList.add('active');
    performSanctionStudentSearch('');
  };

  window.closeSanctionModal = () => document.getElementById('sanctionModal').classList.remove('active');

  window.openUpdateSanctionModal = (s) => {
    document.getElementById('edit_sanction_id').value = s.id;
    document.getElementById('edit_sanction_status').value = s.status || 'Ongoing';
    document.getElementById('edit_sanction_end_date').value = s.end_date || '';
    document.getElementById('edit_sanction_remarks').value = s.remarks || '';
    document.getElementById('updateSanctionModal').classList.add('active');
  };

  window.closeUpdateSanctionModal = () => document.getElementById('updateSanctionModal').classList.remove('active');

  window.handleSanctionSubmit = async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('s_student_id').value;
    const incidentId = document.getElementById('s_incident_id').value;

    if (!studentId) {
      alert('Please search and select a student.');
      return;
    }
    if (!incidentId) {
      alert('Please select an associated incident case. (If no incident exists, log an infraction first).');
      return;
    }

    const payload = {
      student_id: parseInt(studentId, 10),
      incident_id: parseInt(incidentId, 10),
      sanction_type: document.getElementById('s_type').value,
      start_date: document.getElementById('s_start_date').value,
      end_date: document.getElementById('s_end_date').value || null,
      remarks: document.getElementById('s_remarks').value
    };

    try {
      await ApiClient.post('proceedings', 'sanctions', payload);
      alert('Sanction issued successfully!');
      closeSanctionModal();
      window.renderSanctionsModule(container);
    } catch (err) {
      alert('Error issuing sanction: ' + (err.message || 'Server error'));
    }
  };

  window.handleUpdateSanctionSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit_sanction_id').value;
    const payload = {
      status: document.getElementById('edit_sanction_status').value,
      end_date: document.getElementById('edit_sanction_end_date').value || null,
      remarks: document.getElementById('edit_sanction_remarks').value
    };

    try {
      await ApiClient.post('proceedings', 'sanctions', payload, { id: id });
      alert('Sanction status updated!');
      closeUpdateSanctionModal();
      window.renderSanctionsModule(container);
    } catch (err) {
      alert('Error updating sanction: ' + (err.message || 'Server error'));
    }
  };
};
