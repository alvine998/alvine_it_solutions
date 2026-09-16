type Props = {
  id?: string;
  variant?: "banner" | "infeed" | "square";
  label?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

// ponytail: single slot covers all networks (AdSense/Meta/any embed).
// Upgrade when needed: intersection lazy-load, refresh, freq-cap.
// Renders nothing until an embed is actually passed — an empty dashed
// "Advertisement" box on a sales page reads as placeholder slop and kills trust.
export default function AdSlot({ id, variant = "infeed", label = "Advertisement", children, style }: Props) {
  if (!children) return null;
  return (
    <aside aria-label={label} id={id} className={`ad-slot ad-slot--${variant}`} style={style}>
      {children}
    </aside>
  );
}
