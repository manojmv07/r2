import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type { ConceptMapData } from '../types';

interface ConceptMapProps {
    data: ConceptMapData;
}

interface Node {
    id: string;
    label: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Link {
    source: Node;
    target: Node;
    relationship: string;
}

const ConceptMap: React.FC<ConceptMapProps> = ({ data }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const containerRef = useRef<SVGSVGElement>(null);
    const dragControls = useDragControls();

    useEffect(() => {
        if (!data || !containerRef.current) return;
        
        const { width, height } = containerRef.current.getBoundingClientRect();
        
        const initialNodes: Node[] = data.nodes.map(n => ({
            ...n,
            x: width / 2 + (Math.random() - 0.5) * 100,
            y: height / 2 + (Math.random() - 0.5) * 100,
            vx: 0,
            vy: 0,
        }));

        const nodeMap = new Map(initialNodes.map(n => [n.id, n]));

        const initialLinks: Link[] = data.links
            .map(l => ({
                source: nodeMap.get(l.source),
                target: nodeMap.get(l.target),
                relationship: l.relationship,
            }))
            .filter(l => l.source && l.target) as Link[];
        
        setNodes(initialNodes);
        setLinks(initialLinks);

    }, [data]);

    useEffect(() => {
        if (!containerRef.current || nodes.length === 0) return;

        const { width, height } = containerRef.current.getBoundingClientRect();
        const simulation = () => {
             setNodes(currentNodes => {
                const newNodes = currentNodes.map(node => ({ ...node }));

                // Apply forces
                for (let i = 0; i < newNodes.length; i++) {
                    const nodeA = newNodes[i];
                    // Repulsion force
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const nodeB = newNodes[j];
                        const dx = nodeB.x - nodeA.x;
                        const dy = nodeB.y - nodeA.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = -2000 / (distance * distance);
                        nodeA.vx += force * dx / distance;
                        nodeA.vy += force * dy / distance;
                        nodeB.vx -= force * dx / distance;
                        nodeB.vy -= force * dy / distance;
                    }
                     // Centering force
                    const centerDx = width / 2 - nodeA.x;
                    const centerDy = height / 2 - nodeA.y;
                    nodeA.vx += centerDx * 0.005;
                    nodeA.vy += centerDy * 0.005;
                }

                // Link force
                links.forEach(link => {
                    const source = newNodes.find(n => n.id === link.source.id)!;
                    const target = newNodes.find(n => n.id === link.target.id)!;
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const force = (distance - 150) * 0.01;
                    source.vx += force * dx / distance;
                    source.vy += force * dy / distance;
                    target.vx -= force * dx / distance;
                    target.vy -= force * dy / distance;
                });

                // Update positions
                newNodes.forEach(node => {
                    node.vx *= 0.95; // Damping
                    node.vy *= 0.95;
                    node.x += node.vx;
                    node.y += node.vy;

                    // Boundary checks
                    node.x = Math.max(30, Math.min(width - 30, node.x));
                    node.y = Math.max(20, Math.min(height - 20, node.y));
                });

                return newNodes;
            });
        };
        
        const intervalId = setInterval(simulation, 40);
        return () => clearInterval(intervalId);

    }, [links, nodes.length]);

    const handleDrag = (event:any, info:any, nodeId:string) => {
        setNodes(nodes => nodes.map(n => 
            n.id === nodeId ? { ...n, x: info.point.x, y: info.point.y, vx:0, vy:0 } : n
        ));
    };

    return (
        <svg ref={containerRef} width="100%" height="100%" className="bg-brand-bg rounded-md">
            <defs>
                {/* FIX: Corrected SVG attribute types from string to number */}
                <marker id="arrow" viewBox="0 -5 10 10" refX={10} refY={0} markerWidth={6} markerHeight={6} orient="auto">
                    <path d="M0,-5L10,0L0,5" fill="#505060" />
                </marker>
            </defs>
            {links.map((link, i) => (
                <motion.g key={`${link.source.id}-${link.target.id}`}>
                    {/* FIX: Replaced `animate` prop with direct attributes for animation. Corrected `strokeWidth` to be a number. */}
                    <motion.line
                        x1={link.source.x} y1={link.source.y}
                        x2={link.target.x} y2={link.target.y}
                        stroke="#505060"
                        strokeWidth={1.5}
                        markerEnd="url(#arrow)"
                        transition={{ duration: 0.03, ease: "linear" }}
                    />
                    {/* FIX: Replaced `animate` prop with direct attributes for animation. Corrected numeric attributes. */}
                     <motion.text
                        x={(link.source.x + link.target.x) / 2}
                        y={(link.source.y + link.target.y) / 2}
                        fill="#A0A0B0"
                        fontSize={9}
                        textAnchor="middle"
                        dy={-4}
                        transition={{ duration: 0.03, ease: "linear" }}
                    >
                        {link.relationship}
                    </motion.text>
                </motion.g>
            ))}
            {nodes.map(node => (
                // FIX: Replaced `animate` prop with direct x/y props for positioning and animation to resolve type conflicts with `drag`.
                <motion.g 
                    key={node.id} 
                    drag 
                    dragControls={dragControls}
                    onDrag={(e,i) => handleDrag(e,i,node.id)}
                    dragMomentum={false}
                    className="cursor-grab active:cursor-grabbing"
                    x={node.x}
                    y={node.y}
                    transition={{ duration: 0.03, ease: "linear" }}
                >
                    {/* FIX: Corrected SVG attribute `r` to be a number */}
                    <circle r={8} fill="#00F5D4" />
                    {/* FIX: Corrected numeric SVG attributes `dy` and `fontSize` */}
                    <text
                        textAnchor="middle"
                        dy={-12}
                        fill="#E0E0E0"
                        fontSize={12}
                        className="pointer-events-none select-none"
                    >
                        {node.label}
                    </text>
                </motion.g>
            ))}
        </svg>
    );
};

export default ConceptMap;
