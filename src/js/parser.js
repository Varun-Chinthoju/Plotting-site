/**
 * Parser module for telemetry data
 */
export const TelemetryParser = {
    /**
     * Parse raw text input and return a data object grouped by key
     * @param {string} text 
     * @returns {Object} { key: [values] }
     */
    parse(text) {
        text = text.trim();
        if (!text) return {};

        // 1. Check if it's JSON
        if (text.startsWith('[') || text.startsWith('{')) {
            try {
                const json = JSON.parse(text);
                return this.parseJSON(json);
            } catch (e) {
                console.warn('Attempted to parse as JSON but failed. Falling back to text parsing.');
            }
        }

        // 2. Check if it's CSV (first line has commas and no '>' symbols)
        const lines = text.split('\n');
        if (lines[0].includes(',') && !lines[0].includes('>')) {
            return this.parseCSV(lines);
        }

        // 3. Fallback to custom >Key:Value format
        return this.parseCustom(lines);
    },

    /**
     * Parse the custom >Key:Value telemetry format
     */
    parseCustom(lines) {
        const dataMap = {};
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('>')) {
                const parts = line.substring(1).split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const valueStr = parts.slice(1).join(':').trim();
                    const value = parseFloat(valueStr);
                    
                    if (!isNaN(value)) {
                        if (!dataMap[key]) dataMap[key] = [];
                        dataMap[key].push(value);
                    }
                }
            }
        });
        return dataMap;
    },

    /**
     * Parse standard CSV data
     */
    parseCSV(lines) {
        const dataMap = {};
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length === headers.length) {
                row.forEach((val, idx) => {
                    const key = headers[idx];
                    const num = parseFloat(val.trim());
                    if (!isNaN(num)) {
                        if (!dataMap[key]) dataMap[key] = [];
                        dataMap[key].push(num);
                    }
                });
            }
        }
        return dataMap;
    },

    /**
     * Parse JSON data (expects array of objects or single object with arrays)
     */
    parseJSON(json) {
        const dataMap = {};
        if (Array.isArray(json)) {
            // Array of objects: [{x:1, y:2}, {x:2, y:3}]
            json.forEach(obj => {
                Object.keys(obj).forEach(key => {
                    const val = parseFloat(obj[key]);
                    if (!isNaN(val)) {
                        if (!dataMap[key]) dataMap[key] = [];
                        dataMap[key].push(val);
                    }
                });
            });
        } else {
            // Single object with arrays: {x: [1,2], y: [2,3]}
            Object.keys(json).forEach(key => {
                if (Array.isArray(json[key])) {
                    dataMap[key] = json[key].map(v => parseFloat(v)).filter(v => !isNaN(v));
                }
            });
        }
        return dataMap;
    }
};