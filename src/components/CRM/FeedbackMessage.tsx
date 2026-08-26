interface Props {
    message:string;
    tone?:"error" | "success";
}

export default function FeedbackMessage({ message,tone="error" }:Props) {
    if(!message) return null;

    return (
        <p
            role={tone === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
                tone === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
            }`}
        >
            {message}
        </p>
    );
}
