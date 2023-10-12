// Load data from data.json
d3.json('data.json').then(function(data) {
    const root = d3.stratify()
        .id(d => d.Fils)
        .parentId(d => d.Parent)(data);

    const treeLayout = d3.tree().size([600, 500]);

    treeLayout(root);

    const svg = d3.select('#tree-container')
        .append('svg')
        .attr('width', 800)
        .attr('height', 700)
        .append('g')
        .attr('transform', 'translate(50, 50)');

    
    svg.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    
    const nodes = svg.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    nodes.append('circle')
        .attr('r', 4);

    nodes.append('text')
        .attr('dy', '0.35em')
        .attr('x', d => d.children ? -8 : 8)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.Fils);
});
