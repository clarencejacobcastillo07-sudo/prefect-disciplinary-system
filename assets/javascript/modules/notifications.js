window.renderNotificationsModule = async function(container) {
  let logs = [];
  try {
    const res = await ApiClient.get('notifications', 'logs');
    logs = res.data || [];
  } catch (e) {
    logs = [
      { id: 1, first_name: 'Juan', last_name: 'Dela Cruz', phone_number: '09171234567', message_content: 'ST. AGNES ACADEMY ALERT: Mr. Pedro, Juan Dela Cruz has been logged for Cutting Classes on 2026-07-20. Please report to the Prefect Office.', provider: 'Semaphore', status: 'Sent', created_at: '2026-07-20 10:16:00' },
      { id: 2, first_name: 'Mark Anthony', last_name: 'Bautista', phone_number: '09205554433', message_content: 'ST. AGNES ACADEMY NOTICE: Hearing for Mark Anthony is scheduled on Aug 5, 2026 10:00 AM at Prefect Board Room.', provider: 'Semaphore', status: 'Sent', created_at: '2026-07-22 14:00:00' }
    ];
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <div>
        <h2><i class="fas fa-sms" style="color: var(--primary);"></i> Parent Notification Tool (SMS Alerts)</h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">Semaphore SMS API Abstraction & Audit Trail</p>
      </div>
      <div style="display:flex; align-items:center; gap:10px; background:var(--secondary-bg); padding:8px 16px; border-radius:var(--radius-full); border:1px solid rgba(255,255,255,0.1);">
        <span style="width:10px; height:10px; background:#10B981; border-radius:50%; display:inline-block;"></span>
        <span style="font-size:0.8rem; font-weight:600; color:var(--text-light);">Semaphore Gateway Ready</span>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <h3>Dispatch History & SMS Log</h3>
        <button class="btn btn-primary" onclick="openSmsModal()">
          <i class="fas fa-paper-plane"></i> Send Custom SMS Alert
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Student</th>
            <th>Guardian Contact</th>
            <th>Message Content</th>
            <th>Gateway</th>
            <th>Status</th>
            <th>Sent At</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(l => `
            <tr>
              <td><code>#SMS-${l.id}</code></td>
              <td><strong>${l.first_name} ${l.last_name}</strong></td>
              <td><code>${l.phone_number}</code></td>
              <td style="max-width:350px; font-size:0.82rem;">${l.message_content}</td>
              <td><span class="badge badge-primary">${l.provider}</span></td>
              <td><span class="badge badge-success">${l.status}</span></td>
              <td>${l.created_at}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Modal for Custom SMS -->
    <div class="modal-overlay" id="smsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Send SMS Alert to Parent</h3>
          <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="closeSmsModal()">&times;</button>
        </div>
        <form id="smsForm" onsubmit="handleSmsSubmit(event)">
          <div class="form-group">
            <label>Student ID</label>
            <input type="number" id="sms_student_id" placeholder="e.g. 1" required />
          </div>
          <div class="form-group">
            <label>Guardian Phone Number</label>
            <input type="text" id="sms_phone" placeholder="09171234567" required />
          </div>
          <div class="form-group">
            <label>SMS Message Body (Max 160 chars)</label>
            <textarea id="sms_message" rows="4" maxlength="160" placeholder="ST. AGNES ACADEMY NOTICE: ..." required></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secondary" onclick="closeSmsModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Dispatch SMS</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.openSmsModal = () => document.getElementById('smsModal').classList.add('active');
  window.closeSmsModal = () => document.getElementById('smsModal').classList.remove('active');

  window.handleSmsSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      student_id: document.getElementById('sms_student_id').value,
      phone: document.getElementById('sms_phone').value,
      message: document.getElementById('sms_message').value
    };

    try {
      await ApiClient.post('notifications', 'send', payload);
      alert('SMS dispatched successfully via Semaphore Gateway!');
      closeSmsModal();
      Router.navigate('notifications');
    } catch (err) {
      alert('Error sending SMS: ' + err.message);
    }
  };
};
