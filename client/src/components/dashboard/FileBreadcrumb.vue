<template>
  <nav class="flex items-center gap-1 text-sm">
    <div v-for="(item, index) in items" :key="item.id ?? 'root'" class="flex items-center">
      <ChevronRight v-if="index > 0" class="mx-1 h-4 w-4 text-muted-foreground" />
      <button
        @click="$emit('navigate', item.id)"
        :class="[
          'flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent',
          index === items.length - 1
            ? 'font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <Home v-if="index === 0" class="h-4 w-4" />
        <span class="max-w-[120px] truncate md:max-w-[200px]">{{ item.name }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ChevronRight, Home } from 'lucide-vue-next';

defineProps({
  items: {
    type: Array,
    required: true,
  },
});

defineEmits(['navigate']);
</script>

