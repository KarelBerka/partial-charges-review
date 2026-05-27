// methodsData is loaded from data.js

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const headers = document.querySelectorAll('th[data-sort]');

let currentData = [...methodsData];
let currentSort = { column: null, direction: 'asc' };
let currentCategoryFilter = 'all';
let chartInstance = null;

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

    // Group data into clusters
    const clusters = {};
    data.forEach((method, index) => {
        // Group by 0.25 precision to compact points slightly more aggressively
        const cx = Math.round(method.chartCoord.x * 4) / 4;
        const cy = Math.round(method.chartCoord.y * 4) / 4;
        const quality = method.qualityLevel || 'basic';
        // Only group if they share the same quality level (background color)
        const key = `${cx},${cy},${quality}`;
        
        if (!clusters[key]) {
            clusters[key] = {
                id: key,
                baseX: cx,
                baseY: cy,
                items: []
            };
        }
        clusters[key].items.push(method);
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
            
            const clusterLabel = count > 1 ? `${method.name} (+${count-1} in cluster)` : method.name;

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

    let currentHoveredCluster = null;

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        plugins: [ChartDataLabels],
        data: {
            datasets: datasetConfigs
        },
        options: {
            onClick: (event, elements, chart) => {
                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const datasetIndex = firstElement.datasetIndex;
                    const dataset = chart.data.datasets[datasetIndex];
                    if (dataset && dataset.originalName) {
                        window.location.href = `details.html?method=${encodeURIComponent(dataset.originalName)}`;
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

                // 3. Apply state changes if needed
                if (nextClusterId !== currentHoveredCluster) {
                    currentHoveredCluster = nextClusterId;
                    
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
                        return ds.label;
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
