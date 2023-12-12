/*document.getElementById("closeModalButton").addEventListener("click", function () {
    $('#infoModal').modal('hide');
    document.getElementById("infoContent").textContent = '';
    d3.selectAll(".node text").style("cursor", "pointer");
});*/
function filterNodes() {
    // Get the user-entered number
    const filterLevel = parseInt(document.getElementById("filterInput").value);

    // Select all nodes and links
    const nodes = d3.selectAll(".node");
    const links = d3.selectAll(".link");

    // Hide nodes and links that are not in the selected levels
    nodes.style("display", function (d) {
        return d.depth === filterLevel ? null : "none";
    });

    links.style("display", function (d) {
        return d.source.depth === filterLevel ? null : "none";
    });
}
function exportToSVG() {
    try {
        // Get the container element you want to capture (e.g., the SVG container)
        const container = document.querySelector("svg");

        // Apply styles to the "link" class elements for slimmer appearance
        const linkElements = container.querySelectorAll(".link");
        linkElements.forEach(linkElement => {
            linkElement.style.strokeWidth = "1.5px";
            linkElement.style.fill = "none";
        linkElement.style.stroke = "#ccc"; // Adjust the stroke width as needed
        });

        // Create a temporary anchor element to download the SVG
        const a = document.createElement("a");
        const svgData = new XMLSerializer().serializeToString(container);

        // Create a Blob from the SVG data
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        // Set the anchor's attributes and trigger a click event to download the SVG
        a.href = url;
        a.download = "diagram.svg";
        a.click();

        // Release the URL object to free resources
        URL.revokeObjectURL(url);

        // Reset the "link" styles to their original values
        linkElements.forEach(linkElement => {
            linkElement.style.strokeWidth = "1.5px";
            linkElement.style.fill = "none";
        linkElement.style.stroke = "#ccc";
         // Reset to original stroke width
        });
    } catch (error) {
        console.error('Error exporting to SVG:', error);
    }
}

