import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
  {
    variants: {
      variant: {
        default:
          "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white [a&]:hover:brightness-110",
        secondary:
          "border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] [a&]:hover:brightness-110",
        destructive:
          "border-[var(--accent-danger)] bg-[var(--accent-danger)] text-white [a&]:hover:brightness-110",
        outline:
          "border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] [a&]:hover:brightness-110",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
