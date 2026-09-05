import { lazy } from "react";

const P5Sketch = lazy(() => import("../components/showcase/P5Sketch"));

export const SHOWCASE_PROJECTS = [
  {
    id: "fracture-planet",
    title: "Fracture Planet",
    description:
      "A P5.js gravity simulation where orbiting bodies collide, fracture, glow, and reset over time. Embedded in React using p5 instance mode.",
    githubUrl: "",
    ViewComponent: P5Sketch,
  },
];
