import React, { useRef, useCallback, useEffect, useState } from 'react';
import getHeight from 'dom-lib/getHeight';
import addStyle from 'dom-lib/addStyle';
import removeStyle from 'dom-lib/removeStyle';
import on from 'dom-lib/on';
import toggleClass from '../utils/toggleClass';
import isNumberOrTrue from '../utils/isNumberOrTrue';
import getScrollParent from '../utils/getScrollParent';
import type { ListenerCallback, ElementOffset } from '../types';
import type { ScrollbarInstance } from '../Scrollbar';

interface AffixProps {
  getTableHeight: () => number;
  contentHeight: React.MutableRefObject<number>;
  contentWidth: React.MutableRefObject<number>;
  affixHeader?: boolean | number;
  affixHorizontalScrollbar?: boolean | number;
  tableRef: React.RefObject<HTMLDivElement>;
  tableWidth: React.MutableRefObject<number>;
  tableOffset: React.RefObject<ElementOffset>;
  headerOffset: React.RefObject<ElementOffset>;
  headerHeight: number;
  scrollX: React.MutableRefObject<number>;
  scrollbarXRef: React.RefObject<ScrollbarInstance>;
  affixScrollbarXRef: React.RefObject<ScrollbarInstance>;
  affixHeaderWrapperRef: React.RefObject<HTMLDivElement>;
}

