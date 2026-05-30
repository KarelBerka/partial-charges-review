# Walkthrough: Map Decluttering & Ancestral Lineages

I have successfully updated the comparison map to make it clean, highly readable, and chemically insightful by adding label decluttering and connecting lines for related methods.

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
  - Connects related methods (e.g., *Mulliken $\rightarrow$ Löwdin $\rightarrow$ NPA*, *CM1 $\rightarrow$ ... $\rightarrow$ CM5*, *RESP $\rightarrow$ RESP2 $\rightarrow$ RESP3*, *EEM $\rightarrow$ NEEMP EEMs*, etc.).
  - Renders directional arrows at 70% of the line path, pointing from ancestral methods to their successors.
  - **Dynamic Tracking**: The lines and arrows dynamically track the points as they expand ("flower petal" packing) or collapse, keeping the visual links intact during interaction.
  - Added a **"Show Ancestral Links"** checkbox control to easily toggle connection lines on/off.

## 3. Responsive Styling Controls
* Cleaned up and moved the layout rules for the map controls into `style.css`.
* The control checkboxes stack vertically and align neatly on mobile/tablet viewports.
