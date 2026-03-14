import { TelemetryParser } from './parser.js';
import { ChartManager } from './charts.js';

/**
 * App Module - Main Controller
 */
const App = {
    state: {
        activeView: 'plotter', // dashboard, plotter, sessions
        currentData: null,
        history: [] // sessions
    },

    init() {
        this.bindEvents();
        this.loadHistory();
        this.switchView('plotter');
    },

    bindEvents() {
        // Navigation clicks
        document.querySelectorAll('[data-view-btn]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = btn.getAttribute('data-view-btn');
                this.switchView(view);
            });
        });

        // Plot button
        document.getElementById('plot-btn')?.addEventListener('click', () => {
            this.handlePlotAction();
        });

        // Export button
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.handleExportAction();
        });

        // Clear History
        document.getElementById('clear-history-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all stored sessions?')) {
                this.clearHistory();
            }
        });

        // Sidebar New Session
        document.getElementById('sidebar-new-btn')?.addEventListener('click', () => {
            this.newSession();
        });

        // File Upload
        document.getElementById('file-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });

        // Drag and Drop
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('active-glow', 'border-blue-500');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('active-glow', 'border-blue-500');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const file = e.dataTransfer.files[0];
                if (file) this.handleFileUpload(file);
            });
        }
    },

    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const input = document.getElementById('data-input');
            if (input) input.value = text;
            this.handlePlotAction(file.name);
        };
        reader.readAsText(file);
    },

    newSession() {
        this.state.currentData = null;
        const input = document.getElementById('data-input');
        if (input) input.value = '';
        
        const container = document.getElementById('plots-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl animate-in">
                    <p class="text-gray-500">New session started. Paste telemetry or upload a file to begin.</p>
                </div>
            `;
        }
        
        this.switchView('plotter');
    },

    handleExportAction() {
        if (!this.state.currentData) {
            alert('No data to export.');
            return;
        }

        const keys = Object.keys(this.state.currentData);
        const maxLength = Math.max(...keys.map(k => this.state.currentData[k].length));
        
        let csv = keys.join(',') + '\n';
        for (let i = 0; i < maxLength; i++) {
            const row = keys.map(k => this.state.currentData[k][i] ?? '');
            csv += row.join(',') + '\n';
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telemetry_${Date.now()}.csv`;
        a.click();
    },

    switchView(viewName) {
        this.state.activeView = viewName;

        // Update Nav UI
        document.querySelectorAll('[data-view-btn]').forEach(btn => {
            if (btn.getAttribute('data-view-btn') === viewName) {
                btn.classList.add('nav-active');
                btn.classList.remove('text-gray-400', 'hover:bg-gray-800');
            } else {
                btn.classList.remove('nav-active');
                btn.classList.add('text-gray-400', 'hover:bg-gray-800');
            }
        });

        // Update Content UI
        document.querySelectorAll('[data-view-content]').forEach(content => {
            if (content.getAttribute('data-view-content') === viewName) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        // Trigger view-specific rendering
        if (viewName === 'dashboard') {
            this.renderDashboard();
        } else if (viewName === 'sessions') {
            this.renderSessions();
        } else if (viewName === 'plotter') {
            if (this.state.currentData) {
                this.renderPlotter();
            }
        }
    },

    handlePlotAction(sessionName = null) {
        const input = document.getElementById('data-input');
        const rawText = input?.value;
        if (!rawText) return;

        const data = TelemetryParser.parse(rawText);
        if (Object.keys(data).length === 0) {
            alert('No valid data found to plot. Please check your format.');
            return;
        }

        this.state.currentData = data;
        this.addToHistory(rawText, sessionName);
        this.renderPlotter();
    },

    renderPlotter() {
        const container = document.getElementById('plots-container');
        if (container) {
            ChartManager.renderPlotting(this.state.currentData, container);
        }
    },

    renderDashboard() {
        const container = document.getElementById('dashboard-container');
        if (container) {
            ChartManager.renderDashboard(this.state.currentData, container);
        }
    },

    addToHistory(rawText, name = null) {
        const id = Date.now();
        const entry = {
            id: id,
            name: name || `Session ${new Date().toLocaleTimeString()}`,
            date: new Date().toLocaleString(),
            snippet: rawText.substring(0, 80) + '...',
            fullText: rawText,
            seriesCount: Object.keys(this.state.currentData).length
        };
        
        // Remove duplicate if loading same text? No, let's just add.
        this.state.history.unshift(entry);
        
        // Limit history to 20 items
        if (this.state.history.length > 20) this.state.history.pop();
        
        localStorage.setItem('telemetry_history', JSON.stringify(this.state.history));
    },

    loadHistory() {
        const stored = localStorage.getItem('telemetry_history');
        if (stored) {
            this.state.history = JSON.parse(stored);
        }
    },

    deleteSession(id) {
        this.state.history = this.state.history.filter(s => s.id !== id);
        localStorage.setItem('telemetry_history', JSON.stringify(this.state.history));
        this.renderSessions();
    },

    renderSessions() {
        const container = document.getElementById('history-list');
        if (!container) return;

        container.innerHTML = '';
        if (this.state.history.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20 glass rounded-3xl border-2 border-dashed border-gray-800">
                    <p class="text-gray-500">No stored sessions found.</p>
                </div>
            `;
            return;
        }

        this.state.history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'glass p-6 rounded-2xl flex flex-col hover:active-glow transition-all animate-in group';
            item.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <button class="delete-session text-gray-600 hover:text-red-400 transition-colors p-1" title="Delete Session">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <h3 class="font-bold text-gray-100 truncate mb-1" title="${entry.name}">${entry.name}</h3>
                <p class="text-xs text-gray-500 mb-4">${entry.date}</p>
                
                <div class="mt-auto flex items-center justify-between pt-4 border-t border-gray-800">
                    <span class="text-xs font-mono text-gray-400">${entry.seriesCount} Data Series</span>
                    <button class="load-session text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center space-x-1 group/btn">
                        <span>Load</span>
                        <svg class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                </div>
            `;
            
            item.querySelector('.load-session').addEventListener('click', () => {
                const input = document.getElementById('data-input');
                if (input) input.value = entry.fullText;
                this.handlePlotAction(entry.name);
                this.switchView('plotter');
            });

            item.querySelector('.delete-session').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(entry.id);
            });

            container.appendChild(item);
        });
    },

    clearHistory() {
        this.state.history = [];
        localStorage.removeItem('telemetry_history');
        this.renderSessions();
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => App.init());