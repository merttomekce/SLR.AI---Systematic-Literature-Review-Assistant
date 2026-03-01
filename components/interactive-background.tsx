'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseAlpha: number;
    depth: number; // For parallax effect
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

        // Canvas sizing based on device pixel ratio for sharpness
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Particle Configuration
        const particleCount = 120; // Number of nodes
        const maxConnectionDistance = 150; // How close they must be to draw a line
        const interactionRadius = 250; // How close mouse must be to pull/glow

        // Initialize Particles
        const particles: Particle[] = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.getBoundingClientRect().width,
            y: Math.random() * canvas.getBoundingClientRect().height,
            vx: (Math.random() - 0.5) * 0.5, // Slow ambient drifting
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 1.5 + 0.5,
            baseAlpha: Math.random() * 0.5 + 0.1,
            depth: Math.random() * 0.8 + 0.2, // 0.2 (far) to 1.0 (close) for parallax speed
        }));

        // Mouse Tracking
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

        // Scroll Tracking
        const handleScroll = () => {
            currentScrollY = window.scrollY;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Animation Loop
        let animationFrameId: number;

        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Calculate scroll delta for parallax this frame
            smoothScrollY += (currentScrollY - smoothScrollY) * 0.1; // Interpolate for smoothness
            const scrollDelta = smoothScrollY - lastSmoothScrollY;
            lastSmoothScrollY = smoothScrollY;

            // Clear frame
            ctx.clearRect(0, 0, width, height);

            // Update and Draw Particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Apply mouse interaction (attraction + speed boost when moving)
                const dxMouse = mouseX - p.x;
                const dyMouse = mouseY - p.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < interactionRadius) {
                    // Attract towards mouse
                    const force = (interactionRadius - distMouse) / interactionRadius;
                    const attractionStrength = isMouseMoving ? 0.05 : 0.01;

                    p.vx += (dxMouse / distMouse) * force * attractionStrength;
                    p.vy += (dyMouse / distMouse) * force * attractionStrength;

                    // Max speed cap to avoid them flying away completely
                    const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (currentSpeed > 3) {
                        p.vx = (p.vx / currentSpeed) * 3;
                        p.vy = (p.vy / currentSpeed) * 3;
                    }
                }

                // Apply Ambient Drift & Friction
                p.x += p.vx;
                p.y += p.vy;

                // --- Apply Parallax Scrolling ---
                // Move Y based on scroll delta and particle depth (parallax strength)
                const parallaxStrength = 0.5; // Adjust this to make the scroll effect more or less severe
                p.y -= scrollDelta * p.depth * parallaxStrength;

                // Gentle friction to slow them back down to ambient speed
                p.vx *= 0.98;
                p.vy *= 0.98;

                // Ensure minimum ambient speed is maintained
                if (Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1) {
                    p.vx += (Math.random() - 0.5) * 0.05;
                    p.vy += (Math.random() - 0.5) * 0.05;
                }

                // Boundary Reflection & Wrapping
                if (p.x < 0) p.x += width;
                if (p.x > width) p.x -= width;

                // Y boundaries wrap smoothly to keep the screen populated when scrolling
                if (p.y < -100) {
                    p.y += height + 200;
                    p.x = Math.random() * width; // Randomize X to avoid obvious repeating patterns
                }
                if (p.y > height + 100) {
                    p.y -= height + 200;
                    p.x = Math.random() * width;
                }

                // Draw Particle (Node)
                // If near mouse, glow primary color (indigo-ish)
                let alpha = p.baseAlpha;
                let colorStr = `rgba(100, 116, 139, ${alpha})`; // Default Slate

                if (distMouse < interactionRadius) {
                    const glowIntensity = (interactionRadius - distMouse) / interactionRadius;
                    alpha = Math.min(1, p.baseAlpha + glowIntensity * 0.8);
                    // Mix between slate and primary primary (#3713ec / rgb(55,19,236))
                    colorStr = `rgba(${55 * glowIntensity + 100 * (1 - glowIntensity)}, ${19 * glowIntensity + 116 * (1 - glowIntensity)}, ${236 * glowIntensity + 139 * (1 - glowIntensity)}, ${alpha})`;
                }

                ctx.beginPath();
                // Base size scaled slightly by depth to enhance the parallax illusion
                const displayRadius = p.radius + (p.depth * 0.5);
                ctx.arc(p.x, p.y, displayRadius, 0, Math.PI * 2);
                ctx.fillStyle = colorStr;
                ctx.fill();

                // Check connections with other particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxConnectionDistance) {
                        // Check if this connection is near the mouse to glow the line
                        const midX = (p.x + p2.x) / 2;
                        const midY = (p.y + p2.y) / 2;
                        const distToMouseStrand = Math.sqrt(Math.pow(mouseX - midX, 2) + Math.pow(mouseY - midY, 2));

                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);

                        // Standard fade based on distance between points
                        const lineAlpha = 1 - (dist / maxConnectionDistance);

                        if (distToMouseStrand < interactionRadius) {
                            const strandGlow = (interactionRadius - distToMouseStrand) / interactionRadius;
                            const activeAlpha = Math.min(0.8, lineAlpha * (1 + strandGlow * 2));
                            ctx.strokeStyle = `rgba(91, 33, 182, ${activeAlpha * 0.6})`; // Purple-ish active line
                            ctx.lineWidth = 1 + strandGlow;
                        } else {
                            ctx.strokeStyle = `rgba(100, 116, 139, ${lineAlpha * 0.15})`; // Slate very faint line
                            ctx.lineWidth = 1;
                        }

                        ctx.stroke();
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
            style={{ background: 'transparent' }} // Let the actual body background show through
        />
    );
}
