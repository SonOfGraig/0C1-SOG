import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, BatteryCharging, Cpu, Database, Activity, ListChecks, 
  Users, Terminal as TerminalIcon, Zap, LayoutDashboard, 
  Building2, ShieldCheck, FileText, Settings, MessageSquare,
  Folder, File, ChevronRight, ChevronDown, Copy, Check,
  UploadCloud, X, Play, Download, Trash2, Eye, Server, TerminalSquare, Paperclip,
  Loader2, AlertTriangle, BrainCircuit, CheckCircle2, CircleDashed, Plus, History,
  Search, Maximize2, XCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart
} from 'recharts';
import * as d3 from 'd3';
import { ResponsiveGridLayout, useContainerWidth, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Command } from 'cmdk';



const GlobeMap = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3.geoOrthographic()
      .scale(130)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.1);

    const path = d3.geoPath().projection(projection);
    const graticule = d3.geoGraticule();

    // DEFS for 3D effects
    const defs = svg.append("defs");
    
    // 1. Globe Shading
    const shading = defs.append("radialGradient")
      .attr("id", "globeShading")
      .attr("cx", "35%")
      .attr("cy", "35%")
      .attr("r", "65%");
    shading.append("stop").attr("offset", "0%").attr("stop-color", "rgba(40, 50, 60, 0.4)");
    shading.append("stop").attr("offset", "50%").attr("stop-color", "rgba(10, 15, 20, 0.8)");
    shading.append("stop").attr("offset", "100%").attr("stop-color", "rgba(0, 0, 0, 0.95)");

    // 2. Atmosphere Glow
    const atmosphere = defs.append("radialGradient")
      .attr("id", "atmosphere")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    atmosphere.append("stop").attr("offset", "85%").attr("stop-color", "rgba(0, 159, 227, 0)");
    atmosphere.append("stop").attr("offset", "100%").attr("stop-color", "rgba(0, 159, 227, 0.4)");

    // 3. Threat Glow Filter
    const glowFilter = defs.append("filter").attr("id", "threatGlow");
    glowFilter.append("feGaussianBlur").attr("stdDeviation", "2").attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Atmosphere halo
    svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", 130 + 10)
      .style("fill", "url(#atmosphere)");

    // Base Sphere
    svg.append("path")
      .datum({type: "Sphere"})
      .attr("class", "sphere")
      .attr("d", path as any)
      .style("fill", "url(#globeShading)")
      .style("stroke", "rgba(0, 159, 227, 0.6)")
      .style("stroke-width", "1.5px");

    // Graticule
    svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path as any)
      .style("fill", "none")
      .style("stroke", "rgba(0, 159, 227, 0.1)")
      .style("stroke-width", "0.5px");

    // Groups for ordering
    const landGroup = svg.append("g").attr("class", "land-group");
    const arcGroup = svg.append("g").attr("class", "arc-group");
    const pointGroup = svg.append("g").attr("class", "point-group");

    // Threats data
    const threats = [
      { source: [-122.4194, 37.7749], target: [37.6173, 55.7558] }, // SF to Moscow
      { source: [116.4074, 39.9042], target: [-77.0369, 38.9072] }, // Beijing to DC
      { source: [51.5074, -0.1278], target: [103.8198, 1.3521] }, // London to Singapore
      { source: [37.6173, 55.7558], target: [116.4074, 39.9042] },
      { source: [151.2093, -33.8688], target: [-122.4194, 37.7749] } // Sydney to SF
    ];

    let landData: any = null;
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then(res => res.json())
      .then(data => {
        landData = data;
      })
      .catch(err => console.error("Failed to load map data", err));

    let r = 0;
    let dashOffset = 0;
    let pulseTime = 0;

    const timer = d3.timer(() => {
      projection.rotate([r, -15]);
      
      svg.selectAll("path.graticule").attr("d", path as any);
      svg.selectAll("path.sphere").attr("d", path as any);
      
      if (landData) {
        const landPaths = landGroup.selectAll(".land").data(landData.features);
        landPaths.enter()
          .append("path")
          .attr("class", "land")
          .style("fill", "rgba(0, 159, 227, 0.15)")
          .style("stroke", "rgba(0, 159, 227, 0.4)")
          .style("stroke-width", "0.5px")
          .merge(landPaths as any)
          .attr("d", path as any);
      }

      dashOffset -= 0.5;
      pulseTime += 0.05;
      const pulseRadius = 3 + (Math.sin(pulseTime) + 1) * 2.5;
      const pulseOpacity = 0.6 - (Math.sin(pulseTime) + 1) * 0.25;

      // Arcs
      const arcs = arcGroup.selectAll(".arc").data(threats);
      arcs.enter()
        .append("path")
        .attr("class", "arc")
        .style("fill", "none")
        .style("stroke", "#FF003C")
        .style("stroke-width", "2px")
        .style("filter", "url(#threatGlow)")
        .style("stroke-dasharray", "8 4")
        .style("opacity", 0.8)
        .merge(arcs as any)
        .attr("d", (d: any) => {
          const route = { type: "LineString", coordinates: [d.source, d.target] };
          return path(route as any);
        })
        .style("stroke-dashoffset", dashOffset)
        .style("display", (d: any) => {
          const c1 = d3.geoCircle().center(d.source).radius(1)();
          const c2 = d3.geoCircle().center(d.target).radius(1)();
          if (!path(c1) && !path(c2)) return "none";
          return "block";
        });
        
      // Pulses
      const pulses = pointGroup.selectAll(".pulse").data(threats.flatMap(d => [d.source, d.target]));
      pulses.enter()
        .append("circle")
        .attr("class", "pulse")
        .style("fill", "#f25d0d")
        .style("filter", "url(#threatGlow)")
        .merge(pulses as any)
        .attr("cx", (d: any) => projection(d as [number, number])?.[0] || 0)
        .attr("cy", (d: any) => projection(d as [number, number])?.[1] || 0)
        .attr("r", pulseRadius)
        .style("opacity", pulseOpacity)
        .style("display", (d: any) => path(d3.geoCircle().center(d).radius(1)()) ? "block" : "none");

      // Points
      const points = pointGroup.selectAll(".point").data(threats.flatMap(d => [d.source, d.target]));
      points.enter()
        .append("circle")
        .attr("class", "point")
        .style("fill", "#FFFFFF")
        .attr("r", 1.5)
        .merge(points as any)
        .attr("cx", (d: any) => projection(d as [number, number])?.[0] || 0)
        .attr("cy", (d: any) => projection(d as [number, number])?.[1] || 0)
        .style("display", (d: any) => path(d3.geoCircle().center(d).radius(1)()) ? "block" : "none");

      r += 0.2;
    });

    return () => timer.stop();
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg ref={svgRef} className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" />
      <div className="absolute top-2 left-2 text-[9px] text-text-muted uppercase tracking-tighter">Global Threat Map</div>
      <div className="absolute bottom-2 right-2 flex gap-3 text-[9px] font-mono">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-critical shadow-[0_0_5px_#FF003C]"></span> THREAT</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_5px_#f25d0d]"></span> ORIGIN</div>
      </div>
    </div>
  );
};

