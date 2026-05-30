// methodsData is loaded from data.js

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const headers = document.querySelectorAll('th[data-sort]');

let currentData = [...methodsData];
let currentSort = { column: null, direction: 'asc' };
let currentCategoryFilter = 'all';
let chartInstance = null;
let lockedExpandedClusterId = null;

let showAncestralLinks = true;
let showAllLabels = false;

const majorMethods = [
    "Mulliken",
    "NBO",
    "RESP",
    "CHELPG",
    "Hirshfeld / VDD",
    "Bader (QTAIM)",
    "Gasteiger (PEOE)",
    "MMFF94",
    "Charge Equilibration (QEq)",
    "EEM",
    "AM1-BCC",
    "GFN-xTB",
    "SchNet (GNN)",
    "ALIGNN (GNN)",
    "ACKS2 (Svobodová implementation)",
    "SQE+qp",
    "αCharges (SQE+qp)",
    "PDBCharges (GFN1-xTB)"
];

const ancestralLinks = [
    // CM Family
    { from: "CM1", to: "CM2" },
    { from: "CM2", to: "CM3" },
    { from: "CM3", to: "CM4" },
    { from: "CM4", to: "CM5" },
    
    // RESP Family
    { from: "Merz-Kollman (MK)", to: "RESP" },
    { from: "RESP", to: "RESP2" },
    { from: "RESP2", to: "RESP3" },
    
    // Hirshfeld Family
    { from: "Hirshfeld / VDD", to: "Iterative Hirshfeld (Hirshfeld-I)" },
    { from: "Iterative Hirshfeld (Hirshfeld-I)", to: "Hirshfeld-e" },
    { from: "Hirshfeld-e", to: "Fractional Hirshfeld" },
    { from: "Hirshfeld / VDD", to: "VDD (Bickelhaupt)" },
    
    // Mulliken Family
    { from: "Mulliken", to: "Löwdin" },
    { from: "Mulliken", to: "Mulliken-GMA" },
    { from: "Mulliken", to: "NBO" },
    
    // EEM Family
    { from: "EEM", to: "EEM_Mulliken (NEEMP)" },
    { from: "EEM", to: "EEM_NPA (NEEMP)" },
    { from: "EEM", to: "EEM_AIM (NEEMP)" },
    
    // SQE Family
    { from: "SQE (Split-Charge Equilibration)", to: "SQE+qp" },
    { from: "SQE+qp", to: "αCharges (SQE+qp)" },
    
    // QEq Family
    { from: "Charge Equilibration (QEq)", to: "EQeq" },
    { from: "Charge Equilibration (QEq)", to: "G-QEq" },
    { from: "Charge Equilibration (QEq)", to: "SMD/C-QEq" },
    
    // xTB Family
    { from: "GFN-xTB", to: "GFN2-xTB" },
    
    // Gasteiger Family
    { from: "Gasteiger (PEOE)", to: "MPEOE" },
    { from: "Gasteiger (PEOE)", to: "Gasteiger-Hückel" }
];

function getSpeedClass(level) {
    if (level === 'fast') return 'speed-fast';
    if (level === 'med') return 'speed-med';
    return 'speed-slow';
}

function getBadgeClass(type) {
    return type.includes('QM') ? 'badge-qm' : 'badge-empirical';
}

function getCategoryBadge(cat) {
    if (cat.includes('Biomolecular')) return 'badge-qm'; // reuse styles
    if (cat.includes('Materials')) return 'badge-empirical';
    if (cat.includes('Cheminformatics')) return 'badge-qm';
    if (cat.includes('Reactivity')) return 'badge-empirical';
    if (cat.includes('Machine Learning')) return 'badge-qm';
    return 'badge-empirical';
}

function formatCitations(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'k+';
    }
    return num + '+';
}

