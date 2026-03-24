import React, { useRef, useCallback, useEffect, useState } from 'react';
import getHeight from 'dom-lib/getHeight';
import addStyle from 'dom-lib/addStyle';
import removeStyle from 'dom-lib/removeStyle';
import on from 'dom-lib/on';
import { SCROLLBAR_WIDTH } from '../constants';
import toggleClass from '../utils/toggleClass';
import isNumberOrTrue from '../utils/isNumberOrTrue';
import useUpdateEffect from './useUpdateEffect';
import type { ListenerCallback, ElementOffset } from '../types';
import type { ScrollbarInstance } from '../Scrollbar';

interface AffixProps {
  getTableHeight: () => number;
  contentHeight: React.MutableRefObject<number>;
  affixHeader?: boolean | number;
  affixHorizontalScrollbar?: boolean | number;
  affixHorizontalScrollbarContainer?: HTMLElement | React.RefObject<HTMLElement | null>;
  tableOffset: React.RefObject<ElementOffset>;
  headerOffset: React.RefObject<ElementOffset>;
  headerHeight: number;
  tableRef: React.RefObject<HTMLDivElement>;
  scrollbarXRef: React.RefObject<ScrollbarInstance>;
  affixHeaderWrapperRef: React.RefObject<HTMLDivElement>;
}

type ScrollContainer = HTMLElement | Window;

const isElementContainer = (container: ScrollContainer): container is HTMLElement => {
  return container instanceof HTMLElement;
};

const isScrollable = (node: HTMLElement) => {
  const { overflowX, overflowY } = window.getComputedStyle(node);
  const overflow = `${overflowX}${overflowY}`;

  return (
    /(auto|scroll|overlay)/.test(overflow) &&
    (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth)
  );
};

