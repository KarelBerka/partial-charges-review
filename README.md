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

### Expanded Methodology (Radka Svobodová Group)
The database has been expanded to prominently include the extensive parameterization work and tools developed by Radka Svobodová's computational chemistry group at Masaryk University (CEITEC/NCBR):
1. **EEM_Mulliken (NEEMP)**: EEM specifically parameterized to reproduce Mulliken charges.
2. **EEM_NPA (NEEMP)**: EEM parameterized to reproduce high-quality NPA charges.
3. **EEM_AIM (NEEMP)**: EEM parameterized to emulate QTAIM/Bader charges.
4. **SQE+qp**: Split-Charge Equilibration with parameterized initial charges for proteins.
5. **ACKS2**: Atom-condensed Kohn-Sham DFT approximated to second order.
6. **PDBCharges (GFN1-xTB)**: Pre-computed high-quality QM charges for the entire Protein Data Bank.
7. **αCharges (SQE+qp)**: Fast empirical charge calculation for AlphaFold predicted structures.

### UI Enhancements
- **Clustering**: The interactive scatter plot now strictly isolates method clusters by their quality level (background color), guaranteeing that High, Moderate, and Basic quality methods never visually tangle.
- **Aesthetics**: A fully responsive glassmorphism UI paired with a custom `q+` SVG favicon ensuring high-DPI crispness.

## Local Development

If you'd like to run the interface locally:
1. Clone this repository.
2. Open `index.html` in any modern web browser.
*(No complex backend or build tools required - all data is managed seamlessly via the static `data.js` module!)*
