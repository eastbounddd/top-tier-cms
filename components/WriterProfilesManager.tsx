"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Writer } from "@/lib/writers";

const blank = { id: "", slug: "", name: "", profile_image: "", coverage: "", x_handle: "", bio: "", title: "", joined_date: "" };
const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 10 * 1024 * 1024;

export function WriterProfilesManager({ writers }: { writers: Writer[] }) {
  const [items, setItems] = useState(writers);
  const [form, setForm] = useState(blank);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (key: keyof typeof blank, value: string) => setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const db = createClient();
    let imageUrl = form.profile_image.trim();
    try {
      if (photo) {
        const { data: { user }, error: authError } = await db.auth.getUser();
        if (authError || !user) throw new Error("Your session expired. Please sign in again.");
        const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
        const path = `${user.id}/writer-profiles/${crypto.randomUUID()}.${extension}`;
        const { error } = await db.storage.from("article-images").upload(path, photo, { contentType: photo.type, cacheControl: "3600", upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        imageUrl = db.storage.from("article-images").getPublicUrl(path).data.publicUrl;
        // Keep the uploaded URL if saving the profile fails, so retrying does not upload another copy.
        change("profile_image", imageUrl);
        setPhoto(null);
      }
      const payload = { slug: form.slug.trim(), name: form.name.trim(), profile_image: imageUrl || null, coverage: form.coverage.split(",").map(s => s.trim()).filter(Boolean), x_handle: form.x_handle.trim().replace(/^@/, "") || null, bio: form.bio.trim(), title: form.title.trim() || null, joined_date: form.joined_date || null };
      const result = form.id ? await db.from("writer_profiles").update(payload).eq("id", form.id).select().single() : await db.from("writer_profiles").insert(payload).select().single();
      if (result.error) throw new Error(result.error.message);
      setItems(old => [...old.filter(w => w.id !== result.data.id), result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(blank);
      setMessage("Writer profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the writer profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function selectPhoto(file?: File) {
    setMessage("");
    if (!file) return;
    if (!imageTypes.includes(file.type) || file.size > maxImageSize) {
      setPhoto(null);
      setMessage("Choose a JPG, PNG, or WebP image no larger than 10 MB.");
      return;
    }
    setPhoto(file);
  }

  return <><form className="panel writer-form" onSubmit={save}><h2>{form.id ? "Edit public writer profile" : "Create public writer profile"}</h2>
    <label>Name<input required disabled={busy} value={form.name} onChange={e => change("name", e.target.value)} /></label>
    <label>URL slug<input required disabled={busy} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e => change("slug", e.target.value)} placeholder="jane-smith" /></label>
    <label>Profile photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { selectPhoto(e.target.files?.[0]); e.currentTarget.value = ""; }} /><span>JPG, PNG, or WebP; up to 10 MB. Save the profile to apply the photo.</span></label>
    {(preview || form.profile_image) && <div><img className="writer-photo-preview" src={preview || form.profile_image} alt={`${form.name || "Writer"} profile preview`} /><button type="button" disabled={busy} onClick={() => { setPhoto(null); change("profile_image", ""); }}>Remove photo</button></div>}
    <label>Photo URL or local path<input disabled={busy} value={form.profile_image} onChange={e => { setPhoto(null); change("profile_image", e.target.value); }} /></label>
    <label>Title<input disabled={busy} value={form.title} onChange={e => change("title", e.target.value)} /></label>
    <label>Coverage (comma separated)<input disabled={busy} value={form.coverage} onChange={e => change("coverage", e.target.value)} /></label>
    <label>X handle<input disabled={busy} pattern="@?[A-Za-z0-9_]{1,15}" value={form.x_handle} onChange={e => change("x_handle", e.target.value)} /></label>
    <label>Joined date<input disabled={busy} type="date" value={form.joined_date} onChange={e => change("joined_date", e.target.value)} /></label>
    <label>Bio (separate paragraphs with a blank line)<textarea disabled={busy} rows={6} value={form.bio} onChange={e => change("bio", e.target.value)} /></label>
    <button className="red-button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    {form.id && <button type="button" disabled={busy} onClick={() => { setForm(blank); setPhoto(null); setMessage(""); }}>Cancel editing</button>}
    {message && <p role="status">{message}</p>}</form>
    <div className="panel"><h2>Public profiles</h2>{items.map(w => <div className="writer-row" key={w.id}><div><b>{w.name}</b><span>/author/{w.slug}</span></div><button type="button" disabled={busy} onClick={() => { setPhoto(null); setMessage(""); setForm({ id: w.id, slug: w.slug, name: w.name, profile_image: w.profile_image || "", coverage: (w.coverage || []).join(", "), x_handle: w.x_handle || "", bio: w.bio || "", title: w.title || "", joined_date: w.joined_date || "" }); }}>Edit</button></div>)}</div></>;
}
