/**
 * Infraction Incident Logging Module
 * Prefect Disciplinary Action System — St. Agnes Academy
 */

window.renderInfractionsModule = async function (container) {
  let incidents = [];
  let violations = [];
  let selectedStudent = null;
  let searchTimeout = null;

  const currentUser = typeof AuthManager !== 'undefined'
    ? AuthManager.getCurrentUser()
    : { full_name: 'Prefect Officer', role_name: 'Administrator' };

  try {
    const [incRes, violRes] = await Promise.all([
      ApiClient.get('incidents'),
      ApiClient.get('incidents', 'violations')
    ]);
    incidents = incRes.data || [];
    violations = violRes.data || [];
  } catch (e) {
    console.error('Error fetching incidents or violations:', e);
    incidents = [];
    violations = [];
  }

  // Format default current local datetime for input (YYYY-MM-DDTHH:mm)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-file-signature" style="color: var(--accent);"></i> Infraction Incident Logs</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Record and investigate student offenses with automated point deductions & parent alert dispatching.</p>
        </div>
        <button class="btn btn-primary" onclick="openLogIncidentModal()">
          <i class="fas fa-plus-circle"></i> Log New Infraction
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Student</th>
            <th>LRN / Student ID</th>
            <th>Violation</th>
            <th>Category</th>
            <th>Location</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${incidents.length === 0 ? `
            <tr>
              <td colspan="9" style="text-align:center; color:var(--text-muted); padding:35px;">
                <i class="fas fa-edit fa-2x" style="margin-bottom:10px; opacity:0.4; display:block;"></i>
                No infraction reports recorded yet.<br>
                Click <strong>"Log New Infraction"</strong> to record an incident for a student.
              </td>
            </tr>
          ` : incidents.map(inc => `
            <tr>
              <td><strong>${inc.incident_number}</strong></td>
              <td><strong>${inc.first_name} ${inc.last_name}</strong></td>
              <td><code>${inc.lrn}</code></td>
              <td>${inc.violation_title}</td>
              <td><span class="badge ${inc.violation_category === 'Severe' ? 'badge-danger' : (inc.violation_category === 'Major' ? 'badge-warning' : 'badge-primary')}">${inc.violation_category}</span></td>
              <td>${inc.location}</td>
              <td>${inc.incident_date}</td>
              <td><span class="badge badge-success">${inc.status || 'Pending Review'}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" title="View Incident Report" onclick="Router.navigate('incident-reports')"><i class="fas fa-eye"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Logging Infraction -->
    <div class="modal-overlay" id="infractionModal">
      <div class="modal-content" style="max-width: 720px;">
        <div class="modal-header">
          <h3><i class="fas fa-exclamation-triangle" style="color: var(--accent);"></i> Log Student Infraction</h3>
          <button style="background:none; border:none; font-size:1.4rem; color:var(--text-light); cursor:pointer;" onclick="closeLogIncidentModal()">&times;</button>
        </div>
        <form id="infractionForm" onsubmit="handleInfractionSubmit(event)">
          
          <!-- Validation Alert Container -->
          <div id="modal_validation_alert" style="display:none;" class="alert-message alert-warning-box">
            <i class="fas fa-exclamation-circle"></i>
            <span id="modal_validation_alert_text">Please select a valid student before submitting.</span>
          </div>

          <!-- Student Lookup & Selection Component -->
          <div class="form-group" style="margin-top:10px;">
            <label>Student Search & Selection <span style="color:var(--danger);">*</span></label>
            <input type="hidden" id="inf_student_id" value="" />

            <div id="student_search_container">
              <div class="student-lookup-box">
                <div class="student-search-input-wrap">
                  <i class="fas fa-search"></i>
                  <input type="text" id="student_search_query" placeholder="Search Student ID (e.g. 001), LRN, or Name..." oninput="handleStudentSearchInput(this.value)" autocomplete="off" />
                </div>
                <button type="button" class="btn btn-secondary" onclick="triggerStudentSearch()">
                  <i class="fas fa-search"></i> Search
                </button>
              </div>

              <!-- Search Status / Results Area -->
              <div id="student_search_status_area" style="margin-top: 8px;"></div>
            </div>

            <!-- Selected Student Information Card -->
            <div id="selected_student_display" style="display: none;" class="selected-student-card">
              <div class="selected-student-header">
                <h4><i class="fas fa-user-check"></i> Selected Student Record</h4>
                <button type="button" class="btn btn-secondary btn-sm" onclick="clearSelectedStudent()">
                  <i class="fas fa-user-edit"></i> Change Student
                </button>
              </div>
              <div class="selected-student-grid">
                <div class="selected-student-field">
                  <span class="label">Student ID / LRN</span>
                  <span class="value" id="sel_student_lrn">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Full Name</span>
                  <span class="value" id="sel_student_name">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Grade & Section</span>
                  <span class="value" id="sel_student_grade">-</span>
                </div>
                <div class="selected-student-field">
                  <span class="label">Parent / Guardian Contact</span>
                  <span class="value" id="sel_student_guardian">-</span>
                </div>
              </div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label>Offense / Violation Category <span style="color:var(--danger);">*</span></label>
              <select id="inf_violation_id" required>
                <option value="">-- Choose Offense --</option>
                ${violations.map(v => `<option value="${v.id}">${v.code} - ${v.title} (${v.category} : -${v.demerit_points} pts)</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Date & Time of Incident <span style="color:var(--danger);">*</span></label>
              <input type="datetime-local" id="inf_incident_date" value="${defaultDateTime}" required />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="form-group">
              <label>Incident Location <span style="color:var(--danger);">*</span></label>
              <input type="text" id="inf_location" placeholder="e.g. High School Bldg / Canteen" required />
            </div>
            <div class="form-group">
              <label>Reporting Officer</label>
              <input type="text" id="inf_reporting_officer" value="${currentUser.full_name} (${currentUser.role_name || 'Officer'})" readonly style="background:var(--input-bg); opacity:0.85;" />
            </div>
          </div>

          <div class="form-group">
            <label>Witness Information (Optional)</label>
            <input type="text" id="inf_witnesses" placeholder="e.g. Guard Ramos, Classmates" />
          </div>

          <div class="form-group">
            <label>Incident Details & Narrative <span style="color:var(--danger);">*</span></label>
            <textarea id="inf_description" rows="3" placeholder="Provide full details and account of the infraction..." required></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
            <button type="button" class="btn btn-secondary" onclick="closeLogIncidentModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveInfractionBtn">
              <i class="fas fa-save"></i> Save Infraction & Dispatch Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Student Search Handling
  window.handleStudentSearchInput = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performStudentSearch(query);
    }, 300);
  };

  window.triggerStudentSearch = () => {
    const q = document.getElementById('student_search_query').value;
    performStudentSearch(q);
  };

  window.performStudentSearch = async (query) => {
    const statusArea = document.getElementById('student_search_status_area');
    if (!statusArea) return;

    statusArea.innerHTML = `
      <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <i class="fas fa-spinner fa-spin" style="color: var(--accent);"></i> Searching student records...
      </div>
    `;

    try {
      const res = await ApiClient.get('students', 'list', null, { search: query.trim() });
      const studentsFound = res.data || [];

      if (studentsFound.length === 0) {
        statusArea.innerHTML = `
          <div class="alert-message alert-warning-box">
            <i class="fas fa-exclamation-triangle"></i> No student matching your search was found. <a href="javascript:void(0)" onclick="Router.navigate('students')" style="color:var(--accent); text-decoration:underline; margin-left:5px;">Add Student</a>
          </div>
        `;
      } else {
        statusArea.innerHTML = `
          <div class="student-search-results">
            <table>
              <thead>
                <tr>
                  <th>Student ID / LRN</th>
                  <th>Name</th>
                  <th>Grade & Section</th>
                  <th style="text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${studentsFound.map(s => `
                  <tr class="student-search-row" onclick='selectStudentRecord(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                    <td><code>${s.lrn}</code></td>
                    <td><strong>${s.first_name} ${s.last_name}</strong></td>
                    <td>${s.grade_level} - ${s.section}</td>
                    <td style="text-align:right;">
                      <button type="button" class="btn btn-primary btn-sm">
                        <i class="fas fa-check"></i> Select
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      statusArea.innerHTML = `
        <div class="alert-message alert-danger-box">
          <i class="fas fa-exclamation-circle"></i> Unable to retrieve student records.
        </div>
      `;
    }
  };

  window.selectStudentRecord = (student) => {
    selectedStudent = student;
    document.getElementById('inf_student_id').value = student.id;

    document.getElementById('sel_student_lrn').textContent = student.lrn;
    document.getElementById('sel_student_name').textContent = `${student.first_name} ${student.last_name}`;
    document.getElementById('sel_student_grade').textContent = `${student.grade_level} - ${student.section}`;
    document.getElementById('sel_student_guardian').textContent = student.guardian_name
      ? `${student.guardian_name} (${student.guardian_phone || 'No Contact'})`
      : 'No Guardian Contact Listed';

    document.getElementById('student_search_container').style.display = 'none';
    document.getElementById('selected_student_display').style.display = 'block';

    const alertBox = document.getElementById('modal_validation_alert');
    if (alertBox) alertBox.style.display = 'none';
  };

  window.clearSelectedStudent = () => {
    selectedStudent = null;
    document.getElementById('inf_student_id').value = '';
    document.getElementById('student_search_container').style.display = 'block';
    document.getElementById('selected_student_display').style.display = 'none';
    document.getElementById('student_search_query').value = '';
    document.getElementById('student_search_status_area').innerHTML = '';
  };

  window.openLogIncidentModal = () => {
    const modal = document.getElementById('infractionModal');
    if (modal) {
      clearSelectedStudent();
      const alertBox = document.getElementById('modal_validation_alert');
      if (alertBox) alertBox.style.display = 'none';
      modal.classList.add('active');
      performStudentSearch(''); // Populate initial students for fast selection
    }
  };

  window.closeLogIncidentModal = () => {
    const modal = document.getElementById('infractionModal');
    if (modal) modal.classList.remove('active');
  };

  window.handleInfractionSubmit = async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('modal_validation_alert');
    const alertText = document.getElementById('modal_validation_alert_text');

    const studentId = document.getElementById('inf_student_id').value;
    if (!studentId) {
      if (alertBox && alertText) {
        alertText.textContent = 'Please search and select a student before submitting.';
        alertBox.style.display = 'flex';
      } else {
        alert('Please search and select a student before submitting.');
      }
      return;
    }

    const btn = document.getElementById('saveInfractionBtn');
    if (btn) btn.disabled = true;

    const rawDate = document.getElementById('inf_incident_date').value;
    const formattedDate = rawDate ? rawDate.replace('T', ' ') + ':00' : '';

    const payload = {
      student_id: parseInt(studentId, 10),
      violation_id: parseInt(document.getElementById('inf_violation_id').value, 10),
      incident_date: formattedDate,
      location: document.getElementById('inf_location').value,
      description: document.getElementById('inf_description').value,
      witnesses: document.getElementById('inf_witnesses').value
    };

    try {
      const res = await ApiClient.post('incidents', '', payload);
      alert(`Infraction successfully logged!\nIncident No: ${res.data ? res.data.incident_number : 'Recorded'}\nStudent conduct points and violation history updated.`);
      closeLogIncidentModal();
      window.renderInfractionsModule(container);
    } catch (err) {
      alert('Unable to submit the incident. (' + (err.message || 'Server error') + ')');
      if (btn) btn.disabled = false;
    }
  };
};
