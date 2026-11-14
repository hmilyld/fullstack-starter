<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  iconOptions,
  menuIcons,
  type MenuIconGroup,
  type MenuIconName,
} from "@/lib/icons"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const model = defineModel<string>({ default: "circle" })
const { t } = useI18n()

const groups: MenuIconGroup[] = ["常用", "数据", "系统", "内容"]

const grouped = computed(() =>
  groups.map((group) => ({
    group,
    items: iconOptions.filter((item) => item.group === group),
  }))
)
</script>

<template>
  <Select v-model="model">
    <SelectTrigger class="w-full" :aria-label="t('iconPicker.aria')">
      <SelectValue :placeholder="t('iconPicker.aria')" />
    </SelectTrigger>
    <SelectContent class="max-h-72">
      <SelectGroup v-for="entry in grouped" :key="entry.group">
        <SelectLabel>{{
          t(`iconPicker.groups.${entry.group}`, entry.group)
        }}</SelectLabel>
        <SelectItem
          v-for="item in entry.items"
          :key="item.value"
          :value="item.value"
        >
          <span class="flex items-center gap-2">
            <component
              :is="menuIcons[item.value as MenuIconName]"
              class="size-4"
            />
            {{ t(`icons.${item.value}`, item.label) }}
          </span>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