function exportToPNG() {
    // Get the container element you want to capture (e.g., the SVG container)
    const container = document.querySelector("svg");

    // Apply styles to the "link" class elements
    const linkElements = container.querySelectorAll(".link");
    linkElements.forEach(linkElement => {
        linkElement.style.fill = "none";
        linkElement.style.stroke = "#ccc";
        linkElement.style.strokeWidth = "1.5px";
    });

    // Get the container's dimensions
    const containerRect = container.getBoundingClientRect();

    // Create a temporary canvas with the same dimensions as the container
    const canvas = document.createElement("canvas");
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // Get the canvas context
    const context = canvas.getContext("2d");

    // Offset the context to match the container's position
    context.translate(-containerRect.left, -containerRect.top);

    // Draw a white background rectangle to cover the entire canvas
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the visible content of the container onto the canvas
    context.drawSvg(container.innerHTML);

    // Convert the canvas to a PNG image
    const imgData = canvas.toDataURL("image/png");

    // Create a temporary anchor element to download the image
    const a = document.createElement("a");
    a.href = imgData;
    a.download = "screenshot.png";
    a.click();

    // Reset the "link" styles to their original values
    linkElements.forEach(linkElement => {
        linkElement.style.fill = "none";
        linkElement.style.stroke = "#ccc";
        linkElement.style.strokeWidth = "1.5px";
    });
}
// Load data from data.json using D3
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        const maxDepth = d3.max(data, d => d.Deep);
        const numNodes = data.length;

        const svgWidth = maxDepth * 220;
        const svgHeight = numNodes * 25;

        const svg = d3.select("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g");

        const treeData = d3.stratify()
            .id(d => d.Fils)
            .parentId(d => d.Parent)
            (data);

        const root = d3.hierarchy(treeData);

        const treeLayout = d3.tree().size([svgHeight, svgWidth]);

        treeLayout(root);

        const g = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([0.25, 2])
            .on("zoom", zoomed);

        svg.call(zoom);

        function zoomed(event) {
            g.attr("transform", event.transform);
        }

        const links = g.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        const nodes = g.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", async (event, d) => {
                await toggleChildren(event, d);
            });

        nodes.append("circle")
            .attr("r", 5)
            .style('fill', '#287DB6')
            .style('stroke', 'black')
            .style('stroke-width', '1px')
            .style('cursor', 'pointer');

        nodes.append("text")
            .attr("dy", function (d) {
                return d.depth % 2 === 0 ? -20 : 20;
            })
            .style("cursor", "pointer")
            .attr("class", "node-text")
            .text(d => d.data.data.Fils)
            .on("mouseover", function (event, d) {
                showTooltip(event, d);
            })
            .on("mouseout", function () {
                hideTooltip();
            });

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        function showTooltip(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);

            const tooltipContent = `<p>${d.data.data.Fils}</p>
                <button onclick="handleButtonClick('${d.data.data.Fils}', 'Button 1')">Button 1</button>
                <button onclick="handleButtonClick('${d.data.data.Fils}', 'Button 2')">Button 2</button>`;

            tooltip.html(tooltipContent)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function hideTooltip() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }

        // Function to handle button click
        function handleButtonClick(nodeText, buttonLabel) {
            // Implement your logic here
            console.log(`Button '${buttonLabel}' clicked for node: ${nodeText}`);
        }

        // Function to toggle children
        async function toggleChildren(event, d) {
            try {
                if (d.children) {
                    // Collapse the node (hide children)
                    d._children = d.children;
                    d.children = null;
                    d.data.fill = 'blue'; // Set node color to blue when collapsed
                } else {
                    // Expand the node (show children)
                    d.children = d._children;
                    d._children = null;
                    d.data.fill = 'red'; // Set node color to red when expanded
                }

                // Update the tree layout
                treeLayout(root);

                // Update the nodes and links
                const nodes = g.selectAll(".node")
                    .data(root.descendants(), d => d.id);

                const links = g.selectAll(".link")
                    .data(root.links(), d => d.target.id);

                // Remove any existing nodes and links
                nodes.exit().remove();
                links.exit().remove();

                // Enter new nodes and links
                const enteredLinks = links.enter()
                    .append("path")
                    .attr("class", "link")
                    .attr("d", d3.linkHorizontal()
                        .x(d => d.y)
                        .y(d => d.x)
                    );

                const enteredNodes = nodes.enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", d => `translate(${d.y},${d.x})`)
                    .on("click", async (event, d) => {
                        await toggleChildren(event, d);
                    });

                // Update the node color
                enteredNodes.append("circle")
                    .attr("r", 5)
                    .style('stroke', d => d.data.color || 'green') // Use node color or default to green
                    .style('stroke-width', '2px')
                    .style('cursor', 'pointer');

                enteredNodes.append("text")
                    .attr("dy", 3)
                    .attr("x", d => d.children ? -8 : 8)
                    .style("text-anchor", d => d.children ? "end" : "start")
                    .text(d => `${d.data.data.Fils}`);

                // Merge and transition for smooth fade-in effect
                const mergedLinks = enteredLinks.merge(links);
                const mergedNodes = enteredNodes.merge(nodes);

                mergedLinks.transition()
                    .attr("d", d3.linkHorizontal()
                        .x(d => d.y)
                        .y(d => d.x)
                    );

                mergedNodes.transition()
                    .attr("transform", d => `translate(${d.y},${d.x})`)
                    .select("circle");

            } catch (error) {
                console.error('Error toggling children:', error);
            }
        }

        function zoomIn() {
            svg.transition().duration(250).call(zoom.scaleBy, 1.02);
        }

        function zoomOut() {
            svg.transition().duration(250).call(zoom.scaleBy, 0.98);
        }

        function toggleFullScreen() {
            const elem = document.documentElement;

            if (!document.fullscreenElement) {
                elem.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }

        
        
        
        // Add event listeners for the buttons
        document.querySelector('button[onclick="zoomIn()"]').addEventListener('click', zoomIn);
        document.querySelector('button[onclick="zoomOut()"]').addEventListener('click', zoomOut);
        document.querySelector('button[onclick="toggleFullScreen()"]').addEventListener('click', toggleFullScreen);
        document.querySelector('button[onclick="exportToPNG()"]').addEventListener('click', exportToPNG);
        document.querySelector('button[onclick="filterNodes()"]').addEventListener('click', filterNodes);
        document.querySelector('button[onclick="exportToSVG()"]').addEventListener('click', exportToSVG);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

loadData();




