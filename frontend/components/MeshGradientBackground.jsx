import { useEffect, useRef } from "react";

export default function MeshGradientBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic brand colors list (RGBA format) - Strictly Blue and Teal
    const colors = [
      "rgba(11, 19, 41, 0.95)",    // Deep blue
      "rgba(13, 148, 136, 0.85)",   // Teal green
      "rgba(15, 118, 110, 0.9)",    // Dark teal
      "rgba(11, 19, 41, 0.9)",      // Deep blue variation
      "rgba(13, 148, 136, 0.75)"    // Teal variation
    ];

    // Node objects floating in the mesh - Speed reduced by 80%
    const nodes = [
      { x: width * 0.2, y: height * 0.3, vx: 0.08, vy: 0.06, radius: Math.min(width, height) * 0.35, color: colors[0] },
      { x: width * 0.8, y: height * 0.2, vx: -0.06, vy: 0.08, radius: Math.min(width, height) * 0.4, color: colors[1] },
      { x: width * 0.5, y: height * 0.7, vx: 0.04, vy: -0.07, radius: Math.min(width, height) * 0.3, color: colors[2] },
      { x: width * 0.3, y: height * 0.8, vx: -0.07, vy: 0.05, radius: Math.min(width, height) * 0.35, color: colors[3] },
      { x: width * 0.7, y: height * 0.8, vx: 0.06, vy: -0.06, radius: Math.min(width, height) * 0.45, color: colors[4] }
    ];

    // Tracking mouse with inertia LERP
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let isTouch = false;

    // Detect if mouse cursor is available (hover enabled)
    const hoverMedia = window.matchMedia("(hover: none)");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleMouseMove = (e) => {
      if (isTouch) return;
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleTouchMove = (e) => {
      isTouch = true;
      if (e.touches.length > 0) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = e.touches[0].clientY;
      }
    };

    if (!hoverMedia.matches) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      // Update sizes based on new screen size
      nodes.forEach((n, idx) => {
        n.radius = Math.min(width, height) * (0.3 + (idx * 0.04));
      });
    };
    window.addEventListener("resize", handleResize);

    // Easing factor for mouse lag/inertia (Luxurious 0.012)
    const LERP_FACTOR = 0.012;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply GPU-accelerated canvas filter blur
      ctx.filter = "blur(90px)";

      // Smoothly LERP mouse positions
      mouseX += (targetMouseX - mouseX) * LERP_FACTOR;
      mouseY += (targetMouseY - mouseY) * LERP_FACTOR;

      // Draw color nodes
      nodes.forEach((node, idx) => {
        // Slowly float nodes within bounds
        if (!prefersReducedMotion.matches) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        // Apply mouse pull to color nodes for interactive depth feel - reduced coefficient for gentle reaction
        let dx = 0;
        let dy = 0;
        
        if (!hoverMedia.matches) {
          dx = (mouseX - node.x) * 0.005 * (1.2 - idx * 0.15);
          dy = (mouseY - node.y) * 0.005 * (1.2 - idx * 0.15);
        }

        const drawX = node.x + dx;
        const drawY = node.y + dy;

        // Draw node as a soft radial gradient
        const gradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, node.radius);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(drawX, drawY, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Clear filter state
      ctx.filter = "none";

      if (!prefersReducedMotion.matches) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Trigger initial render
    if (prefersReducedMotion.matches) {
      render(); // Single static render frame
    } else {
      render();
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mesh-gradient-canvas"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}