const getScrollParent = (node: HTMLElement | null): ScrollContainer => {
  let current = node?.parentElement;

  while (current && current !== document.body) {
    if (isScrollable(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return window;
};

const getContainerElement = (
  container?: HTMLElement | React.RefObject<HTMLElement | null>
): HTMLElement | null => {
  if (!container) {
    return null;
  }

  if ('current' in container) {
    return container.current;
  }

  return container;
};

const useAffix = (props: AffixProps) => {
  const {
    getTableHeight,
    contentHeight,
    affixHorizontalScrollbar,
    affixHorizontalScrollbarContainer,
    affixHeader,
    tableOffset,
    headerOffset,
    headerHeight,
    tableRef,
    scrollbarXRef,
    affixHeaderWrapperRef
  } = props;

  const windowScrollListener = useRef<ListenerCallback>();
  const containerScrollListener = useRef<ListenerCallback>();
  const resizeListener = useRef<ListenerCallback>();
  const adjustedContainerRef = useRef<HTMLElement | null>(null);
  const [containerAffixState, setContainerAffixState] = useState<{
    container: HTMLElement | null;
    style: React.CSSProperties | null;
  }>({
    container: null,
    style: null
  });

  const getHorizontalScrollContainer = useCallback((): ScrollContainer => {
    const container = getContainerElement(affixHorizontalScrollbarContainer);

    return container || getScrollParent(tableRef.current);
  }, [affixHorizontalScrollbarContainer, tableRef]);

  const handleAffixHorizontalScrollbar = useCallback(() => {
    const scrollY = window.scrollY || window.pageYOffset;
    const windowHeight = getHeight(window);
    const height = getTableHeight();
    const bottom = typeof affixHorizontalScrollbar === 'number' ? affixHorizontalScrollbar : 0;
    const target = getHorizontalScrollContainer();

    if (isElementContainer(target)) {
      const table = tableRef.current;

      if (!table) {
        setContainerAffixState({ container: null, style: null });
        return;
      }

      const containerRect = target.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const offsetTop = tableRect.top - containerRect.top + target.scrollTop;
      const fixedScrollbar =
        target.scrollTop + target.clientHeight < height + (offsetTop + bottom) &&
        target.scrollTop + target.clientHeight - headerHeight > offsetTop + bottom;

      if (!fixedScrollbar) {
        setContainerAffixState({ container: null, style: null });
        return;
      }

      setContainerAffixState({
        container: target,
        style: {
          left: tableRect.left - containerRect.left + target.scrollLeft,
          position: 'absolute',
          top: target.scrollTop + target.clientHeight - SCROLLBAR_WIDTH - bottom,
          zIndex: 3
        }
      });

      return;
    }

    setContainerAffixState({ container: null, style: null });

    const offsetTop = tableOffset.current?.top || 0;

    const fixedScrollbar =
      scrollY + windowHeight < height + (offsetTop + bottom) &&
      scrollY + windowHeight - headerHeight > offsetTop + bottom;

    if (scrollbarXRef?.current?.root) {
      toggleClass(scrollbarXRef.current.root, 'fixed', fixedScrollbar);

      if (fixedScrollbar) {
        addStyle(scrollbarXRef.current.root, 'bottom', `${bottom}px`);
      } else {
        removeStyle(scrollbarXRef.current.root, 'bottom');
      }
    }
  }, [
    affixHorizontalScrollbar,
    getHorizontalScrollContainer,
    getTableHeight,
    headerHeight,
    scrollbarXRef,
    tableOffset,
    tableRef
  ]);

  const handleAffixTableHeader = useCallback(() => {
    const top = typeof affixHeader === 'number' ? affixHeader : 0;
    const scrollY = window.scrollY || window.pageYOffset;
    const offsetTop = headerOffset.current?.top || 0;
    const fixedHeader =
      scrollY - (offsetTop - top) >= 0 && scrollY < offsetTop - top + contentHeight.current;

    if (affixHeaderWrapperRef.current) {
      toggleClass(affixHeaderWrapperRef.current, 'fixed', fixedHeader);
    }
  }, [affixHeader, affixHeaderWrapperRef, contentHeight, headerOffset]);

  const handleAffix = useCallback(() => {
    if (isNumberOrTrue(affixHeader)) {
      handleAffixTableHeader();
    }
    if (isNumberOrTrue(affixHorizontalScrollbar)) {
      handleAffixHorizontalScrollbar();
    }
  }, [
    affixHeader,
    affixHorizontalScrollbar,
    handleAffixTableHeader,
    handleAffixHorizontalScrollbar
  ]);

  /**
   * Update the position of the fixed element after the height of the table changes.
   * fix: https://github.com/rsuite/rsuite/issues/1716
   */
  useUpdateEffect(handleAffix, [getTableHeight]);

  useEffect(() => {
    const target = getHorizontalScrollContainer();

    if (!isNumberOrTrue(affixHorizontalScrollbar)) {
      setContainerAffixState({ container: null, style: null });
    }

    if (
      isNumberOrTrue(affixHorizontalScrollbar) &&
      isElementContainer(target) &&
      window.getComputedStyle(target).position === 'static'
    ) {
      addStyle(target, 'position', 'relative');
      adjustedContainerRef.current = target;
    }

    if (
      isNumberOrTrue(affixHeader) ||
      (isNumberOrTrue(affixHorizontalScrollbar) && !isElementContainer(target))
    ) {
      windowScrollListener.current = on(window, 'scroll', handleAffix);
    }

    if (isNumberOrTrue(affixHorizontalScrollbar) && isElementContainer(target)) {
      containerScrollListener.current = on(target, 'scroll', handleAffixHorizontalScrollbar);
      resizeListener.current = on(window, 'resize', handleAffixHorizontalScrollbar);
      handleAffixHorizontalScrollbar();
    }

    return () => {
      windowScrollListener.current?.off();
      containerScrollListener.current?.off();
      resizeListener.current?.off();

      if (adjustedContainerRef.current) {
        removeStyle(adjustedContainerRef.current, 'position');
        adjustedContainerRef.current = null;
      }
    };
  }, [
    affixHeader,
    affixHorizontalScrollbar,
    getHorizontalScrollContainer,
    handleAffix,
    handleAffixHorizontalScrollbar
  ]);

  return containerAffixState;
};

export default useAffix;
