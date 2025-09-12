
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    fx?: number;
    fy?: number;
}

interface Link {
    source: Node;
    target: Node;
    relationship: string;
}

const ConceptMap: React.FC<ConceptMapProps> = ({ data }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const containerRef = useRef<SVGSVGElement>(null);
    // FIX: Initialize useRef with null to provide a defined initial value. This is a speculative fix for an obscure error.
    const animationFrameRef = useRef<number | null>(null);

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
                const newNodes = currentNodes.map(node => {
                    if (node.fx !== undefined) { // If node is being dragged, fix its position
                        return { ...node, x: node.fx, y: node.fy, vx: 0, vy: 0 };
                    }
                    return { ...node };
                });

                // Apply forces
                for (let i = 0; i < newNodes.length; i++) {
                    const nodeA = newNodes[i];
                    // Repulsion force from other nodes
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const nodeB = newNodes[j];
                        const dx = nodeB.x - nodeA.x;
                        const dy = nodeB.y - nodeA.y;
                        let distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < 1) distance = 1;
                        const force = -2500 / (distance * distance); // Increased repulsion
                        const forceX = force * dx / distance;
                        const forceY = force * dy / distance;
                        
                        if(!nodeA.fx) {
                            nodeA.vx += forceX;
                            nodeA.vy += forceY;
                        }
                        if(!nodeB.fx) {
                            nodeB.vx -= forceX;
                            nodeB.vy -= forceY;
                        }
                    }
                     // Centering force to pull nodes towards the middle
                    if(!nodeA.fx) {
                        const centerDx = width / 2 - nodeA.x;
                        const centerDy = height / 2 - nodeA.y;
                        nodeA.vx += centerDx * 0.003;
                        nodeA.vy += centerDy * 0.003;
                    }
                }

                // Apply link force
                links.forEach(link => {
                    const source = newNodes.find(n => n.id === link.source.id)!;
                    const target = newNodes.find(n => n.id === link.target.id)!;
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > 0) {
                        const force = (distance - 180) * 0.015; // Link spring force
                        const forceX = force * dx / distance;
                        const forceY = force * dy / distance;
                        if(!source.fx) {
                            source.vx += forceX;
                            source.vy += forceY;
                        }
                        if(!target.fx) {
                            target.vx -= forceX;
                            target.vy -= forceY;
                        }
                    }
                });

                // Update positions
                newNodes.forEach(node => {
                    if (!node.fx) {
                        node.vx *= 0.9; // Damping to prevent infinite movement
                        node.vy *= 0.9;
                        node.x += node.vx;
                        node.y += node.vy;

                        // Boundary checks to keep nodes within the view
                        node.x = Math.max(50, Math.min(width - 50, node.x));
                        node.y = Math.max(30, Math.min(height - 30, node.y));
                    }
                });

                return newNodes;
            });

            animationFrameRef.current = requestAnimationFrame(simulation);
        };
        
        animationFrameRef.current = requestAnimationFrame(simulation);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };

    }, [links, nodes.length]);

    const handleDragStart = (nodeId: string) => {
        setNodes(nodes => nodes.map(n => 
            n.id === nodeId ? { ...n, fx: n.x, fy: n.y } : n
        ));
    };

    const handleDrag = (info: any, nodeId: string) => {
        setNodes(nodes => nodes.map(n => 
            n.id === nodeId ? { ...n, fx: info.point.x, fy: info.point.y } : n
        ));
    };
    
    const handleDragEnd = (nodeId: string) => {
         setNodes(nodes => nodes.map(n => {
            if (n.id === nodeId) {
                const { fx, fy, ...rest } = n;
                return rest;
            }
            return n;
        }));
    };

    const connectedNodeIds = hoveredNode ? new Set(links
        .filter(l => l.source.id === hoveredNode || l.target.id === hoveredNode)
        .flatMap(l => [l.source.id, l.target.id])) : null;

    return (
        <svg ref={containerRef} width="100%" height="100%" className="bg-brand-bg rounded-md select-none">
            <defs>
                <marker id="arrow" viewBox="0 -5 10 10" refX={10} refY={0} markerWidth={6} markerHeight={6} orient="auto">
                    <path d="M0,-5L10,0L0,5" className="fill-brand-subtle" />
                </marker>
                 <marker id="arrow-highlight" viewBox="0 -5 10 10" refX={10} refY={0} markerWidth={6} markerHeight={6} orient="auto">
                    <path d="M0,-5L10,0L0,5" className="fill-brand-cyan" />
                </marker>
            </defs>
            {links.map((link, i) => {
                 const isHighlighted = hoveredNode && (link.source.id === hoveredNode || link.target.id === hoveredNode);
                 return (
                    <motion.g key={`${link.source.id}-${link.target.id}`}>
                        <motion.line
                            x1={link.source.x} y1={link.source.y}
                            x2={link.target.x} y2={link.target.y}
                            className={`transition-all duration-300 ${isHighlighted ? 'stroke-brand-cyan' : 'stroke-brand-subtle'}`}
                            strokeWidth={isHighlighted ? 2 : 1.5}
                            markerEnd={isHighlighted ? "url(#arrow-highlight)" : "url(#arrow)"}
                            initial={false}
                            animate={{ x1: link.source.x, y1: link.source.y, x2: link.target.x, y2: link.target.y }}
                            transition={{ duration: 0.05, ease: "linear" }}
                        />
                        <motion.text
                            x={(link.source.x + link.target.x) / 2}
                            y={(link.source.y + link.target.y) / 2}
                            className={`text-xs transition-all duration-300 ${isHighlighted ? 'fill-brand-cyan' : 'fill-brand-text-muted'}`}
                            textAnchor="middle"
                            dy={-5}
                            initial={false}
                             animate={{ x: (link.source.x + link.target.x) / 2, y: (link.source.y + link.target.y) / 2 }}
                             transition={{ duration: 0.05, ease: "linear" }}
                        >
                            {link.relationship}
                        </motion.text>
                    </motion.g>
                )}
            )}
            {nodes.map(node => {
                const isHovered = hoveredNode === node.id;
                const isConnected = connectedNodeIds?.has(node.id);
                const isDimmed = hoveredNode && !isHovered && !isConnected;

                return (
                    <motion.g 
                        key={node.id} 
                        drag 
                        onDragStart={() => handleDragStart(node.id)}
                        onDrag={(e,i) => handleDrag(i, node.id)}
                        onDragEnd={() => handleDragEnd(node.id)}
                        dragMomentum={false}
                        className="cursor-grab active:cursor-grabbing"
                        onHoverStart={() => setHoveredNode(node.id)}
                        onHoverEnd={() => setHoveredNode(null)}
                        initial={false}
                        animate={{ x: node.x, y: node.y }}
                        transition={{ type: "spring", stiffness: 500, damping: 50, mass: 1 }}
                    >
                        <circle r={10} className={`transition-all duration-300 ${isHovered ? 'fill-brand-magenta' : 'fill-brand-cyan'}`} opacity={isDimmed ? 0.3 : 1} />
                        <text
                            textAnchor="middle"
                            dy={-15}
                            className={`pointer-events-none transition-all duration-300 ${isHovered || isConnected ? 'fill-brand-text' : 'fill-brand-text-muted'}`}
                            opacity={isDimmed ? 0.3 : 1}
                            fontSize={12}
                            fontWeight={isHovered || isConnected ? 'bold' : 'normal'}
                        >
                            {node.label}
                        </text>
                    </motion.g>
                )
            })}
        </svg>
    );
};

export default ConceptMap;
