import { cn } from "@/lib/utils"

export function MessageBubble({
  role,
  text,
  large,
}: {
  role: "user" | "assistant"
  text: string
  large?: boolean
}) {
  const isUser = role === "user"
  return (
    <div className={cn("w-full flex", isUser ? "justify-end" : "justify-start")} aria-live="polite">
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 leading-relaxed",
          large ? "text-lg" : "text-base",
          isUser
            ? "bg-[color:var(--color-brand)] text-[color:var(--color-pastel)]"
            : "bg-[color:var(--panel-bg)] text-[color:var(--fg)] border",
        )}
      >
        <p className="whitespace-pre-wrap text-pretty">{text}</p>
      </div>
    </div>
  )
}
