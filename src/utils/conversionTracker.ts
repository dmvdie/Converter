// src/utils/conversionTracker.ts
let activeConversions = 0;

export function startConversion() {
  activeConversions++;
}

export function endConversion() {
  if (activeConversions > 0) activeConversions--;
}

export function getActiveConversions() {
  return activeConversions;
}
