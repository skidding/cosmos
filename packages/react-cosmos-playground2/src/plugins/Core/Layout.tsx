import React from 'react';
import { Slot } from 'react-plugin';
import styled from 'styled-components';
import { useDrag } from '../../shared/ui';
import { NAV_WIDTH_DEFAULT, restrictNavWidth } from './shared';

type Props = {
  storageCacheReady: boolean;
  navWidth: number;
  setNavWidth: (width: number) => unknown;
};

export function Layout({ storageCacheReady, navWidth, setNavWidth }: Props) {
  const handleNavWidthChange = React.useCallback(
    (newWidth: number) => setNavWidth(restrictNavWidth(newWidth)),
    [setNavWidth]
  );
  const { dragElRef, dragging } = useDrag({
    value: navWidth,
    onChange: handleNavWidthChange
  });

  if (!storageCacheReady) {
    return <Container />;
  }

  // z indexes are set here on purpose to show the layer hierarchy at a glance
  return (
    <Container>
      <Left style={{ zIndex: 2, width: navWidth }}>
        <Slot name="left" />
        <DragHandle ref={dragElRef} />
      </Left>
      <Center style={{ zIndex: 1 }}>
        <Slot name="rendererHeader" />
        <PreviewContainer>
          <Slot name="rendererPreview" />
          <Slot name="contentOverlay" />
        </PreviewContainer>
        {dragging && <CenterDragOverlay />}
      </Center>
      <div style={{ zIndex: 3 }}>
        <Slot name="right" />
      </div>
      <div style={{ zIndex: 4 }}>
        <Slot name="global" />
      </div>
    </Container>
  );
}

const Container = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
`;

const Left = styled.div`
  flex-shrink: 0;
  position: relative;
  width: ${NAV_WIDTH_DEFAULT}px;
  border-right: 1px solid var(--darkest);
`;

const Center = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: var(--grey6);
  color: var(--grey2);
  overflow: hidden;
`;

const PreviewContainer = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
`;

// The purpose of CenterDragOverlay is to cover the content area, which can
// contain the renderer preview iframe, while dragging because document
// 'mousemove' events are no longer captured while hovering over an iframe
const CenterDragOverlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const DragHandle = styled.div`
  position: absolute;
  top: 0;
  right: -3px;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
`;