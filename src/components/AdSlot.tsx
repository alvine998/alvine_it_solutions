type Props = {
  id?: string;
  variant?: "banner" | "infeed" | "square";
  label?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

// ponytail: single slot covers all networks (AdSense/Meta/any embed).
// Upgrade when needed: intersection lazy-load, refresh, freq-cap.
export default function AdSlot({ id, variant = "infeed", label = "Advertisement", children, style }: Props) {
  return (
    <aside aria-label={label} id={id} className={`ad-slot ad-slot--${variant}`} style={style}>
      {children ?? <span className="ad-slot__placeholder">{label}</span>}
    </aside>
  );
}
