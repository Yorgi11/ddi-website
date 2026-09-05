import { useEffect, useRef } from "react";
import p5 from "p5";
import fracturePlanetSketch from "../sketches/Fracture_Planet_2026_05_23_22_51_32/sketch.js?raw";

const CANVAS_SIZE = 800;

export default function P5Sketch() {
  const containerRef = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      const originalCreateCanvas = p.createCanvas.bind(p);

      p.createCanvas = (...args) => {
        const canvas = originalCreateCanvas(...args);
        canvas.parent(containerRef.current);
        canvas.style("width", "100%");
        canvas.style("height", "auto");
        canvas.style("display", "block");
        return canvas;
      };

      Function(
        "p",
        `
          with (p) {
            ${fracturePlanetSketch}
            p.setup = setup;
            p.draw = draw;
          }
        `,
      )(p);
    };

    const p5Instance = new p5(sketch);

    return () => {
      p5Instance.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        aspectRatio: "1 / 1",
        width: "100%",
        maxWidth: `${CANVAS_SIZE}px`,
        overflow: "hidden",
      }}
    />
  );
}
