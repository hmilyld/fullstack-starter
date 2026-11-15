<script lang="ts">
  import { CircleAlert } from "@lucide/svelte"
  import {
    Alert,
    AlertAction,
    AlertDescription,
    AlertTitle,
  } from "#lib/components/ui/alert/index.js"
  import { Button } from "#lib/components/ui/button/index.js"
  import { t } from "#lib/i18n.js"

  let { message, onRetry }: { message: string; onRetry: () => void } = $props()
</script>

<Alert variant="destructive" class="mb-4">
  <CircleAlert />
  <AlertTitle>{$t("common.refreshFailed")}</AlertTitle>
  <AlertDescription>{message}</AlertDescription>
  <AlertAction>
    <Button variant="outline" size="xs" onclick={onRetry}
      >{$t("common.retry")}</Button
    >
  </AlertAction>
</Alert>
