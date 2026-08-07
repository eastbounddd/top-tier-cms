"use client";

import {
  ChangeEvent,
  CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover_image_url: string;
  is_top_story: boolean;
  status: string;
};

export function ArticleEditor() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    excerpt: "",
    category: "College Football",
    cover_image_url: "",
    is_top_story: false,
    status: "draft",
  });
  const [editorHtml, setEditorHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setMessage(error.message);
          return;
        }
        if (!data) return;

        setForm({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          category: data.category || "College Football",
          cover_image_url: data.cover_image_url || "",
          is_top_story: Boolean(data.is_top_story),
          status: data.status || "draft",
        });

        const html =
          typeof data.body === "object" && data.body?.html
            ? data.body.html
            : String(data.body || "");

        setEditorHtml(html);
        requestAnimationFrame(() => {
          if (editor.current) editor.current.innerHTML = html;
        });
      });
  }, [id]);

  useEffect(() => {
    const rememberSelection = () => {
      const selection = window.getSelection();
      if (
        selection?.rangeCount &&
        editor.current &&
        selection.anchorNode &&
        editor.current.contains(selection.anchorNode)
      ) {
        savedRange.current = selection.getRangeAt(0).cloneRange();
      }
    };

    document.addEventListener("selectionchange", rememberSelection);
    return () =>
      document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  const restoreSelection = () => {
    editor.current?.focus();
    if (!savedRange.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange.current);
  };

  const upload = async (file: File, bucket: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("You are not signed in.");

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${Date.now()}-${cleanName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type,
    });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data.publicUrl) throw new Error("Upload finished but no public URL was returned.");
    return data.publicUrl;
  };

  const cover = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setUploading("Uploading cover image…");
    setMessage("");

    try {
      const url = await upload(file, "article-images");
      setForm((f) => ({ ...f, cover_image_url: url }));
      setMessage("Cover image uploaded. It will be saved with the article.");
    } catch (e: any) {
      setMessage(`Cover upload failed: ${e.message}`);
    } finally {
      setBusy(false);
      setUploading("");
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    const next = editor.current?.innerHTML || "";
    setEditorHtml(next);
  };

  const insertMedia = async (file?: File) => {
    if (!file || !editor.current) return;

    const isMp4 = file.type === "video/mp4";
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);

    if (!isMp4 && !isImage) {
      setMessage("Please upload a JPG, PNG, WEBP, or MP4 file.");
      return;
    }

    setBusy(true);
    setUploading(isMp4 ? "Uploading MP4 video…" : "Uploading article image…");
    setMessage("");

    try {
      const url = await upload(
        file,
        isMp4 ? "article-videos" : "article-images"
      );

      if (isMp4) {
        insertHtmlAtCursor(
          `<figure class="article-media-block"><video controls playsinline preload="metadata" src="${url}"></video></figure><p><br></p>`
        );
      } else {
        insertHtmlAtCursor(
          `<figure class="article-media-block"><img src="${url}" alt="" /></figure><p><br></p>`
        );
      }

      setMessage(
        isMp4
          ? "Video uploaded and inserted into the article."
          : "Photo uploaded and inserted into the article."
      );
    } catch (e: any) {
      setMessage(`Media upload failed: ${e.message}`);
    } finally {
      setBusy(false);
      setUploading("");
    }
  };

  const command = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value);
    setEditorHtml(editor.current?.innerHTML || "");
  };

  const addLink = () => {
    const url = window.prompt("Paste the full hyperlink URL:");
    if (!url) return;

    const selection = window.getSelection();
    restoreSelection();

    if (selection && !selection.isCollapsed) {
      document.execCommand("createLink", false, url);
      document.execCommand("styleWithCSS", false, "false");
      setEditorHtml(editor.current?.innerHTML || "");
      return;
    }

    const text = window.prompt("Link text:", url) || url;
    insertHtmlAtCursor(
      `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${text}</a>`
    );
  };

  const addXPost = () => {
    const url = window.prompt("Paste the X/Twitter post URL:");
    if (!url) return;

    const valid =
      /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/[^/]+\/status\/\d+/i.test(url);

    if (!valid) {
      setMessage("That does not look like a valid X post URL.");
      return;
    }

    insertHtmlAtCursor(
      `<blockquote class="twitter-tweet"><a href="${url.replace(
        /"/g,
        "&quot;"
      )}">View this post on X</a></blockquote><p><br></p>`
    );
    setMessage("X post embedded. The full X card appears on the published article.");
  };
