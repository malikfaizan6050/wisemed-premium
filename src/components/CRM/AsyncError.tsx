import { RefreshCw } from "lucide-react";
import FeedbackMessage from "./FeedbackMessage";

export default function AsyncError({ message,onRetry }:{ message:string;onRetry?:()=>void }) {
    if(!message) return null;
    return <div className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><FeedbackMessage message={message}/></div>{onRetry&&<button type="button" onClick={onRetry} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={15}/>Retry</button>}</div>;
}
