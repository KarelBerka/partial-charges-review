document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const methodName = urlParams.get('method');
    const contentDiv = document.getElementById('detailContent');
    const loadingDiv = document.getElementById('loading');

    if (!methodName) {
        showError("No method specified in the URL.");
        return;
    }

    // methodsData is loaded globally from data.js
    const method = methodsData.find(m => m.name === methodName);

    if (!method) {
        showError(`Method "${methodName}" not found in the database.`);
        return;
    }

    renderMethodDetails(method);
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
});

function showError(msg) {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation fa-3x" style="color: #ef4444; margin-bottom: 1rem;"></i>
        <h2 style="color: var(--text-primary);">${msg}</h2>
        <p style="color: var(--text-secondary); margin-top: 1rem;">Please return to the dashboard and try again.</p>
    `;
}

function getBadgeClass(type) {
    return type.includes('QM') ? 'badge-qm' : 'badge-empirical';
}

function renderMethodDetails(method) {
    const contentDiv = document.getElementById('detailContent');
    
    let qColor = '#f59e0b'; // Basic
    if(method.qualityLevel === 'high') qColor = '#10b981';
    if(method.qualityLevel === 'moderate') qColor = '#3b82f6';

    let rColor = '#ef4444'; // Poor
    if(method.reactionLevel === 'excellent') rColor = '#10b981';
    if(method.reactionLevel === 'good') rColor = '#3b82f6';
    if(method.reactionLevel === 'fair') rColor = '#f59e0b';

    let catColor = '#64748b';
    if(method.category.includes('Biomolecular')) catColor = '#10b981';
    if(method.category.includes('Materials')) catColor = '#f59e0b';
    if(method.category.includes('Cheminformatics')) catColor = '#3b82f6';
    if(method.category.includes('Machine Learning')) catColor = '#8b5cf6';
    if(method.category.includes('Reactivity')) catColor = '#ef4444';

    let linksHTML = '';
    if (method.doi && method.doi !== "N/A") {
        linksHTML += `<a href="https://doi.org/${method.doi}" target="_blank" class="btn btn-primary"><i class="fa-solid fa-file-lines"></i> Read Publication</a>`;
    }
    if (method.repo && method.repo !== "N/A") {
        linksHTML += `<a href="${method.repo}" target="_blank" class="btn btn-secondary"><i class="fa-brands fa-github"></i> ${method.repoName}</a>`;
    }
    if (method.webserver && method.webserver !== "N/A") {
        linksHTML += `<a href="${method.webserver}" target="_blank" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> ${method.webserverName}</a>`;
    }
    
    if (!linksHTML) {
        linksHTML = '<p style="color: var(--text-secondary);"><i class="fa-solid fa-circle-info"></i> No external links or repositories available for this method.</p>';
    }

    contentDiv.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-title">${method.name}</h1>
            <div class="detail-meta">
                <span class="badge ${getBadgeClass(method.type)}">${method.type}</span>
                <span style="display:inline-block; padding:0.35rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:600; color:white; background-color:${catColor};">${method.category}</span>
                <span style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.75rem; border-radius:6px; font-size:0.85rem; font-weight:600; color:var(--text-secondary); background:rgba(148, 163, 184, 0.1);"><i class="fa-regular fa-calendar"></i> ${method.year || 'N/A'}</span>
            </div>
        </div>

        <div class="detail-grid">
            <div class="detail-card">
                <h3><i class="fa-solid fa-bolt" style="color: #3b82f6;"></i> Speed / Scaling</h3>
                <p>${method.speedText}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fa-solid fa-cube" style="color: #8b5cf6;"></i> Conformation</h3>
                <p>${method.conformation}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fa-solid fa-star" style="color: ${qColor};"></i> Quality</h3>
                <p style="color: ${qColor};">${method.quality}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fa-solid fa-flask" style="color: ${rColor};"></i> Reactivity Prediction</h3>
                <p style="color: ${rColor};">${method.reaction}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fa-solid fa-chart-line" style="color: #10b981;"></i> Usage / Citations</h3>
                <p>${method.citations.toLocaleString()}+</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fa-solid fa-globe" style="color: #f59e0b;"></i> Element Coverage</h3>
                <p>${method.coverage}</p>
            </div>
        </div>
        
        <div class="detail-card" style="margin-bottom: 2.5rem; background: rgba(255, 255, 255, 0.8);">
            <h3><i class="fa-solid fa-align-left" style="color: var(--text-secondary);"></i> Typical Use Case</h3>
            <p style="line-height: 1.6; font-size: 1.2rem;">${method.use}</p>
        </div>

        <div class="links-section">
            <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--text-primary); font-family: 'Outfit', sans-serif;">External Resources</h3>
            ${linksHTML}
        </div>
    `;
}
