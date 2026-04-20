import { useEffect, useMemo } from 'react';
import { Film, ImageOff, X } from 'lucide-react';
import './FilePreview.css';

export default function FilePreview({ file, type = 'image', onClear }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!file) return null;

  return (
    <div className="file-preview">
      <button className="fp-clear" onClick={onClear} title="Remove">
        <X size={14} strokeWidth={2} />
      </button>

      {type === 'image'
        ? previewUrl
          ? <img src={previewUrl} alt="Preview" className="fp-image" />
          : <div className="fp-placeholder"><ImageOff size={28} strokeWidth={1} /></div>
        : previewUrl
          ? <video src={previewUrl} className="fp-video" controls muted />
          : <div className="fp-placeholder"><Film size={28} strokeWidth={1} /></div>}

      <div className="fp-info">
        <span className="fp-name">{file.name}</span>
        <span className="fp-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
      </div>
    </div>
  );
}
