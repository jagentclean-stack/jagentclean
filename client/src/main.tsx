import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Parallax effect for hero background
window.addEventListener("scroll", () => {
  const parallaxElements = document.querySelectorAll("[style*=\"--parallax-offset\"]");
  parallaxElements.forEach((element) => {
    const scrollPosition = window.scrollY;
    // Adjust the multiplier for desired parallax speed
    const offset = scrollPosition * 0.3;
    (element as HTMLElement).style.setProperty("--parallax-offset", `${offset}px`);
  });
});
