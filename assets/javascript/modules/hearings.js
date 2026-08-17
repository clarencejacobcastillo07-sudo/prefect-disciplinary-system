window.renderHearingsModule = async function(container) {
  let hearings = [];
  try {
    const res = await ApiClient.get('proceedings', 'hearings');
    hearings = res.data || [];
  } catch (e) {
    hearings = [
      { id: 1, incident_number: 'INC-2026-0002', first_name: 'Mark Anthony', last_name: 'Bautista', violation_title: 'Bullying / Harassment', hearing_date: '2026-08-05', hearing_time: '10:00:00', venue: 'Prefect Disciplinary Board Room', committee_members: 'Mr. Ricardo Santos, Ms. Maria Teresa Cruz', status: 'Scheduled' }
    ];
  }

  container.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <div>
          <h3><i class="fas fa-calendar-alt" style="color: var(--primary);"></i> Disciplinary Hearing Schedule</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">Schedule formal hearings for major and severe disciplinary proceedings.</p>
        </div>
        <button class="btn btn-primary" onclick="openHearingModal()">
          <i class="fas fa-plus-circle"></i> Schedule Hearing
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Student Name</th>
            <th>Violation</th>
            <th>Date & Time</th>
            <th>Venue</th>
            <th>Committee Members</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${hearings.map(h => `
            <tr>
              <td><strong>${h.incident_number}</strong></td>
              <td>${h.first_name} ${h.last_name}</td>
              <td>${h.violation_title}</td>
              <td><strong>${h.hearing_date}</strong> at ${h.hearing_time}</td>
              <td>${h.venue}</td>
              <td>${h.committee_members || 'Board Committee'}</td>
              <td><span class="badge badge-warning">${h.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Hearing -->
    <div class="modal-overlay" id="hearingModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Schedule Disciplinary Hearing</h3>
          <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="closeHearingModal()">&times;</button>
        </div>
        <form id="hearingForm" onsubmit="handleHearingSubmit(event)">
          <div class="form-group">
            <label>Incident ID</label>
            <input type="number" id="h_incident_id" placeholder="e.g. 2" required />
          </div>
          <div class="form-group">
            <label>Hearing Date</label>
            <input type="date" id="h_date" required />
          </div>
          <div class="form-group">
            <label>Hearing Time</label>
            <input type="time" id="h_time" required />
          </div>
          <div class="form-group">
            <label>Venue</label>
            <input type="text" id="h_venue" value="Prefect Disciplinary Board Room" required />
          </div>
          <div class="form-group">
            <label>Committee Members</label>
            <input type="text" id="h_committee" placeholder="e.g. Prefect Officer, Guidance Counselor, Principal" />
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeHearingModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Schedule Hearing</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openHearingModal = () => document.getElementById('hearingModal').classList.add('active');
  window.closeHearingModal = () => document.getElementById('hearingModal').classList.remove('active');

  window.handleHearingSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      incident_id: document.getElementById('h_incident_id').value,
      hearing_date: document.getElementById('h_date').value,
      hearing_time: document.getElementById('h_time').value,
      venue: document.getElementById('h_venue').value,
      committee_members: document.getElementById('h_committee').value
    };

    try {
      await ApiClient.post('proceedings', 'hearings', payload);
      alert('Disciplinary hearing scheduled successfully!');
      closeHearingModal();
      Router.navigate('hearings');
    } catch (err) {
      alert('Error scheduling hearing: ' + err.message);
    }
  };
};
