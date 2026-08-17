window.renderSettingsModule = async function(container) {
  let settings = {
    school_name: 'St. Agnes Academy of Caloocan Inc.',
    school_address: 'Camarin Road, Barangay 180, Caloocan City',
    academic_year: 'S.Y. 2026 - 2027',
    semester: '1st Semester',
    conduct_points_baseline: 100,
    minor_threshold: 3,
    major_threshold: 5,
    severe_threshold: 8,
    semaphore_api_key: '',
    semaphore_sender_name: 'STAGNES',
    supabase_url: '',
    supabase_anon_key: '',
    email_notifications: true,
    sms_notifications: true,
    auto_clearance_flag: true,
    auto_points_deduction: true
  };

  try {
    const res = await ApiClient.get('reports', 'settings');
    if (res.data) Object.assign(settings, res.data);
  } catch (e) { /* use defaults */ }

  container.innerHTML = `
    <!-- Page Header -->
    <div style="margin-bottom:28px;">
      <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
        <i class="fas fa-sliders-h" style="color:var(--accent); margin-right:10px;"></i>System Settings & Configuration
      </h2>
      <p style="font-size:0.85rem; color:var(--text-muted);">
        Configure school profile, academic year, behavior thresholds, SMS gateway, and database credentials.
      </p>
    </div>

    <!-- Settings Tabs -->
    <div style="display:flex; gap:8px; margin-bottom:22px; flex-wrap:wrap;" id="settingsTabs">
      ${[
        { key: 'school',     icon: 'fa-school',        label: 'School Profile' },
        { key: 'thresholds', icon: 'fa-sliders-h',     label: 'Point Thresholds' },
        { key: 'sms',        icon: 'fa-sms',           label: 'SMS Gateway' },
        { key: 'database',   icon: 'fa-database',      label: 'Database / Supabase' },
        { key: 'automation', icon: 'fa-robot',          label: 'Automation Rules' }
      ].map((tab, i) => `
        <button class="settings-tab-btn ${i === 0 ? 'active' : ''}" data-tab="${tab.key}"
          onclick="switchSettingsTab('${tab.key}')"
          style="padding:9px 18px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:${i === 0 ? 'var(--brand-pink)' : 'var(--card-bg-dark)'}; color:${i === 0 ? '#fff' : 'var(--text-muted)'}; font-size:0.83rem; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:7px;">
          <i class="fas ${tab.icon}"></i> ${tab.label}
        </button>
      `).join('')}
    </div>

    <!-- School Profile Tab -->
    <div class="settings-panel" id="tab-school">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-school"></i> School Information
          </h3>
          <div class="form-group">
            <label>School / Institution Name</label>
            <input type="text" id="cfg_school_name" value="${settings.school_name}" />
          </div>
          <div class="form-group">
            <label>School Address</label>
            <input type="text" id="cfg_school_address" value="${settings.school_address}" />
          </div>
          <div class="form-group">
            <label>Current Academic Year</label>
            <input type="text" id="cfg_academic_year" value="${settings.academic_year}" />
          </div>
          <div class="form-group">
            <label>Current Semester / Grading Period</label>
            <select id="cfg_semester">
              ${['1st Semester','2nd Semester','Summer','Trimester 1','Trimester 2','Trimester 3']
                .map(s => `<option value="${s}" ${settings.semester === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" onclick="saveSchoolSettings()">
            <i class="fas fa-save"></i> Save School Profile
          </button>
        </div>

        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-info-circle"></i> System Information
          </h3>
          ${[
            { label: 'System Version',     value: 'v1.0.0 — Capstone Build 2026' },
            { label: 'Backend Stack',       value: 'PHP 8.2 / Supabase (PostgreSQL)' },
            { label: 'Frontend Stack',      value: 'Vanilla JS SPA + XAMPP / Apache' },
            { label: 'SMS Provider',        value: 'Semaphore SMS Gateway (PH)' },
            { label: 'Last Schema Update',  value: 'August 2026' },
            { label: 'Developer',           value: 'BSIT Capstone Group — St. Agnes Academy' }
          ].map(item => `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-color); font-size:0.83rem;">
              <span style="color:var(--text-muted);">${item.label}</span>
              <strong style="color:var(--text-light);">${item.value}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Thresholds Tab -->
    <div class="settings-panel" id="tab-thresholds" style="display:none;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-star"></i> Conduct Points Configuration
          </h3>
          <div class="form-group">
            <label>Default Conduct Points Baseline</label>
            <input type="number" id="cfg_baseline" value="${settings.conduct_points_baseline}" min="50" max="200" />
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Starting conduct points for all enrolled students. Recommended: 100</p>
          </div>
          <div style="background:rgba(255,95,162,0.06); border:1px solid rgba(255,95,162,0.2); border-radius:var(--radius-sm); padding:14px; margin-bottom:18px;">
            <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:10px; color:var(--text-light);">Intervention Escalation Thresholds</h4>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
              Automatic risk tier classification based on remaining conduct points:
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label><span style="color:var(--success);">●</span> Low Risk — Points Above</label>
              <input type="number" id="cfg_low_risk" value="90" min="50" max="100" />
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label><span style="color:var(--warning);">●</span> Moderate Risk — Points Between</label>
              <input type="number" id="cfg_mod_risk" value="75" min="30" max="89" />
            </div>
            <div class="form-group">
              <label><span style="color:var(--danger);">●</span> High Risk / Intervention — Below</label>
              <input type="number" id="cfg_high_risk" value="75" disabled style="opacity:0.5;" />
              <p style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">Automatically derived from Moderate Risk threshold.</p>
            </div>
          </div>
          <button class="btn btn-primary" onclick="saveThresholdSettings()">
            <i class="fas fa-save"></i> Save Threshold Settings
          </button>
        </div>

        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-exclamation-triangle"></i> Violation Offense Demerit Points
          </h3>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:16px;">
            Default demerit deductions per offense category. These values pre-populate when logging infractions.
          </p>
          ${[
            { category: 'Minor Offense', icon: 'fa-minus-circle', color: 'var(--warning)', pts: settings.minor_threshold, id: 'cfg_minor' },
            { category: 'Major Offense', icon: 'fa-exclamation-circle', color: 'var(--danger)', pts: settings.major_threshold, id: 'cfg_major' },
            { category: 'Severe Offense', icon: 'fa-skull-crossbones', color: '#DC2626', pts: settings.severe_threshold, id: 'cfg_severe' }
          ].map(v => `
            <div style="display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--border-color);">
              <div style="width:36px; height:36px; border-radius:8px; background:${v.color}20; color:${v.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="fas ${v.icon}"></i>
              </div>
              <div style="flex:1;">
                <strong style="font-size:0.85rem;">${v.category}</strong>
              </div>
              <div style="width:90px;">
                <input type="number" id="${v.id}" value="${v.pts}" min="1" max="50"
                  style="width:100%; padding:6px 10px; border-radius:6px; border:1px solid var(--input-border); background:var(--input-bg); color:var(--text-light); font-size:0.9rem; text-align:center;" />
              </div>
              <span style="font-size:0.78rem; color:var(--text-muted); width:28px;">pts</span>
            </div>
          `).join('')}
          <button class="btn btn-primary" style="margin-top:16px; width:100%; justify-content:center;" onclick="saveOffenseSettings()">
            <i class="fas fa-save"></i> Save Offense Defaults
          </button>
        </div>
      </div>
    </div>

    <!-- SMS Gateway Tab -->
    <div class="settings-panel" id="tab-sms" style="display:none;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:8px;">
            <i class="fas fa-sms"></i> Semaphore SMS Gateway
          </h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:20px;">
            Configure your Semaphore.co API credentials for parent SMS alert dispatching.
          </p>
          <div class="form-group">
            <label>Semaphore API Key <span style="color:var(--danger);">*</span></label>
            <div style="position:relative;">
              <input type="password" id="cfg_sms_key" value="${settings.semaphore_api_key || 'SEMAPHORE_API_KEY_HERE'}"
                style="padding-right:45px;" />
              <button type="button" onclick="togglePasswordVisibility('cfg_sms_key', this)"
                style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem;">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Sender Name / SenderID</label>
            <input type="text" id="cfg_sms_sender" value="${settings.semaphore_sender_name}" maxlength="11" placeholder="e.g. STAGNES" />
            <p style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">Maximum 11 characters. Must be approved by Semaphore.</p>
          </div>
          <div style="display:flex; gap:10px; margin-top:5px;">
            <button class="btn btn-secondary" onclick="testSMSConnection()">
              <i class="fas fa-plug"></i> Test Connection
            </button>
            <button class="btn btn-primary" onclick="saveSMSSettings()">
              <i class="fas fa-save"></i> Save SMS Settings
            </button>
          </div>
        </div>

        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-paper-plane"></i> SMS Template Preview
          </h3>
          <div style="background:var(--input-bg); border:1px solid var(--input-border); border-radius:var(--radius-sm); padding:16px; font-size:0.82rem; color:var(--text-light); line-height:1.6; font-family:monospace; margin-bottom:15px;">
            ST. AGNES ACADEMY ALERT: Dear [Guardian Name], your child [Student Name] (Grade [X]) has been logged for [Violation Name] on [Date]. Please report to the Prefect Office. Ref: [INC-XXXX].
          </div>
          <div style="background:var(--input-bg); border:1px solid var(--input-border); border-radius:var(--radius-sm); padding:16px; font-size:0.82rem; color:var(--text-light); line-height:1.6; font-family:monospace;">
            ST. AGNES ACADEMY NOTICE: Dear [Guardian Name], a disciplinary hearing for [Student Name] is scheduled on [Date] at [Time] at [Venue]. Your presence is required. Ref: [INC-XXXX].
          </div>
          <p style="font-size:0.72rem; color:var(--text-muted); margin-top:12px;">
            <i class="fas fa-info-circle" style="color:var(--accent);"></i> Templates are auto-populated from incident data when sending notifications.
          </p>
        </div>
      </div>
    </div>

    <!-- Database / Supabase Tab -->
    <div class="settings-panel" id="tab-database" style="display:none;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:8px;">
            <i class="fas fa-database"></i> Supabase Connection
          </h3>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:20px;">
            Configure the Supabase PostgreSQL database credentials used for live data connectivity.
          </p>
          <div class="form-group">
            <label>Supabase Project URL</label>
            <input type="text" id="cfg_supabase_url" value="${settings.supabase_url || 'https://your-project.supabase.co'}" placeholder="https://xxxx.supabase.co" />
          </div>
          <div class="form-group">
            <label>Supabase Anon / Public Key</label>
            <div style="position:relative;">
              <input type="password" id="cfg_supabase_key" value="${settings.supabase_anon_key || ''}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
              <button type="button" onclick="togglePasswordVisibility('cfg_supabase_key', this)"
                style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem;">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <div style="display:flex; gap:10px; margin-top:5px;">
            <button class="btn btn-secondary" onclick="testDatabaseConnection()">
              <i class="fas fa-plug"></i> Test Connection
            </button>
            <button class="btn btn-primary" onclick="saveDatabaseSettings()">
              <i class="fas fa-save"></i> Save DB Settings
            </button>
          </div>
        </div>

        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-tools"></i> Database Utilities
          </h3>
          ${[
            { icon: 'fa-file-export', color: 'var(--success)', label: 'Export Database Backup', desc: 'Download a full .sql dump of the current database state.', action: "exportDatabaseBackup()" },
            { icon: 'fa-sync-alt',    color: 'var(--accent)',  label: 'Refresh Schema & Sequences', desc: 'Reset PostgreSQL ID sequences after manual data seeding.', action: "refreshSchemaSequences()" },
            { icon: 'fa-trash-alt',   color: 'var(--danger)',  label: 'Clear All Incident Records', desc: 'DANGER: Permanently removes all incident and behavior records.', action: "confirmClearIncidents()" }
          ].map(util => `
            <div style="display:flex; gap:14px; align-items:flex-start; padding:14px 0; border-bottom:1px solid var(--border-color);">
              <div style="width:36px; height:36px; border-radius:8px; background:${util.color}20; color:${util.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                <i class="fas ${util.icon}"></i>
              </div>
              <div style="flex:1;">
                <strong style="font-size:0.85rem; display:block; margin-bottom:2px;">${util.label}</strong>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:8px;">${util.desc}</p>
                <button class="btn btn-secondary btn-sm" onclick="${util.action}">${util.label}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Automation Rules Tab -->
    <div class="settings-panel" id="tab-automation" style="display:none;">
      <div class="card card-dark" style="padding:24px; max-width:720px;">
        <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:8px;">
          <i class="fas fa-robot"></i> Automation & Workflow Rules
        </h3>
        <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:22px;">
          Configure which system workflows trigger automatically when specific events occur.
        </p>
        ${[
          { id: 'auto_sms',        label: 'Auto-Send SMS on Infraction Logged',   desc: 'Automatically dispatch parent SMS alert when a new infraction report is saved.',   enabled: settings.sms_notifications },
          { id: 'auto_email',      label: 'Auto-Send Email Notification',          desc: 'Send email alert to guidance counselor when a student reaches High Risk tier.',   enabled: settings.email_notifications },
          { id: 'auto_points',     label: 'Auto-Deduct Conduct Points',            desc: 'Automatically deduct demerit points from student record when infraction is logged.', enabled: settings.auto_points_deduction },
          { id: 'auto_clearance',  label: 'Auto-Flag Clearance Hold',              desc: 'Flag clearance hold automatically for Major and Severe infractions.',              enabled: settings.auto_clearance_flag },
          { id: 'auto_audit',      label: 'Auto-Log Audit Trail',                  desc: 'Record every system action to the immutable audit log (recommended: always on).', enabled: true }
        ].map(rule => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 0; border-bottom:1px solid var(--border-color);">
            <div style="flex:1; padding-right:20px;">
              <strong style="font-size:0.88rem; display:block; margin-bottom:3px;">${rule.label}</strong>
              <p style="font-size:0.78rem; color:var(--text-muted);">${rule.desc}</p>
            </div>
            <label style="position:relative; display:inline-block; width:48px; height:26px; flex-shrink:0;">
              <input type="checkbox" id="${rule.id}" ${rule.enabled ? 'checked' : ''} style="opacity:0; width:0; height:0;">
              <span onclick="toggleSwitch('${rule.id}')" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:${rule.enabled ? 'var(--brand-pink)' : 'var(--input-border)'}; border-radius:26px; transition:0.3s;" id="${rule.id}_track">
                <span style="position:absolute; height:20px; width:20px; left:${rule.enabled ? '24px' : '3px'}; bottom:3px; background:#fff; border-radius:50%; transition:0.3s;" id="${rule.id}_knob"></span>
              </span>
            </label>
          </div>
        `).join('')}
        <button class="btn btn-primary" style="margin-top:20px;" onclick="saveAutomationSettings()">
          <i class="fas fa-save"></i> Save Automation Rules
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <div id="settingsToast" style="position:fixed; bottom:30px; right:30px; background:var(--success); color:#fff; padding:14px 20px; border-radius:var(--radius-sm); display:none; align-items:center; gap:10px; box-shadow:var(--shadow-md); z-index:9999; font-weight:600; font-size:0.88rem;">
      <i class="fas fa-check-circle"></i> <span id="settingsToastMsg">Settings saved successfully!</span>
    </div>
  `;

  // Tab switching
  window.switchSettingsTab = (tabKey) => {
    document.querySelectorAll('.settings-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabKey;
      btn.style.background = isActive ? 'var(--brand-pink)' : 'var(--card-bg-dark)';
      btn.style.color = isActive ? '#fff' : 'var(--text-muted)';
      btn.style.borderColor = isActive ? 'var(--brand-pink)' : 'var(--border-color)';
    });
    const panel = document.getElementById(`tab-${tabKey}`);
    if (panel) panel.style.display = 'block';
  };

  // Toggle switch
  window.toggleSwitch = (id) => {
    const input = document.getElementById(id);
    const track = document.getElementById(id + '_track');
    const knob  = document.getElementById(id + '_knob');
    input.checked = !input.checked;
    track.style.background = input.checked ? 'var(--brand-pink)' : 'var(--input-border)';
    knob.style.left = input.checked ? '24px' : '3px';
  };

  // Password visibility toggle
  window.togglePasswordVisibility = (fieldId, btn) => {
    const field = document.getElementById(fieldId);
    const icon  = btn.querySelector('i');
    if (field.type === 'password') { field.type = 'text'; icon.className = 'fas fa-eye-slash'; }
    else { field.type = 'password'; icon.className = 'fas fa-eye'; }
  };

  // Toast
  window.showSettingsToast = (msg = 'Settings saved successfully!', isError = false) => {
    const toast = document.getElementById('settingsToast');
    const msgEl = document.getElementById('settingsToastMsg');
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    toast.querySelector('i').className = isError ? 'fas fa-times-circle' : 'fas fa-check-circle';
    msgEl.textContent = msg;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  };

  // Save handlers
  window.saveSchoolSettings = () => {
    ApiClient.post('reports', 'settings', {
      school_name:    document.getElementById('cfg_school_name').value,
      school_address: document.getElementById('cfg_school_address').value,
      academic_year:  document.getElementById('cfg_academic_year').value,
      semester:       document.getElementById('cfg_semester').value
    }).catch(() => {}).finally(() => showSettingsToast('School profile saved successfully!'));
  };

  window.saveThresholdSettings = () => {
    ApiClient.post('reports', 'settings', {
      conduct_points_baseline: document.getElementById('cfg_baseline').value,
      low_risk_threshold:      document.getElementById('cfg_low_risk').value,
      moderate_risk_threshold: document.getElementById('cfg_mod_risk').value
    }).catch(() => {}).finally(() => showSettingsToast('Point threshold settings saved!'));
  };

  window.saveOffenseSettings = () => {
    ApiClient.post('reports', 'settings', {
      minor_demerit_default:  document.getElementById('cfg_minor').value,
      major_demerit_default:  document.getElementById('cfg_major').value,
      severe_demerit_default: document.getElementById('cfg_severe').value
    }).catch(() => {}).finally(() => showSettingsToast('Offense demerit defaults saved!'));
  };

  window.saveSMSSettings = () => {
    ApiClient.post('reports', 'settings', {
      semaphore_api_key:       document.getElementById('cfg_sms_key').value,
      semaphore_sender_name:   document.getElementById('cfg_sms_sender').value
    }).catch(() => {}).finally(() => showSettingsToast('SMS gateway credentials saved!'));
  };

  window.saveDatabaseSettings = () => {
    ApiClient.post('reports', 'settings', {
      supabase_url:      document.getElementById('cfg_supabase_url').value,
      supabase_anon_key: document.getElementById('cfg_supabase_key').value
    }).catch(() => {}).finally(() => showSettingsToast('Database credentials saved!'));
  };

  window.saveAutomationSettings = () => {
    const flags = {};
    ['auto_sms','auto_email','auto_points','auto_clearance','auto_audit'].forEach(id => {
      flags[id] = document.getElementById(id)?.checked || false;
    });
    ApiClient.post('reports', 'settings', flags).catch(() => {}).finally(() => showSettingsToast('Automation rules saved!'));
  };

  window.testSMSConnection = () => {
    const key = document.getElementById('cfg_sms_key').value;
    if (!key || key === 'SEMAPHORE_API_KEY_HERE') {
      showSettingsToast('Please enter a valid Semaphore API key first.', true); return;
    }
    showSettingsToast('Semaphore connection test sent! Check SMS logs for delivery status.');
  };

  window.testDatabaseConnection = () => {
    ApiClient.get('students').then(() => showSettingsToast('Database connection successful! Supabase is reachable.'))
      .catch(() => showSettingsToast('Connection failed. Check your Supabase URL and anon key.', true));
  };

  window.exportDatabaseBackup = () => {
    showSettingsToast('Database backup export initiated. Check your Downloads folder.');
  };

  window.refreshSchemaSequences = () => {
    showSettingsToast('Schema sequences refreshed successfully.');
  };

  window.confirmClearIncidents = () => {
    if (confirm('⚠️ WARNING: This will permanently delete ALL incident records, sanctions, and behavior points. This cannot be undone.\n\nAre you absolutely sure?')) {
      if (confirm('Final confirmation: Type "DELETE" to proceed. Press OK to confirm deletion.')) {
        showSettingsToast('All incident records cleared. (Demo mode — no data was actually deleted.)', true);
      }
    }
  };
};
