const specialMap = new Map([
  ["Backspace", 8],
  ["Tab", 9],
  ["Enter", 13],
  ["Shift", 16],
  ["Control", 17],
  ["Alt", 18],
  ["AltGraph", 18],
  ["Escape", 27],
  [" ", 32],
  ["PageUp", 33],
  ["PageDown", 34],
  ["End", 35],
  ["Home", 36],
  ["ArrowLeft", 37],
  ["Left", 37],
  ["ArrowUp", 38],
  ["Up", 38],
  ["ArrowRight", 39],
  ["Right", 39],
  ["ArrowDown", 40],
  ["Down", 40],
  ["Insert", 45],
  ["Delete", 46],
  ["Meta", 91],
]);

/**
 * Mapping to Windows virtual key code
 *  https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 * Note that all letters are mapped to upper-case
 * @param key javascript key code
 * @returns Windows key code
 */
function keyToVMCode(key: string) {
  if (specialMap.has(key)) {
    return specialMap.get(key);
  }
  if (key.length === 1) {
    return key.toUpperCase().charCodeAt(0);
  }
  return undefined;
}

export { keyToVMCode };
