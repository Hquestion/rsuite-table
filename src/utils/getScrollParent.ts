const SCROLLABLE_OVERFLOW_PATTERN = /(auto|scroll|overlay)/;

const isScrollable = (element: HTMLElement) => {
  const { overflowY, overflow } = window.getComputedStyle(element);
  const overflowValue = `${overflowY} ${overflow}`;

  return (
    SCROLLABLE_OVERFLOW_PATTERN.test(overflowValue) &&
    element.scrollHeight > element.clientHeight
  );
};

const getScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
  let current = element?.parentElement || null;

  while (current) {
    if (current === document.body || current === document.documentElement) {
      return window;
    }

    if (isScrollable(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return window;
};

export default getScrollParent;
