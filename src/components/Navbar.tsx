"use client";

import { AnimatePresence,motion } from "framer-motion";
import { ArrowRight,Menu,X } from "lucide-react";
import Link from "next/link";
import { useEffect,useState } from "react";

// "Platform" was removed: it pointed at /solutions, the same page as
// "Solutions", so the menu offered the same destination twice.
// "Resources" is hidden until that section has real content rather than
// promising material the site does not have.
const links = [
  {
    name:"Solutions",
    href:"/solutions"
  },
  {
    name:"Services",
    href:"/services"
  },
  {
    name:"About",
    href:"/about"
  },
];

export default function Navbar(){
  const [menuOpen,setMenuOpen] = useState(false);

  // Close on Escape, and stop the page scrolling behind the open menu.
  useEffect(()=>{
    if(!menuOpen) return;
    const onKeyDown=(event:KeyboardEvent)=>{ if(event.key === "Escape") setMenuOpen(false); };
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    window.addEventListener("keydown",onKeyDown);
    return ()=>{
      document.body.style.overflow=previousOverflow;
      window.removeEventListener("keydown",onKeyDown);
    };
  },[menuOpen]);

  return (
    <motion.nav
      initial={{ opacity:0,y:-30 }}
      animate={{ opacity:1,y:0 }}
      transition={{ duration:0.7 }}
      className="fixed left-1/2 top-3 z-50 w-full max-w-7xl -translate-x-1/2 px-4 sm:top-6 sm:px-6"
    >
      <div className="flex items-center justify-between gap-3 rounded-full border border-white bg-white/85 px-5 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-8 sm:py-4">

        {/* Logo. Shrunk on small screens so it cannot collide with the button
            beside it, which is what pushed the CTA into three wrapped lines. */}
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight sm:text-2xl">
          <span className="text-blue-600">WiseMed</span>
          <span className="text-slate-900">Billing</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-9 text-sm font-medium text-slate-600 md:flex">
          {/* Link, not a bare anchor: these used plain hrefs, so every desktop
              navigation threw away the loaded application and fetched the whole
              page again. The mobile menu below already routed client-side, so
              the two halves of the same menu behaved differently. */}
          {links.map((item)=>(
            <motion.div
              key={item.name}
              whileHover={{ y:-2,color:"#2563eb" }}
              transition={{ duration:0.2 }}
              className="cursor-pointer"
            >
              <Link href={item.href}>{item.name}</Link>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop CTA. Hidden on mobile, where it appears inside the menu
              instead, so the bar has room for the logo and the toggle. */}
          <Link href="/consultation" className="hidden sm:block">
            <motion.button
              whileHover={{ scale:1.05 }}
              whileTap={{ scale:0.98 }}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Free RCM Audit
              <ArrowRight size={17}/>
            </motion.button>
          </Link>

          {/* Mobile toggle. Without this the links were simply absent on
              phones, leaving no way to navigate the site at all. */}
          <button
            type="button"
            onClick={()=>setMenuOpen((open)=>!open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
          >
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity:0,y:-12 }}
            animate={{ opacity:1,y:0 }}
            exit={{ opacity:0,y:-12 }}
            transition={{ duration:0.2 }}
            className="mt-3 overflow-hidden rounded-3xl border border-white bg-white/95 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col">
              {links.map((item)=>(
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={()=>setMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                >
                  {item.name}
                </Link>
              ))}

              <Link
                href="/consultation"
                onClick={()=>setMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Free RCM Audit
                <ArrowRight size={17}/>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
