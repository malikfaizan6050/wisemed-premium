"use client";

export default function GlobalError({ retry }:{ error:Error & { digest?:string }; retry:()=>void }) {
    return <html><body><main style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"Arial, sans-serif",background:"#f8fafc" }}><div role="alert" style={{ maxWidth:"28rem",padding:"2rem",textAlign:"center",border:"1px solid #e2e8f0",borderRadius:"1.5rem",background:"white" }}><h2>Something went wrong</h2><p>The application could not complete this request. Please try again.</p><button type="button" onClick={retry} style={{ marginTop:"1rem",padding:"0.75rem 1.25rem",border:0,borderRadius:"0.75rem",color:"white",background:"#2563eb",fontWeight:600 }}>Try again</button></div></main></body></html>;
}
