"use client";
import { useEffect } from "react";

export default function DashboardBgEffect() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    console.log("DashboardBgEffect mounted");
    const isDark = document.documentElement.classList.contains("dark");
    
    if (isDark) {
      // Find the main element
      const mainElement = document.querySelector('main');
      
      // Save previous values
      const prevBodyBg = document.body.style.backgroundColor;
      const prevHtmlBg = document.documentElement.style.backgroundColor;
      const prevMainBg = mainElement?.style.backgroundColor || '';
      
      // Set the background color on html, body, and main with !important
      document.body.style.setProperty('background-color', '#212121', 'important');
      document.documentElement.style.setProperty('background-color', '#212121', 'important');
      if (mainElement) {
        mainElement.style.setProperty('background-color', '#212121', 'important');
      }
      
      return () => {
        // Restore previous values on unmount
        if (prevBodyBg) {
          document.body.style.setProperty('background-color', prevBodyBg, 'important');
        } else {
          document.body.style.removeProperty('background-color');
        }
        if (prevHtmlBg) {
          document.documentElement.style.setProperty('background-color', prevHtmlBg, 'important');
        } else {
          document.documentElement.style.removeProperty('background-color');
        }
        if (mainElement) {
          if (prevMainBg) {
            mainElement.style.setProperty('background-color', prevMainBg, 'important');
          } else {
            mainElement.style.removeProperty('background-color');
          }
        }
      };
    }
  }, []);
  return null;
}
