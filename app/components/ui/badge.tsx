import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary border-primary/40",
        secondary: "bg-secondary text-secondary-foreground border-border",
        outline: "text-foreground border-border",
        success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        warning: "bg-amber-500/15 text-amber-300 border-amber-500/40",
        destructive: "bg-red-500/15 text-red-300 border-red-500/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
