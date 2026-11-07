<script setup lang="ts">
import { iconOptions, menuIcons, type MenuIconName } from "@/lib/icons"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const model = defineModel<string>({ default: "circle" })
</script>

<template>
  <Select v-model="model">
    <SelectTrigger class="w-full" aria-label="选择图标">
      <SelectValue placeholder="选择图标" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectItem
          v-for="item in iconOptions"
          :key="item.value"
          :value="item.value"
        >
          <span class="flex items-center gap-2">
            <component
              :is="menuIcons[item.value as MenuIconName]"
              class="size-4"
            />
            {{ item.label }}
          </span>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
