export const COURSES = [
  {
    id: "unity-csharp-game-development",
    title: "Programming and Game Development with C# and Unity",
    priority: 4,
    summary:
      "A complete beginner-to-advanced Unity and C# game development pathway.",
    certificateTitle:
      "DDI Certificate in Programming and Game Development with C# and Unity",
    levels: [
      {
        id: "unity-csharp-level-1",
        levelNumber: 1,
        title: "Intro to C#, Console App",
        summary: "Programming fundamentals using C# console applications.",
        prerequisiteLevelId: null,
      },
      {
        id: "unity-csharp-level-2",
        levelNumber: 2,
        title: "Intro to Unity, Simple C# Unity Scripting",
        summary:
          "Unity editor basics, GameObjects, components, and simple scripts.",
        prerequisiteLevelId: "unity-csharp-level-1",
      },
      {
        id: "unity-csharp-level-3",
        levelNumber: 3,
        title: "Making a Real Game in Unity with C#",
        summary:
          "Build a complete playable Unity game with applied C# systems.",
        prerequisiteLevelId: "unity-csharp-level-2",
      },
      {
        id: "unity-csharp-level-4",
        levelNumber: 4,
        title: "Advanced Unity and C# Programming",
        summary:
          "Advanced gameplay systems, polish, architecture, and production habits.",
        prerequisiteLevelId: "unity-csharp-level-3",
      },
    ],
  },
  {
    id: "p5js-web-games",
    title: "Building Web Games with P5.js",
    priority: 4,
    summary:
      "A browser-based creative coding and game development track using JavaScript and P5.js.",
    certificateTitle: "DDI Certificate in Web Game Development with P5.js",
    levels: [
      {
        id: "p5js-level-1",
        levelNumber: 1,
        title: "Intro to P5.js",
        summary: "Creative coding fundamentals with drawing, input, and motion.",
        prerequisiteLevelId: null,
      },
      {
        id: "p5js-level-2",
        levelNumber: 2,
        title: "Intermediate JavaScript Programming in P5.js",
        summary:
          "Reusable functions, state, arrays, collision logic, and structured sketches.",
        prerequisiteLevelId: "p5js-level-1",
      },
      {
        id: "p5js-level-3",
        levelNumber: 3,
        title: "Advanced Game Development Concepts in P5.js",
        summary:
          "Build larger web games with scenes, progression, scoring, and polish.",
        prerequisiteLevelId: "p5js-level-2",
      },
    ],
  },
  {
    id: "cpp-game-development",
    title: "Programming and Game Development with C++",
    priority: 2,
    summary:
      "A C++ game programming pathway from console fundamentals to rendering and games.",
    certificateTitle: "DDI Certificate in C++ Game Programming",
    levels: [
      {
        id: "cpp-level-1",
        levelNumber: 1,
        title: "Intro to C++, Console App",
        summary: "C++ syntax, input, control flow, and console applications.",
        prerequisiteLevelId: null,
      },
      {
        id: "cpp-level-2",
        levelNumber: 2,
        title: "Intermediate C++ Concepts, Rendering to the Screen",
        summary:
          "Core C++ structures and first steps into drawing and rendering output.",
        prerequisiteLevelId: "cpp-level-1",
      },
      {
        id: "cpp-level-3",
        levelNumber: 3,
        title: "Your First C++ Game",
        summary: "Build a complete small game with C++ programming concepts.",
        prerequisiteLevelId: "cpp-level-2",
      },
      {
        id: "cpp-level-4",
        levelNumber: 4,
        title: "Advanced C++ Programming for Games",
        summary:
          "Advanced game programming patterns, systems, and performance habits.",
        prerequisiteLevelId: "cpp-level-3",
      },
    ],
  },
  {
    id: "rust-game-development",
    title: "Programming and Game Development with Rust",
    priority: 2,
    summary:
      "A Rust game programming pathway focused on safe systems programming and game logic.",
    certificateTitle: "DDI Certificate in Rust Game Programming",
    levels: [
      {
        id: "rust-level-1",
        levelNumber: 1,
        title: "Intro to Rust, Console App",
        summary: "Rust fundamentals, ownership basics, and console programs.",
        prerequisiteLevelId: null,
      },
      {
        id: "rust-level-2",
        levelNumber: 2,
        title: "Intermediate Rust Concepts, Rendering to the Screen",
        summary:
          "Rust data modeling, modules, and rendering-focused application structure.",
        prerequisiteLevelId: "rust-level-1",
      },
      {
        id: "rust-level-3",
        levelNumber: 3,
        title: "Your First Rust Game",
        summary: "Build a complete small game using Rust concepts.",
        prerequisiteLevelId: "rust-level-2",
      },
      {
        id: "rust-level-4",
        levelNumber: 4,
        title: "Advanced Rust Programming for Games",
        summary:
          "Advanced Rust patterns and applied game development architecture.",
        prerequisiteLevelId: "rust-level-3",
      },
    ],
  },
  {
    id: "electron-desktop-apps",
    title: "Building Desktop Apps with Electron",
    priority: 1,
    summary:
      "A practical pathway for building custom cross-platform desktop applications.",
    certificateTitle:
      "DDI Certificate in Cross-Platform Desktop App Development with Electron",
    levels: [
      {
        id: "electron-level-1",
        levelNumber: 1,
        title: "Intro to Electron",
        summary: "Electron fundamentals and first desktop app structure.",
        prerequisiteLevelId: null,
      },
      {
        id: "electron-level-2",
        levelNumber: 2,
        title: "Building Custom Cross-Platform Apps",
        summary:
          "Create richer app workflows with storage, menus, packaging, and UI polish.",
        prerequisiteLevelId: "electron-level-1",
      },
      {
        id: "electron-level-3",
        levelNumber: 3,
        title: "Advanced Electron Development",
        summary:
          "Production-focused Electron architecture, distribution, and advanced integrations.",
        prerequisiteLevelId: "electron-level-2",
      },
    ],
  },
].sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));

export function findCourse(courseId) {
  return COURSES.find((course) => course.id === courseId) ?? null;
}

export function findCourseLevel(courseId, levelId) {
  const course = findCourse(courseId);
  return course?.levels.find((level) => level.id === levelId) ?? null;
}
