<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";

interface Props {
  trigger?: "click" | "hover";
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  trigger: "click",
  placement: "bottom-start",
  disabled: false,
});

const emit = defineEmits<{
  (e: "open"): void;
  (e: "close"): void;
  (e: "select", value: string): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const classes = computed(() => ({
  dropdown: true,
  "dropdown-disabled": props.disabled,
}));

const openMenu = () => {
  if (!props.disabled) {
    isOpen.value = true;
    emit("open");
  }
};

const closeMenu = () => {
  isOpen.value = false;
  emit("close");
};

const toggleMenu = () => {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
};


const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeMenu();
  }
};

onMounted(() => {
  if (props.trigger === "click") {
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div :class="classes" ref="dropdownRef">
    <div
      class="dropdown-trigger"
      :class="{ 'dropdown-trigger-active': isOpen }"
      @click.stop="trigger === 'click' ? toggleMenu() : openMenu()"
      @mouseenter="trigger === 'hover' ? openMenu() : null"
    >
      <slot name="trigger"></slot>
    </div>
    <transition name="dropdown">
      <div v-show="isOpen" class="dropdown-menu" :data-placement="placement">
        <slot name="menu" :close="closeMenu"></slot>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(.dropdown-disabled) {
    opacity: 0.8;
  }

  &.dropdown-trigger-active {
    opacity: 0.7;
  }
}

.dropdown-menu {
  position: absolute;
  background: var(--modal-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--modal-shadow);
  min-width: 160px;
  z-index: 1000;
  animation: fadeInUp 0.3s ease-out;

  &[data-placement="bottom-start"] {
    top: 100%;
    left: 0;
  }

  &[data-placement="bottom-end"] {
    top: 100%;
    right: 0;
  }

  &[data-placement="top-start"] {
    bottom: 100%;
    left: 0;
  }

  &[data-placement="top-end"] {
    bottom: 100%;
    right: 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
