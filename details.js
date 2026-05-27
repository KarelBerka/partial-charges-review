// Safe localStorage wrapper for environments that block localStorage (e.g., file:// protocol or private browsing)
const safeLocalStorage = {
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // Ignore quota or security exceptions
        }
    }
};

// Safe Promise.any fallback for compatibility with older browsers
const safePromiseAny = Promise.any ? Promise.any.bind(Promise) : function(promises) {
    return new Promise((resolve, reject) => {
        let rejectedCount = 0;
        const count = promises.length;
        if (count === 0) {
            reject(new Error("No promises provided"));
            return;
        }
        promises.forEach(p => {
            Promise.resolve(p).then(resolve).catch(err => {
                rejectedCount++;
                if (rejectedCount === count) {
                    reject(new Error("All promises failed"));
                }
            });
        });
    });
};

function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const methodName = urlParams.get('method');
    const contentDiv = document.getElementById('detailContent');
    const loadingDiv = document.getElementById('loading');

    if (!methodName) {
        showError("No method specified in the URL.");
        return;
    }

    // methodsData is loaded globally from data.js
    if (typeof methodsData === 'undefined') {
        showError("Database (data.js) failed to load.");
        return;
    }

    const method = methodsData.find(m => m.name === methodName);

    if (!method) {
        showError(`Method "${methodName}" not found in the database.`);
        return;
    }

    renderMethodDetails(method);
    
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (contentDiv) contentDiv.style.display = 'block';

    if (method.doi && method.doi !== "N/A") {
        loadBibliography(method);
    }
}

// Safely execute init after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function showError(msg) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation fa-3x" style="color: #ef4444; margin-bottom: 1rem;"></i>
            <h2 style="color: var(--text-primary);">${msg}</h2>
            <p style="color: var(--text-secondary); margin-top: 1rem;">Please return to the dashboard and try again.</p>
        `;
    }
}

function getBadgeClass(type) {
    return type.includes('QM') ? 'badge-qm' : 'badge-empirical';
}

function renderMethodDetails(method) {
    const contentDiv = document.getElementById('detailContent');
    if (!contentDiv) return;
    
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
    if (method.cliRepo && method.cliRepo !== "N/A") {
        linksHTML += `<a href="${method.cliRepo}" target="_blank" class="btn btn-secondary"><i class="fa-solid fa-terminal"></i> ${method.cliRepoName}</a>`;
    }
    if (method.webserver && method.webserver !== "N/A") {
        linksHTML += `<a href="${method.webserver}" target="_blank" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> ${method.webserverName}</a>`;
    }
    
    if (!linksHTML) {
        linksHTML = '<p style="color: var(--text-secondary);"><i class="fa-solid fa-circle-info"></i> No external links or repositories available for this method.</p>';
    }

    let bibliographyHTML = '';
    if (method.doi && method.doi !== "N/A") {
        const fallbackText = `${method.name} Publication. Year: ${method.year || 'N/A'}. DOI: <a href="https://doi.org/${method.doi}" target="_blank" style="color: var(--accent-color); text-decoration: none;">${method.doi} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem; margin-left: 2px;"></i></a>`;
        
        bibliographyHTML = `
            <div class="bibliography-section" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(148, 163, 184, 0.2);">
                <h4 style="margin-top: 0; margin-bottom: 0.75rem; color: var(--text-primary); font-family: 'Outfit', sans-serif; font-size: 1.05rem;">
                    <i class="fa-solid fa-quote-left" style="color: var(--accent-color); margin-right: 6px;"></i> Journal Citation
                </h4>
                <div id="citationText" style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); background: rgba(255, 255, 255, 0.5); padding: 1rem; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.2);">
                    ${fallbackText}
                </div>
            </div>
        `;
    }

    let descriptionHTML = '';
    if (method.description) {
        descriptionHTML = `
        <div class="detail-card" style="margin-bottom: 2.5rem; background: rgba(255, 255, 255, 0.8);">
            <h3><i class="fa-solid fa-circle-info" style="color: var(--accent-color);"></i> Description</h3>
            <p style="line-height: 1.6; font-size: 1.15rem; color: var(--text-primary);">${method.description}</p>
        </div>`;
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
        
        ${descriptionHTML}
        
        <div class="detail-card" style="margin-bottom: 2.5rem; background: rgba(255, 255, 255, 0.8);">
            <h3><i class="fa-solid fa-align-left" style="color: var(--text-secondary);"></i> Typical Use Case</h3>
            <p style="line-height: 1.6; font-size: 1.2rem;">${method.use}</p>
        </div>

        <div class="links-section">
            <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--text-primary); font-family: 'Outfit', sans-serif;">External Resources</h3>
            ${linksHTML}
            ${bibliographyHTML}
        </div>
    `;
}

async function loadBibliography(method) {
    const doi = method.doi;
    const citationContainer = document.getElementById('citationText');
    if (!citationContainer) return;
    
    const cacheKey = `citation_${doi}`;
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
        citationContainer.innerHTML = cached;
        return;
    }
    
    // Start Crossref and OpenAlex fetches in parallel using safePromiseAny
    try {
        const citation = await safePromiseAny([
            fetchFromCrossref(doi).then(res => {
                if (res) return res;
                throw new Error("Crossref returned empty");
            }),
            fetchFromOpenAlex(doi).then(res => {
                if (res) return res;
                throw new Error("OpenAlex returned empty");
            })
        ]);
        
        citationContainer.innerHTML = citation;
        safeLocalStorage.setItem(cacheKey, citation);
    } catch (err) {
        console.warn("Both bibliography sources failed or timed out. Keeping fallback.", err);
    }
}

async function fetchFromCrossref(doi) {
    try {
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
            headers: {
                'User-Agent': 'PartialChargesReview/1.0 (mailto:karel.berka@upol.cz)'
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        const msg = data.message;
        
        let authorsStr = "";
        if (msg.author && msg.author.length > 0) {
            const formatted = msg.author.map(auth => {
                const family = auth.family || "";
                const given = auth.given || "";
                const initials = given ? given.split(" ").map(n => n[0] + ".").join("") : "";
                return family && initials ? `${family}, ${initials}` : family || given || "";
            });
            if (formatted.length > 5) {
                authorsStr = formatted.slice(0, 3).join("; ") + " et al.";
            } else {
                authorsStr = formatted.join("; ");
            }
        }
        
        const title = msg.title ? msg.title[0] : "";
        const journal = msg['container-title'] ? msg['container-title'][0] : "";
        const year = msg.issued && msg.issued['date-parts'] && msg.issued['date-parts'][0] ? msg.issued['date-parts'][0][0] : "";
        const volume = msg.volume || "";
        const issue = msg.issue || "";
        const pages = msg.page || "";
        
        let citationHTML = "";
        if (authorsStr) citationHTML += `${authorsStr}. `;
        if (title) citationHTML += `"${title}." `;
        if (journal) citationHTML += `<em>${journal}</em>. `;
        if (year) citationHTML += `<strong>${year}</strong>`;
        if (volume) {
            citationHTML += `, <em>${volume}</em>`;
            if (issue) citationHTML += ` (${issue})`;
        }
        if (pages) citationHTML += `, ${pages}`;
        citationHTML += `. <a href="https://doi.org/${doi}" target="_blank" style="color: var(--accent-color); text-decoration: none;"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8rem; margin-left: 4px;"></i></a>`;
        
        return citationHTML;
    } catch (e) {
        console.error("Crossref fetch error:", e);
        return null;
    }
}

