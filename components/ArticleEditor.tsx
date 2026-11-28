"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveArticle } from "@/app/dashboard/new/actions";
import { articleCategories } from "@/lib/articleCategories";
import { articleSchoolOptions } from "@/lib/schools";
import { RenderedArticleContent } from "@/components/RenderedArticleContent";
import { isXStatusUrl, renderStandaloneXLinks } from "@/lib/renderXLinks";

import { ArticlePicker, PromoEditor, schoolPromo, type SearchResult } from "@/components/ArticleInsertDialogs";
import { escapeHtml, followPromo, promoHtml, safeArticleUrl, videoHtml, withFollowPromo, type Promo } from "@/lib/articleBlocks";
import { savedStoryLabels, storyLabels, type StoryLabel } from "@/lib/storyLabels";
import { articleSponsorship } from "@/lib/articleSponsorship";
import { KeyTakeaways } from "@/components/KeyTakeaways";
import { articlePresentation, authoredTakeaways, takeawayMax, takeawayMin, takeawaySoftLimit } from "@/lib/articlePresentation";
import { PreferredSource } from "@/components/PreferredSource";

const templates = {
  "Breaking News": ["What Happened", "Why It Matters", "What’s Next"],
  "Game Preview / Watch Guide": ["How to Watch", "Kickoff Time & TV Channel", "Key Matchups", "Prediction"],
  "Recruiting / Portal Update": ["The Latest", "Scouting Report", "What It Means"],
  "Rankings / List": ["Ranking Criteria", "The Rankings", "What Stands Out"],
};

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
  labels: StoryLabel[];
  status: string;
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

const articleUnavailable = "Article not found or you don't have permission to save it.";