function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 3rem;">
                    No matching methods found.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(method => {
        const tr = document.createElement('tr');
        
        let confIcon = '<i class="fa-solid fa-cube" style="color: #3b82f6; margin-right: 0.5rem;"></i>';
        if (method.conformation.includes('2D')) {
            confIcon = '<i class="fa-solid fa-project-diagram" style="color: #64748b; margin-right: 0.5rem;"></i>';
        } else if (method.conformation.includes('Restrained')) {
            confIcon = '<i class="fa-solid fa-anchor" style="color: #10b981; margin-right: 0.5rem;"></i>';
        }

        let qColor = '#f59e0b'; // Basic
        if(method.qualityLevel === 'high') qColor = '#10b981'; // Green
        if(method.qualityLevel === 'moderate') qColor = '#3b82f6'; // Blue
        const qualityHtml = `<span style="color: ${qColor}; font-weight: 500;">${method.quality}</span>`;

        let rColor = '#ef4444'; // Red for Poor
        if(method.reactionLevel === 'excellent') rColor = '#10b981'; // Green
        if(method.reactionLevel === 'good') rColor = '#3b82f6'; // Blue
        if(method.reactionLevel === 'fair') rColor = '#f59e0b'; // Orange
        const reactionHtml = `<span style="color: ${rColor}; font-weight: 500;">${method.reaction}</span>`;

        let linksHTML = '';
        if (method.doi && method.doi !== "N/A") {
            linksHTML += `
            <a href="https://doi.org/${method.doi}" target="_blank" style="color: var(--accent-color); text-decoration: none; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">
                <i class="fa-solid fa-book" style="margin-right: 4px;"></i> Paper
            </a>`;
        }
        if (method.repo && method.repo !== "N/A") {
            linksHTML += `
            <a href="${method.repo}" target="_blank" style="color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">
                <i class="fa-solid fa-code" style="margin-right: 4px;"></i> ${method.repoName}
            </a>`;
        }
        if (method.cliRepo && method.cliRepo !== "N/A") {
            linksHTML += `
            <a href="${method.cliRepo}" target="_blank" style="color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">
                <i class="fa-solid fa-terminal" style="margin-right: 4px; font-size: 0.75rem;"></i> ${method.cliRepoName}
            </a>`;
        }
        if (method.webserver && method.webserver !== "N/A") {
            linksHTML += `
            <a href="${method.webserver}" target="_blank" style="color: var(--success-color); text-decoration: none; font-size: 0.85rem; display: block;">
                <i class="fa-solid fa-globe" style="margin-right: 4px;"></i> ${method.webserverName}
            </a>`;
        }
        if (!linksHTML) linksHTML = '<span style="color: #94a3b8; font-size: 0.85rem;">N/A</span>';

        // Add a slightly distinct badge for category
        let catColor = '#64748b';
        if(method.category.includes('Biomolecular')) catColor = '#10b981';
        if(method.category.includes('Materials')) catColor = '#f59e0b';
        if(method.category.includes('Cheminformatics')) catColor = '#3b82f6';
        if(method.category.includes('Machine Learning')) catColor = '#8b5cf6';
        if(method.category.includes('Reactivity')) catColor = '#ef4444';

        tr.innerHTML = `
            <td>
                <a href="details.html?method=${encodeURIComponent(method.name)}" class="method-link-box">${method.name}</a>
                <div style="margin-top: 0.35rem;">
                    <span class="badge ${getBadgeClass(method.type)}">${method.type}</span>
                    <span style="display:inline-block; padding:0.2rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600; color:white; background-color:${catColor}; margin-left: 0.25rem;">${method.category}</span>
                </div>
            </td>
            <td class="${getSpeedClass(method.speedLevel)} font-medium">
                ${method.speedText}
            </td>
            <td>${method.coverage}</td>
            <td>
                ${confIcon}
                ${method.conformation}
            </td>
            <td>${qualityHtml}</td>
            <td>${reactionHtml}</td>
            <td style="font-weight: 600; color: #475569;">~${formatCitations(method.citations)}</td>
            <td class="typical-use">${method.use}</td>
            <td style="white-space: nowrap;">
                ${linksHTML}
            </td>
        `;
        tableBody.appendChild(tr);
    });
    if (typeof updateFloatingScrollbar === 'function') {
        requestAnimationFrame(updateFloatingScrollbar);
    }
}

