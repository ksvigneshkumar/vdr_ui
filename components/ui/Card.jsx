export default function Card({
  title,
  children,
  onClose,
  className = "",
}) {
  return (
    <div
      className={`
        bg-white
        rounded-lg
        shadow-sm
        border border-gray-200
        w-full
        max-w-sm
        p-5
        ${className}
      `}
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>

        <button
          onClick={onClose}
          className="text-gray-500
 hover:text-black
 text-xl
 transition-all"
        >
          ✕
        </button>

      </div>

      {/* Content */}
      {children}

    </div>
  );
}