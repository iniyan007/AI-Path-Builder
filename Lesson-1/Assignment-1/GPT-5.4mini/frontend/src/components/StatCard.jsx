import { motion } from "framer-motion";

export function StatCard({ label, value, hint }) {
  return (
    <motion.div className="stat-card" whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </motion.div>
  );
}
