/**
 * Module for handling Plotly charts and dashboard rendering
 */
export const ChartManager = {
    // Shared dark theme layout configuration for Plotly
    darkLayout: {
        paper_bgcolor: 'rgba(0,0,0,0)', // Transparent
        plot_bgcolor: 'rgba(0,0,0,0)',  // Transparent
        font: { color: '#e5e7eb' }, // Tailwind gray-200
        xaxis: { gridcolor: '#374151', zerolinecolor: '#374151', title: 'Timestep' }, // Tailwind gray-700
        yaxis: { gridcolor: '#374151', zerolinecolor: '#374151' },
    },

    /**
     * Dynamically group keys by their prefix (e.g., "Pose_X" and "Pose_Y" group into "Pose")
     */
    getDynamicCategories(dataMap) {
        const groups = {};
        const keys = Object.keys(dataMap);

        keys.forEach(key => {
            // Split by underscore to find a prefix
            const parts = key.split('_');
            const prefix = parts.length > 1 ? parts[0] : 'General';
            
            if (!groups[prefix]) {
                groups[prefix] = [];
            }
            groups[prefix].push(key);
        });

        return groups;
    },

    /**
     * Render the plotting dashboard
     */
    renderPlotting(dataMap, container) {
        container.innerHTML = '';
        
        if (!dataMap || Object.keys(dataMap).length === 0) {
            container.innerHTML = '<div class="text-center py-10 text-gray-400">No data available to plot.</div>';
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid grid-cols-1 xl:grid-cols-2 gap-6';
        container.appendChild(gridContainer);

        // Get dynamic groupings based on the actual data provided
        const dynamicCategories = this.getDynamicCategories(dataMap);

        // Render Categorized Charts
        Object.entries(dynamicCategories).forEach(([name, keys]) => {
            const traces = [];
            keys.forEach(key => {
                if (dataMap[key] && dataMap[key].length > 0) {
                    traces.push({
                        y: dataMap[key],
                        type: 'scatter',
                        mode: 'lines',
                        name: key,
                        line: { width: 2 }
                    });
                }
            });

            if (traces.length > 0) {
                this.createPlot(name, traces, gridContainer);
            }
        });
    },

    /**
     * Create a single Plotly chart
     */
    createPlot(title, traces, parent) {
        const card = document.createElement('div');
        card.className = 'glass chart-card rounded-2xl p-6 shadow-xl animate-in';
        
        const h2 = document.createElement('h2');
        h2.className = 'text-lg font-bold mb-4 text-gray-100 border-b border-gray-800 pb-3 flex items-center justify-between';
        h2.innerHTML = `
            <span>${title}</span>
            <span class="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">${traces.length} series</span>
        `;
        card.appendChild(h2);

        const plotDiv = document.createElement('div');
        plotDiv.className = 'h-72 w-full';
        card.appendChild(plotDiv);

        parent.appendChild(card);

        const layout = { 
            ...this.darkLayout, 
            height: 280, 
            margin: { l: 40, r: 10, t: 10, b: 40 },
            hovermode: 'x unified'
        };
        
        Plotly.newPlot(plotDiv, traces, layout, {responsive: true, displayModeBar: false});
    },

    /**
     * Render the "Latest Stats" Dashboard tiles
     */
    renderDashboard(dataMap, container) {
        container.innerHTML = '';
        if (!dataMap || Object.keys(dataMap).length === 0) {
            container.innerHTML = `
                <div class="text-center py-20 glass rounded-3xl border-2 border-dashed border-gray-800">
                    <p class="text-gray-500 text-lg">No telemetry data available.</p>
                    <p class="text-gray-600 text-sm mt-2">Go to the "Plotter" tab and paste data or upload a file first.</p>
                </div>
            `;
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4';
        
        Object.entries(dataMap).forEach(([key, values]) => {
            const lastVal = values[values.length - 1];
            const card = document.createElement('div');
            card.className = 'glass stat-tile p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center transition-all hover:active-glow cursor-default';
            
            card.innerHTML = `
                <span class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">${key}</span>
                <span class="text-3xl font-black text-blue-400 tabular-nums">${typeof lastVal === 'number' ? lastVal.toFixed(2) : lastVal}</span>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);
    }
};