import { motion, AnimatePresence } from "framer-motion";

export function Modal({ open, title, onClose, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-card" initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }}>
            <div className="modal-header">
              <h3>{title}</h3>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