async function fetchFromOpenAlex(doi) {
    try {
        const response = await fetch(`https://api.openalex.org/works/doi:${doi}`);
        if (!response.ok) return null;
        const data = await response.json();
        
        let authorsStr = "";
        if (data.authorships && data.authorships.length > 0) {
            const formatted = data.authorships.map(a => {
                const name = a.author.display_name;
                const parts = name.trim().split(/\s+/);
                if (parts.length > 1) {
                    const family = parts[parts.length - 1];
                    const initials = parts.slice(0, -1).map(n => n[0] + ".").join("");
                    return `${family}, ${initials}`;
                }
                return name;
            });
            if (formatted.length > 5) {
                authorsStr = formatted.slice(0, 3).join("; ") + " et al.";
            } else {
                authorsStr = formatted.join("; ");
            }
        }
        
        const title = data.title || "";
        const journal = data.primary_location && data.primary_location.source ? data.primary_location.source.display_name : "";
        const year = data.publication_year || "";
        const volume = data.biblio ? data.biblio.volume : "";
        const issue = data.biblio ? data.biblio.issue : "";
        const firstPage = data.biblio ? data.biblio.first_page : "";
        const lastPage = data.biblio ? data.biblio.last_page : "";
        const pages = firstPage && lastPage ? `${firstPage}-${lastPage}` : firstPage || "";
        
        let citationHTML = "";
        if (authorsStr) citationHTML += `${authorsStr}. `;
        if (title) citationHTML += `"${title}." `;
        if (journal) citationHTML += `<em>${journal}</em>. `;
        if (year) citationHTML += `<strong>${year}</strong>`;
        if (volume) {
            citationHTML += `, <em>${volume}</em>`;
            if (issue) citationHTML += ` (${issue})`;
        }
        if (pages) citationHTML += `, ${pages}`;
        citationHTML += `. <a href="https://doi.org/${doi}" target="_blank" style="color: var(--accent-color); text-decoration: none;"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8rem; margin-left: 4px;"></i></a>`;
        
        return citationHTML;
    } catch (e) {
        console.error("OpenAlex fetch error:", e);
        return null;
    }
}