const deleteArticle = async () => {
  if (!id) return;

  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this article? This cannot be undone."
  );

  if (!confirmed) return;

  setBusy(true);
  setMessage("");

  const supabase = createClient();

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  setBusy(false);

  if (error) {
    setMessage(`Could not delete article: ${error.message}`);
    return;
  }

  router.push("/dashboard");
  router.refresh();
};
  const save = async (status: string) => {
    if (!form.title.trim()) {
      setMessage("Please enter a headline first.");
      return;
    }

    setBusy(true);
    setMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBusy(false);
      setMessage("Your login session expired. Please sign in again.");
      return;
    }

    const payload: any = {
      ...form,
      slug: form.slug || slugify(form.title),
      status,
      author_id: user.id,
      body: {
  html: (editor.current?.innerHTML || editorHtml || "")
    .replace(/<h1\b[^>]*>/gi, "")
    .replace(/<\/h1>/gi, "")
},
    };

    if (status === "published") {
      payload.published_at = new Date().toISOString();
    }

    let error: any = null;
    if (id) {
      ({ error } = await supabase.from("articles").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("articles").insert(payload));
    }

    setBusy(false);

    if (error) {
      setMessage(`Could not save article: ${error.message}`);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const onEditorInput = () => {
    setEditorHtml(editor.current?.innerHTML || "");
  };

  const coverStyle = {
    "--preview-bg": `url("${form.cover_image_url || "/top-tier-logo.png"}")`,
  } as CSSProperties;

  return (
    <div className="editor-layout">
      <section className="editor-form">
        <div className="editor-top">
          <div>
            <small>ARTICLE EDITOR</small>
            <h1>{id ? "Edit Article" : "Create New Article"}</h1>
          </div>
          <a href="/dashboard">← Dashboard</a>
        </div>

        <label>
          Headline
          <input
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                title: e.target.value,
                slug: f.slug || slugify(e.target.value),
              }))
            }
            placeholder="Enter article headline"
          />
        </label>

        <div className="two-col">
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option>College Football</option>
              <option>Breaking News</option>
              <option>Recruiting</option>
              <option>Transfer Portal</option>
              <option>Coaching</option>
              <option>Other News</option>
            </select>
          </label>

          <label>
            URL Slug
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
              }
            />
          </label>
        </div>

        <label>
          Preview Description
          <textarea
            value={form.excerpt}
            onChange={(e) =>
              setForm((f) => ({ ...f, excerpt: e.target.value }))
            }
            maxLength={260}
            placeholder="Short description shown on story cards and social previews."
          />
        </label>

        <label>
          Cover Image
          <input
            disabled={busy}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              cover(e.target.files?.[0])
            }
          />
          <span className="field-help">
            Recommended 1600 × 900. The complete image is shown in the CMS and on
            the article page.
          </span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.is_top_story}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_top_story: e.target.checked }))
            }
          />
          Feature in Top Stories
        </label>

        <div className="toolbar" aria-label="Article formatting toolbar">
          <button type="button" onClick={() => command("bold")}>
            <b>B</b>
          </button>
          <button type="button" onClick={() => command("italic")}>
            <i>I</i>
          </button>
          <button type="button" onClick={() => command("underline")}>
            <u>U</u>
          </button>
          <button type="button" onClick={() => command("formatBlock", "h2")}>
            H2
          </button>
          <button type="button" onClick={() => command("insertUnorderedList")}>
            • List
          </button>
          <button type="button" onClick={() => command("insertOrderedList")}>
            1. List
          </button>
          <button type="button" onClick={addLink}>
            🔗 Link
          </button>
          <button type="button" onClick={addXPost}>
            𝕏 Embed Post
          </button>
          <label className="upload-button">
            + Photo / MP4
            <input
              hidden
              disabled={busy}
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                insertMedia(e.target.files?.[0])
              }
            />
          </label>
        </div>

        <div
          ref={editor}
          className="rich-editor"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write your story here…"
          onInput={onEditorInput}
        />

        {uploading && <p className="editor-uploading">{uploading}</p>}
        {message && <p className="editor-message">{message}</p>}

        <div className="editor-actions">
          {id && (
  <button
    type="button"
    disabled={busy}
    onClick={deleteArticle}
    className="delete-button"
  >
    Delete Article
  </button>
)}
          <button
            disabled={busy}
            onClick={() => save("draft")}
            className="outline-button"
          >
            Save Draft
          </button>
          <button
            disabled={busy}
            onClick={() => save("pending_review")}
            className="outline-button"
          >
            Submit for Review
          </button>
          <button
            disabled={busy}
            onClick={() => save("published")}
            className="red-button"
          >
            Publish
          </button>
        </div>
      </section>

      <aside className="preview">
        <small>LIVE ARTICLE PREVIEW</small>

        <div className="preview-image clean-media" style={coverStyle}>
          <img
            src={form.cover_image_url || "/top-tier-logo.png"}
            alt="Article cover preview"
          />
        </div>

        <span>{form.category}</span>
        <h2>{form.title || "Your headline appears here"}</h2>
        <p>{form.excerpt || "Your article preview description appears here."}</p>

        <div className="preview-body">
          <div className="preview-body-label">BODY PREVIEW</div>
          {editorHtml ? (
            <div
              className="preview-prose"
              dangerouslySetInnerHTML={{ __html: editorHtml }}
            />
          ) : (
            <div className="preview-empty">
              Start writing and your article body will appear here.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
