"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Lands every in-app navigation at the top of the new page.
 *
 * Clicking a call to action such as "Free RCM Audit" from halfway down a page
 * opened /consultation still scrolled halfway down, so visitors arrived in the
 * middle of the form. The router only scrolls to the top when it decides the
 * new page is out of view, and that check misreads these pages: their first
 * element is the fixed navbar, which sits at the top of the viewport whatever
 * the scroll position is.
 *
 * Back and forward are left alone, so the browser can still restore where the
 * visitor was, and a link carrying a hash keeps landing on its own anchor.
 */
export default function ScrollToTop(){
  const pathname = usePathname();
  const cameFromHistory = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(()=>{
    const onPopState=()=>{ cameFromHistory.current=true; };
    window.addEventListener("popstate",onPopState);
    return ()=>window.removeEventListener("popstate",onPopState);
  },[]);

  useEffect(()=>{
    // A fresh page load is the browser's to position, not ours.
    if(isFirstRender.current){
      isFirstRender.current=false;
      return;
    }

    if(cameFromHistory.current){
      cameFromHistory.current=false;
      return;
    }

    if(window.location.hash) return;

    // "instant" because globals.css sets scroll-behavior:smooth, which would
    // otherwise animate the whole page height while the new page renders.
    window.scrollTo({ top:0,left:0,behavior:"instant" });
  },[pathname]);

  return null;
}
