import { ref } from 'vue';
import { defineStore } from 'pinia';

const STORAGE_KEY = 'msgs-qinggangjian-v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useQingGangJianStore = defineStore('qingGangJian', () => {
  const saved = loadState();

  const side = ref(saved?.side ?? 'right');
  const isExpanded = ref(saved?.isExpanded ?? true);
  const currentText = ref('');

  function toggleExpand() {
    isExpanded.value = !isExpanded.value;
    saveState({ isExpanded: isExpanded.value, side: side.value });
  }

  function setSide(newSide) {
    side.value = newSide;
    saveState({ isExpanded: isExpanded.value, side: newSide });
  }

  return {
    side,
    isExpanded,
    currentText,
    toggleExpand,
    setSide,
  };
});
