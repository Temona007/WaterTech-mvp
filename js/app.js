/**
 * WaterTech dMRV — MVP Application
 */

const App = {
  user: null,
  assets: [...DEMO_ASSETS],
  readings: [],
  audit: [],
  simulation: { enabled: false, mode: 'clean' },
  weather: null,

  init() {
    this.bindLogin();
    this.bindLogout();
    this.bindSimulation();
    this.loadWeather();
  },

  bindLogin() {
    const DEMO_ACCOUNTS = {
      owner: { email: 'owner@burjalarab.ae', password: 'demo123', role: 'owner' },
      admin: { email: 'admin@gias.ae', password: 'admin456', role: 'admin' }
    };

    document.getElementById('quick-login').addEventListener('change', (e) => {
      const val = e.target.value;
      if (val && DEMO_ACCOUNTS[val]) {
        const acc = DEMO_ACCOUNTS[val];
        this.user = { email: acc.email, role: acc.role };
        this.showDashboard();
      }
    });

  },

  bindLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.user = null;
      document.getElementById('login-view').classList.add('active');
      document.getElementById('dashboard-view').classList.remove('active');
    });
  },

  bindSimulation() {
    const toggle = document.getElementById('sim-toggle');
    const cleanBtn = document.getElementById('sim-clean');
    const maliciousBtn = document.getElementById('sim-malicious');

    toggle?.addEventListener('change', () => {
      this.simulation.enabled = toggle.checked;
      this.updateSimulationUI();
      if (this.simulation.enabled) {
        cleanBtn.disabled = false;
        maliciousBtn.disabled = false;
        this.runSimulation(this.simulation.mode);
      } else {
        cleanBtn.disabled = true;
        maliciousBtn.disabled = true;
        this.loadInitialData();
      }
      this.render();
    });

    cleanBtn?.addEventListener('click', () => {
      this.simulation.mode = 'clean';
      this.runSimulation('clean');
      this.updateSimulationUI();
      this.render();
    });

    maliciousBtn?.addEventListener('click', () => {
      this.simulation.mode = 'malicious';
      this.runSimulation('malicious');
      this.updateSimulationUI();
      this.render();
    });
  },

  showDashboard() {
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('dashboard-view').classList.add('active');

    this.updateRoleUI();
    this.updateSimulationUI();
    this.loadInitialData();
    this.render();
  },

  updateRoleUI() {
    const badge = document.getElementById('user-role');
    if (badge) {
      badge.textContent = this.user.role === 'admin' ? 'GIAS Admin' : 'Asset Owner';
    }

    const panel = document.getElementById('simulation-panel');
    if (panel) {
      panel.classList.toggle('hidden', this.user.role !== 'admin');
    }
  },

  updateSimulationUI() {
    const badge = document.getElementById('simulation-badge');
    if (badge) {
      badge.classList.remove('hidden');
      if (this.simulation.enabled) {
        badge.textContent = `Simulation: ${this.simulation.mode.toUpperCase()}`;
        badge.classList.add('active', this.simulation.mode === 'malicious');
      } else {
        badge.textContent = 'Simulation: OFF';
        badge.classList.remove('active');
      }
    }

    const cleanBtn = document.getElementById('sim-clean');
    const maliciousBtn = document.getElementById('sim-malicious');
    if (cleanBtn) cleanBtn.classList.toggle('active', this.simulation.mode === 'clean');
    if (maliciousBtn) maliciousBtn.classList.toggle('active', this.simulation.mode === 'malicious');
  },

  async loadWeather() {
    this.weather = await fetchUAEWeather();
    const el = document.getElementById('weather-badge');
    if (el) {
      el.textContent = `${this.weather.location}: ${this.weather.temp_c}°C, ${this.weather.humidity}% RH`;
    }
  },

  loadInitialData() {
    const { readings, audit } = generateCleanReadings();
    this.readings = readings;
    this.audit = audit;
    this.updateAssetLastReadings();
  },

  runSimulation(mode) {
    const { readings, audit } = mode === 'malicious'
      ? generateMaliciousReadings()
      : generateCleanReadings();
    this.readings = readings;
    this.audit = audit;
    this.updateAssetLastReadings();
  },

  updateAssetLastReadings() {
    this.assets.forEach(asset => {
      const last = this.audit.filter(a => a.assetId === asset.id).sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      if (last) {
        asset.lastReading = last.timestamp;
        asset.status = last.result.toLowerCase();
      }
    });
  },

  getFilteredAssets() {
    if (this.user?.role === 'admin') return this.assets;
    return this.assets.filter(a => a.ownerId === 'owner-1');
  },

  getFilteredAudit() {
    const assetIds = this.getFilteredAssets().map(a => a.id);
    return [...this.audit]
      .filter(a => assetIds.includes(a.assetId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  getStats() {
    const filtered = this.getFilteredAudit();
    const verified = filtered.filter(a => a.result === 'VERIFIED').length;
    const flagged = filtered.filter(a => ['FLAGGED', 'BLOCKED'].includes(a.result)).length;
    const totalCredits = filtered
      .filter(a => a.result === 'VERIFIED')
      .reduce((sum, a) => sum + (a.inputs?.volume || a.inputs?.production || 0) / 1000, 0);

    return {
      totalCredits: totalCredits.toFixed(2),
      verifiedToday: verified,
      flagged
    };
  },

  render() {
    const assets = this.getFilteredAssets();
    const audit = this.getFilteredAudit();
    const stats = this.getStats();

    document.getElementById('total-credits').textContent = stats.totalCredits;
    document.getElementById('verified-today').textContent = stats.verifiedToday;
    document.getElementById('flagged-count').textContent = stats.flagged;

    const tbody = document.getElementById('assets-tbody');
    tbody.innerHTML = assets.map(asset => `
      <tr>
        <td>${asset.name}</td>
        <td>${asset.type === 'greywater' ? 'Greywater' : 'AWG'}</td>
        <td>${asset.location}</td>
        <td>${asset.lastReading ? new Date(asset.lastReading).toLocaleString() : '—'}</td>
        <td><span class="status-badge ${asset.status}">${asset.status || 'pending'}</span></td>
      </tr>
    `).join('');

    const auditTbody = document.getElementById('audit-tbody');
    auditTbody.innerHTML = audit.slice(0, 20).map(entry => `
      <tr>
        <td>${new Date(entry.timestamp).toLocaleString()}</td>
        <td>${entry.assetName}</td>
        <td class="details-cell">${JSON.stringify(entry.inputs).slice(0, 60)}…</td>
        <td><span class="status-badge ${entry.result.toLowerCase()}">${entry.result}</span></td>
        <td class="details-cell">${entry.details}</td>
      </tr>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
