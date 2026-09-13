window.renderSettingsModule = async function(container) {
  let settings = {
    school_name: 'St. Agnes Academy of Caloocan Inc.',
    school_address: 'Camarin Road, Barangay 180, Caloocan City',
    academic_year: 'S.Y. 2026 - 2027',
    semester: '1st Semester',
    conduct_points_baseline: 100,
    low_risk_threshold: 90,
    moderate_risk_threshold: 75,
    minor_demerit_default: 3,
    major_demerit_default: 5,
    severe_demerit_default: 8,
    semaphore_sender_name: 'STAGNES',
    email_notifications: true,
    sms_notifications: true,
    auto_clearance_flag: true,
    auto_points_deduction: true
  };

  let loadError = null;

  try {
    const res = await ApiClient.get('reports', 'settings');
    if (res.data) Object.assign(settings, res.data);
  } catch (e) {
    console.error('Error loading settings:', e);
    loadError = e;
  }

  if (loadError) {
    container.innerHTML = `
      <div class="card card-dark" style="padding:40px; text-align:center; max-width:600px; margin:40px auto;">
        <div style="width:60px; height:60px; border-radius:50%; background:rgba(239,68,68,0.15); color:var(--danger); display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; font-size:1.5rem;">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 style="color:var(--text-light); margin-bottom:8px; font-size:1.2rem;">Unable to Load System Settings</h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:20px;">
          ${loadError.message || 'Access restricted to Administrator role or server connection failure.'}
        </p>
        <button class="btn btn-primary" onclick="Router.navigate('dashboard')">
          <i class="fas fa-arrow-left"></i> Return to Dashboard
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Page Header -->
    <div style="margin-bottom:28px;">
      <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-light); margin-bottom:4px;">
        <i class="fas fa-sliders-h" style="color:var(--accent); margin-right:10px;"></i>System Settings & Configuration
      </h2>
      <p style="font-size:0.85rem; color:var(--text-muted);">
        Configure school profile, academic year, conduct point thresholds, SMS gateway, and automated system policies.
      </p>
    </div>

    <!-- Settings Tabs -->
    <div style="display:flex; gap:8px; margin-bottom:22px; flex-wrap:wrap;" id="settingsTabs">
      ${[
        { key: 'school',     icon: 'fa-school',        label: 'School Profile' },
        { key: 'thresholds', icon: 'fa-sliders-h',     label: 'Point Thresholds' },
        { key: 'sms',        icon: 'fa-sms',           label: 'SMS Gateway' },
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
            <input type="text" id="cfg_school_name" value="${settings.school_name || ''}" />
          </div>
          <div class="form-group">
            <label>School Address</label>
            <input type="text" id="cfg_school_address" value="${settings.school_address || ''}" />
          </div>
          <div class="form-group">
            <label>Current Academic Year</label>
            <input type="text" id="cfg_academic_year" value="${settings.academic_year || ''}" />
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
            <i class="fas fa-shield-alt"></i> System & Environment Security
          </h3>
          ${[
            { label: 'Environment Config',  value: 'Server-Side Managed (.env)' },
            { label: 'Database Service',    value: 'Supabase PostgreSQL (Active)' },
            { label: 'Authentication',      value: 'Supabase Auth JWT + Local RBAC' },
            { label: 'SMS Gateway Layer',   value: 'Semaphore (Server-Side Key)' },
            { label: 'Security Policy',     value: 'Least Privilege Enforcement' },
            { label: 'Audit Trail',         value: 'Active (Immutable Logs)' }
          ].map(item => `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-color); font-size:0.83rem;">
              <span style="color:var(--text-muted);">${item.label}</span>
              <strong style="color:var(--text-light);">${item.value}</strong>
            </div>
          `).join('')}
          <div style="margin-top:16px; background:rgba(255,95,162,0.06); border:1px solid rgba(255,95,162,0.2); border-radius:var(--radius-sm); padding:12px; font-size:0.78rem; color:var(--text-muted);">
            <i class="fas fa-lock" style="color:var(--accent); margin-right:4px;"></i>
            Database passwords and private API keys are protected on the server and not editable from the browser.
          </div>
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
            <input type="number" id="cfg_baseline" value="${settings.conduct_points_baseline || 100}" min="50" max="200" />
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Starting conduct points for all enrolled students. Recommended: 100</p>
          </div>
          <div style="background:rgba(255,95,162,0.06); border:1px solid rgba(255,95,162,0.2); border-radius:var(--radius-sm); padding:14px; margin-bottom:18px;">
            <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:10px; color:var(--text-light);">Intervention Escalation Thresholds</h4>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
              Automatic risk tier classification based on remaining conduct points:
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label><span style="color:var(--success);">●</span> Low Risk — Points Above</label>
              <input type="number" id="cfg_low_risk" value="${settings.low_risk_threshold || 90}" min="50" max="100" />
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label><span style="color:var(--warning);">●</span> Moderate Risk — Points Between</label>
              <input type="number" id="cfg_mod_risk" value="${settings.moderate_risk_threshold || 75}" min="30" max="89" />
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
            { category: 'Minor Offense', icon: 'fa-minus-circle', color: 'var(--warning)', pts: settings.minor_demerit_default || 3, id: 'cfg_minor' },
            { category: 'Major Offense', icon: 'fa-exclamation-circle', color: 'var(--danger)', pts: settings.major_demerit_default || 5, id: 'cfg_major' },
            { category: 'Severe Offense', icon: 'fa-skull-crossbones', color: '#DC2626', pts: settings.severe_demerit_default || 8, id: 'cfg_severe' }
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
            Configure your SMS Sender ID. API credentials are encrypted and stored on the server environment.
          </p>
          <div class="form-group">
            <label>Sender Name / SenderID</label>
            <input type="text" id="cfg_sms_sender" value="${settings.semaphore_sender_name || 'STAGNES'}" maxlength="11" placeholder="e.g. STAGNES" />
            <p style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">Maximum 11 characters. Registered with Semaphore.co.</p>
          </div>
          <div style="display:flex; gap:10px; margin-top:15px;">
            <button class="btn btn-primary" onclick="saveSMSSettings()">
              <i class="fas fa-save"></i> Save SMS Sender Settings
            </button>
          </div>
        </div>

        <div class="card card-dark" style="padding:24px;">
          <h3 style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:20px;">
            <i class="fas fa-paper-plane"></i> SMS Notification Templates
          </h3>
          <div style="background:var(--input-bg); border:1px solid var(--input-border); border-radius:var(--radius-sm); padding:16px; font-size:0.82rem; color:var(--text-light); line-height:1.6; font-family:monospace; margin-bottom:15px;">
            ST. AGNES ACADEMY ALERT: Dear [Guardian Name], your child [Student Name] (Grade [X]) has been logged for [Violation Name] on [Date]. Please report to the Prefect Office. Ref: [INC-XXXX].
          </div>
          <div style="background:var(--input-bg); border:1px solid var(--input-border); border-radius:var(--radius-sm); padding:16px; font-size:0.82rem; color:var(--text-light); line-height:1.6; font-family:monospace;">
            ST. AGNES ACADEMY NOTICE: Dear [Guardian Name], a disciplinary hearing for [Student Name] is scheduled on [Date] at [Time] at [Venue]. Your presence is required. Ref: [INC-XXXX].
          </div>
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
          Configure which system workflows trigger automatically when specific disciplinary events occur.
        </p>
        ${[
          { id: 'auto_sms',        label: 'Auto-Send SMS on Infraction Logged',   desc: 'Automatically dispatch parent SMS alert when a new infraction report is saved.',   enabled: settings.sms_notifications },
          { id: 'auto_email',      label: 'Auto-Send Email Notification',          desc: 'Send email alert to guidance counselor when a student reaches High Risk tier.',   enabled: settings.email_notifications },
          { id: 'auto_points',     label: 'Auto-Deduct Conduct Points',            desc: 'Automatically deduct demerit points from student record when infraction is logged.', enabled: settings.auto_points_deduction },
          { id: 'auto_clearance',  label: 'Auto-Flag Clearance Hold',              desc: 'Flag clearance hold automatically for Major and Severe infractions.',              enabled: settings.auto_clearance_flag },
          { id: 'auto_audit',      label: 'Auto-Log Audit Trail',                  desc: 'Record every system action to the immutable audit log (always enforced).',           enabled: true }
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
    if (!input || !track || !knob) return;
    input.checked = !input.checked;
    track.style.background = input.checked ? 'var(--brand-pink)' : 'var(--input-border)';
    knob.style.left = input.checked ? '24px' : '3px';
  };

  // Toast
  window.showSettingsToast = (msg = 'Settings saved successfully!', isError = false) => {
    const toast = document.getElementById('settingsToast');
    const msgEl = document.getElementById('settingsToastMsg');
    if (!toast || !msgEl) return;
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    toast.querySelector('i').className = isError ? 'fas fa-times-circle' : 'fas fa-check-circle';
    msgEl.textContent = msg;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
  };

  // Save handlers
  window.saveSchoolSettings = async () => {
    try {
      await ApiClient.post('reports', 'settings', {
        school_name:    document.getElementById('cfg_school_name').value.trim(),
        school_address: document.getElementById('cfg_school_address').value.trim(),
        academic_year:  document.getElementById('cfg_academic_year').value.trim(),
        semester:       document.getElementById('cfg_semester').value
      });
      showSettingsToast('School profile saved successfully!');
    } catch (err) {
      showSettingsToast('Failed to save school profile: ' + (err.message || 'Server error'), true);
    }
  };

  window.saveThresholdSettings = async () => {
    try {
      await ApiClient.post('reports', 'settings', {
        conduct_points_baseline: parseInt(document.getElementById('cfg_baseline').value, 10),
        low_risk_threshold:      parseInt(document.getElementById('cfg_low_risk').value, 10),
        moderate_risk_threshold: parseInt(document.getElementById('cfg_mod_risk').value, 10)
      });
      showSettingsToast('Point threshold settings saved!');
    } catch (err) {
      showSettingsToast('Failed to save thresholds: ' + (err.message || 'Server error'), true);
    }
  };

  window.saveOffenseSettings = async () => {
    try {
      await ApiClient.post('reports', 'settings', {
        minor_demerit_default:  parseInt(document.getElementById('cfg_minor').value, 10),
        major_demerit_default:  parseInt(document.getElementById('cfg_major').value, 10),
        severe_demerit_default: parseInt(document.getElementById('cfg_severe').value, 10)
      });
      showSettingsToast('Offense demerit defaults saved!');
    } catch (err) {
      showSettingsToast('Failed to save offense defaults: ' + (err.message || 'Server error'), true);
    }
  };

  window.saveSMSSettings = async () => {
    try {
      await ApiClient.post('reports', 'settings', {
        semaphore_sender_name: document.getElementById('cfg_sms_sender').value.trim()
      });
      showSettingsToast('SMS sender settings saved!');
    } catch (err) {
      showSettingsToast('Failed to save SMS settings: ' + (err.message || 'Server error'), true);
    }
  };

  window.saveAutomationSettings = async () => {
    const flags = {};
    ['auto_sms','auto_email','auto_points','auto_clearance'].forEach(id => {
      flags[id] = document.getElementById(id)?.checked || false;
    });
    try {
      await ApiClient.post('reports', 'settings', flags);
      showSettingsToast('Automation rules saved!');
    } catch (err) {
      showSettingsToast('Failed to save automation rules: ' + (err.message || 'Server error'), true);
    }
  };
};

