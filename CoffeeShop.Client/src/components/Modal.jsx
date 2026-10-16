import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

export const Modal = ({ isOpen, onClose, title, children, footer, maxWidth }) => {
  const customStyle = maxWidth && maxWidth.includes('px') ? { maxWidth } : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
      <DialogContent style={customStyle} className={!customStyle && maxWidth ? maxWidth : undefined}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="py-1 text-sm text-foreground">
          {children}
        </div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
