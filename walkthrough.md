# Walkthrough: Map Decluttering, Ancestral Lineages & Focus State Fading

I have successfully updated the comparison map to make it clean, highly readable, and chemically insightful by adding label decluttering, ancestral connection lines, a selection halo, and dynamic grayish fading for non-active elements.

## 1. Map Decluttering (Major Labels Only by Default)
* **Problem**: With 100+ methods plotted on a single scatter plot, the text labels overlapped extensively, creating a cluttered and clumsy visual layout.
* **Solution**:
  - Defined a list of **18 landmark representative methods** (including *Mulliken*, *RESP*, *EEM*, *Bader*, *Gasteiger*, *SchNet*, *ALIGNN*, *AM1-BCC*, etc.) to always display labels by default.
  - Minor variant methods have their labels hidden initially to keep the chart clean and spacious.
  - Hovering or expanding any cluster core will dynamically pop in the labels of the underlying methods in that cluster.
  - Added a **"Show All Labels"** checkbox control to the page. Checking it renders all 100+ labels for a dense landscape overview.

## 2. Ancestral Lineage Connections
* **Problem**: Related charge models (e.g. successive generations of charge models or variants) were plotted as isolated points, hiding their evolutionary links.
* **Solution**:
  - Created a custom Chart.js plugin (`ancestralLinesPlugin`) that draws dashed line connections in the background of the scatter plot.
  - Connects related methods (e.g., *Mulliken* $\rightarrow$ *Löwdin*, *CM1* $\rightarrow$ ... $\rightarrow$ *CM5*, *RESP* $\rightarrow$ *RESP2* $\rightarrow$ *RESP3*, *EEM* $\rightarrow$ *NEEMP EEMs*, etc.).
  - Renders directional arrows at 70% of the line path, pointing from ancestral methods to their successors.
  - **Dynamic Tracking**: The lines and arrows dynamically track the points as they expand ("flower petal" packing) or collapse, keeping the visual links intact during interaction.
  - Added a **"Show Ancestral Links"** checkbox control to easily toggle connection lines on/off.

## 3. Group Selection Background Halo
* **Problem**: When a group of clustered methods was expanded, it could be difficult to distinguish which points belonged to the active selection compared to neighboring points.
* **Solution**:
  - Created a custom Chart.js plugin (`clusterHaloPlugin`) that runs during the background draw phase.
  - Draws a soft, semi-transparent background circle (halo) centered on the selected cluster's core coordinates.
  - **Dynamic Sizing**: The halo dynamically calculates the distance to the outermost expanded petal in that cluster to perfectly enclose the entire expanded group.
  - **Quality Coordinated**: The circle's fill and border colors match the quality level of the selected cluster (Green for High, Blue for Moderate, Amber for Basic) with a dashed border for a clean, modern aesthetic.

## 4. Focus State Grayish Fading (Dynamic Contrast)
* **Problem**: Even with the background halo, the rest of the map's multi-colored points, labels, and ancestral lines created visual interference when trying to focus on the active selection.
* **Solution**:
  - **Node Fading**: Added a color state updater `updateChartColors` that temporarily shifts all non-active datasets to a muted, semi-transparent gray (`rgba(203, 213, 225, 0.25)` fill, `rgba(148, 163, 184, 0.35)` border) while preserving the active cluster's original quality-based colors (Green, Blue, Amber).
  - **Label Fading**: Configured a dynamic color callback for the `datalabels` plugin so that text labels of non-active points also fade to a soft gray (`rgba(148, 163, 184, 0.45)`).
  - **Lineage Fading**: Modified the `ancestralLinesPlugin` to inspect the active cluster. If a connection line is not linked to the active cluster, it and its directional arrow fade to a low-opacity gray (`rgba(203, 213, 225, 0.15)`).
  - **Instant Reset**: The map returns to its default colorful, fully visible state instantly as soon as the hover or clicked selection is cleared.

## 5. Responsive Controls
* Cleaned up and moved the layout rules for the map controls into `style.css`.
* The control checkboxes stack vertically and align neatly on mobile/tablet viewports.
