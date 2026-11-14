<script lang="ts">
  import {
    iconOptions,
    menuIcons,
    type MenuIconGroup,
    type MenuIconName,
  } from "#lib/icons.js"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "#lib/components/ui/select/index.js"
  import { t } from "#lib/i18n.js"

  let { value = $bindable("circle") }: { value?: string } = $props()

  const groups: MenuIconGroup[] = ["常用", "数据", "系统", "内容"]
  const grouped = $derived(
    groups.map((group) => ({
      group,
      label: $t(`iconPicker.groups.${group}`),
      items: iconOptions
        .filter((item) => item.group === group)
        .map((item) => ({
          ...item,
          translatedLabel: $t(`icons.${item.value}`, {
            defaultValue: item.label,
          }),
        })),
    }))
  )
  const items = $derived(
    iconOptions.map((item) => ({
      value: item.value,
      label: $t(`icons.${item.value}`, { defaultValue: item.label }),
    }))
  )
</script>

<Select
  type="single"
  {items}
  {value}
  onValueChange={(next) => {
    if (next) value = next
  }}
>
  <SelectTrigger class="w-full" aria-label={$t("iconPicker.aria")}>
    <SelectValue placeholder={$t("iconPicker.aria")} />
  </SelectTrigger>
  <SelectContent class="max-h-72">
    {#each grouped as entry (entry.group)}
      <SelectGroup>
        <SelectLabel>{entry.label}</SelectLabel>
        {#each entry.items as item (item.value)}
          {@const Icon = menuIcons[item.value as MenuIconName]}
          <SelectItem value={item.value}>
            <span class="flex items-center gap-2">
              <Icon class="size-4" />
              {item.translatedLabel}
            </span>
          </SelectItem>
        {/each}
      </SelectGroup>
    {/each}
  </SelectContent>
</Select>