function renderChart(data) {
    const ctx = document.getElementById('clusteringMap').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Helper to determine the family of a method based on its name
    function getMethodFamily(name) {
        const lowerName = name.toLowerCase();
        
        // Force Field families
        if (lowerName.includes("amber") || lowerName.includes("ff99") || lowerName.includes("ff03") || lowerName.includes("ff98")) {
            return "AMBER Force Field";
        }
        if (lowerName.includes("charmm")) {
            return "CHARMM Force Field";
        }
        if (lowerName.includes("gromos")) {
            return "GROMOS Force Field";
        }
        if (lowerName.includes("opls")) {
            return "OPLS Force Field";
        }
        if (lowerName.includes("trappe")) {
            return "TraPPE Force Field";
        }
        
        // Chemical/Computational families
        if (/^cm[1-5](m)?\b/i.test(lowerName) || lowerName.startsWith("cm ")) {
            return "Charge Model (CM)";
        }
        if (lowerName.includes("resp") || lowerName === "repa" || lowerName === "recep") {
            return "RESP Protocol";
        }
        if (lowerName.includes("gasteiger") || lowerName.includes("peoe")) {
            return "Gasteiger (PEOE)";
        }
        if (lowerName.includes("xtb")) {
            return "GFN-xTB Family";
        }
        if (lowerName.includes("hirshfeld")) {
            return "Hirshfeld Partitioning";
        }
        if (lowerName.includes("chelp")) {
            return "CHELP/CHELPG ESP";
        }
        if (lowerName.includes("qeq") || lowerName.includes("eqeq")) {
            return "Charge Equilibration (QEq)";
        }
        if (lowerName.includes("eem") || lowerName.includes("smea") || lowerName === "eeq") {
            return "Electronegativity Equalization (EEM)";
        }
        if (lowerName.includes("bader") || lowerName.includes("qtaim") || lowerName === "aim") {
            return "Atoms in Molecules (AIM)";
        }
        
        return null;
    }

    // Precalculate average (centroid) coordinates for active families to keep cluster centers neat
    const familyCenters = {};
    const familyCounts = {};
    data.forEach(method => {
        const family = getMethodFamily(method.name);
        if (family) {
            if (!familyCenters[family]) {
                familyCenters[family] = { x: 0, y: 0 };
                familyCounts[family] = 0;
            }
            familyCenters[family].x += method.chartCoord.x;
            familyCenters[family].y += method.chartCoord.y;
            familyCounts[family]++;
        }
    });

    Object.keys(familyCenters).forEach(family => {
        familyCenters[family].x /= familyCounts[family];
        familyCenters[family].y /= familyCounts[family];
        // Round to nearest 0.25 precision for neat layout
        familyCenters[family].x = Math.round(familyCenters[family].x * 4) / 4;
        familyCenters[family].y = Math.round(familyCenters[family].y * 4) / 4;
    });

    // Group data into clusters (either by defined family or spatial grid coordinate)
    const clusters = {};
    data.forEach((method, index) => {
        const family = getMethodFamily(method.name);
        let cx, cy;
        let clusterId;
        
        if (family) {
            cx = familyCenters[family].x;
            cy = familyCenters[family].y;
            clusterId = `family:${family}`;
        } else {
            // Fallback: group by 0.25 precision grid
            cx = Math.round(method.chartCoord.x * 4) / 4;
            cy = Math.round(method.chartCoord.y * 4) / 4;
            const quality = method.qualityLevel || 'basic';
            clusterId = `grid:${cx},${cy},${quality}`;
        }
        
        if (!clusters[clusterId]) {
            clusters[clusterId] = {
                id: clusterId,
                baseX: cx,
                baseY: cy,
                items: [],
                name: family ? family : method.name
            };
        }
        clusters[clusterId].items.push(method);
    });

    const datasetConfigs = [];
    
    Object.values(clusters).forEach(cluster => {
        const count = cluster.items.length;
        cluster.items.forEach((method, i) => {
            let expandedX = cluster.baseX;
            let expandedY = cluster.baseY;
            
            if (count > 1) {
                // Fermat's spiral (sunflower) for beautiful "flower petal" packing
                const phi = (1 + Math.sqrt(5)) / 2;
                const goldenAngle = 2 * Math.PI / Math.pow(phi, 2); // 137.5 degrees
                
                const angle = i * goldenAngle;
                
                // Scale factor based on total items to keep it contained
                const targetMaxRadiusX = Math.min(0.25 + Math.sqrt(count) * 0.15, 1.5);
                const c = targetMaxRadiusX / Math.sqrt(count);
                
                const rX = c * Math.sqrt(i + 1);
                const rY = rX * 0.6; // Adjust for typical screen aspect ratio
                
                expandedX = cluster.baseX + rX * Math.cos(angle);
                expandedY = cluster.baseY + rY * Math.sin(angle);
            }

            let bgColor = 'rgba(245, 158, 11, 0.7)'; // Basic - Amber
            let borderColor = 'rgba(245, 158, 11, 1)';
            
            if (method.qualityLevel === 'high') {
                bgColor = 'rgba(16, 185, 129, 0.7)'; // High - Green
                borderColor = 'rgba(16, 185, 129, 1)';
            } else if (method.qualityLevel === 'moderate') {
                bgColor = 'rgba(59, 130, 246, 0.7)'; // Moderate - Blue
                borderColor = 'rgba(59, 130, 246, 1)';
            }
            
            // Set the label: if it's a family or grid cluster, customize it
            const isFamilyCluster = cluster.id.startsWith("family:");
            let clusterLabel = "";
            if (count > 1) {
                if (isFamilyCluster) {
                    clusterLabel = `${cluster.name} (+${count-1} methods)`;
                } else {
                    clusterLabel = `${method.name} (+${count-1} in cluster)`;
                }
            } else {
                clusterLabel = method.name;
            }

            datasetConfigs.push({
                clusterId: cluster.id,
                baseX: cluster.baseX,
                baseY: cluster.baseY,
                expandedX: expandedX,
                expandedY: expandedY,
                isCluster: count > 1,
                originalName: method.name,
                clusterName: clusterLabel,
                itemIndex: i,
                
                label: clusterLabel,
                data: [{ x: cluster.baseX, y: cluster.baseY }],
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 2,
                pointRadius: count > 1 ? (i === 0 ? 14 : 0) : 8,
                pointHoverRadius: count > 1 ? (i === 0 ? 14 : 10) : 10
            });
        });
    });

    Chart.defaults.color = '#475569';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Custom plugin to draw connecting dashed lines from centroid to petals when expanded
    const clusterLinesPlugin = {
        id: 'clusterLines',
        afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const datasets = chart.data.datasets;
            
            datasets.forEach(ds => {
                if (ds.isCluster && ds.pointRadius > 0) {
                    const currentX = ds.data[0].x;
                    const currentY = ds.data[0].y;
                    
                    // If the petal is expanded (i.e. not at base coordinate)
                    if (currentX !== ds.baseX || currentY !== ds.baseY) {
                        const pixelCenterX = chart.scales.x.getPixelForValue(ds.baseX);
                        const pixelCenterY = chart.scales.y.getPixelForValue(ds.baseY);
                        const pixelPetalX = chart.scales.x.getPixelForValue(currentX);
                        const pixelPetalY = chart.scales.y.getPixelForValue(currentY);
                        
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(pixelCenterX, pixelCenterY);
                        ctx.lineTo(pixelPetalX, pixelPetalY);
                        ctx.strokeStyle = ds.borderColor;
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([4, 4]); // tech-style dashed lines
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            });
        }
    };

    // Custom plugin to draw background connecting lines and arrows for ancestral links (lineages)
    const ancestralLinesPlugin = {
        id: 'ancestralLines',
        beforeDatasetsDraw: (chart) => {
            if (!showAncestralLinks) return;
            
            const ctx = chart.ctx;
            const datasets = chart.data.datasets;
            
            ancestralLinks.forEach(link => {
                const dsFrom = datasets.find(d => d.originalName === link.from);
                const dsTo = datasets.find(d => d.originalName === link.to);
                
                if (dsFrom && dsTo) {
                    const fromX = dsFrom.data[0].x;
                    const fromY = dsFrom.data[0].y;
                    const toX = dsTo.data[0].x;
                    const toY = dsTo.data[0].y;
                    
                    const isFromVisible = !dsFrom.isCluster || dsFrom.itemIndex === 0 || dsFrom.data[0].x !== dsFrom.baseX;
                    const isToVisible = !dsTo.isCluster || dsTo.itemIndex === 0 || dsTo.data[0].x !== dsTo.baseX;
                    
                    if (isFromVisible && isToVisible) {
                        const pixelFromX = chart.scales.x.getPixelForValue(fromX);
                        const pixelFromY = chart.scales.y.getPixelForValue(fromY);
                        const pixelToX = chart.scales.x.getPixelForValue(toX);
                        const pixelToY = chart.scales.y.getPixelForValue(toY);
                        
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(pixelFromX, pixelFromY);
                        ctx.lineTo(pixelToX, pixelToY);
                        
                        ctx.lineWidth = 2.0;
                        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'; // Indigo-400 with opacity
                        ctx.setLineDash([5, 5]);
                        ctx.stroke();
                        
                        // Draw arrow at 70% along the line path
                        const angle = Math.atan2(pixelToY - pixelFromY, pixelToX - pixelFromX);
                        const arrowLength = 7;
                        const targetX = pixelFromX + (pixelToX - pixelFromX) * 0.7;
                        const targetY = pixelFromY + (pixelToY - pixelFromY) * 0.7;
                        
                        ctx.beginPath();
                        ctx.moveTo(targetX, targetY);
                        ctx.lineTo(targetX - arrowLength * Math.cos(angle - Math.PI / 6), targetY - arrowLength * Math.sin(angle - Math.PI / 6));
                        ctx.lineTo(targetX - arrowLength * Math.cos(angle + Math.PI / 6), targetY - arrowLength * Math.sin(angle + Math.PI / 6));
                        ctx.closePath();
                        ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
                        ctx.fill();
                        
                        ctx.restore();
                    }
                }
            });
        }
    };

    // Custom plugin to draw a soft selection halo/circle behind the expanded cluster
    const clusterHaloPlugin = {
        id: 'clusterHalo',
        beforeDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const datasets = chart.data.datasets;
            
            const activeClusterId = currentHoveredCluster || lockedExpandedClusterId;
            if (!activeClusterId) return;
            
            // Find one dataset in this cluster to get its baseX, baseY, and quality color
            const sampleDs = datasets.find(d => d.clusterId === activeClusterId && d.isCluster);
            if (!sampleDs) return; 
            
            const pixelCenterX = chart.scales.x.getPixelForValue(sampleDs.baseX);
            const pixelCenterY = chart.scales.y.getPixelForValue(sampleDs.baseY);
            
            // Find max distance to expanded petals
            let maxPixelRadius = 30; 
            datasets.forEach(ds => {
                if (ds.clusterId === activeClusterId) {
                    const petalPixelX = chart.scales.x.getPixelForValue(ds.expandedX);
                    const petalPixelY = chart.scales.y.getPixelForValue(ds.expandedY);
                    const dist = Math.sqrt(Math.pow(petalPixelX - pixelCenterX, 2) + Math.pow(petalPixelY - pixelCenterY, 2));
                    if (dist > maxPixelRadius) {
                        maxPixelRadius = dist;
                    }
                }
            });
            
            const finalRadius = maxPixelRadius + 18; // Add some padding around the outermost petal
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(pixelCenterX, pixelCenterY, finalRadius, 0, 2 * Math.PI);
            
            let colorBase = 'rgba(59, 130, 246'; // Moderate - Blue default
            if (sampleDs.borderColor.includes('16, 185, 129')) {
                colorBase = 'rgba(16, 185, 129'; // High - Green
            } else if (sampleDs.borderColor.includes('245, 158, 11')) {
                colorBase = 'rgba(245, 158, 11'; // Basic - Amber
            }
            
            ctx.fillStyle = `${colorBase}, 0.06)`;
            ctx.strokeStyle = `${colorBase}, 0.25)`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]); // Dashed border for high-tech aesthetic
            
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    };

    let currentHoveredCluster = null;

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        plugins: [ChartDataLabels, clusterLinesPlugin, ancestralLinesPlugin, clusterHaloPlugin],
        data: {
            datasets: datasetConfigs
        },
        options: {
            onClick: (event, elements, chart) => {
                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const datasetIndex = firstElement.datasetIndex;
                    const dataset = chart.data.datasets[datasetIndex];
                    
                    if (dataset) {
                        if (dataset.isCluster) {
                            const isCurrentlyExpanded = (dataset.clusterId === currentHoveredCluster);
                            
                            // If not expanded, or not currently locked, lock it!
                            if (!isCurrentlyExpanded || dataset.clusterId !== lockedExpandedClusterId) {
                                lockedExpandedClusterId = dataset.clusterId;
                                currentHoveredCluster = dataset.clusterId; // Force expanded state
                                
                                // Expand this cluster and collapse all others
                                chart.data.datasets.forEach(ds => {
                                    if (ds.clusterId === lockedExpandedClusterId) {
                                        ds.data[0].x = ds.expandedX;
                                        ds.data[0].y = ds.expandedY;
                                        ds.label = ds.originalName;
                                        ds.pointRadius = 8;
                                    } else {
                                        ds.data[0].x = ds.baseX;
                                        ds.data[0].y = ds.baseY;
                                        if (ds.isCluster) {
                                            if (ds.itemIndex === 0) {
                                                ds.label = ds.clusterName;
                                                ds.pointRadius = 14;
                                            } else {
                                                ds.label = "";
                                                ds.pointRadius = 0;
                                            }
                                        } else {
                                            ds.label = ds.originalName;
                                            ds.pointRadius = 8;
                                        }
                                    }
                                });
                                chart.update('none');
                            } else {
                                // If already expanded and locked, clicking navigates to the detail page
                                if (dataset.originalName) {
                                    window.location.href = `details.html?method=${encodeURIComponent(dataset.originalName)}`;
                                }
                            }
                        } else {
                            // Non-cluster (single node): navigate directly
                            if (dataset.originalName) {
                                window.location.href = `details.html?method=${encodeURIComponent(dataset.originalName)}`;
                            }
                        }
                    }
                } else {
                    // Clicked empty space: reset locked state and collapse any expanded clusters
                    if (lockedExpandedClusterId !== null) {
                        lockedExpandedClusterId = null;
                        currentHoveredCluster = null;
                        
                        chart.data.datasets.forEach(ds => {
                            ds.data[0].x = ds.baseX;
                            ds.data[0].y = ds.baseY;
                            if (ds.isCluster) {
                                if (ds.itemIndex === 0) {
                                    ds.label = ds.clusterName;
                                    ds.pointRadius = 14;
                                } else {
                                    ds.label = "";
                                    ds.pointRadius = 0;
                                }
                            } else {
                                ds.label = ds.originalName;
                                ds.pointRadius = 8;
                            }
                        });
                        chart.update('none');
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
            },
            onHover: (event, elements, chart) => {
                const triggerRadius = 40; // Pixels to trigger opening a cluster
                const keepOpenRadius = 130; // Pixels to keep it open while hovering petals
                
                // Cache cluster centers to calculate absolute distance
                if (!chart._clusterCenters) {
                    chart._clusterCenters = {};
                    chart.data.datasets.forEach(ds => {
                        if (ds.isCluster && !chart._clusterCenters[ds.clusterId]) {
                            chart._clusterCenters[ds.clusterId] = { x: ds.baseX, y: ds.baseY };
                        }
                    });
                }

                let nextClusterId = null;

                // 1. Check if we should keep the currently hovered cluster open
                if (currentHoveredCluster && chart._clusterCenters[currentHoveredCluster]) {
                    const center = chart._clusterCenters[currentHoveredCluster];
                    const pixelX = chart.scales.x.getPixelForValue(center.x);
                    const pixelY = chart.scales.y.getPixelForValue(center.y);
                    const dist = Math.sqrt(Math.pow(event.x - pixelX, 2) + Math.pow(event.y - pixelY, 2));
                    if (dist < keepOpenRadius) {
                        nextClusterId = currentHoveredCluster;
                    }
                }

                // 2. If no cluster is kept open, check for new ones to open
                if (!nextClusterId) {
                    let minDistance = triggerRadius;
                    for (const [cId, center] of Object.entries(chart._clusterCenters)) {
                        const pixelX = chart.scales.x.getPixelForValue(center.x);
                        const pixelY = chart.scales.y.getPixelForValue(center.y);
                        const dist = Math.sqrt(Math.pow(event.x - pixelX, 2) + Math.pow(event.y - pixelY, 2));
                        if (dist < minDistance) {
                            nextClusterId = cId;
                            minDistance = dist;
                        }
                    }
                }

                // If a cluster is locked, force that one to stay open unless we hover over a different cluster
                let activeClusterId = nextClusterId || lockedExpandedClusterId;

                // 3. Apply state changes if needed
                if (activeClusterId !== currentHoveredCluster) {
                    currentHoveredCluster = activeClusterId;
                    
                    chart.data.datasets.forEach(ds => {
                        if (currentHoveredCluster && ds.clusterId === currentHoveredCluster) {
                            // Expand
                            ds.data[0].x = ds.expandedX;
                            ds.data[0].y = ds.expandedY;
                            ds.label = ds.originalName;
                            ds.pointRadius = 8; // Normal size for expanded petals
                        } else {
                            // Collapse
                            ds.data[0].x = ds.baseX;
                            ds.data[0].y = ds.baseY;
                            if (ds.isCluster) {
                                if (ds.itemIndex === 0) {
                                    ds.label = ds.clusterName;
                                    ds.pointRadius = 14; // Larger size for collapsed cluster core
                                } else {
                                    ds.label = "";
                                    ds.pointRadius = 0; // Hide other cluster members
                                }
                            } else {
                                ds.label = ds.originalName;
                                ds.pointRadius = 8;
                            }
                        }
                    });
                    
                    chart.update('none'); // Instant update without animation
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    right: 30,
                    bottom: 10,
                    left: 10
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Method Clustering Map (Colored by Quality)',
                    color: '#0f172a',
                    font: { size: 16, weight: '600' },
                    padding: { bottom: 20 }
                },
                datalabels: {
                    align: function(context) {
                        const y = context.dataset.data[0].y;
                        return y < 2 ? 'bottom' : 'top';
                    },
                    anchor: function(context) {
                        const y = context.dataset.data[0].y;
                        return y < 2 ? 'start' : 'end';
                    },
                    offset: 6,
                    color: '#0f172a',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11,
                        weight: '600'
                    },
                    formatter: function(value, context) {
                        const ds = context.dataset;
                        if (ds.pointRadius === 0) {
                            return null;
                        }
                        if (showAllLabels) {
                            return ds.label;
                        }
                        const isMajor = majorMethods.includes(ds.originalName);
                        const isHovered = (currentHoveredCluster && ds.clusterId === currentHoveredCluster);
                        if (isMajor || isHovered) {
                            return ds.label;
                        }
                        return null;
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label;
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#0f172a',
                    bodyColor: '#475569',
                    padding: 10,
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Computational Cost →',
                        color: '#0f172a'
                    },
                    min: 0,
                    max: 6,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    },
                    ticks: {
                        callback: function(value) {
                            const isSmallScreen = window.innerWidth < 768;
                            if (value === 1) return isSmallScreen ? 'O(N) (Fast)' : 'O(N) (Extremely Fast)';
                            if (value === 3) return 'Moderate';
                            if (value === 5) return isSmallScreen ? 'O(N³)+ (Slow)' : 'O(N³)+ (Very Slow)';
                            return '';
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Conformation Sensitivity',
                        color: '#0f172a'
                    },
                    min: 0.5,
                    max: 4.0,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    },
                    ticks: {
                        callback: function(value) {
                            const isSmallScreen = window.innerWidth < 768;
                            if (value === 1) return '2D Topology';
                            if (value === 2) return isSmallScreen ? '3D Restr.' : '3D Restrained';
                            if (value === 3) return isSmallScreen ? '3D Resp.' : '3D Highly Responsive';
                            return '';
                        }
                    }
                }
            }
        }
    });
}

