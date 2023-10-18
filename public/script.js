function exportToPNG() {
    const svgElement = document.querySelector('svg');
    
    // Convert SVG to a data URL
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create a temporary canvas for rendering the SVG
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.width = svgElement.clientWidth;
    canvas.height = svgElement.clientHeight;

    // Draw the SVG on the canvas
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 5, 8);
        // Convert the canvas to a data URL and initiate download
        const canvasDataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = canvasDataUrl;
        a.download = 'new.png';
        a.click();
        // Clean up
        document.body.removeChild(canvas);
    };
    img.src = svgUrl;
}
// Load data from data.json using D3
fetch('data.json')
.then(response => response.json())
.then(data => {
    // Trouver la profondeur maximale des données
    const maxDepth = d3.max(data, d => d.Deep);

    // Définir les dimensions du conteneur SVG en fonction de la profondeur maximale
    const svgWidth = maxDepth * 250;
    const svgHeight = data.length * 150;

    // Créer le conteneur SVG
    const svg = d3.select("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const treeData = d3.stratify()
        .id(d => d.Fils)
        .parentId(d => d.Parent)
        (data);

    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree().size([svgHeight, svgWidth]);

    treeLayout(root);

    const g = svg.append("g");

    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        g.attr("transform", event.transform);
       // svg.style('cursor', 'pointer');
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
        .on("click", click)
        .on('mouseover', function(event, d) {
            d3.select(this).select('circle').style('fill', 'green');
        })
        .on('mouseout', function(event, d) {
            d3.select(this).select('circle').style('fill', 'green');
        });

    nodes.append("circle")
        .attr("r", 5)
        .style('fill', 'green')
        .style('stroke', 'green')
        .style('stroke-width', '2px')
        .style('cursor', 'pointer');

    nodes.append("text")
        .attr("dy", function(d) {
            return d.depth % 2 === 0 ? -15 : 15;
        })
        .style("text-anchor", "middle")
        .text(d => `${d.data.data.Fils}`);

    function click(event, d) {
        // Toggle the children and node color
        if (d.children) {
            // Collapse the node (hide children)
            d._children = d.children;
            d.children = null;
            d.data.color = 'green';  // Set node color to green when collapsed
        } else {
            // Expand the node (show children)
            d.children = d._children;
            d._children = null;
            d.data.color = 'red';  // Set node color to red when expanded
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
            .on("click", click)
            .on('mouseover', function(event, d) {
                d3.select(this).select('circle').style('fill', 'green');
            })
            .on('mouseout', function(event, d) {
                d3.select(this).select('circle').style('fill', 'green');
            });

        // Update the node color
        enteredNodes.append("circle")
            .attr("r", 5)
            .attr("fill", d => d.data.color)
            .style('stroke', 'green')
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
            .select("circle")
            .attr("fill", d => d.data.color);
    }

   
    
    // Function to zoom in
    function zoomIn() {
      
        svg.transition().duration(250).call(zoom.scaleBy, 1.2);
    }

    // Function to zoom out
    function zoomOut() {
        
        svg.transition().duration(250).call(zoom.scaleBy, 0.8);
    }

    // Function to toggle full screen
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
});
