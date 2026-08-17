window.renderSanctionsModule = async function(container) {
  let sanctions = [];
  try {
    const res = await ApiClient.get('proceedings', 'sanctions');
    sanctions = res.data || [];
  } catch (e) {
    sanctions = [
      { id: 1, incident_number: 'INC-2026-0001', first_name: 'Juan', last_name: 'Dela Cruz', lrn: '136123450001', sanction_type: '1-Day Suspension & Reflection Paper', start_date: '2026-07-22', end_date: '2026-07-23', status: 'Served', remarks: 'Submitted reflection paper' }
    ];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-gavel" style="color: var(--primary);"></i> Sanction Management & Compliance</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Track warning letters, suspensions, and disciplinary penalties.</p>
        </div>
        <button class="btn btn-primary" onclick="openSanctionModal()">
          <i class="fas fa-plus-circle"></i> Issue New Sanction
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Student Name</th>
            <th>LRN</th>
            <th>Sanction Penalty</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${sanctions.map(s => `
            <tr>
              <td><strong>${s.incident_number}</strong></td>
              <td>${s.first_name} ${s.last_name}</td>
              <td><code>${s.lrn}</code></td>
              <td><strong>${s.sanction_type}</strong></td>
              <td>${s.start_date}</td>
              <td>${s.end_date || 'N/A'}</td>
              <td><span class="badge ${s.status === 'Served' ? 'badge-success' : 'badge-warning'}">${s.status}</span></td>
              <td>${s.remarks}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Issuing Sanction -->
    <div class="modal-overlay" id="sanctionModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Issue Disciplinary Sanction</h3>
          <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="closeSanctionModal()">&times;</button>
        </div>
        <form id="sanctionForm" onsubmit="handleSanctionSubmit(event)">
          <div class="form-group">
            <label>Incident Reference ID</label>
            <input type="number" id="s_incident_id" placeholder="e.g. 1" required />
          </div>
          <div class="form-group">
            <label>Student ID</label>
            <input type="number" id="s_student_id" placeholder="e.g. 1" required />
          </div>
          <div class="form-group">
            <label>Sanction Penalty Type</label>
            <select id="s_type" required>
              <option value="Verbal Warning">Verbal Warning</option>
              <option value="Written Warning & Letter">Written Warning & Letter</option>
              <option value="Campus Detention (1-3 Hours)">Campus Detention (1-3 Hours)</option>
              <option value="In-School Suspension (1-3 Days)">In-School Suspension (1-3 Days)</option>
              <option value="Out-of-School Suspension">Out-of-School Suspension</option>
            </select>
          </div>
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" id="s_start_date" required />
          </div>
          <div class="form-group">
            <label>End Date (Optional)</label>
            <input type="date" id="s_end_date" />
          </div>
          <div class="form-group">
            <label>Remarks & Instructions</label>
            <textarea id="s_remarks" rows="2" placeholder="Specify conditions for completion..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeSanctionModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Confirm & Issue</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openSanctionModal = () => document.getElementById('sanctionModal').classList.add('active');
  window.closeSanctionModal = () => document.getElementById('sanctionModal').classList.remove('active');

  window.handleSanctionSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      incident_id: document.getElementById('s_incident_id').value,
      student_id: document.getElementById('s_student_id').value,
      sanction_type: document.getElementById('s_type').value,
      start_date: document.getElementById('s_start_date').value,
      end_date: document.getElementById('s_end_date').value,
      remarks: document.getElementById('s_remarks').value
    };

    try {
      await ApiClient.post('proceedings', 'sanctions', payload);
      alert('Sanction issued successfully!');
      closeSanctionModal();
      Router.navigate('sanctions');
    } catch (err) {
      alert('Error issuing sanction: ' + err.message);
    }
  };
};