const useAffix = (props: AffixProps) => {
  const {
    getTableHeight,
    contentHeight,
    contentWidth,
    affixHorizontalScrollbar,
    affixHeader,
    tableRef,
    tableWidth,
    tableOffset,
    headerOffset,
    headerHeight,
    scrollX,
    scrollbarXRef,
    affixScrollbarXRef,
    affixHeaderWrapperRef
  } = props;

  const windowScrollListener = useRef<ListenerCallback>();
  const containerScrollListener = useRef<ListenerCallback>();
  const resizeListener = useRef<ListenerCallback>();
  const horizontalScrollbarTargetRef = useRef<HTMLElement | Window>(window);
  const horizontalScrollbarWidthRef = useRef(0);
  const [horizontalScrollbarContainer, setHorizontalScrollbarContainer] =
    useState<HTMLElement | null>(null);
  const [horizontalScrollbarWidth, setHorizontalScrollbarWidth] = useState<number | null>(null);

  const getContainerAffixTransform = useCallback((container: HTMLElement) => {
    const styles = window.getComputedStyle(container);
    const paddingLeft = parseFloat(styles.paddingLeft || '0') || 0;
    const paddingBottom = parseFloat(styles.paddingBottom || '0') || 0;

    return `translate3d(${-paddingLeft}px, ${paddingBottom}px, 0px)`;
  }, []);

  const syncHorizontalScrollbarTarget = useCallback(() => {
    if (!isNumberOrTrue(affixHorizontalScrollbar)) {
      horizontalScrollbarTargetRef.current = window;
      setHorizontalScrollbarContainer(prevState => (prevState ? null : prevState));
      return window;
    }

    const nextTarget = getScrollParent(tableRef.current);
    horizontalScrollbarTargetRef.current = nextTarget;

    setHorizontalScrollbarContainer(prevState => {
      const nextContainer = nextTarget === window ? null : (nextTarget as HTMLElement);
      return prevState === nextContainer ? prevState : nextContainer;
    });

    return nextTarget;
  }, [affixHorizontalScrollbar, tableRef]);

  const syncHorizontalScrollbarWidth = useCallback((nextWidth: number) => {
    const roundedWidth = Math.round(nextWidth);

    horizontalScrollbarWidthRef.current = roundedWidth;
    setHorizontalScrollbarWidth(prevWidth => (prevWidth === roundedWidth ? prevWidth : roundedWidth));
  }, []);

  const syncAffixScrollbarOffset = useCallback(() => {
    if (!affixScrollbarXRef.current || contentWidth.current <= 0) {
      return;
    }

    const width = horizontalScrollbarWidthRef.current || tableWidth.current;
    const offset = (Math.abs(scrollX.current) / contentWidth.current) * width;
    affixScrollbarXRef.current.resetScrollBarPosition(offset);
  }, [affixScrollbarXRef, contentWidth, scrollX, tableWidth]);

  const handleAffixHorizontalScrollbar = useCallback(() => {
    const bottom = typeof affixHorizontalScrollbar === 'number' ? affixHorizontalScrollbar : 0;
    const originalScrollbar = scrollbarXRef?.current?.root;
    const affixScrollbar = affixScrollbarXRef?.current?.root;
    const target = syncHorizontalScrollbarTarget();

    if (!isNumberOrTrue(affixHorizontalScrollbar)) {
      if (originalScrollbar) {
        toggleClass(originalScrollbar, 'fixed', false);
        removeStyle(originalScrollbar, 'bottom');
      }

      if (affixScrollbar) {
        addStyle(affixScrollbar, 'display', 'none');
        removeStyle(affixScrollbar, ['left', 'bottom', 'transform']);
      }
      return;
    }

    if (target === window) {
      if (affixScrollbar) {
        addStyle(affixScrollbar, 'display', 'none');
        removeStyle(affixScrollbar, ['left', 'bottom', 'transform']);
      }

      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = getHeight(window);
      const height = getTableHeight();
      const offsetTop = tableOffset.current?.top || 0;
      const fixedScrollbar =
        scrollY + windowHeight < height + (offsetTop + bottom) &&
        scrollY + windowHeight - headerHeight > offsetTop + bottom;

      if (originalScrollbar) {
        toggleClass(originalScrollbar, 'fixed', fixedScrollbar);

        if (fixedScrollbar) {
          addStyle(originalScrollbar, 'bottom', `${bottom}px`);
        } else {
          removeStyle(originalScrollbar, 'bottom');
        }
      }
      return;
    }

    if (originalScrollbar) {
      toggleClass(originalScrollbar, 'fixed', false);
      removeStyle(originalScrollbar, 'bottom');
    }

    if (!tableRef.current || !affixScrollbar) {
      return;
    }

    const container = target as HTMLElement;
    const tableRect = tableRef.current.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    syncHorizontalScrollbarWidth(tableRect.width);
    const viewportBottom = container.scrollTop + container.clientHeight;
    const tableTop = tableRect.top - containerRect.top + container.scrollTop;
    const tableBottom = tableTop + getTableHeight();
    const fixedScrollbar =
      viewportBottom < tableBottom + bottom &&
      viewportBottom - headerHeight > tableTop + bottom;

    if (!fixedScrollbar) {
      addStyle(affixScrollbar, 'display', 'none');
      removeStyle(affixScrollbar, ['left', 'bottom', 'transform']);
      return;
    }

    syncAffixScrollbarOffset();
    removeStyle(affixScrollbar, 'display');
    addStyle(affixScrollbar, {
      width: `${tableRect.width}px`,
      left: `${tableRect.left - containerRect.left - container.clientLeft + container.scrollLeft}px`,
      bottom: `${bottom}px`,
      transform: getContainerAffixTransform(container)
    });
  }, [
    affixHorizontalScrollbar,
    affixScrollbarXRef,
    getTableHeight,
    getContainerAffixTransform,
    headerHeight,
    scrollbarXRef,
    scrollX,
    syncAffixScrollbarOffset,
    syncHorizontalScrollbarWidth,
    syncHorizontalScrollbarTarget,
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

  const handleScroll = useCallback(() => {
    if (isNumberOrTrue(affixHeader)) {
      handleAffixTableHeader();
    }

    if (isNumberOrTrue(affixHorizontalScrollbar)) {
      handleAffixHorizontalScrollbar();
    }
  }, [affixHeader, affixHorizontalScrollbar, handleAffixHorizontalScrollbar, handleAffixTableHeader]);

  useEffect(() => {
    syncHorizontalScrollbarTarget();
    handleScroll();
  });

  useEffect(() => {
    windowScrollListener.current?.off();
    containerScrollListener.current?.off();
    resizeListener.current?.off();

    const shouldListenWindowScroll =
      isNumberOrTrue(affixHeader) ||
      (isNumberOrTrue(affixHorizontalScrollbar) && horizontalScrollbarTargetRef.current === window);

    if (shouldListenWindowScroll) {
      windowScrollListener.current = on(window, 'scroll', handleScroll);
    }

    if (isNumberOrTrue(affixHorizontalScrollbar) && horizontalScrollbarTargetRef.current !== window) {
      containerScrollListener.current = on(
        horizontalScrollbarTargetRef.current as HTMLElement,
        'scroll',
        handleScroll
      );
    }

    if (isNumberOrTrue(affixHeader) || isNumberOrTrue(affixHorizontalScrollbar)) {
      resizeListener.current = on(window, 'resize', handleScroll);
    }

    return () => {
      windowScrollListener.current?.off();
      containerScrollListener.current?.off();
      resizeListener.current?.off();
    };
  }, [affixHeader, affixHorizontalScrollbar, handleScroll, horizontalScrollbarContainer]);

  return {
    horizontalScrollbarContainer,
    horizontalScrollbarWidth
  };
};

export default useAffix;
