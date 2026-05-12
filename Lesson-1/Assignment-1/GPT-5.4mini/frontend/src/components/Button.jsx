export function Button({ className = "", variant = "primary", ...props }) {
  return <button className={`btn btn-${variant} ${className}`.trim()} {...props} />;
}
