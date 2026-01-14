import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
} from '@floating-ui/react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = React.useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 10 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        // REMOVED border-b and border-dotted here
        className="inline-block cursor-help active:opacity-70 transition-opacity"
      >
        {children}
      </div>
      
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl max-w-[85vw] sm:max-w-xs break-words"
          >
            {content}
            <div
              ref={arrowRef}
              className="absolute w-2 h-2 bg-gray-900 rotate-45"
              style={{
                left: context.middlewareData.arrow?.x != null ? `${context.middlewareData.arrow.x}px` : '',
                top: context.middlewareData.arrow?.y != null ? `${context.middlewareData.arrow.y}px` : '',
                // Position logic for arrow based on where the tooltip is flipped
                bottom: context.placement.startsWith('top') ? '-4px' : '',
                top: context.placement.startsWith('bottom') ? '-4px' : '',
              }}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default Tooltip;