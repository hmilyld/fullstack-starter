import type { VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "@/components/ui/button"
import { cva } from "class-variance-authority"

export { default as InputGroup } from "./InputGroup.vue"
export { default as InputGroupAddon } from "./InputGroupAddon.vue"
export { default as InputGroupButton } from "./InputGroupButton.vue"
export { default as InputGroupInput } from "./InputGroupInput.vue"
export { default as InputGroupText } from "./InputGroupText.vue"
export { default as InputGroupTextarea } from "./InputGroupTextarea.vue"

export const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*=size-])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-2 has-[>button]:-ml-1 has-[>kbd]:ml-[-0.15rem]",
        "inline-end":
          "order-last pr-2 has-[>button]:-mr-1 has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

export type InputGroupVariants = VariantProps<typeof inputGroupAddonVariants>

export const inputGroupButtonVariants = cva(
  "flex items-center gap-2 rounded-md text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-[calc(var(--control-h)-0.75rem)] gap-1 rounded-xl px-1.5 [&>svg:not([class*=size-])]:size-3.5",
        sm: "",
        "icon-xs": "size-(--icon-btn-xs) rounded-xl p-0 has-[>svg]:p-0",
        "icon-sm": "size-(--icon-btn) p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

export type InputGroupButtonVariants = VariantProps<
  typeof inputGroupButtonVariants
>

export interface InputGroupButtonProps {
  variant?: ButtonVariants["variant"]
  size?: InputGroupButtonVariants["size"]
  class?: HTMLAttributes["class"]
}