const SystemHealthRadar = ({ onHealthClick }: { onHealthClick?: () => void }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ feature: string, value: number, x: number, y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 300;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    const features = ['Network I/O', 'CPU Load', 'Memory', 'Storage I/O', 'API Rate'];
    const baseData = [85, 65, 90, 45, 75];
    const angleSlice = (Math.PI * 2) / features.length;

    // DEFS
    const defs = svg.append("defs");

    // Glow filter
    const filter = defs.append("filter").attr("id", "radarGlow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Radar fill gradient
    const radarGradient = defs.append("radialGradient")
      .attr("id", "radarGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    radarGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(0, 159, 227, 0.1)");
    radarGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(0, 159, 227, 0.6)");

    const g = svg.append("g").attr("transform", `translate(${centerX},${centerY})`);

    // Draw grid
    const levels = 5;
    for (let level = 0; level < levels; level++) {
      const r = radius / levels * (level + 1);
      g.selectAll(`.gridCircle-${level}`)
        .data(features)
        .enter()
        .append("line")
        .attr("x1", (d, i) => r * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y1", (d, i) => r * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("x2", (d, i) => r * Math.cos(angleSlice * (i + 1) - Math.PI / 2))
        .attr("y2", (d, i) => r * Math.sin(angleSlice * (i + 1) - Math.PI / 2))
        .style("stroke", "rgba(74, 74, 74, 0.3)")
        .style("stroke-width", "1px");
    }

    // Draw axes
    const axes = g.selectAll(".axis")
      .data(features)
      .enter()
      .append("g")
      .attr("class", "axis");

    axes.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
      .style("stroke", "rgba(74, 74, 74, 0.3)")
      .style("stroke-width", "1px");

    axes.append("text")
      .attr("x", (d, i) => (radius + 25) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => (radius + 25) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .style("text-anchor", "middle")
      .style("alignment-baseline", "middle")
      .style("fill", "#888888")
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("letter-spacing", "1px");

    // Hit areas for hover
    g.selectAll(".hitArea")
      .data(features)
      .enter()
      .append("circle")
      .attr("class", "hitArea")
      .attr("cx", (d, i) => (radius + 25) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => (radius + 25) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("r", 25)
      .style("fill", "transparent")
      .style("cursor", "help")
      .on("mouseover", function(event, d) {
        const i = features.indexOf(d);
        const cx = parseFloat(d3.select(this).attr("cx"));
        const cy = parseFloat(d3.select(this).attr("cy"));
        setHoveredPoint({ feature: d, value: baseData[i], x: cx + centerX, y: cy + centerY });
      })
      .on("mouseout", function() {
        setHoveredPoint(null);
      });

    // Draw radar blob
    const radarLine = d3.lineRadial<number>()
      .angle((d, i) => i * angleSlice)
      .radius(d => (d / 100) * radius)
      .curve(d3.curveLinearClosed);

    const radarPath = g.append("path")
      .datum(baseData)
      .attr("d", radarLine)
      .style("fill", "url(#radarGradient)")
      .style("stroke", "#009FE3")
      .style("stroke-width", "2px")
      .style("filter", "url(#radarGlow)");

    // Draw points
    const points = g.selectAll(".radarPoint")
      .data(baseData)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => (d / 100) * radius * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => (d / 100) * radius * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("r", 3)
      .style("fill", "#FFFFFF")
      .style("stroke", "#009FE3")
      .style("stroke-width", "1.5px")
      .style("filter", "url(#radarGlow)");

    // Sweep line
    const sweepGroup = g.append("g");
    const sweepLine = sweepGroup.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", -radius)
      .style("stroke", "#009FE3")
      .style("stroke-width", "2px")
      .style("opacity", 0.8)
      .style("filter", "url(#radarGlow)");
      
    // Sweep gradient arc
    const arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(Math.PI / 4); // 45 degrees sweep
      
    const sweepGradient = defs.append("linearGradient")
      .attr("id", "sweepGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    sweepGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(0, 159, 227, 0.4)");
    sweepGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(0, 159, 227, 0)");

    const sweepArc = sweepGroup.append("path")
      .attr("d", arcGenerator as any)
      .style("fill", "url(#sweepGradient)")
      .attr("transform", "rotate(-45)");

    // Animation loop for breathing effect and sweep
    let time = 0;
    let rotation = 0;
    const timer = d3.timer(() => {
      time += 0.03;
      rotation = (rotation + 2) % 360;
      
      sweepGroup.attr("transform", `rotate(${rotation})`);

      // Add some noise to the data
      const animatedData = baseData.map((val, i) => {
        const noise = Math.sin(time + i * 2) * 8; // +/- 8% variation
        return Math.max(0, Math.min(100, val + noise));
      });

      radarPath.datum(animatedData).attr("d", radarLine);

      points.data(animatedData)
        .attr("cx", (d, i) => (d / 100) * radius * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("cy", (d, i) => (d / 100) * radius * Math.sin(angleSlice * i - Math.PI / 2));
    });

    return () => timer.stop();
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-black/40 cursor-pointer" onClick={onHealthClick}>
      <svg ref={svgRef} className="w-full h-full" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" />
      <div className="absolute inset-0 pointer-events-none rounded-sm shadow-[inset_0_0_40px_rgba(0,159,227,0.05)]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-secondary rounded-full shadow-[0_0_10px_#009FE3]"></div>
      {hoveredPoint && (
        <div 
          className="absolute pointer-events-none glass-panel p-2 text-[10px] text-text-main border border-primary/30 rounded-sm z-50 shadow-[0_0_10px_rgba(0,159,227,0.2)]"
          style={{ left: hoveredPoint.x + 10, top: hoveredPoint.y - 10 }}
        >
          <div className="text-text-muted uppercase tracking-widest mb-1">{hoveredPoint.feature}</div>
          <div className="font-mono text-primary text-lg">{hoveredPoint.value}%</div>
        </div>
      )}
    </div>
  );
};

const ResourceAllocation3D = ({ subAgents, onAgentClick }: { subAgents: SubAgent[], onAgentClick?: (agent: SubAgent) => void }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string, value: number, color: string, x: number, y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 300;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const activeAgents = subAgents.filter(a => a.status === 'Active');
    if (activeAgents.length === 0) return;

    const colors = ['#f25d0d', '#009FE3', '#FF003C', '#666666'];
    const data = activeAgents.map((a, i) => ({
      name: a.name,
      value: a.load,
      color: colors[i % colors.length]
    }));

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = 80;
    const innerRadius = 45;
    const depth = 20;

    // DEFS
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow3dPie");
    filter.append("feGaussianBlur").attr("stdDeviation", "2").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const mainGroup = svg.append("g")
      .attr("transform", `translate(${centerX},${centerY}) scale(1, 0.55)`);

    const arcGenerator = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .padAngle(0.05);

    const pieGenerator = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    // Create layers
    const layers: any[] = [];
    for (let i = depth; i >= 0; i--) {
      const layer = mainGroup.append("g")
        .attr("transform", `translate(0, ${i})`);
      layers.push({ group: layer, index: i });
    }

    // Center core
    const core = mainGroup.append("ellipse")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("rx", innerRadius - 8)
      .attr("ry", innerRadius - 8)
      .style("fill", "rgba(0, 159, 227, 0.1)")
      .style("stroke", "rgba(0, 159, 227, 0.4)")
      .style("stroke-width", "1px")
      .style("filter", "url(#glow3dPie)");

    let rotation = 0;
    let pulse = 0;

    const timer = d3.timer(() => {
      rotation += 0.005;
      pulse += 0.05;

      pieGenerator.startAngle(rotation).endAngle(rotation + Math.PI * 2);
      const pieData = pieGenerator(data);

      layers.forEach(({ group, index }) => {
        const isTop = index === 0;
        const paths = group.selectAll("path").data(pieData);
        
        const enterPaths = paths.enter().append("path");
        
        const mergedPaths = enterPaths.merge(paths as any)
          .attr("d", arcGenerator)
          .style("fill", (d: any) => {
            if (isTop) return d.data.color;
            const c = d3.color(d.data.color)?.darker(1.5);
            return c ? c.toString() : d.data.color;
          })
          .style("stroke", (d: any) => isTop ? "rgba(255,255,255,0.3)" : "none")
          .style("stroke-width", isTop ? "1px" : "0px")
          .style("opacity", isTop ? 0.9 : 0.8)
          .style("filter", isTop ? "url(#glow3dPie)" : "none");

        if (isTop) {
          mergedPaths
            .style("cursor", "pointer")
            .on("mouseover", function(event, d: any) {
              const [x, y] = d3.pointer(event, svgRef.current);
              setHoveredSlice({ name: d.data.name, value: d.data.value, color: d.data.color, x, y });
              d3.select(this).style("opacity", 1).style("stroke-width", "2px");
            })
            .on("mousemove", function(event, d: any) {
              const [x, y] = d3.pointer(event, svgRef.current);
              setHoveredSlice({ name: d.data.name, value: d.data.value, color: d.data.color, x, y });
            })
            .on("mouseout", function() {
              setHoveredSlice(null);
              d3.select(this).style("opacity", 0.9).style("stroke-width", "1px");
            })
            .on("click", (event, d: any) => {
              const agent = subAgents.find(a => a.name === d.data.name);
              if (agent && onAgentClick) onAgentClick(agent);
            });
        }
          
        paths.exit().remove();
      });

      // Pulse core
      core.attr("rx", (innerRadius - 8) + Math.sin(pulse) * 2)
          .attr("ry", (innerRadius - 8) + Math.sin(pulse) * 2)
          .style("opacity", 0.5 + Math.sin(pulse) * 0.3);
    });

    return () => timer.stop();
  }, [subAgents, onAgentClick]);

  const avgLoad = Math.round(subAgents.reduce((acc, a) => acc + a.load, 0) / Math.max(1, subAgents.filter(a => a.status === 'Active').length));

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-black/40">
      <svg ref={svgRef} className="w-full h-full" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet" />
      <div className="absolute inset-0 pointer-events-none rounded-sm shadow-[inset_0_0_40px_rgba(0,159,227,0.05)]"></div>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col -mt-4">
        <span className="text-[10px] text-text-muted tracking-widest">SYS LOAD</span>
        <span className="text-xl font-mono text-primary font-bold drop-shadow-[0_0_8px_rgba(0,159,227,0.8)]">
          {avgLoad}%
        </span>
      </div>

      {hoveredSlice && (
        <div 
          className="absolute pointer-events-none glass-panel p-2 text-[10px] text-text-main border rounded-sm z-50"
          style={{ 
            left: hoveredSlice.x + 10, 
            top: hoveredSlice.y - 10,
            borderColor: hoveredSlice.color,
            boxShadow: `0 0 10px ${hoveredSlice.color}33`
          }}
        >
          <div className="text-text-muted uppercase tracking-widest mb-1">{hoveredSlice.name}</div>
          <div className="font-mono text-lg" style={{ color: hoveredSlice.color }}>{hoveredSlice.value}%</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3 text-[9px] font-mono flex-wrap px-2">
        {subAgents.filter(a => a.status === 'Active').map((a, i) => {
          const colors = ['#f25d0d', '#009FE3', '#FF003C', '#666666'];
          const color = colors[i % colors.length];
          return (
            <div key={a.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }}></span>
              <span className="uppercase">{a.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SubAgent {
  id: string;
  name: string;
  type: 'Scout' | 'Scraper' | 'Analyzer' | 'Infiltrator';
  status: 'Idle' | 'Active' | 'Error';
  load: number;
}

interface Task {
  id: string;
  title: string;
  progress: number;
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Failed';
  assignedTo: string;
}

interface LogEntry {
  id?: string;
  type: 'system' | 'muted' | 'secondary' | 'command' | 'code' | 'file-chip' | 'agent-thought';
  text?: string;
  time?: string;
  cmd?: string;
  code?: string;
  language?: string;
  file?: { name: string, path: string, content: string, language: string };
  thoughts?: { text: string, status: 'pending' | 'done' }[];
  isExpanded?: boolean;
}

interface StagedFile {
  file: File;
  snippet?: string;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
}

interface ChatTab {
  id: string;
  name: string;
  logs: LogEntry[];
}

interface ChatHistory {
  id: string;
  timestamp: string;
  name: string;
  logs: LogEntry[];
}

const KNOWN_COMMANDS = [
  'agent --status all', 
  'agent --build-scraper',
  'ls -la', 
  'cat openclaw/config.json', 
  'cat openclaw/agent_core.py', 
  'clear', 
  'help'
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'memory', label: 'Memory', icon: Database },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'office', label: 'Office', icon: Building2 },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
  { id: 'docs', label: 'Docs', icon: FileText },
  { id: 'agents', label: 'Agents', icon: Cpu },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [time, setTime] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [subAgents, setSubAgents] = useState<SubAgent[]>([
    { id: 'SA-01', name: 'SCOUT_ALPHA', type: 'Scout', status: 'Active', load: 45 },
    { id: 'SA-02', name: 'SCRP_BETA', type: 'Scraper', status: 'Active', load: 82 },
    { id: 'SA-03', name: 'ANLZ_GAMMA', type: 'Analyzer', status: 'Idle', load: 0 },
    { id: 'SA-04', name: 'INFL_DELTA', type: 'Infiltrator', status: 'Error', load: 0 },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 'T-882', title: 'Network Perimeter Scan', progress: 100, status: 'Completed', assignedTo: 'SCOUT_ALPHA' },
    { id: 'T-885', title: 'Data Exfiltration: Sector 7G', progress: 65, status: 'In-Progress', assignedTo: 'SCRP_BETA' },
    { id: 'T-889', title: 'Neural Pattern Analysis', progress: 0, status: 'Pending', assignedTo: 'ANLZ_GAMMA' },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'system', text: '0C1-SOG CORE INITIALIZED. POWERED BY OPENCLAW.' },
    { type: 'muted', text: 'Sub-agent synchronization complete.' },
    { type: 'command', time: '14:28:44', cmd: 'agent --status all' },
    { type: 'secondary', text: 'All systems nominal. 4 sub-agents detected.' },
  ]);
  
  const [suggestion, setSuggestion] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/openclaw']));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [executionState, setExecutionState] = useState<{status: 'executing' | 'verifying' | 'completed' | 'error', message: string} | null>(null);
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [ping, setPing] = useState(24);

  const [chatTabs, setChatTabs] = useState<ChatTab[]>([
    { 
      id: 'tab-1', 
      name: 'Agent-01', 
      logs: [
        { type: 'system', text: '0C1-SOG CORE INITIALIZED. POWERED BY OPENCLAW.' },
        { type: 'muted', text: 'Sub-agent synchronization complete.' },
        { type: 'command', time: '14:28:44', cmd: 'agent --status all' },
        { type: 'secondary', text: 'All systems nominal. 4 sub-agents detected.' },
      ]
    }
  ]);
  const [activeChatTabId, setActiveChatTabId] = useState<string>('tab-1');
  const [chatHistoryList, setChatHistoryList] = useState<ChatHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // New UX Features State
  const [layout, setLayout] = useState<Layout>([
    { i: 'metrics', x: 0, y: 0, w: 4, h: 1 },
    { i: 'resource', x: 4, y: 0, w: 4, h: 2 },
    { i: 'globe', x: 8, y: 0, w: 4, h: 2 },
    { i: 'health', x: 0, y: 1, w: 4, h: 2 },
    { i: 'velocity', x: 4, y: 2, w: 8, h: 2 },
    { i: 'tasks', x: 0, y: 3, w: 4, h: 2 }
  ]);
  const [selectedAgent, setSelectedAgent] = useState<SubAgent | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [historicalSnapshot, setHistoricalSnapshot] = useState<'now' | '1h' | '24h' | '7d'>('now');
  const [liveAlerts, setLiveAlerts] = useState<string[]>([
    '[14:42:01] SCRP_BETA successfully bypassed CAPTCHA on Target 4...',
    '[14:42:15] SCOUT_ALPHA discovered 3 new open ports on 192.168.1.105',
    '[14:43:02] ANLZ_GAMMA completed pattern analysis. 0 anomalies detected.',
  ]);

  const { width, containerRef } = useContainerWidth();

  const activeChat = chatTabs.find(t => t.id === activeChatTabId) || chatTabs[0];

  const updateActiveLogs = (updater: (prev: LogEntry[]) => LogEntry[]) => {
    setChatTabs(prev => prev.map(tab => 
      tab.id === activeChatTabId ? { ...tab, logs: updater(tab.logs) } : tab
    ));
  };
  
  const [fileTree, setFileTree] = useState<FileNode[]>([
    { 
      name: 'openclaw', 
      type: 'folder', 
      children: [
        { name: 'config.json', type: 'file', content: `{\n  "agent_name": "0C1-SOG",\n  "version": "2.4.1",\n  "modules": ["scout", "scraper", "analyzer"],\n  "auto_heal": true\n}`, language: 'json' },
        { name: 'agent_core.py', type: 'file', content: `def initialize_core():\n    print("Loading OpenClaw modules...")\n    connect_vps()\n    return True`, language: 'python' },
        { 
          name: 'logs', 
          type: 'folder', 
          children: [
            { name: 'error.log', type: 'file', content: '2026-03-14 23:45:01 ERROR: Connection timeout', language: 'log' },
            { name: 'access.log', type: 'file', content: '2026-03-14 23:45:02 INFO: User login', language: 'log' }
          ]
        }
      ]
    }
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPing(prev => Math.max(12, prev + Math.floor(Math.random() * 9) - 4));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat.logs]);

  const handleTerminalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTerminalInput(val);
    if (val) {
      const match = KNOWN_COMMANDS.find(cmd => cmd.startsWith(val));
      setSuggestion(match || '');
    } else {
      setSuggestion('');
    }
  };

  const getFileFromTree = (nodes: FileNode[], pathParts: string[]): FileNode | null => {
    if (pathParts.length === 0) return null;
    const part = pathParts[0];
    const node = nodes.find(n => n.name === part);
    if (!node) return null;
    if (pathParts.length === 1 && node.type === 'file') return node;
    if (node.type === 'folder' && node.children) {
      return getFileFromTree(node.children, pathParts.slice(1));
    }
    return null;
  };

  const currentPreviewFile = previewFilePath ? getFileFromTree(fileTree, previewFilePath.split('/')) : null;

  const handleNewTab = () => {
    const newId = `tab-${Date.now()}`;
    setChatTabs(prev => [...prev, {
      id: newId,
      name: `Agent-${(prev.length + 1).toString().padStart(2, '0')}`,
      logs: [{ type: 'system', text: 'OpenClaw Secure Terminal v2.4.1\nEstablishing encrypted connection to VPS...' }]
    }]);
    setActiveChatTabId(newId);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chatTabs.length === 1) return;
    
    setChatTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeChatTabId === id) {
        setActiveChatTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const handleClearChat = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setChatHistoryList(prev => [{
      id: `hist-${Date.now()}`,
      timestamp: timeStr,
      name: `${activeChat.name} Session`,
      logs: [...activeChat.logs]
    }, ...prev]);

    updateActiveLogs(() => [{ type: 'system', text: 'Terminal cleared. Session archived.' }]);
  };

  const handleLoadHistory = (history: ChatHistory) => {
    const newId = `tab-${Date.now()}`;
    setChatTabs(prev => [...prev, {
      id: newId,
      name: `[Archived] ${history.name}`,
      logs: history.logs
    }]);
    setActiveChatTabId(newId);
    setShowHistory(false);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const executeCommand = (cmd: string) => {
    if (!cmd.trim() && stagedFiles.length === 0) return;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    if (cmd.trim()) {
      updateActiveLogs(prev => [...prev, { type: 'command', time: timeStr, cmd }]);
      setCommandHistory(prev => [...prev, cmd]);
    }
    setHistoryIndex(-1);
    setTerminalInput('');
    setSuggestion('');

    if (cmd === 'clear') {
      updateActiveLogs(() => []);
      setStagedFiles([]);
      return;
    }

    const processCmd = () => {
      if (!cmd.trim()) return;
      
      const isRecognized = KNOWN_COMMANDS.includes(cmd.trim()) || 
                           cmd.startsWith('python ') || 
                           cmd.startsWith('tail ') || 
                           cmd.startsWith('top ');

      setExecutionState({ status: 'executing', message: `Executing directive: ${cmd}` });
      
      setTimeout(() => {
        setExecutionState({ status: 'verifying', message: 'Verifying output integrity...' });
      }, 600);

      setTimeout(() => {
        if (!isRecognized) {
          setExecutionState({ status: 'error', message: `Command execution failed: ${cmd}` });
          setTimeout(() => {
            setExecutionState(null);
            updateActiveLogs(prev => [...prev, { type: 'secondary', text: `bash: ${cmd}: command not found` }]);
          }, 1000);
        } else {
          setExecutionState({ status: 'completed', message: 'Directive executed successfully.' });
          setTimeout(() => {
            setExecutionState(null);
            const newLogs: LogEntry[] = [];
            
            if (cmd === 'agent --build-scraper') {
              const thoughtId = 'thought-' + Date.now();
              newLogs.push({
                id: thoughtId,
                type: 'agent-thought',
                isExpanded: true,
                thoughts: [{ text: 'Analyzing directive: build scraper', status: 'pending' }]
              });
              
              setTimeout(() => {
                updateActiveLogs(prev => prev.map(log => log.id === thoughtId ? {
                  ...log,
                  thoughts: [
                    { text: 'Analyzing directive: build scraper', status: 'done' },
                    { text: 'Initializing openclaw/scraper_v2.py', status: 'pending' }
                  ]
                } : log));
                
                setFileTree(prev => {
                  const newTree = JSON.parse(JSON.stringify(prev));
                  const openclaw = newTree.find((n: any) => n.name === 'openclaw');
                  if (openclaw && !openclaw.children.find((n: any) => n.name === 'scraper_v2.py')) {
                    openclaw.children.push({
                      name: 'scraper_v2.py',
                      type: 'file',
                      content: '',
                      language: 'python'
                    });
                  }
                  return newTree;
                });
                
                setPreviewFilePath('openclaw/scraper_v2.py');
                setExpandedFolders(prev => new Set(prev).add('/openclaw'));
              }, 1500);

              setTimeout(() => {
                updateActiveLogs(prev => prev.map(log => log.id === thoughtId ? {
                  ...log,
                  thoughts: [
                    { text: 'Analyzing directive: build scraper', status: 'done' },
                    { text: 'Initializing openclaw/scraper_v2.py', status: 'done' },
                    { text: 'Writing import statements and class structure...', status: 'pending' }
                  ]
                } : log));

                const codeToWrite = `import requests\nfrom bs4 import BeautifulSoup\n\nclass ScraperV2:\n    def __init__(self, target_url):\n        self.target = target_url\n        self.session = requests.Session()\n\n    def execute(self):\n        print(f"Scraping {self.target}...")\n        # TODO: Implement extraction logic\n        return True\n`;
                
                let charIndex = 0;
                const typeInterval = setInterval(() => {
                  if (charIndex < codeToWrite.length) {
                    const chunk = codeToWrite.slice(charIndex, charIndex + 5);
                    charIndex += 5;
                    
                    setFileTree(prev => {
                      const newTree = JSON.parse(JSON.stringify(prev));
                      const openclaw = newTree.find((n: any) => n.name === 'openclaw');
                      if (openclaw) {
                        const file = openclaw.children.find((n: any) => n.name === 'scraper_v2.py');
                        if (file) {
                          file.content += chunk;
                        }
                      }
                      return newTree;
                    });
                  } else {
                    clearInterval(typeInterval);
                    updateActiveLogs(prev => prev.map(log => log.id === thoughtId ? {
                      ...log,
                      thoughts: [
                        { text: 'Analyzing directive: build scraper', status: 'done' },
                        { text: 'Initializing openclaw/scraper_v2.py', status: 'done' },
                        { text: 'Writing import statements and class structure...', status: 'done' },
                        { text: 'Module compilation successful.', status: 'done' }
                      ]
                    } : log));
                    
                    updateActiveLogs(prev => [...prev, {
                      type: 'file-chip',
                      file: { name: 'scraper_v2.py', path: 'openclaw/scraper_v2.py', content: codeToWrite, language: 'python' }
                    }]);
                  }
                }, 50);
              }, 3000);
            } else if (cmd.startsWith('cat ')) {
              const path = cmd.slice(4).trim();
              const file = getFileFromTree(fileTree, path.split('/'));
              if (file && file.type === 'file') {
                newLogs.push({
                  type: 'code',
                  language: file.language || 'text',
                  code: file.content || ''
                });
                newLogs.push({
                  type: 'file-chip',
                  file: { name: file.name, path: path, content: file.content || '', language: file.language || 'text' }
                });
              } else {
                newLogs.push({ type: 'secondary', text: `cat: ${path}: No such file or directory` });
              }
            } else if (cmd === 'ls -la') {
               newLogs.push({ type: 'secondary', text: 'drwxr-xr-x 4 root root 4096 Mar 14 23:45 openclaw' });
            } else if (cmd === 'agent --status all') {
               newLogs.push({ type: 'secondary', text: 'All systems nominal. 4 sub-agents detected.' });
            } else if (cmd === 'help') {
               newLogs.push({ type: 'secondary', text: 'Available commands: agent --status all, ls -la, cat [file], clear, help' });
            } else {
              newLogs.push({ type: 'muted', text: 'Executing OpenClaw directive: ' + cmd });
              newLogs.push({ type: 'secondary', text: 'Directive executed successfully. 0 errors.' });
            }
            updateActiveLogs(prev => [...prev, ...newLogs]);
          }, 800);
        }
      }, 1400);
    };

    if (stagedFiles.length > 0) {
      const fileNames = stagedFiles.map(f => f.file.name).join(', ');
      updateActiveLogs(prev => [...prev, { type: 'system', text: `Initiating secure upload for ${fileNames}...` }]);
      setExecutionState({ status: 'executing', message: 'Encrypting payload...' });
      setTimeout(() => setExecutionState({ status: 'verifying', message: 'Transferring to VPS & verifying checksum...' }), 600);
      setTimeout(() => {
        setExecutionState({ status: 'completed', message: 'Upload completed successfully.' });
        setTimeout(() => {
          setExecutionState(null);
          updateActiveLogs(prev => [...prev, { type: 'secondary', text: `Upload complete: ${fileNames} -> /opt/openclaw/` }]);
          processCmd();
        }, 800);
      }, 1400);
      setStagedFiles([]);
    } else {
      processCmd();
    }
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setTerminalInput(suggestion);
      setSuggestion('');
    } else if (e.key === 'Enter') {
      executeCommand(terminalInput.trim());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  
  const processFiles = async (files: File[]) => {
    if (files.length > 0) {
      const newStaged: StagedFile[] = [];
      for (const file of files) {
        let snippet = '';
        if (file.type.startsWith('text/') || file.name.match(/\.(json|js|ts|py|txt|md|csv|log)$/i)) {
          try {
            const text = await file.text();
            snippet = text.slice(0, 80) + (text.length > 80 ? '...' : '');
          } catch (err) {
            console.error("Could not read file snippet", err);
          }
        }
        newStaged.push({ file, snippet });
      }
      setStagedFiles(prev => [...prev, ...newStaged]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    await processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setExpandedFolders(newSet);
  };

  const renderFileTree = (nodes: FileNode[], path = '') => {
    return nodes.map((node) => {
      const currentPath = `${path}/${node.name}`;
      const isExpanded = expandedFolders.has(currentPath);
      
      return (
        <div key={currentPath} className="flex flex-col">
          <div 
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 cursor-pointer rounded-sm text-[12px] transition-colors ${node.type === 'folder' ? 'text-text-main font-bold' : (previewFilePath === currentPath.substring(1) ? 'text-primary bg-primary/10' : 'text-text-muted')}`}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(currentPath);
              } else {
                setPreviewFilePath(currentPath.substring(1));
              }
            }}
          >
            {node.type === 'folder' ? (
              <>
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Folder className="w-3 h-3 text-secondary" />
              </>
            ) : (
              <>
                <span className="w-3 h-3" />
                <File className={`w-3 h-3 ${previewFilePath === currentPath.substring(1) ? 'text-primary' : 'text-text-muted'}`} />
              </>
            )}
            <span>{node.name}</span>
          </div>
          {node.type === 'folder' && isExpanded && node.children && (
            <div className="pl-4 border-l border-border-muted/30 ml-3 mt-1 flex flex-col gap-0.5">
              {renderFileTree(node.children, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderDashboard = () => (
    <div ref={containerRef} className={`flex-1 flex flex-col min-h-0 overflow-y-auto pr-2 ${historicalSnapshot !== 'now' ? 'sepia-[0.3] hue-rotate-[-10deg]' : ''}`}>
      <ResponsiveGridLayout
        width={width}
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={140}
        onLayoutChange={(newLayout) => setLayout(newLayout)}
        margin={[16, 16]}
      >
        {/* Core Metrics */}
        <div key="metrics" className="glass-panel rounded-sm p-4 flex flex-col gap-4 overflow-hidden cursor-move">
          <div className="flex items-center justify-between border-b border-border-muted pb-2">
            <div className="flex items-center gap-2 text-text-muted uppercase tracking-widest text-[10px]">
              <Activity className="w-3 h-3" />
              <span>Core Metrics</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="flex flex-col justify-center relative group">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Uptime</div>
              <div className="text-2xl font-mono text-primary cursor-help">124:12:05</div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-3 glass-panel text-[10px] text-text-main z-50 border border-primary/30 shadow-[0_0_15px_rgba(242,93,13,0.15)] rounded-sm pointer-events-none">
                <div className="text-text-muted mb-1 uppercase tracking-widest">Last Reboot:</div>
                <div className="font-mono mb-2 text-primary">2026-03-10 04:17:29 UTC</div>
                <div className="text-text-muted mb-1 uppercase tracking-widest">Reason:</div>
                <div className="text-secondary font-mono">Kernel Patch (Critical)</div>
              </div>
            </div>
            <div className="flex flex-col justify-center relative group">
              <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Threats</div>
              <div className="text-2xl font-mono text-critical cursor-help">03</div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 p-3 glass-panel text-[10px] text-text-main z-50 border border-critical/30 shadow-[0_0_15px_rgba(255,0,60,0.15)] rounded-sm pointer-events-none">
                <div className="text-text-muted mb-2 uppercase tracking-widest">Active Threats:</div>
                <ul className="font-mono text-critical space-y-1.5">
                  <li className="flex justify-between"><span>192.168.1.45</span><span className="text-text-muted">DDoS</span></li>
                  <li className="flex justify-between"><span>10.0.0.2</span><span className="text-text-muted">Intrusion</span></li>
                  <li className="flex justify-between"><span>172.16.0.8</span><span className="text-text-muted">Malware</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Allocation */}
        <div key="resource" className="glass-panel rounded-sm p-4 flex flex-col gap-4 overflow-hidden cursor-move">
          <div className="flex items-center justify-between border-b border-border-muted pb-2">
            <div className="flex items-center gap-2 text-text-muted uppercase tracking-widest text-[10px]">
              <Cpu className="w-3 h-3" />
              <span>Resource Allocation</span>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden rounded-sm border border-border-muted/30">
            <ResourceAllocation3D subAgents={subAgents} onAgentClick={(agent) => setSelectedAgent(agent)} />
          </div>
        </div>

        {/* Global Threat Map */}
        <div key="globe" className="glass-panel rounded-sm overflow-hidden relative bg-black/40 cursor-move">
          <GlobeMap />
        </div>

        {/* System Health Radar */}
        <div key="health" className="glass-panel rounded-sm p-4 flex flex-col gap-4 overflow-hidden cursor-move">
          <div className="flex items-center justify-between border-b border-border-muted pb-2">
            <div className="flex items-center gap-2 text-text-muted uppercase tracking-widest text-[10px]">
              <Activity className="w-3 h-3" />
              <span>System Health</span>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden rounded-sm border border-border-muted/30">
            <SystemHealthRadar onHealthClick={() => setIsHealthModalOpen(true)} />
          </div>
        </div>

        {/* Task Velocity */}
        <div key="velocity" className="glass-panel rounded-sm p-4 flex flex-col gap-4 overflow-hidden cursor-move">
          <div className="flex items-center justify-between border-b border-border-muted pb-2">
            <div className="flex items-center gap-2 text-text-muted uppercase tracking-widest text-[10px]">
              <ListChecks className="w-3 h-3" />
              <span>Task Velocity (24h vs 7d)</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { time: '00:00', assigned: 20, completed: 15, backlog: 5 },
                { time: '04:00', assigned: 35, completed: 25, backlog: 10 },
                { time: '08:00', assigned: 50, completed: 40, backlog: 10 },
                { time: '12:00', assigned: 80, completed: 60, backlog: 20 },
                { time: '16:00', assigned: 95, completed: 85, backlog: 10 },
                { time: '20:00', assigned: 110, completed: 105, backlog: 5 },
                { time: '24:00', assigned: 120, completed: 118, backlog: 2 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 74, 74, 0.3)" vertical={false} />
                <XAxis dataKey="time" stroke="#666666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666666" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid #4A4A4A', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="backlog" fill="rgba(242, 93, 13, 0.1)" stroke="none" />
                <Line type="monotone" dataKey="assigned" stroke="#666666" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="completed" stroke="#f25d0d" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Directives */}
        <div key="tasks" className="glass-panel rounded-sm p-4 flex flex-col gap-4 overflow-hidden cursor-move">
          <div className="flex items-center justify-between border-b border-border-muted pb-2">
            <div className="flex items-center gap-2 text-text-muted uppercase tracking-widest text-[10px]">
              <TerminalIcon className="w-3 h-3" />
              <span>Active Directives</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className="p-3 border border-border-muted/50 rounded-sm bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[11px] font-bold text-text-main">{task.title}</div>
                    <div className="text-[9px] text-text-muted">ASGN: {task.assignedTo}</div>
                  </div>
                  <div className={`text-[9px] uppercase font-bold ${
                    task.status === 'Completed' ? 'text-secondary' :
                    task.status === 'In-Progress' ? 'text-primary' :
                    'text-text-muted'
                  }`}>
                    {task.status}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-border-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${task.progress}%` }}></div>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );

  const renderChat = () => (
    <div 
      className="flex-1 flex gap-4 min-h-0 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-sm flex flex-col items-center justify-center text-primary">
          <UploadCloud className="w-12 h-12 mb-4 animate-bounce" />
          <div className="text-xl font-bold tracking-widest uppercase">Drop files to upload to VPS</div>
          <div className="text-sm opacity-70 mt-2 font-mono">Target: /opt/openclaw/</div>
        </div>
      )}

      {/* Chat Area */}
      <div className="glass-panel flex-1 flex flex-col rounded-sm overflow-hidden min-w-[400px]">
        <div className="h-10 border-b border-border-muted flex items-center justify-between bg-black/20 pr-4">
          <div className="flex h-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {chatTabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveChatTabId(tab.id)}
                className={`flex items-center gap-2 px-4 h-full border-r border-border-muted/30 cursor-pointer min-w-[120px] max-w-[200px] group transition-colors ${
                  activeChatTabId === tab.id ? 'bg-primary/10 border-b-2 border-b-primary text-primary' : 'hover:bg-white/5 text-text-muted'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] uppercase tracking-wider truncate flex-1 font-bold">{tab.name}</span>
                {chatTabs.length > 1 && (
                  <button 
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className={`p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                      activeChatTabId === tab.id ? 'hover:bg-primary/20 text-primary' : 'hover:bg-white/10 text-text-muted'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={handleNewTab}
              className="px-3 h-full flex items-center justify-center text-text-muted hover:text-primary hover:bg-white/5 transition-colors border-r border-border-muted/30"
              title="New Agent Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-sm transition-colors ${showHistory ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-primary hover:bg-white/5'}`}
              title="Session History"
            >
              <History className="w-4 h-4" />
            </button>
            <button 
              onClick={handleClearChat}
              className="p-1.5 rounded-sm text-text-muted hover:text-critical hover:bg-critical/10 transition-colors"
              title="Clear & Archive Session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2 text-[14px] font-mono relative">
          {showHistory && (
            <div className="absolute top-0 right-0 w-64 bottom-0 bg-black/95 border-l border-border-muted/30 z-20 flex flex-col animate-in slide-in-from-right-2 duration-200">
              <div className="p-3 border-b border-border-muted/30 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Session Archives</span>
                <button onClick={() => setShowHistory(false)} className="text-text-muted hover:text-primary"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                {chatHistoryList.length === 0 ? (
                  <div className="text-[11px] text-text-muted/50 text-center mt-4 italic">No archived sessions</div>
                ) : (
                  chatHistoryList.map(hist => (
                    <div 
                      key={hist.id} 
                      onClick={() => handleLoadHistory(hist)}
                      className="p-2 border border-border-muted/30 rounded-sm hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-primary font-bold">{hist.name}</span>
                        <span className="text-[9px] text-text-muted">{hist.timestamp}</span>
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        {hist.logs.filter(l => l.type === 'command').length} directives executed
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeChat.logs.map((log, index) => {
            if (log.type === 'system') return <div key={index} className="text-primary font-bold mb-4 text-[15px]">{log.text}</div>;
            if (log.type === 'muted') return <div key={index} className="text-text-muted">{log.text}</div>;
            if (log.type === 'secondary') return <div key={index} className="text-secondary">{log.text}</div>;
            if (log.type === 'command') return (
              <div key={index} className="mt-6 flex gap-3">
                <span className="text-text-muted">[{log.time}]</span>
                <span className="text-primary">0C1-SOG &gt;</span>
                <span className="text-text-main">{log.cmd}</span>
              </div>
            );
            if (log.type === 'code') return (
              <div key={index} className="mt-3 relative group bg-[#050505] border border-border-muted/30 rounded-sm p-4 overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-black/80 border-b border-l border-border-muted/30 rounded-bl-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(log.code || '');
                      setCopiedIndex(index);
                      setTimeout(() => setCopiedIndex(null), 2000);
                    }}
                    className="text-text-muted hover:text-text-main transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-text-muted uppercase mb-3 select-none flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  {log.language}
                </div>
                <pre className="text-[13px] text-primary/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  <code>{log.code}</code>
                </pre>
              </div>
            );
            if (log.type === 'file-chip' && log.file) return (
              <div key={index} className="mt-2 flex items-center gap-2">
                <div 
                  className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-sm text-[12px] hover:bg-primary/20 transition-colors cursor-pointer group" 
                  onClick={() => setPreviewFilePath(log.file!.path)}
                >
                  <FileText className="w-3 h-3" />
                  <span>{log.file.name}</span>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-primary/20 rounded" title="Preview" onClick={(e) => { e.stopPropagation(); setPreviewFilePath(log.file!.path); }}><Eye className="w-3 h-3" /></button>
                    <button className="p-1 hover:bg-primary/20 rounded" title="Execute" onClick={(e) => { e.stopPropagation(); executeCommand(`python ${log.file!.path}`); }}><Play className="w-3 h-3" /></button>
                    <button className="p-1 hover:bg-primary/20 rounded" title="Download" onClick={(e) => { e.stopPropagation(); }}><Download className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            );
            if (log.type === 'agent-thought') return (
              <div key={index} className="mt-4 flex flex-col gap-0 bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
                <div 
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => {
                    updateActiveLogs(prev => prev.map((l, i) => i === index ? { ...l, isExpanded: !l.isExpanded } : l));
                  }}
                >
                  {log.isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-primary" />}
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <span className="text-primary text-[13px] font-bold uppercase tracking-wider">Agent Reasoning</span>
                </div>
                
                {log.isExpanded && log.thoughts && (
                  <div className="px-4 py-3 flex flex-col gap-2 border-t border-primary/10">
                    {log.thoughts.map((thought, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2 text-[13px] font-mono">
                        {thought.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <CircleDashed className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '3s' }} />
                        )}
                        <span className={thought.status === 'done' ? 'text-text-muted' : 'text-text-main'}>
                          {thought.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
            return null;
          })}
          
          {executionState && (
            <div className="mt-4 flex flex-col gap-2 p-3 bg-black/40 border border-border-muted/30 rounded-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-3 font-mono text-[13px]">
                {executionState.status === 'executing' && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                {executionState.status === 'verifying' && <ShieldCheck className="w-4 h-4 animate-pulse text-blue-400" />}
                {executionState.status === 'completed' && <Check className="w-4 h-4 text-emerald-500" />}
                {executionState.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                
                <span className={
                  executionState.status === 'executing' ? 'text-orange-500' :
                  executionState.status === 'verifying' ? 'text-blue-400' :
                  executionState.status === 'completed' ? 'text-emerald-500' :
                  'text-red-500'
                }>
                  [{executionState.status.toUpperCase()}] {executionState.message}
                </span>
              </div>
              <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${
                  executionState.status === 'executing' ? 'w-1/3 bg-orange-500' :
                  executionState.status === 'verifying' ? 'w-2/3 bg-blue-400' :
                  executionState.status === 'completed' ? 'w-full bg-emerald-500' :
                  'w-full bg-red-500'
                }`} />
              </div>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>

        <div className="flex flex-col border-t border-primary/50 bg-black/40">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border-muted/30 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {[
              { label: 'Tail Error Logs', cmd: 'tail -f openclaw/logs/error.log' },
              { label: 'Check CPU Load', cmd: 'top -b -n 1' },
              { label: 'List Directory', cmd: 'ls -la' },
              { label: 'Agent Status', cmd: 'agent --status all' }
            ].map(action => (
              <button 
                key={action.label}
                onClick={() => executeCommand(action.cmd)}
                className="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-border-muted/50 rounded-sm text-[10px] text-text-muted hover:text-text-main transition-colors uppercase tracking-wider"
              >
                <TerminalSquare className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between px-4 py-1.5 bg-black/60 text-[10px] font-mono text-text-muted">
            <div className="flex items-center gap-3">
              <span className="text-secondary">root@vps:/opt/openclaw</span>
              <span className="opacity-50">|</span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Ping: {ping}ms
              </span>
            </div>
            <div className="flex items-center gap-1 text-secondary">
              <ShieldCheck className="w-3 h-3" />
              SECURE
            </div>
          </div>

          {stagedFiles.length > 0 && (
            <div className="px-4 py-3 border-b border-border-muted/30 flex gap-3 overflow-x-auto bg-black/80">
              {stagedFiles.map((staged, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 bg-[#050505] border border-primary/30 rounded-sm p-2.5 min-w-[220px] max-w-[280px] relative group shrink-0">
                  <button 
                    onClick={() => setStagedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 p-1 text-text-muted hover:text-critical bg-black/80 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-2 text-[12px] text-primary font-mono pr-6">
                    <File className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate" title={staged.file.name}>{staged.file.name}</span>
                  </div>
                  <div className="text-[10px] text-text-muted flex justify-between items-center">
                    <span className="truncate max-w-[100px]">{staged.file.type || 'unknown type'}</span>
                    <span>{(staged.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  {staged.snippet && (
                    <div className="text-[10px] text-text-muted/70 font-mono bg-white/5 p-1.5 rounded-sm truncate mt-1 border border-white/5">
                      {staged.snippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="h-12 flex items-center px-4 relative">
            <span className="text-primary mr-3 font-mono text-[15px] z-10">0C1-SOG &gt;</span>
            <div className="relative flex-1 h-full flex items-center">
              {suggestion && suggestion.startsWith(terminalInput) && (
                <div className="absolute inset-0 flex items-center text-text-muted/30 font-mono text-[15px] pointer-events-none whitespace-pre">
                  <span className="opacity-0">{terminalInput}</span>
                  <span>{suggestion.slice(terminalInput.length)}</span>
                </div>
              )}
              <input 
                autoFocus 
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-text-main font-mono text-[15px] p-0 placeholder-text-muted/50 z-10 relative" 
                placeholder={stagedFiles.length > 0 ? "Press Enter to upload staged files..." : "Enter directive... (Tab to autocomplete, ↑/↓ for history)"}
                type="text" 
                value={terminalInput}
                onChange={handleTerminalChange}
                onKeyDown={handleTerminalKeyDown}
              />
            </div>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-muted hover:text-primary transition-colors ml-2"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Split-Pane Previewer */}
      {currentPreviewFile && (
        <div className="w-1/3 glass-panel rounded-sm flex flex-col overflow-hidden shrink-0 border-l border-secondary/30 animate-in slide-in-from-right-4 duration-200">
          <div className="h-10 border-b border-border-muted flex items-center px-4 justify-between bg-black/20">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-secondary uppercase">
              <Eye className="w-4 h-4" />
              <span>Preview: {currentPreviewFile.name}</span>
            </div>
            <button 
              onClick={() => setPreviewFilePath(null)}
              className="p-1 text-text-muted hover:text-critical transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-[#050505]">
            <pre className="text-[12px] text-text-main font-mono whitespace-pre-wrap leading-relaxed">
              <code>{currentPreviewFile.content}</code>
            </pre>
          </div>
        </div>
      )}

      {/* File Tree Drawer */}
      <div className="w-64 glass-panel rounded-sm flex flex-col overflow-hidden shrink-0">
        <div className="h-10 border-b border-border-muted flex items-center px-4 bg-black/20">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-text-muted uppercase">
            <Database className="w-4 h-4" />
            <span>VPS File System</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 select-none">
          {renderFileTree(fileTree)}
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="flex-1 glass-panel rounded-sm p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-muted pb-4">
        <div className="flex items-center gap-3 text-text-muted uppercase tracking-widest text-[12px]">
          <ListChecks className="w-4 h-4" />
          <span>Task Master</span>
        </div>
        <button className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-sm text-[11px] hover:bg-primary/20 transition-colors uppercase tracking-wider">
          <Plus className="w-3 h-3" /> New Task
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
        {tasks.map(task => (
          <div key={task.id} className="p-4 border border-border-muted/50 rounded-sm bg-white/5 hover:bg-white/10 transition-colors flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-[14px] font-bold text-text-main">{task.title}</div>
                <div className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  task.status === 'Completed' ? 'text-secondary border-secondary/30 bg-secondary/10' :
                  task.status === 'In-Progress' ? 'text-primary border-primary/30 bg-primary/10' :
                  'text-text-muted border-border-muted bg-white/5'
                }`}>
                  {task.status}
                </div>
              </div>
              <div className="text-[10px] text-text-muted font-mono">ID: {task.id}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-text-muted flex items-center gap-2">
                <Cpu className="w-3 h-3" />
                Assigned: <span className="text-text-main">{task.assignedTo}</span>
              </div>
              <div className="flex items-center gap-3 w-1/3">
                <div className="flex-1 h-1.5 bg-border-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${task.status === 'Completed' ? 'bg-secondary' : 'bg-primary'}`} style={{ width: `${task.progress}%` }}></div>
                </div>
                <span className="text-[10px] font-mono text-text-muted w-8 text-right">{task.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMemory = () => (
    <div className="flex-1 glass-panel rounded-sm p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-muted pb-4">
        <div className="flex items-center gap-3 text-text-muted uppercase tracking-widest text-[12px]">
          <Database className="w-4 h-4" />
          <span>Vector Memory Bank</span>
        </div>
        <div className="text-[10px] text-secondary font-mono">CAPACITY: 42.8%</div>
      </div>
      <div className="grid grid-cols-3 gap-4 h-32">
        {[
          { label: 'Total Vectors', value: '1,048,576' },
          { label: 'Recent Queries', value: '3,492' },
          { label: 'Avg Latency', value: '12ms' }
        ].map((stat, i) => (
          <div key={i} className="bg-black/40 border border-border-muted/50 rounded-sm p-4 flex flex-col justify-center items-center gap-2">
            <div className="text-[10px] text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-mono text-primary">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 border border-border-muted/50 rounded-sm bg-black/40 p-4 flex flex-col gap-4 overflow-hidden">
        <div className="text-[10px] text-text-muted uppercase tracking-widest">Recent Memory Access</div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {[
            { query: 'Find all references to "Project Orion"', distance: '0.012', time: '2 mins ago' },
            { query: 'Analyze sentiment of intercepted comms', distance: '0.045', time: '15 mins ago' },
            { query: 'Retrieve infiltration protocols', distance: '0.003', time: '1 hour ago' },
            { query: 'Identify anomalies in sector 7G', distance: '0.089', time: '3 hours ago' },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
              <div className="text-[12px] text-text-main font-mono truncate max-w-[60%]">{log.query}</div>
              <div className="flex items-center gap-4 text-[10px] text-text-muted font-mono">
                <span>Dist: <span className="text-secondary">{log.distance}</span></span>
                <span>{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="flex-1 glass-panel rounded-sm p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-muted pb-4">
        <div className="flex items-center gap-3 text-text-muted uppercase tracking-widest text-[12px]">
          <Users className="w-4 h-4" />
          <span>Operative Roster</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2">
        {subAgents.map(agent => (
          <div key={agent.id} className="p-4 border border-border-muted/50 rounded-sm bg-black/40 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-text-main">{agent.name}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest">{agent.type}</div>
                </div>
              </div>
              <div className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                agent.status === 'Active' ? 'text-secondary border-secondary/30 bg-secondary/10' :
                agent.status === 'Error' ? 'text-critical border-critical/30 bg-critical/10' :
                'text-text-muted border-border-muted bg-white/5'
              }`}>
                {agent.status}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>Current Load</span>
                <span>{agent.load}%</span>
              </div>
              <div className="h-1.5 w-full bg-border-muted rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${agent.status === 'Error' ? 'bg-critical' : 'bg-secondary'}`} style={{ width: `${agent.load}%` }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-border-muted/50 rounded-sm text-[10px] text-text-main transition-colors uppercase tracking-wider">
                Diagnostics
              </button>
              <button className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-sm text-[10px] text-primary transition-colors uppercase tracking-wider">
                Reassign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlaceholder = () => (
    <div className="flex-1 glass-panel rounded-sm flex items-center justify-center flex-col gap-4">
      <div className="w-16 h-16 border-2 border-dashed border-border-muted rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
        <Zap className="w-6 h-6 text-text-muted animate-pulse" />
      </div>
      <div className="text-text-muted tracking-[0.2em] uppercase text-xs">
        Module [{activeTab.toUpperCase()}] Offline
      </div>
      <div className="text-border-muted font-mono text-[10px]">
        Awaiting construction directive...
      </div>
    </div>
  );

  return (
    <>
      {/* Topographical Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid-40 opacity-20 pointer-events-none z-0"></div>
      
      {/* Main Layout Grid */}
      <div className="relative z-10 h-full w-full flex p-4 gap-4">
        
        {/* Side Navigation */}
        <aside className="w-48 flex-none glass-panel rounded-sm flex flex-col border-primary/30 overflow-hidden">
          <div className="h-12 flex items-center justify-center border-b border-border-muted bg-black/20">
            <Zap className="w-5 h-5 text-primary mr-2 fill-primary/20" />
            <span className="text-primary font-bold tracking-widest text-[14px]">OPENCLAW</span>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-[11px] tracking-wider uppercase ${
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-2 border-t border-border-muted bg-black/20">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-[11px] tracking-wider uppercase text-text-muted hover:text-text-main hover:bg-white/5 border-l-2 border-transparent">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Global Header */}
          <header className="flex-none h-12 flex items-center justify-between glass-panel px-4 rounded-sm border-primary/30">
            <div className="flex items-center gap-6">
              <span className="text-primary font-bold tracking-[0.2em] uppercase text-[16px]">
                0C1-SOG // {activeTab.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-6 text-text-muted">
              {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2 bg-black/40 rounded-sm p-1 border border-border-muted/30">
                  {(['now', '1h', '24h', '7d'] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => setHistoricalSnapshot(t)}
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-sm transition-colors ${historicalSnapshot === t ? 'bg-primary text-white' : 'hover:bg-white/10'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-secondary" />
                <span className="text-[10px]">NEURAL LOAD: 64%</span>
              </div>
              <span className="font-mono">{time}</span>
              <div className="flex gap-2">
                <Wifi className="w-4 h-4" />
                <BatteryCharging className="w-4 h-4" />
              </div>
            </div>
          </header>

          {/* Live Alert Ticker */}
          {activeTab === 'dashboard' && (
            <div className="flex-none h-8 glass-panel rounded-sm border-secondary/30 flex items-center px-3 overflow-hidden bg-secondary/5">
              <div className="flex items-center gap-2 text-secondary mr-4 shrink-0">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Live Feed</span>
              </div>
              <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <div className="absolute whitespace-nowrap animate-[ticker_20s_linear_infinite] text-[11px] font-mono text-text-main flex gap-8">
                  {liveAlerts.map((alert, i) => <span key={i}>{alert}</span>)}
                  {liveAlerts.map((alert, i) => <span key={`dup-${i}`}>{alert}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Content */}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'memory' && renderMemory()}
          {activeTab === 'team' && renderTeam()}
          {activeTab !== 'dashboard' && activeTab !== 'chat' && activeTab !== 'tasks' && activeTab !== 'memory' && activeTab !== 'team' && renderPlaceholder()}
          
        </div>
      </div>

      {/* Command Palette Overlay */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={() => setIsCommandPaletteOpen(false)}>
          <div className="w-full max-w-2xl glass-panel rounded-md border border-primary/50 shadow-[0_0_30px_rgba(242,93,13,0.15)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <Command className="w-full bg-transparent" label="Command Palette">
              <div className="flex items-center px-4 py-3 border-b border-border-muted/50">
                <Search className="w-5 h-5 text-primary mr-3" />
                <Command.Input 
                  autoFocus
                  placeholder="Type a command or search..." 
                  className="flex-1 bg-transparent border-none outline-none text-text-main font-mono text-sm placeholder:text-text-muted"
                />
                <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono bg-white/5 px-2 py-1 rounded-sm">
                  <span>ESC</span> to close
                </div>
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden">
                <Command.Empty className="p-4 text-center text-text-muted text-sm font-mono">No commands found.</Command.Empty>
                <Command.Group heading="Quick Actions" className="text-[10px] uppercase tracking-widest text-text-muted p-2">
                  <Command.Item onSelect={() => { executeCommand('agent --status all'); setIsCommandPaletteOpen(false); setActiveTab('chat'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer hover:bg-primary/20 hover:text-primary text-text-main text-sm transition-colors aria-selected:bg-primary/20 aria-selected:text-primary">
                    <Activity className="w-4 h-4" /> Check System Status
                  </Command.Item>
                  <Command.Item onSelect={() => { executeCommand('agent --build-scraper'); setIsCommandPaletteOpen(false); setActiveTab('chat'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer hover:bg-primary/20 hover:text-primary text-text-main text-sm transition-colors aria-selected:bg-primary/20 aria-selected:text-primary">
                    <TerminalSquare className="w-4 h-4" /> Build Scraper Module
                  </Command.Item>
                  <Command.Item onSelect={() => { setIsCommandPaletteOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer hover:bg-critical/20 hover:text-critical text-text-main text-sm transition-colors aria-selected:bg-critical/20 aria-selected:text-critical">
                    <XCircle className="w-4 h-4" /> Kill Task T-885
                  </Command.Item>
                </Command.Group>
                <Command.Group heading="Navigation" className="text-[10px] uppercase tracking-widest text-text-muted p-2 mt-2 border-t border-border-muted/30">
                  {NAV_ITEMS.map(item => (
                    <Command.Item key={item.id} onSelect={() => { setActiveTab(item.id); setIsCommandPaletteOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer hover:bg-white/10 text-text-main text-sm transition-colors aria-selected:bg-white/10">
                      <item.icon className="w-4 h-4" /> Go to {item.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}

      {/* System Health Deep-Dive Modal */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsHealthModalOpen(false)}>
          <div className="w-full max-w-4xl glass-panel rounded-md border border-border-muted shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="h-12 border-b border-border-muted flex items-center justify-between px-4 bg-black/40">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-bold tracking-widest text-text-main">SYSTEM HEALTH DIAGNOSTICS</span>
                <span className="text-[10px] px-2 py-0.5 rounded-sm uppercase font-bold bg-primary/20 text-primary">
                  OPTIMAL
                </span>
              </div>
              <button onClick={() => setIsHealthModalOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex gap-6 h-[500px]">
              <div className="w-1/2 flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Live Telemetry</div>
                  <div className="flex-1 bg-black/20 border border-border-muted/30 rounded-sm p-4 relative overflow-hidden">
                    <SystemHealthRadar />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 border border-border-muted/30 rounded-sm p-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Core Temp</div>
                    <div className="font-mono text-lg text-text-main">42°C</div>
                  </div>
                  <div className="bg-black/20 border border-border-muted/30 rounded-sm p-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Fan Speed</div>
                    <div className="font-mono text-lg text-text-main">2400 RPM</div>
                  </div>
                  <div className="bg-black/20 border border-border-muted/30 rounded-sm p-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Power Draw</div>
                    <div className="font-mono text-lg text-text-main">185W</div>
                  </div>
                </div>
              </div>
              <div className="w-1/2 flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">System Event Log</div>
                  <div className="flex-1 bg-black/50 border border-border-muted/50 rounded-sm p-3 font-mono text-[11px] text-text-muted overflow-y-auto flex flex-col gap-2">
                    <div className="flex gap-3"><span className="text-primary">[14:45:02]</span><span>Memory garbage collection cycle completed. Freed 1.2GB.</span></div>
                    <div className="flex gap-3"><span className="text-secondary">[14:42:15]</span><span>Network interface eth0 link state changed to UP.</span></div>
                    <div className="flex gap-3"><span className="text-primary">[14:40:00]</span><span>Scheduled system snapshot created successfully.</span></div>
                    <div className="flex gap-3"><span className="text-critical">[14:35:12]</span><span>Warning: High API rate detected from 192.168.1.45. Throttling applied.</span></div>
                    <div className="flex gap-3"><span className="text-primary">[14:30:05]</span><span>Agent SCRP_BETA deployed to node-7.</span></div>
                    <div className="flex gap-3"><span className="text-primary">[14:15:22]</span><span>Database sync completed in 4.2s.</span></div>
                    <div className="flex gap-3"><span className="text-secondary">[14:00:00]</span><span>Hourly metrics aggregated and stored.</span></div>
                    <div className="flex gap-3"><span className="text-primary">[13:45:10]</span><span>User 'admin' authenticated successfully.</span></div>
                  </div>
                </div>
                <div className="h-1/3 flex flex-col">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Network I/O (1h)</div>
                  <div className="flex-1 bg-black/20 border border-border-muted/30 rounded-sm p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{t:1,in:20,out:10},{t:2,in:45,out:20},{t:3,in:30,out:15},{t:4,in:80,out:40},{t:5,in:60,out:30}]}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#009FE3" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#009FE3" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f25d0d" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f25d0d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="in" stroke="#009FE3" fillOpacity={1} fill="url(#colorIn)" isAnimationActive={false} />
                        <Area type="monotone" dataKey="out" stroke="#f25d0d" fillOpacity={1} fill="url(#colorOut)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Deep-Dive Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAgent(null)}>
          <div className="w-full max-w-3xl glass-panel rounded-md border border-border-muted shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="h-12 border-b border-border-muted flex items-center justify-between px-4 bg-black/40">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="font-bold tracking-widest text-text-main">{selectedAgent.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-sm uppercase font-bold ${selectedAgent.status === 'Active' ? 'bg-primary/20 text-primary' : selectedAgent.status === 'Error' ? 'bg-critical/20 text-critical' : 'bg-white/10 text-text-muted'}`}>
                  {selectedAgent.status}
                </span>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex gap-6 h-[400px]">
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Target URL</div>
                  <div className="font-mono text-sm text-secondary bg-secondary/10 px-3 py-2 rounded-sm border border-secondary/20 truncate">
                    https://target-sys.internal.net/api/v1/data
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Terminal Output</div>
                  <div className="flex-1 bg-black/50 border border-border-muted/50 rounded-sm p-3 font-mono text-[11px] text-text-muted overflow-y-auto">
                    <div>[14:40:02] Initiating connection to target...</div>
                    <div>[14:40:05] Connection established. Handshake OK.</div>
                    <div className="text-primary">[14:40:12] Bypassing security layer alpha...</div>
                    <div>[14:40:15] Payload injected successfully.</div>
                    <div>[14:41:00] Awaiting response...</div>
                    <div className="animate-pulse">_</div>
                  </div>
                </div>
              </div>
              <div className="w-1/3 flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">CPU Usage (5m)</div>
                  <div className="flex-1 bg-black/20 border border-border-muted/30 rounded-sm p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{t:1,v:20},{t:2,v:45},{t:3,v:30},{t:4,v:80},{t:5,v:selectedAgent.load}]}>
                        <Line type="monotone" dataKey="v" stroke="#f25d0d" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/20 border border-border-muted/30 rounded-sm p-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Memory</div>
                    <div className="font-mono text-lg text-text-main">1.2GB</div>
                  </div>
                  <div className="bg-black/20 border border-border-muted/30 rounded-sm p-3 flex flex-col items-center justify-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Threads</div>
                    <div className="font-mono text-lg text-text-main">24</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Deep-Dive Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="w-full max-w-2xl glass-panel rounded-md border border-border-muted shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="h-12 border-b border-border-muted flex items-center justify-between px-4 bg-black/40">
              <div className="flex items-center gap-3">
                <ListChecks className="w-5 h-5 text-secondary" />
                <span className="font-bold tracking-widest text-text-main">{selectedTask.title}</span>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Status</div>
                  <div className={`text-sm uppercase font-bold ${
                    selectedTask.status === 'Completed' ? 'text-secondary' :
                    selectedTask.status === 'In-Progress' ? 'text-primary' :
                    'text-text-muted'
                  }`}>
                    {selectedTask.status}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Assigned Agent</div>
                  <div className="text-sm font-mono text-text-main">{selectedTask.assignedTo}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Progress</div>
                  <div className="text-xl font-mono text-text-main">{selectedTask.progress}%</div>
                </div>
              </div>
              
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Execution Timeline</div>
                <div className="h-2 bg-border-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${selectedTask.progress}%` }}></div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Task Logs</div>
                <div className="h-48 bg-black/50 border border-border-muted/50 rounded-sm p-3 font-mono text-[11px] text-text-muted overflow-y-auto">
                  <div>[10:00:00] Task initialized.</div>
                  <div>[10:00:05] Resources allocated.</div>
                  {selectedTask.progress > 0 && <div>[10:05:12] Execution started.</div>}
                  {selectedTask.progress > 50 && <div>[10:15:30] Milestone 1 reached.</div>}
                  {selectedTask.progress === 100 && <div className="text-secondary">[10:30:00] Task completed successfully.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