renderTable(currentData);
renderChart(currentData);

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    currentData = methodsData.filter(method => {
        const matchesSearch = Object.values(method).some(value => {
            if (typeof value === 'string' || typeof value === 'number') {
                return String(value).toLowerCase().includes(searchTerm);
            }
            return false;
        });
        
        const matchesCategory = currentCategoryFilter === 'all' || method.category === currentCategoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    if (currentSort.column) {
        sortData(currentSort.column, currentSort.direction);
    } else {
        renderTable(currentData);
        renderChart(currentData);
    }
}

searchInput.addEventListener('input', applyFilters);

const toggleLinksCheckbox = document.getElementById('toggleLinks');
const toggleLabelsCheckbox = document.getElementById('toggleLabels');

if (toggleLinksCheckbox) {
    toggleLinksCheckbox.addEventListener('change', (e) => {
        showAncestralLinks = e.target.checked;
        if (chartInstance) {
            chartInstance.update();
        }
    });
}

if (toggleLabelsCheckbox) {
    toggleLabelsCheckbox.addEventListener('change', (e) => {
        showAllLabels = e.target.checked;
        if (chartInstance) {
            chartInstance.update();
        }
    });
}

const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategoryFilter = e.target.getAttribute('data-category');
        applyFilters();
    });
});

