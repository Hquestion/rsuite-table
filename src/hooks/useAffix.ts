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
  affixHeaderContainer?: HTMLElement | React.RefObject<HTMLElement | null>;
  affixHorizontalScrollbar?: boolean | number;
  affixHorizontalScrollbarContainer?: HTMLElement | React.RefObject<HTMLElement | null>;
  tableOffset: React.RefObject<ElementOffset>;
  headerOffset: React.RefObject<ElementOffset>;
  headerHeight: number;
  headerWrapperRef: React.RefObject<HTMLDivElement>;
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
    affixHeaderContainer,
    tableOffset,
    headerOffset,
    headerHeight,
    headerWrapperRef,
    tableRef,
    scrollbarXRef,
    affixHeaderWrapperRef
  } = props;

  const windowScrollListener = useRef<ListenerCallback>();
  const headerContainerScrollListener = useRef<ListenerCallback>();
  const scrollbarContainerScrollListener = useRef<ListenerCallback>();
  const headerResizeListener = useRef<ListenerCallback>();
  const scrollbarResizeListener = useRef<ListenerCallback>();
  const adjustedContainersRef = useRef<HTMLElement[]>([]);
  const [containerAffixState, setContainerAffixState] = useState<{
    container: HTMLElement | null;
    style: React.CSSProperties | null;
  }>({
    container: null,
    style: null
  });
  const [headerAffixState, setHeaderAffixState] = useState<{
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

  const getHeaderScrollContainer = useCallback((): ScrollContainer => {
    const container = getContainerElement(affixHeaderContainer);

    return container || getScrollParent(tableRef.current);
  }, [affixHeaderContainer, tableRef]);

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
    const target = getHeaderScrollContainer();

    if (isElementContainer(target)) {
      const headerNode = headerWrapperRef.current;

      if (!headerNode) {
        setHeaderAffixState({ container: null, style: null });
        return;
      }

      const containerRect = target.getBoundingClientRect();
      const headerRect = headerNode.getBoundingClientRect();
      const tableRect = tableRef.current?.getBoundingClientRect();
      const offsetTop = headerRect.top - containerRect.top + target.scrollTop;
      const fixedHeader =
        target.scrollTop - (offsetTop - top) >= 0 &&
        target.scrollTop < offsetTop - top + contentHeight.current;

      if (!fixedHeader || !tableRect) {
        setHeaderAffixState({ container: null, style: null });
        return;
      }

      setHeaderAffixState({
        container: target,
        style: {
          left: tableRect.left - containerRect.left + target.scrollLeft,
          position: 'absolute',
          top: target.scrollTop + top,
          width: tableRect.width,
          zIndex: 3
        }
      });
      return;
    }

    setHeaderAffixState({ container: null, style: null });

    const scrollY = window.scrollY || window.pageYOffset;
    const offsetTop = headerOffset.current?.top || 0;
    const fixedHeader =
      scrollY - (offsetTop - top) >= 0 && scrollY < offsetTop - top + contentHeight.current;

    if (affixHeaderWrapperRef.current) {
      toggleClass(affixHeaderWrapperRef.current, 'fixed', fixedHeader);
    }
  }, [
    affixHeader,
    affixHeaderWrapperRef,
    contentHeight,
    getHeaderScrollContainer,
    headerOffset,
    headerWrapperRef,
    tableRef
  ]);

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
    const headerTarget = getHeaderScrollContainer();
    const scrollbarTarget = getHorizontalScrollContainer();

    if (!isNumberOrTrue(affixHorizontalScrollbar)) {
      setContainerAffixState({ container: null, style: null });
    }

    if (!isNumberOrTrue(affixHeader)) {
      setHeaderAffixState({ container: null, style: null });
    }

    if (
      isNumberOrTrue(affixHorizontalScrollbar) &&
      isElementContainer(scrollbarTarget) &&
      window.getComputedStyle(scrollbarTarget).position === 'static'
    ) {
      addStyle(scrollbarTarget, 'position', 'relative');
      adjustedContainersRef.current.push(scrollbarTarget);
    }

    if (
      isNumberOrTrue(affixHeader) &&
      isElementContainer(headerTarget) &&
      window.getComputedStyle(headerTarget).position === 'static' &&
      !adjustedContainersRef.current.includes(headerTarget)
    ) {
      addStyle(headerTarget, 'position', 'relative');
      adjustedContainersRef.current.push(headerTarget);
    }

    if (
      (isNumberOrTrue(affixHeader) && !isElementContainer(headerTarget)) ||
      (isNumberOrTrue(affixHorizontalScrollbar) && !isElementContainer(scrollbarTarget))
    ) {
      windowScrollListener.current = on(window, 'scroll', handleAffix);
    }

    if (isNumberOrTrue(affixHorizontalScrollbar) && isElementContainer(scrollbarTarget)) {
      scrollbarContainerScrollListener.current = on(
        scrollbarTarget,
        'scroll',
        handleAffixHorizontalScrollbar
      );
      scrollbarResizeListener.current = on(window, 'resize', handleAffixHorizontalScrollbar);
      handleAffixHorizontalScrollbar();
    }

    if (isNumberOrTrue(affixHeader) && isElementContainer(headerTarget)) {
      headerContainerScrollListener.current = on(headerTarget, 'scroll', handleAffixTableHeader);
      headerResizeListener.current = on(window, 'resize', handleAffixTableHeader);
      handleAffixTableHeader();
    }

    return () => {
      windowScrollListener.current?.off();
      headerContainerScrollListener.current?.off();
      scrollbarContainerScrollListener.current?.off();
      headerResizeListener.current?.off();
      scrollbarResizeListener.current?.off();

      adjustedContainersRef.current.forEach(container => removeStyle(container, 'position'));
      adjustedContainersRef.current = [];
    };
  }, [
    affixHeader,
    affixHeaderContainer,
    affixHorizontalScrollbar,
    getHorizontalScrollContainer,
    getHeaderScrollContainer,
    handleAffix,
    handleAffixTableHeader,
    handleAffixHorizontalScrollbar
  ]);

  return {
    headerContainer: headerAffixState.container,
    headerStyle: headerAffixState.style,
    isHeaderContainerMode: isElementContainer(getHeaderScrollContainer()),
    scrollbarContainer: containerAffixState.container,
    scrollbarStyle: containerAffixState.style
  };
};

export default useAffix;
