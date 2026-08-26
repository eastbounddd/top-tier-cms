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
import { articleSchoolOptions } from "@/lib/schools";
import { RenderedArticleContent } from "@/components/RenderedArticleContent";
import { isXStatusUrl, renderStandaloneXLinks } from "@/lib/renderXLinks";

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
  school: string;
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
    school: "",
    cover_image_url: "",
    is_top_story: false,
    status: "draft",
  });
  const [editorHtml, setEditorHtml] = useState("");
  const [authorName, setAuthorName] = useState("");
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
          school: data.school || "",
          cover_image_url: data.cover_image_url || "",
          is_top_story: Boolean(data.is_top_story),
          status: data.status || "draft",
        });

        const html =
          typeof data.body === "object" && data.body?.html
            ? data.body.html
            : String(data.body || "");

        setAuthorName(
          typeof data.body === "object" ? data.body?.author_name || "" : ""
        );
        setEditorHtml(html);
        requestAnimationFrame(() => {
          if (editor.current) {
            const rendered = document.createElement("div");
            rendered.innerHTML = renderStandaloneXLinks(html);
            rendered.querySelectorAll<HTMLElement>(".x-post-embed").forEach((post) => {
              const url = post.dataset.xUrl || post.querySelector("a")?.href || "";
              if (url) post.outerHTML = createEditorXPreview(url);
            });
            editor.current.innerHTML = rendered.innerHTML;
          }
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
    const root = editor.current;
    if (!root) return false;

    root.focus();
    let range = savedRange.current?.cloneRange() || null;
    if (!range || !root.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);
    }

    const fragment = range.createContextualFragment(html);
    const lastInsertedNode = fragment.lastChild;
    if (!lastInsertedNode) return false;

    range.deleteContents();
    range.insertNode(fragment);
    range.setStartAfter(lastInsertedNode);
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRange.current = range.cloneRange();
    setEditorHtml(serializeEditorHtml());
    return true;
  };

  const escapeAttribute = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  const createEditorXPreview = (url: string) => {
    const safeUrl = escapeAttribute(url);
    const tweetId = url.match(/\/status\/(\d+)/i)?.[1] || "";
    const embedUrl = escapeAttribute(
      `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true&lang=en&theme=light&hideCard=false&hideThread=false`
    );
    return `<div class="x-editor-tweet-preview" contenteditable="false" data-x-url="${safeUrl}"><iframe class="x-post-frame" src="${embedUrl}" title="Embedded post on X" loading="lazy" scrolling="yes"></iframe><a class="x-post-source-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">View post on X</a></div>`;
  };

  const serializeEditorHtml = () => {
    if (!editor.current) return editorHtml || "";
    const clone = editor.current.cloneNode(true) as HTMLDivElement;
    clone.querySelectorAll<HTMLElement>(".x-editor-tweet-preview").forEach((preview) => {
      const paragraph = document.createElement("p");
      paragraph.textContent =
        preview.dataset.xUrl || preview.querySelector("a")?.getAttribute("href") || "";
      preview.replaceWith(paragraph);
    });
    clone.querySelectorAll<HTMLElement>("figcaption.photo-credit").forEach((caption) => {
      const text = caption.textContent?.trim() || "";
      if (!text) {
        caption.remove();
        return;
      }

      // Store captions as plain text within their own image figure. Assigning
      // textContent strips pasted markup while preserving punctuation safely.
      caption.textContent = text;
      caption.removeAttribute("data-editor-caption-id");
    });
    return clone.innerHTML;
  };

  const handleEditorPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("figcaption.photo-credit")) {
      event.preventDefault();
      document.execCommand(
        "insertText",
        false,
        event.clipboardData.getData("text/plain")
      );
      return;
    }

    const pastedText = event.clipboardData.getData("text/plain").trim();
    if (!isXStatusUrl(pastedText)) {
      if (/^https?:\/\/\S+$/i.test(pastedText)) {
        event.preventDefault();
        const safeUrl = escapeAttribute(pastedText);
        insertHtmlAtCursor(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`);
      }
      return;
    }

    event.preventDefault();
    insertHtmlAtCursor(`${createEditorXPreview(pastedText)}<p><br></p>`);
    setMessage("X post preview added. The original URL will be saved with the article.");
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

      const captionId = `caption-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const mediaMarkup = isMp4
        ? `<video controls playsinline preload="metadata" src="${url}"></video>`
        : `<img src="${url}" alt="" />`;
      const captionLabel = isMp4
        ? "Video credit / caption (optional)"
        : "Photo credit / caption (optional)";

      const inserted = insertHtmlAtCursor(
        `<figure class="article-media-block">${mediaMarkup}<figcaption class="photo-credit" data-editor-caption-id="${captionId}" data-placeholder="${captionLabel}"></figcaption></figure><p><br></p>`
      );

      if (!inserted) {
        throw new Error("The media could not be inserted into the article body.");
      }

      requestAnimationFrame(() => {
        const caption = editor.current?.querySelector<HTMLElement>(
          `[data-editor-caption-id="${captionId}"]`
        );
        if (!caption) return;

        const range = document.createRange();
        range.selectNodeContents(caption);
        range.collapse(false);
        editor.current?.focus();
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        savedRange.current = range.cloneRange();
      });

      setMessage(
        `${isMp4 ? "Video" : "Photo"} inserted. Add its optional credit or caption directly below it.`
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
    setEditorHtml(serializeEditorHtml());
  };

  const addLink = () => {
    const url = window.prompt("Paste the full hyperlink URL:");
    if (!url) return;

    const selection = window.getSelection();
    restoreSelection();

    if (selection && !selection.isCollapsed) {
      document.execCommand("createLink", false, url);
      document.execCommand("styleWithCSS", false, "false");
      setEditorHtml(serializeEditorHtml());
      return;
    }

    const text = window.prompt("Link text:", url) || url;
    insertHtmlAtCursor(
      `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${text}</a>`
    );
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

    if (!authorName.trim()) {
      setMessage("Please enter the author name.");
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
        html: serializeEditorHtml()
          .replace(/<h1\b[^>]*>/gi, "")
          .replace(/<\/h1>/gi, ""),
        author_name: authorName.trim(),
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
    setEditorHtml(serializeEditorHtml());
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
            School
            <select
              value={form.school}
              onChange={(e) =>
                setForm((f) => ({ ...f, school: e.target.value }))
              }
            >
              <option value="">No school</option>
              {articleSchoolOptions.map((school) => (
                <option key={school.slug} value={school.name}>{school.name}</option>
              ))}
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
          Author Name
          <input
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Name shown on the published article"
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
          onPaste={handleEditorPaste}
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
            <RenderedArticleContent html={editorHtml} className="preview-prose" />
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
