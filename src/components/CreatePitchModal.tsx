import { useState, useRef } from "react";
import { toast } from "sonner";
import { usePitches } from "@/hooks/usePitches";
import { useAuth } from "@/context/AuthContext";

const GENRES = [
  "Action",
  "Drama",
  "Comedy",
  "Nollywood",
  "Sci-Fi",
  "Thriller",
  "Romance",
  "Horror",
  "Documentary",
  "Animation",
];

const SUGGESTED_TAGS = [
  "dystopian",
  "afrofuturism",
  "thriller",
  "coming-of-age",
  "romance",
  "ai",
  "nollywood",
  "sci-fi",
  "superhero",
  "crime",
  "political",
  "military",
  "heist",
  "family",
  "survival",
  "historical",
  "mystery",
];

interface CreatePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export default function CreatePitchModal({
  isOpen,
  onClose,
  onCreated,
}: CreatePitchModalProps) {
  const { user } = useAuth();
  const { addPitch, uploadImage } = usePitches();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("2024");
  const [logline, setLogline] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setTitle("");
    setGenre("");
    setYear("2024");
    setLogline("");
    setSynopsis("");
    setVideoUrl("");
    setImageUrl("");
    setFile(null);
    setPreview("");
    setTags([]);
    setTagInput("");
    setStatusMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setImageUrl("");
  };

  const addTag = (t: string) => {
    const tag = t.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (!tag || tags.includes(tag) || tags.length >= 8) return;
    setTags((p) => [...p, tag]);
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setTags((p) => p.filter((x) => x !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !genre) {
      toast.error("Title and genre are required");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      let finalImage = imageUrl.trim();

      if (file) {
        setStatusMsg("Uploading poster...");
        const uploaded = await uploadImage(file);
        if (uploaded) finalImage = uploaded;
      }

      if (!finalImage) {
        finalImage =
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=70&auto=format&fit=crop";
      }

      setStatusMsg("Publishing pitch...");

      const payload = {
        title: title.trim(),
        genre,
        year: Number(year) || 2024,
        logline: logline.trim(),
        image: finalImage,
        synopsis: synopsis.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        tags: tags.length ? tags : undefined,
      };

      const result = await addPitch(payload, user.id);

      close();

      toast.success("🎬 Pitch is live!", {
        description: "Your story is now in the marketplace.",
      });

      onCreated?.(result.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish. Please try again.");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if ((e.target as Element).classList.contains("modal-backdrop")) close();
      }}
    >
      <div className="modal-box" style={{ maxWidth: 560, maxHeight: "92vh" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 800 }}>
              🚀 Launch Your Movie Pitch
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13 }}>
              Share your story with the world
            </p>
          </div>

          <button className="modal-close-btn" onClick={close}>
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <SectionLabel>🎭 Core Story</SectionLabel>

          <input
            className="form-input"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <select
              className="form-input"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Select genre</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>

            <input
              className="form-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <textarea
            className="form-input"
            placeholder="Logline"
            value={logline}
            maxLength={280}
            onChange={(e) => setLogline(e.target.value)}
          />

          <textarea
            className="form-input"
            placeholder="Synopsis (optional)"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
          />

          <SectionLabel>🏷️ Tags</SectionLabel>

          <input
            className="form-input"
            placeholder="Add tag + Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  background: "rgba(124,58,237,0.2)",
                  padding: "4px 8px",
                  borderRadius: 20,
                  fontSize: 12,
                }}
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  style={{ marginLeft: 6 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <SectionLabel>🖼️ Poster</SectionLabel>

          <input type="file" ref={fileRef} onChange={handleFileSelect} />

          {preview && (
            <img
              src={preview}
              style={{ width: "100%", borderRadius: 10, marginTop: 10 }}
            />
          )}

          <input
            className="form-input"
            placeholder="Or image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />

          <SectionLabel>🎥 Video</SectionLabel>

          <input
            className="form-input"
            placeholder="YouTube or Vimeo link"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={close}>
              Cancel
            </button>

            <button type="submit" className="btn-purple" disabled={loading}>
              {loading ? statusMsg || "Publishing..." : "🎬 Publish Pitch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: "#7c3aed",
        marginTop: 10,
      }}
    >
      {children}
    </div>
  );
}
