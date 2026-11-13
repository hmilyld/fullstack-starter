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

  let { value = $bindable("circle") }: { value?: string } = $props()

  const groups: MenuIconGroup[] = ["常用", "数据", "系统", "内容"]
  const grouped = $derived(
    groups.map((group) => ({
      group,
      items: iconOptions.filter((item) => item.group === group),
    }))
  )
  const items = $derived(
    iconOptions.map((item) => ({ value: item.value, label: item.label }))
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
  <SelectTrigger class="w-full" aria-label="选择图标">
    <SelectValue placeholder="选择图标" />
  </SelectTrigger>
  <SelectContent class="max-h-72">
    {#each grouped as entry (entry.group)}
      <SelectGroup>
        <SelectLabel>{entry.group}</SelectLabel>
        {#each entry.items as item (item.value)}
          {@const Icon = menuIcons[item.value as MenuIconName]}
          <SelectItem value={item.value}>
            <span class="flex items-center gap-2">
              <Icon class="size-4" />
              {item.label}
            </span>
          </SelectItem>
        {/each}
      </SelectGroup>
    {/each}
  </SelectContent>
</Select>
