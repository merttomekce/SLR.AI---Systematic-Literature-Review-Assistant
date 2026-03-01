'use client';

import { useEffect, useRef } from 'react';

// For the SLR Citation Web effect
interface DocumentNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number; // Base size of the document
    baseAlpha: number;
    depth: number; // For parallax effect and blur
    isCentralNode: boolean; // Some nodes are larger 'hub' papers (Stacks)
    category: 'included' | 'excluded' | 'unprocessed'; // Semantic colors
    format: 'portrait' | 'landscape' | 'chart'; // Geometry variety
    hasDogEar: boolean;
    scanPhase: number; // For the laser scanner animation
}

export function InteractiveBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Track mouse position
        let mouseX = -1000;
        let mouseY = -1000;
        let isMouseMoving = false;
        let mouseTimeout: NodeJS.Timeout;

        // Track smooth scrolling for parallax
        let currentScrollY = window.scrollY;
        let smoothScrollY = window.scrollY;
        let lastSmoothScrollY = window.scrollY;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const particleCount = 80; // Fewer particles since docs are larger than dots
        const maxConnectionDistance = 180;
        const interactionRadius = 250;

        // Check if running on client (prevent hydration SSR geometry mismatches)
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

        const particles: DocumentNode[] = Array.from({ length: particleCount }, (_, i) => {
            const isCentral = i % 12 === 0;
            const randCategory = Math.random();
            const randFormat = Math.random();

            return {
                x: Math.random() * windowWidth,
                y: Math.random() * windowHeight,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                scale: Math.random() * 2 + 1.5,
                baseAlpha: Math.random() * 0.4 + 0.1,
                depth: Math.random() * 0.8 + 0.2,
                isCentralNode: isCentral,
                category: randCategory > 0.8 ? 'included' : randCategory > 0.6 ? 'excluded' : 'unprocessed',
                format: randFormat > 0.8 ? 'chart' : randFormat > 0.6 ? 'landscape' : 'portrait',
                hasDogEar: Math.random() > 0.7 && !isCentral,
                scanPhase: Math.random() * Math.PI * 2,
            };
        });

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;

            isMouseMoving = true;
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                isMouseMoving = false;
            }, 100);
        };

        const handleMouseLeave = () => {
            mouseX = -1000;
            mouseY = -1000;
        };

        const handleScroll = () => {
            currentScrollY = window.scrollY;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('scroll', handleScroll, { passive: true });

        let animationFrameId: number;

        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            smoothScrollY += (currentScrollY - smoothScrollY) * 0.1;
            const scrollDelta = smoothScrollY - lastSmoothScrollY;
            lastSmoothScrollY = smoothScrollY;

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                const dxMouse = mouseX - p.x;
                const dyMouse = mouseY - p.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < interactionRadius) {
                    const force = (interactionRadius - distMouse) / interactionRadius;
                    const attractionStrength = isMouseMoving ? 0.04 : 0.01;

                    p.vx += (dxMouse / distMouse) * force * attractionStrength;
                    p.vy += (dyMouse / distMouse) * force * attractionStrength;

                    const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (currentSpeed > 2) {
                        p.vx = (p.vx / currentSpeed) * 2;
                        p.vy = (p.vy / currentSpeed) * 2;
                    }
                }

                p.x += p.vx;
                p.y += p.vy;

                const parallaxStrength = 0.5;
                p.y -= scrollDelta * p.depth * parallaxStrength;

                p.vx *= 0.98;
                p.vy *= 0.98;

                if (Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1) {
                    p.vx += (Math.random() - 0.5) * 0.05;
                    p.vy += (Math.random() - 0.5) * 0.05;
                }

                if (p.x < -50) p.x += width + 100;
                if (p.x > width + 50) p.x -= width + 100;

                if (p.y < -100) {
                    p.y += height + 200;
                    p.x = Math.random() * width;
                }
                if (p.y > height + 100) {
                    p.y -= height + 200;
                    p.x = Math.random() * width;
                }

                // --- DRAW DOCUMENT ---
                let alpha = p.baseAlpha;
                let glowIntensity = 0;

                if (distMouse < interactionRadius) {
                    glowIntensity = (interactionRadius - distMouse) / interactionRadius;
                    alpha = Math.min(1, p.baseAlpha + glowIntensity * 0.8);
                }

                // 1. Depth of Field (Blur)
                // Nodes further away (lower depth) are blurrier, but hovering pulls them into focus
                const focusPull = glowIntensity * 2;
                let blurAmount = Math.max(0, (1 - p.depth) * 4 - focusPull);
                if (ctx.filter !== undefined) {
                    ctx.filter = `blur(${blurAmount}px)`;
                }

                // Get Semantic Colors based on Category
                let r = 55, g = 19, b = 236; // Indigo default
                if (glowIntensity > 0.1) {
                    if (p.category === 'included') { r = 16; g = 185; b = 129; } // Emerald
                    if (p.category === 'excluded') { r = 244; g = 63; b = 94; } // Rose
                }
                const glowGems = `rgba(${r}, ${g}, ${b}, ${glowIntensity})`;
                const fillGems = `rgba(${r + 50 * glowIntensity}, ${g + 50 * glowIntensity}, ${b + 50 * glowIntensity}, ${alpha * 0.8})`;

                // 2. Geometry Variety (Format & Stacks)
                const docWidth = p.scale * (p.isCentralNode ? 8 : p.format === 'landscape' ? 6 : 4);
                const docHeight = p.format === 'landscape' ? docWidth * 0.7 : docWidth * 1.4;
                const docX = p.x - docWidth / 2;
                const docY = p.y - docHeight / 2;

                const drawPaperShape = (offsetX = 0, offsetY = 0) => {
                    ctx.beginPath();
                    if (p.hasDogEar && !p.isCentralNode) {
                        ctx.moveTo(docX + offsetX, docY + offsetY);
                        ctx.lineTo(docX + docWidth - docWidth * 0.3 + offsetX, docY + offsetY);
                        ctx.lineTo(docX + docWidth + offsetX, docY + docWidth * 0.3 + offsetY);
                        ctx.lineTo(docX + docWidth + offsetX, docY + docHeight + offsetY);
                        ctx.lineTo(docX + offsetX, docY + docHeight + offsetY);
                        ctx.closePath();
                    } else if (ctx.roundRect) {
                        ctx.roundRect(docX + offsetX, docY + offsetY, docWidth, docHeight, docWidth * 0.1);
                    } else {
                        ctx.rect(docX + offsetX, docY + offsetY, docWidth, docHeight);
                    }
                };

                // Draw Stack for Central Hubs
                if (p.isCentralNode) {
                    ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.4})`;
                    ctx.strokeStyle = `rgba(100, 116, 139, ${alpha * 0.2})`;
                    drawPaperShape(-docWidth * 0.1, docHeight * 0.1);
                    ctx.fill(); ctx.stroke();
                    drawPaperShape(-docWidth * 0.05, docHeight * 0.05);
                    ctx.fill(); ctx.stroke();
                }

                // Draw Main Paper
                if (glowIntensity > 0.1) {
                    ctx.fillStyle = fillGems;
                    ctx.shadowColor = glowGems;
                    ctx.shadowBlur = 15;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                } else {
                    ctx.fillStyle = `rgba(30, 41, 59, ${alpha * 0.6})`;
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = `rgba(100, 116, 139, ${alpha * 0.5})`;
                }

                drawPaperShape();
                ctx.fill();
                ctx.lineWidth = Math.max(0.5, docWidth * 0.05);
                ctx.stroke();

                // Draw little dog-ear fold if applicable
                if (p.hasDogEar && !p.isCentralNode) {
                    ctx.beginPath();
                    ctx.moveTo(docX + docWidth - docWidth * 0.3, docY);
                    ctx.lineTo(docX + docWidth - docWidth * 0.3, docY + docWidth * 0.3);
                    ctx.lineTo(docX + docWidth, docY + docWidth * 0.3);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
                    ctx.fill();
                    ctx.stroke();
                }

                // 3. Document Content Variety (Text lines vs Charts)
                if (docWidth > 8) {
                    ctx.beginPath();
                    if (p.format === 'chart') {
                        // Draw tiny bar chart
                        ctx.rect(docX + docWidth * 0.2, docY + docHeight * 0.8, docWidth * 0.15, -docHeight * 0.3);
                        ctx.rect(docX + docWidth * 0.45, docY + docHeight * 0.8, docWidth * 0.15, -docHeight * 0.5);
                        ctx.rect(docX + docWidth * 0.7, docY + docHeight * 0.8, docWidth * 0.15, -docHeight * 0.2);
                        ctx.fillStyle = glowIntensity > 0.1 ? `rgba(255, 255, 255, ${alpha})` : `rgba(100, 116, 139, ${alpha})`;
                        ctx.fill();
                    } else {
                        // Draw standard abstract text lines
                        ctx.moveTo(docX + docWidth * 0.2, docY + docHeight * 0.25);
                        ctx.lineTo(docX + docWidth * 0.8, docY + docHeight * 0.25);
                        ctx.moveTo(docX + docWidth * 0.2, docY + docHeight * 0.45);
                        ctx.lineTo(docX + docWidth * 0.8, docY + docHeight * 0.45);
                        ctx.moveTo(docX + docWidth * 0.2, docY + docHeight * 0.65);
                        ctx.lineTo(docX + docWidth * 0.6, docY + docHeight * 0.65);

                        ctx.strokeStyle = glowIntensity > 0.1 ? `rgba(255, 255, 255, ${alpha})` : `rgba(100, 116, 139, ${alpha})`;
                        ctx.lineWidth = Math.max(0.5, docWidth * 0.08);
                        ctx.stroke();
                    }
                }

                // 4. The OCR Laser Scanner Beam Animation
                if (glowIntensity > 0.2) {
                    p.scanPhase += 0.05;
                    const scanY = docY + (Math.sin(p.scanPhase) * 0.5 + 0.5) * docHeight;

                    ctx.beginPath();
                    ctx.moveTo(docX - docWidth * 0.1, scanY);
                    ctx.lineTo(docX + docWidth * 1.1, scanY);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity})`;
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgba(255, 255, 255, 1)`;
                    ctx.stroke();
                }

                ctx.shadowBlur = 0; // Reset shadow
                if (ctx.filter !== undefined) ctx.filter = 'none';

                // Check connections (Citations)
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxConnectionDistance) {
                        const midX = (p.x + p2.x) / 2;
                        const midY = (p.y + p2.y) / 2;
                        const distToMouseStrand = Math.sqrt(Math.pow(mouseX - midX, 2) + Math.pow(mouseY - midY, 2));

                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);

                        const lineAlpha = 1 - (dist / maxConnectionDistance);

                        if (distToMouseStrand < interactionRadius) {
                            const strandGlow = (interactionRadius - distToMouseStrand) / interactionRadius;
                            const activeAlpha = Math.min(0.8, lineAlpha * (1 + strandGlow * 2));

                            // Match origin paper's categorical color
                            ctx.strokeStyle = p.category === 'included' ? `rgba(16, 185, 129, ${activeAlpha * 0.6})` :
                                p.category === 'excluded' ? `rgba(244, 63, 94, ${activeAlpha * 0.6})` :
                                    `rgba(91, 33, 182, ${activeAlpha * 0.6})`;

                            ctx.lineWidth = Math.max(1, 2 * strandGlow);
                            ctx.setLineDash([4, 4]);

                            // 5. Data Flowing Animation along the citation line
                            // We use the global scanPhase to animate a dash offset backwards to look like data traveling
                            ctx.lineDashOffset = -Date.now() / 20;

                        } else {
                            ctx.strokeStyle = `rgba(100, 116, 139, ${lineAlpha * 0.15})`;
                            ctx.lineWidth = 1;
                            ctx.setLineDash([2, 5]);
                            ctx.lineDashOffset = 0;
                        }

                        ctx.stroke();
                        ctx.setLineDash([]); // Reset
                        ctx.lineDashOffset = 0;
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(mouseTimeout);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
}