function sortData(column, direction) {
    currentData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        if (column === 'speed') {
            const speedOrder = { 'fast': 1, 'med': 2, 'slow': 3 };
            valA = speedOrder[a.speedLevel];
            valB = speedOrder[b.speedLevel];
        } else if (column === 'quality') {
            const qualityOrder = { 'high': 1, 'moderate': 2, 'basic': 3 };
            valA = qualityOrder[a.qualityLevel];
            valB = qualityOrder[b.qualityLevel];
        } else if (column === 'reaction') {
            const reactionOrder = { 'excellent': 1, 'good': 2, 'fair': 3, 'poor': 4 };
            valA = reactionOrder[a.reactionLevel];
            valB = reactionOrder[b.reactionLevel];
        } else if (column === 'citations') {
            valA = a.citations;
            valB = b.citations;
        } else if (column === 'method') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (column === 'category') {
            valA = a.category.toLowerCase();
            valB = b.category.toLowerCase();
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderTable(currentData);
    renderChart(currentData);
}

headers.forEach(header => {
    header.addEventListener('click', () => {
        const column = header.getAttribute('data-sort');
        
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
        
        headers.forEach(h => {
            const icon = h.querySelector('i');
            if(icon) icon.className = 'fa-solid fa-sort';
        });
        
        const currentIcon = header.querySelector('i');
        if(currentIcon) {
            currentIcon.className = currentSort.direction === 'asc' 
                ? 'fa-solid fa-sort-up' 
                : 'fa-solid fa-sort-down';
        }
            
        sortData(column, currentSort.direction);
    });
});

// Floating scrollbar implementation for large table scrolling accessibility
let scrollbarContainer, scrollbarContent;
let isSyncingScroll = false;
const tableWrapper = document.querySelector('.table-wrapper');

if (tableWrapper) {
    scrollbarContainer = document.createElement('div');
    scrollbarContainer.className = 'floating-scrollbar-container';
    scrollbarContent = document.createElement('div');
    scrollbarContent.className = 'floating-scrollbar-content';
    scrollbarContainer.appendChild(scrollbarContent);
    document.body.appendChild(scrollbarContainer);

    scrollbarContainer.addEventListener('scroll', () => {
        if (isSyncingScroll) {
            isSyncingScroll = false;
            return;
        }
        isSyncingScroll = true;
        tableWrapper.scrollLeft = scrollbarContainer.scrollLeft;
    });

    tableWrapper.addEventListener('scroll', () => {
        if (isSyncingScroll) {
            isSyncingScroll = false;
            return;
        }
        isSyncingScroll = true;
        scrollbarContainer.scrollLeft = tableWrapper.scrollLeft;
    });
}

function updateFloatingScrollbar() {
    if (!tableWrapper || !scrollbarContainer || !scrollbarContent) return;
    
    const rect = tableWrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    const hasHorizontalOverflow = tableWrapper.scrollWidth > tableWrapper.clientWidth;
    const isTableVisible = rect.top < viewportHeight && rect.bottom > viewportHeight;
    
    if (hasHorizontalOverflow && isTableVisible) {
        scrollbarContainer.style.left = `${rect.left}px`;
        scrollbarContainer.style.width = `${rect.width}px`;
        scrollbarContent.style.width = `${tableWrapper.scrollWidth}px`;
        scrollbarContainer.style.display = 'block';
        
        isSyncingScroll = true;
        scrollbarContainer.scrollLeft = tableWrapper.scrollLeft;
    } else {
        scrollbarContainer.style.display = 'none';
    }
}

window.addEventListener('scroll', updateFloatingScrollbar);
window.addEventListener('resize', updateFloatingScrollbar);
// Initialize the scrollbar positioning once page is loaded
window.addEventListener('load', () => {
    requestAnimationFrame(updateFloatingScrollbar);
});
