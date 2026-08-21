export default function SettingsHeader({ title, description }) {
  return (
    <div className="mb-8 border-b border-gray-800 pb-5">
      <h2 className="text-2xl font-semibold text-white tracking-tight">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      )}
    </div>
  );
}
