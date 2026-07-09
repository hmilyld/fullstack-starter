import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean
}

export function LoadingButton({ loading, disabled, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  )
}
