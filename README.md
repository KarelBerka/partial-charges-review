# Partial Charges Review

Welcome to the **Partial Charges Review** repository! 

🌐 **Live Website**: [https://KarelBerka.github.io/partial-charges-review/](https://KarelBerka.github.io/partial-charges-review/)

This project is an interactive, comprehensive visual database and review of over 100+ partial atomic charge calculation methods used in computational chemistry, cheminformatics, and molecular dynamics. 

## Features

- **Interactive Visualization**: Explore the landscape of partial charge methods plotted on a custom 2D map comparing computational **cost/speed** vs **quality/accuracy**.
- **Smart Clustering**: Highly similar methods are clustered beautifully using Fermat's spiral (sunflower) algorithm to reveal the density of methods within a specific performance niche.
- **Dynamic Category Filtering**: Instantly filter methods by domain: *Quantum Analysis, MD - Biomolecular, MD - Materials, Cheminformatics, Reactivity*, and *Machine Learning*.
- **Deep-Dive Method Profiles**: Click on any method to view its dedicated profile page, including its speed class, optimal use case, coverage, and associated literature DOIs.

## Recent Updates

### DOI Link Validation
All DOIs for the ~107 methods have been strictly validated. Broken or dead DOIs from legacy publications have been safely labeled as `"N/A"` to ensure a smooth, error-free browsing experience.

### Method Categorization & Criteria
To help researchers easily navigate the massive landscape of partial charge calculation algorithms, each method is rigorously classified across several axes:
1. **Application Category**: 
   * **Quantum Analysis**: High-level QM partitioning (e.g., QTAIM, Hirshfeld).
   * **MD - Biomolecular**: Empirical methods optimized for proteins/nucleic acids (e.g., AMBER, CHARMM, SQE+qp).
   * **MD - Materials**: Methods for solid-state and materials science (e.g., REAXFF, EEM).
   * **Cheminformatics**: Extremely fast descriptor-based or 2D methods (e.g., PEOE, Gasteiger).
   * **Reactivity**: Methods focusing on nucleophilic/electrophilic indices (e.g., Fukui functions).
   * **Machine Learning**: Modern neural network potentials and ML property predictors (e.g., ALIGNN, SchNet, ANI).
2. **Computational Speed**: Categorized as *O(1)* to *O(N³)* to reflect the computational scaling.
3. **Quality Level**: Broadly categorized into High (QM-equivalent), Moderate (Empirical/Semi-empirical approximations), and Basic (Topological/Heuristic) to ensure comparisons are physically meaningful.

### UI Enhancements
- **Clustering**: The interactive scatter plot now strictly isolates method clusters by their quality level (background color), guaranteeing that High, Moderate, and Basic quality methods never visually tangle.
- **Aesthetics**: A fully responsive glassmorphism UI paired with a custom `q+` SVG favicon ensuring high-DPI crispness.

## Local Development

If you'd like to run the interface locally:
1. Clone this repository.
2. Open `index.html` in any modern web browser.
*(No complex backend or build tools required - all data is managed seamlessly via the static `data.js` module!)*