export function ArticleEditor({ initialId, editorRole, displayName }: {
  initialId: string | null; editorRole: boolean; displayName: string;
}) {
  const id = useRef(initialId);
  const hydratedId = useRef<string | null>(null);
  const saving = useRef(false);
  const lastSave = useRef("");
  const changes = useRef(0);
  const savedChanges = useRef(0);
  const markChanged = () => { changes.current += 1; };
  const [savedAt, setSavedAt] = useState("");
  const [tab, setTab] = useState("Article");
  const [metadata, setMetadata] = useState({
    cover_alt: "", cover_credit: "", partner_name: "", cover_width: 0, secondary_school: "", keyTakeaways: [] as string[],
    auto_follow: false, preferred_source: true,
  });
  const updatedAt = useRef<string | null>(null);
  const [schedule, setSchedule] = useState("");
  const [picker, setPicker] = useState<"link" | "related" | null>(null);
  const [promo, setPromo] = useState<{ value: Promo; node?: HTMLElement } | null>(null);
  const [dragging, setDragging] = useState(false);
  const setMeta = <K extends keyof typeof metadata>(key: K, value: (typeof metadata)[K]) =>
    setMetadata(current => ({ ...current, [key]: value }));
  const router = useRouter();
  const editor = useRef<HTMLDivElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);
  const mediaInsertionMarker = useRef<HTMLSpanElement | null>(null);
  const mediaInsertionBookmark = useRef<{
    childIndex: number;
    replaceEmptyBlock: boolean;
  } | null>(null);
  const savedRange = useRef<Range | null>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    excerpt: "",
    category: "College Football",
    school: "",
    cover_image_url: "",
    is_top_story: false,
    labels: [],
    status: "draft",
  });
  const [editorHtml, setEditorHtml] = useState("");
  const [authorName, setAuthorName] = useState(displayName);
  const [writerId, setWriterId] = useState("");
  const [writers, setWriters] = useState<{id:string;name:string}[]>([]);
  useEffect(() => { createClient().from("writer_profiles").select("id,name").order("name").then(({data}) => setWriters(data || [])); }, []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const [loadedArticleId, setLoadedArticleId] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverUpscaled, setCoverUpscaled] = useState(false);

  const rememberEditorSelection = () => {
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

  useEffect(() => {
    const requestedId = initialId;
    // The first autosave updates the URL without reloading the in-progress draft.
    if (!requestedId || hydratedId.current === requestedId) return;
    const supabase = createClient();
    let active = true;


    supabase
      .from("articles")
      .select("*")
      .eq("id", requestedId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMessage(error.message);
          return;
        }
        if (!data) {
          setMessage(articleUnavailable);
          return;
        }

        const partner = articleSponsorship(data);
        updatedAt.current = data.updated_at ?? null;
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          category: data.category || "College Football",
          school: data.school || "",
          cover_image_url: data.cover_image_url || "",
          is_top_story: Boolean(data.is_top_story),
          labels: savedStoryLabels(data, partner.sponsored),
          status: data.status === "pending_review" ? "ready_for_review" : data.status || "draft",
        });

        const html =
          typeof data.body === "object" && data.body?.html
            ? data.body.html
            : typeof data.body === "string" ? data.body : data.body_html || "";

        const body = data.body;
        if (body && typeof body === "object") {
          setMetadata({
            cover_alt: body.cover_alt || "", cover_credit: body.cover_credit || "", partner_name: partner.name,
            cover_width: Number(body.cover_width) || 0, secondary_school: body.secondary_school || "",
            keyTakeaways: authoredTakeaways(body),
            auto_follow: body.auto_follow === true, preferred_source: body.preferred_source !== false,
          });
        } else {
          setMetadata(current => ({ ...current, partner_name: partner.name }));
        }
        if (data.status === "scheduled" && data.published_at) {
          setSchedule(new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Chicago", dateStyle: "short", timeStyle: "short" })
            .format(new Date(data.published_at)).replace(" ", "T"));
        }
        setWriterId(data.writer_profile_id || "");
        setAuthorName(
          data.body?.author_name || data.author_name || displayName
        );
        setEditorHtml(html);
        requestAnimationFrame(() => {
          if (active && editor.current) {
            const rendered = document.createElement("div");
            rendered.innerHTML = renderStandaloneXLinks(html);
            rendered.querySelectorAll<HTMLElement>(".x-post-embed").forEach((post) => {
              const url = post.dataset.xUrl || post.querySelector("a")?.href || "";
              if (isXStatusUrl(url)) post.outerHTML = createEditorXPreview(url);
            });
            editor.current.innerHTML = rendered.innerHTML;
            id.current = requestedId;
            hydratedId.current = requestedId;
            setLoadedArticleId(requestedId);
          }
        });
      });
    return () => { active = false; };
  }, [initialId, displayName]);

  useEffect(() => {
    document.addEventListener("selectionchange", rememberEditorSelection);
    return () =>
      document.removeEventListener("selectionchange", rememberEditorSelection);
  }, []);

  const restoreSelection = () => {
    editor.current?.focus();
    if (!savedRange.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange.current);
  };

  const prepareMediaInsertion = () => {
    rememberEditorSelection();
    const root = editor.current;
    const saved = savedRange.current?.cloneRange();
    if (!root || !saved || !root.contains(saved.commonAncestorContainer)) return;

    if (saved.startContainer === root) {
      mediaInsertionBookmark.current = {
        childIndex: saved.startOffset,
        replaceEmptyBlock: false,
      };
    } else {
      let topLevelBlock: Node | null = saved.startContainer;
      while (topLevelBlock?.parentNode && topLevelBlock.parentNode !== root) {
        topLevelBlock = topLevelBlock.parentNode;
      }
      if (topLevelBlock?.parentNode === root) {
        const childIndex = Array.prototype.indexOf.call(root.childNodes, topLevelBlock);
        const element = topLevelBlock as HTMLElement;
        const text = element.textContent?.replace(/\u200b/g, "").trim();
        const hasMedia = Boolean(element.querySelector?.("img,video,iframe"));
        const replaceEmptyBlock = !text && !hasMedia;
        mediaInsertionBookmark.current = {
          childIndex: childIndex + (replaceEmptyBlock ? 0 : 1),
          replaceEmptyBlock,
        };
      }
    }

    mediaInsertionMarker.current?.remove();
    const marker = document.createElement("span");
    marker.className = "media-insertion-marker";
    marker.contentEditable = "false";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = "\u200b";
    saved.insertNode(marker);
    mediaInsertionMarker.current = marker;

    const range = document.createRange();
    range.setStartAfter(marker);
    range.collapse(true);
    savedRange.current = range;
  };

  const upload = async (file: File, bucket: string, folder = "") => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("You are not signed in.");

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${folder}${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      cacheControl: "3600",
      ...(file.type ? { contentType: file.type } : {}),
    });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data.publicUrl) throw new Error("Upload finished but no public URL was returned.");
    return { path, url: data.publicUrl };
  };

  const cover = async (file?: File) => {
    if (!file || busy) return;
    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setBusy(true);
    setUploading("Uploading cover image…");
    setMessage("");

    try {
      const { path } = await upload(file, "article-images", "cover-originals/");
      const response = await fetch("/api/article-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.url) throw new Error(result?.error || "The cover image could not be processed.");
      setForm((f) => ({ ...f, cover_image_url: result.url }));
      setCoverUpscaled(result.upscaled);
      setMeta("cover_width", result.originalWidth || 0);
      markChanged();
      setMessage("Cover image uploaded. It will be saved with the article.");
    } catch (e: any) {
      setMessage(`Cover upload failed: ${e.message}`);
    } finally {
      setCoverPreview("");
      URL.revokeObjectURL(preview);
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
    markChanged();
    setEditorHtml(serializeEditorHtml());
    return true;
  };

  const insertMediaAtCursor = ({
    url,
    isMp4,
    captionId,
    captionLabel,
  }: {
    url: string;
    isMp4: boolean;
    captionId: string;
    captionLabel: string;
  }) => {
    const root = editor.current;
    if (!root) return false;

    const figure = document.createElement("figure");
    figure.className = "article-media-block";

    if (isMp4) {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = url;
      figure.appendChild(video);
    } else {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "";
      figure.appendChild(image);
    }

    const caption = document.createElement("figcaption");
    caption.className = "photo-credit";
    caption.dataset.editorCaptionId = captionId;
    caption.dataset.placeholder = captionLabel;
    figure.appendChild(caption);

    const trailingParagraph = document.createElement("p");
    trailingParagraph.appendChild(document.createElement("br"));

    // The marker survives focus changes and the native photo picker, unlike a
    // browser Selection/Range on several mobile and desktop engines.
    const marker = mediaInsertionMarker.current;
    let insertionReference: ChildNode | null = null;
    let emptyMarkerBlock: ChildNode | null = null;
    if (marker?.isConnected && root.contains(marker)) {
      let topLevelBlock: Node = marker;
      while (topLevelBlock.parentNode && topLevelBlock.parentNode !== root) {
        topLevelBlock = topLevelBlock.parentNode;
      }

      if (topLevelBlock.parentNode === root) {
        if (topLevelBlock === marker) {
          insertionReference = marker;
        } else {
          const beforeMarker = document.createRange();
          beforeMarker.selectNodeContents(topLevelBlock);
          beforeMarker.setEndBefore(marker);
          const hasContentBefore = Boolean(beforeMarker.toString().trim());
          marker.remove();

          const element = topLevelBlock as HTMLElement;
          const remainingText = element.textContent?.replace(/\u200b/g, "").trim();
          const hasMedia = Boolean(element.querySelector("img,video,iframe"));
          if (!remainingText && !hasMedia) {
            insertionReference = topLevelBlock as ChildNode;
            emptyMarkerBlock = topLevelBlock as ChildNode;
          } else {
            insertionReference = hasContentBefore
              ? topLevelBlock.nextSibling
              : (topLevelBlock as ChildNode);
          }
        }
      }
    }

    if (marker !== insertionReference) marker?.remove();
    mediaInsertionMarker.current = null;

    // React/browser focus changes can remove a temporary marker. The saved
    // top-level child index still identifies the chosen paragraph boundary.
    const bookmark = mediaInsertionBookmark.current;
    if (!insertionReference && !emptyMarkerBlock && bookmark) {
      insertionReference = root.childNodes[bookmark.childIndex] || null;
      if (bookmark.replaceEmptyBlock && insertionReference instanceof HTMLElement) {
        const text = insertionReference.textContent?.replace(/\u200b/g, "").trim();
        const hasMedia = Boolean(insertionReference.querySelector("img,video,iframe"));
        if (!text && !hasMedia) emptyMarkerBlock = insertionReference;
      }
    }
    mediaInsertionBookmark.current = null;

    // Last resort for older saved content where no durable bookmark existed.
    const saved = savedRange.current;
    if (!insertionReference && !emptyMarkerBlock && saved && root.contains(saved.commonAncestorContainer)) {
      if (saved.startContainer === root) {
        // A caret between paragraphs is represented as an offset directly in
        // the editor root. Insert before the child at that exact offset.
        insertionReference = root.childNodes[saved.startOffset] || null;
      } else {
        let topLevelBlock: Node | null = saved.startContainer;
        while (topLevelBlock?.parentNode && topLevelBlock.parentNode !== root) {
          topLevelBlock = topLevelBlock.parentNode;
        }
        if (topLevelBlock?.parentNode === root) {
          insertionReference = topLevelBlock.nextSibling;
        }
      }
    }

    root.insertBefore(figure, insertionReference);
    root.insertBefore(trailingParagraph, insertionReference);
    if (marker === insertionReference) marker?.remove();
    emptyMarkerBlock?.remove();

    const range = document.createRange();
    range.selectNodeContents(caption);
    range.collapse(false);
    root.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRange.current = range.cloneRange();
    markChanged();
    setEditorHtml(serializeEditorHtml());
    return true;
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
    clone.querySelectorAll(".cms-promo-controls").forEach(controls => controls.remove());
    clone.querySelectorAll(".media-insertion-marker").forEach((marker) => marker.remove());
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
        const safeUrl = escapeHtml(safeArticleUrl(pastedText));
        if (!safeUrl) return;
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

    const isMp4 = file.type === "video/mp4" || /\.mp4$/i.test(file.name);
    const isImage = file.type.startsWith("image/") ||
      /\.(?:avif|gif|heic|heif|jpe?g|png|webp)$/i.test(file.name);

    if (!isMp4 && !isImage) {
      setMessage("Please choose an image or MP4 video file.");
      return;
    }

    setBusy(true);
    setUploading(isMp4 ? "Uploading MP4 video…" : "Uploading article image…");
    setMessage("");

    try {
      const { url } = await upload(
        file,
        isMp4 ? "article-videos" : "article-images"
      );

      const captionId = `caption-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const captionLabel = isMp4
        ? "Video credit / caption (optional)"
        : "Photo credit / caption (optional)";

      const inserted = insertMediaAtCursor({
        url,
        isMp4,
        captionId,
        captionLabel,
      });

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
    markChanged();
    setEditorHtml(serializeEditorHtml());
  };

  const chooseLink = (item: SearchResult) => {
    if (picker === "related") {
      insertHtmlAtCursor(promoHtml({ title: item.title, subtitle: "READ NEXT", button: "Read story →",
        url: item.url, image: item.image, style: "light", kind: "related" }) + "<p><br></p>");
    } else if (savedRange.current && !savedRange.current.collapsed) {
      command("createLink", item.url);
    } else {
      insertHtmlAtCursor(`<a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>`);
    }
    setPicker(null);
  };

  const showPromo = (value: Promo, node?: HTMLElement) => setPromo({ value, node });
  const addPromo = (kind: string) => {
    switch (kind) {
      case "main": insertHtmlAtCursor(promoHtml(followPromo) + "<p><br></p>"); break;
      case "school": showPromo(schoolPromo(form.school)); break;
      case "ig": insertHtmlAtCursor(promoHtml({ title: "Follow @TopTierState on Instagram",
        subtitle: "509K+ college sports fans. Graphics, highlights, and daily news.", url: "https://instagram.com/toptierstate",
        button: "Follow", style: "dark" }) + "<p><br></p>"); break;
      case "related": setPicker("related"); break;
      case "custom": showPromo({ title: "", subtitle: "", button: "", url: "", style: "light" }); break;
    }
  };

const deleteArticle = async () => {
  const articleId = id.current;
  if (!articleId) return;

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
    .eq("id", articleId);

  setBusy(false);

  if (error) {
    setMessage(`Could not delete article: ${error.message}`);
    return;
  }

  router.push("/dashboard");
  router.refresh();
};
  const save = async (status: string, autosave = false) => {
    if (saving.current || busy) return;
    if (initialId && loadedArticleId !== initialId) {
      setMessage(articleUnavailable);
      return;
    }
    if (!form.title.trim()) {
      setMessage("Please enter a headline first.");
      return;
    }

    const articleSlug = form.slug || slugify(form.title);
    if (["published", "scheduled"].includes(status) && form.status !== "published" && (articleSlug.length < 8 || !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(articleSlug))) {
      setMessage("Use a descriptive URL slug of at least 8 characters with hyphen-separated words.");
      return;
    }

    if (!authorName.trim()) {
      setMessage("Please enter the author name.");
      return;
    }

    try {
      const payload = {
        title: form.title,
        slug: articleSlug,
        excerpt: form.excerpt,
        category: form.category,
        school: form.school,
        cover_image_url: form.cover_image_url,
        is_top_story: form.is_top_story,
        labels: form.labels,
        status,
        writer_profile_id: writerId || null,
        body: {
          html: serializeEditorHtml()
            .replace(/<h1\b[^>]*>/gi, "")
            .replace(/<\/h1>/gi, ""),
          ...metadata,
          partner_name: metadata.partner_name.trim(),
          keyTakeaways: metadata.keyTakeaways.map(text => text.trim()).filter(Boolean),
          secondary_school: metadata.secondary_school === form.school ? "" : metadata.secondary_school,
          author_name: authorName.trim(),
        },
        schedule,
      };
      const snapshot = JSON.stringify(payload);
      if (autosave && lastSave.current === snapshot) { savedChanges.current = changes.current; return; }
      const revision = changes.current;
      saving.current = true;
      setBusy(true);
      setMessage("");

      const result = await saveArticle(id.current, payload, updatedAt.current);
      if (result.error) throw new Error(result.error);
      updatedAt.current = result.updatedAt ?? null;
      lastSave.current = snapshot;
      savedChanges.current = revision;
      if (!id.current && result.id) {
        id.current = result.id;
        hydratedId.current = result.id;
        setLoadedArticleId(result.id);
        window.history.replaceState(null, "", "/dashboard/new?id=" + result.id);
      }
      setForm(current => ({ ...current, status, slug: current.slug || (changes.current === revision ? articleSlug : "") }));
      setSavedAt(new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date()));
    } catch (error) {
      setMessage(`Could not save article: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const onEditorInput = () => {
    markChanged();
    setEditorHtml(serializeEditorHtml());
  };

  const autosaveDraft = useRef<() => void>(() => {});
  useEffect(() => {
    autosaveDraft.current = () => {
      if (changes.current !== savedChanges.current && form.status === "draft" && (!initialId || loadedArticleId === initialId) && form.title.trim() && authorName.trim()) {
        void save("draft", true);
      }
    };
  });
  useEffect(() => {
    const interval = window.setInterval(() => autosaveDraft.current(), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const toggleStoryLabel = (label: StoryLabel, checked: boolean) => setForm(current => {
    const labels = checked ? [...new Set([...current.labels, label])].slice(0, 2) : current.labels.filter(item => item !== label);
    return { ...current, labels };
  });

  const words = editorHtml.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const titleInRange = form.title.length >= 50 && form.title.length <= 65;
  const descriptionInRange = form.excerpt.length >= 120 && form.excerpt.length <= 155;
  const checks = [
    [titleInRange, "Headline 50–65 characters"],
    [descriptionInRange, "Description 120–155 characters"],
    [metadata.cover_width >= 1200 && metadata.cover_alt.trim() && form.cover_image_url, "Cover source at least 1200px wide with alt text"],
    [/<h2\b/i.test(editorHtml), "At least one H2"],
    [/<a\b[^>]*\bhref=["'](?:\/(?![/\\])|https?:\/\/(?:www\.)?toptierstate\.net(?:[/?#]|["']))/i.test(editorHtml), "Internal Top Tier link"],
  ] as const;
  const selectSchool = (name: string, value: string, change: (value: string) => void) => <label>{name}
    <select value={value} onChange={event => change(event.target.value)}>
      <option value="">No school</option>
      {articleSchoolOptions(value).map(school => <option key={school.name} value={school.name}>{school.name}</option>)}
    </select>
  </label>;
  const previewImage = coverPreview || form.cover_image_url;
  const { body: previewBody, takeaways } = articlePresentation(editorHtml, form.excerpt, metadata.keyTakeaways.map(text => text.trim()).filter(Boolean));
  const locked = Boolean(initialId && initialId !== loadedArticleId) ||
    (!editorRole && ["published", "scheduled"].includes(form.status));
  return (
    <div className="editor-layout">
      <section className="editor-form" onChangeCapture={markChanged}>
        <div className="editor-top">
          <div>
            <small>ARTICLE EDITOR</small>
            <h1>{id.current ? "Edit Article" : "Create New Article"}</h1>
          </div>
          <a href="/dashboard">← Dashboard</a>
        </div>

        <label>Headline
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter article headline" />
          <span className={titleInRange ? "cms-good" : "cms-warning"}>{form.title.length} characters · 50–65 suggested</span>
        </label>
        <label className={`cms-cover-drop${dragging ? " is-dragging" : ""}`}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); if (!locked) void cover(event.dataTransfer.files[0]); }}>
          {previewImage && <Image unoptimized width={1600} height={900} src={previewImage} alt="Cover crop preview" />}
          <strong>Cover Image</strong><span>Drop an image or choose a file · center crop to 1600 × 900</span>
          <input type="file" disabled={busy || locked} accept="image/png,image/jpeg,image/webp" onChange={event => {
            const input = event.currentTarget;
            void cover(input.files?.[0]).finally(() => { input.value = ""; });
          }} />
        </label>
        {metadata.cover_width > 0 && metadata.cover_width < 1200 && <p role="status" className="cms-warning">Low resolution · source is under 1200px wide.</p>}
        {coverUpscaled && <p role="status" className="cms-warning">This cover was upscaled to 1600 × 900.</p>}
        {form.cover_image_url && <button disabled={busy || locked} type="button" onClick={() => {
          setForm(f => ({ ...f, cover_image_url: "" })); setMeta("cover_width", 0); setCoverUpscaled(false); markChanged();
        }}>Remove cover image</button>}
        <div className="two-col cms-cover-fields">
          <label>Cover Image Alt Text<input value={metadata.cover_alt} onChange={e => setMeta("cover_alt", e.target.value)} /></label>
          <label>Photo Credit<input value={metadata.cover_credit} onChange={e => setMeta("cover_credit", e.target.value)} /></label>
        </div>
        <h2 className="cms-body-heading">Article Body</h2>
        {!initialId && !editorHtml.replace(/<[^>]*>|&nbsp;/g, "").trim() && <div className="cms-template-chips" aria-label="Starter templates">
          {Object.entries(templates).map(([name, headings]) => <button type="button" key={name} onClick={() => {
            if (!editor.current) return;
            editor.current.innerHTML = headings.map(heading => "<h2>" + escapeHtml(heading) + "</h2><p><br></p>").join("");
            savedRange.current = null;
            onEditorInput();
          }}>{name}</button>)}
        </div>}

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
          <button type="button" onClick={() => command("formatBlock", "h3")}>H3</button>
          <button type="button" onClick={() => command("formatBlock", "blockquote")}>Pull Quote</button>
          <button type="button" onClick={() => command("insertUnorderedList")}>
            • List
          </button>
          <button type="button" onClick={() => command("insertOrderedList")}>
            1. List
          </button>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setPicker("link")}>
            🔗 Link
          </button>
          <button
            type="button"
            className="upload-button"
            disabled={busy}
            onPointerDown={prepareMediaInsertion}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (!mediaInsertionMarker.current?.isConnected) prepareMediaInsertion();
              mediaInput.current?.click();
            }}
          >
            + Photo / MP4
          </button>
          <select aria-label="Add promo card" value="" onChange={e => addPromo(e.target.value)}>
            <option value="" disabled>+ Promo Card</option><option value="main">Follow @TopTierStateX</option>
            <option value="school">Follow School X Account</option><option value="ig">Follow on Instagram</option>
            <option value="related">Related Story Card</option><option value="custom">Custom Promo / Callout</option>
          </select>
          <button type="button" onClick={() => {
            const url = window.prompt("Paste an X post URL")?.trim();
            if (!url) return;
            if (isXStatusUrl(url)) insertHtmlAtCursor(createEditorXPreview(url) + "<p><br></p>");
            else setMessage("Enter a valid X or Twitter status URL.");
          }}>+ Embed X Post</button>
          <button type="button" onClick={() => {
            const url = window.prompt("Paste a YouTube or Instagram post URL")?.trim();
            if (!url) return;
            const html = videoHtml(url);
            if (html) insertHtmlAtCursor(html + "<p><br></p>");
            else setMessage("Enter a valid YouTube video or Instagram post URL.");
          }}>+ Embed Video / IG</button>
          <small className="cms-word-count">{words} words · {Math.ceil(words / 225)} min read</small>
          <input
            ref={mediaInput}
            hidden
            disabled={busy}
            type="file"
            accept="image/*,video/mp4"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const input = e.currentTarget;
              if (!input.files?.[0]) {
                mediaInsertionMarker.current?.remove();
                mediaInsertionMarker.current = null;
                mediaInsertionBookmark.current = null;
                return;
              }
              void insertMedia(input.files?.[0]).finally(() => {
                input.value = "";
              });
            }}
          />
        </div>

        <div
          ref={editor}
          className="rich-editor"
          contentEditable={!locked}
          onClick={event => {
            if (locked) return;
            const target = event.target as HTMLElement;
            const block = target.closest<HTMLElement>("[data-promo-block]");
            if (!block) return;
            if (target.closest("a")) event.preventDefault();
            if (block.querySelector(".cms-promo-controls")) return;
            editor.current?.querySelectorAll(".cms-promo-controls").forEach(node => node.remove());
            const controls = document.createElement("span");
            controls.className = "cms-promo-controls";
            for (const label of ["Edit", "Remove ×"]) {
              const button = document.createElement("button");
              button.type = "button";
              button.textContent = label;
              button.onclick = () => {
                if (label === "Edit") showPromo(JSON.parse(block.dataset.promoBlock!), block);
                else { block.remove(); onEditorInput(); }
              };
              controls.append(button);
            }
            block.append(controls);
          }}
          onPointerOver={event => {
            const target = event.target as HTMLElement;
            const block = target.closest<HTMLElement>("[data-promo-block]");
            if (block && !block.querySelector(".cms-promo-controls") && !locked) block.click();
          }}
          suppressContentEditableWarning
          data-placeholder="Write your story here…"
          onInput={onEditorInput}
          onPaste={handleEditorPaste}
        />

        <label>Preview Description
          <textarea value={form.excerpt} maxLength={260} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
          <span className={descriptionInRange ? "cms-good" : "cms-warning"}>{form.excerpt.length} characters · 120–155 suggested</span>
        </label>
        <div className="two-col">
          <label>Category <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {Array.from(new Set([...articleCategories, form.category])).map(category => <option key={category}>{category}</option>)}
          </select></label>
          <label>Writer profile <select value={writerId} onChange={e => {
            const writer = writers.find(item => item.id === e.target.value);
            setWriterId(e.target.value);
            if (writer) setAuthorName(writer.name);
          }}><option value="">No profile (byline shown as plain text)</option>
            {writers.map(writer => <option key={writer.id} value={writer.id}>{writer.name}</option>)}
          </select></label>
          {selectSchool("Primary School", form.school, school => setForm(f => ({ ...f, school })))}
          {selectSchool("Secondary School", metadata.secondary_school, school => setMeta("secondary_school", school))}
        </div>
        <details className="cms-editor-drawer">
          <summary>Key Takeaways</summary>
          <p>Add {takeawayMin}-{takeawayMax} bullets. Start a bullet with **Bold text** to emphasize its lead-in.</p>
          {metadata.keyTakeaways.map((text, index) => <div className="cms-takeaway-field" key={index}>
            <label>Takeaway {index + 1}
            <input value={text} onChange={e => setMeta("keyTakeaways", metadata.keyTakeaways.map((item, i) => i === index ? e.target.value : item))} />
            <span className={text.length > takeawaySoftLimit ? "cms-warning" : undefined}>{text.length} / {takeawaySoftLimit} suggested characters</span>
            </label>
            <button type="button" onClick={() => {
              setMeta("keyTakeaways", metadata.keyTakeaways.filter((_, i) => i !== index));
              markChanged();
            }}>Remove takeaway {index + 1}</button>
          </div>)}
          <button type="button" disabled={metadata.keyTakeaways.length >= takeawayMax} onClick={() =>
            setMeta("keyTakeaways", [...metadata.keyTakeaways, ""])}>Add takeaway</button>
        </details>
        <details className="cms-editor-drawer" open={!writerId && !authorName}>
          <summary>Article Settings</summary>
          <label>URL Slug <input value={form.slug} placeholder={slugify(form.title)} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} /></label>
          {!writerId && <label>Author Name <input value={authorName} onChange={e => setAuthorName(e.target.value)} /></label>}
          <fieldset className="cms-story-labels"><legend>Labels</legend>
            <p>Choose up to two.</p>
            {(Object.keys(storyLabels) as StoryLabel[]).map(label => {
              const checked = form.labels.includes(label);
              return <label className="check" key={label}>
                <input type="checkbox" checked={checked} disabled={!checked && form.labels.length >= 2}
                  onChange={event => toggleStoryLabel(label, event.target.checked)} />
                <span><span className={`story-label story-label-${label.toLowerCase()}`}>{label}</span>
                  <span className="cms-label-help">{storyLabels[label]}</span></span>
              </label>;
            })}
          </fieldset>
          <label className="check"><input type="checkbox" checked={form.is_top_story} onChange={e => setForm(f => ({ ...f, is_top_story: e.target.checked }))} />Feature in Top Stories</label>
          <label className="check"><input type="checkbox" checked={form.labels.includes("PARTNER")} disabled={!form.labels.includes("PARTNER") && form.labels.length >= 2} onChange={e => toggleStoryLabel("PARTNER", e.target.checked)} />Sponsored / partner content</label>
          {form.labels.includes("PARTNER") && <label>Partner name (optional)<input value={metadata.partner_name} onChange={e => setMeta("partner_name", e.target.value)} /></label>}
          <label className="check"><input type="checkbox" checked={metadata.auto_follow} onChange={e => setMeta("auto_follow", e.target.checked)} />Auto-insert mid-article Follow @TopTierStateX card</label>
          <label className="check"><input type="checkbox" checked={metadata.preferred_source} onChange={e => setMeta("preferred_source", e.target.checked)} />Show Google Preferred Source card</label>
        </details>
        {editorRole && <label>Schedule Publish (Central Time)
          <input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} />
        </label>}
        {uploading && <p className="editor-uploading">{uploading}</p>}
        {message && <p className="editor-message" role="status">{message}</p>}
        <div className="editor-actions">
          <details className="cms-seo"><summary>SEO &amp; Discover · {checks.filter(([pass]) => pass).length}/5</summary>
            <ul>{checks.map(([pass, label]) => <li key={label} className={pass ? "cms-good" : "cms-warning"}>{pass ? "✓" : "●"} {label}</li>)}</ul>
          </details>
          {savedAt && <span role="status">Saved · {savedAt}</span>}
          {id.current && !locked && <button type="button" disabled={busy} onClick={deleteArticle} className="delete-button">Delete Article</button>}
          <button disabled={busy || locked} onClick={() => save("draft")} className="outline-button">Save Draft</button>
          <button disabled={busy || locked} onClick={() => save("ready_for_review")} className="outline-button">Submit for Review</button>
          {editorRole && <>
            <button disabled={busy || locked || !schedule} onClick={() => save("scheduled")} className="outline-button">Schedule Publish</button>
            <button disabled={busy || locked} onClick={() => save("published")} className="red-button">Publish</button>
          </>}
        </div>
        {picker && <ArticlePicker context={picker} onChoose={chooseLink} onClose={() => setPicker(null)} />}
        {promo && <PromoEditor school={form.school} promo={promo.value} onClose={() => setPromo(null)} onSave={value => {
          const html = promoHtml(value);
          if (!html) return;
          if (promo.node?.isConnected) { promo.node.outerHTML = html; onEditorInput(); }
          else insertHtmlAtCursor(html + "<p><br></p>");
          setPromo(null);
        }} />}
      </section>
      <aside className="preview cms-light-preview">
        <div className="cms-preview-tabs" role="group" aria-label="Preview format">
          {["Article", "Google", "X Card"].map(value => <button type="button" key={value} aria-pressed={tab === value}
            onClick={() => setTab(value)}>{value}</button>)}
        </div>
        {tab === "Google" ? <div className="cms-search-preview">
          <small>toptierstate.net › articles › {form.slug || slugify(form.title) || "your-slug"}</small>
          <h2>{form.title || "Your headline appears here"}</h2><p>{form.excerpt.slice(0, 155)}</p>
        </div> : tab === "X Card" ? <div className="cms-x-preview">
          <b>@TopTierStateX</b>
          <div className="preview-image">{previewImage && <Image unoptimized width={1600} height={900} src={previewImage} alt={metadata.cover_alt} />}</div>
          <strong>{form.title || "Your headline appears here"}</strong><small>toptierstate.net</small>
        </div> : <>
          <small className="cms-preview-category">{form.category}</small>
          <h2>{form.title || "Your headline appears here"}</h2>
          <p>{form.excerpt}</p>{authorName && <p>By {authorName}</p>}
          {previewImage && <figure><div className="preview-image"><Image unoptimized width={1600} height={900} src={previewImage} alt={metadata.cover_alt} /></div>
            {metadata.cover_credit && <figcaption>{metadata.cover_credit}</figcaption>}</figure>}
          <KeyTakeaways bullets={takeaways} />
          <RenderedArticleContent html={withFollowPromo(previewBody, metadata.auto_follow)} className="prose editorial-prose" />
          {metadata.preferred_source && <PreferredSource />}
        </>}
      </aside>
    </div>
  );
}
