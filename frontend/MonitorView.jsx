
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function MonitorView() {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current).attr('width', 800).attr('height', 600);
    svg.selectAll('*').remove();

    const fetchData = async () => {
      const res = await fetch('http://localhost:3001/api/metrics');
      const metrics = await res.json();

      const nodes = [...new Set(metrics.flatMap(m => [m.from, m.to]))].map(name => ({ id: name }));
      const links = metrics.map(m => ({ source: m.from, target: m.to, latency: m.latency, status: m.status }));

      const sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(400, 300));

      const link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#999")
        .attr("stroke-width", 2);

      const node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 20)
        .attr("fill", "#4f46e5");

      const label = svg.selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => d.id)
        .attr("font-size", 12)
        .attr("dy", 4)
        .attr("text-anchor", "middle");

      sim.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return <svg ref={ref}></svg>;
}
