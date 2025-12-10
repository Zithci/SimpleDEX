export default function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div className={`${sizeClasses[size]} border-white/30 border-t-white rounded-full animate-spin`}></div>
  );
}
